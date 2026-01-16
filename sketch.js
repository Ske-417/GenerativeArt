// 直線の糸掛けだけで円っぽい縁を作る
// 線は寿命つきで消えて循環するから、放置しても真っ白に埋まらない
// キー：r 再生成 / s 保存 / スペース 一時停止 / [ ] 速度 / - + 残像

let paused = false;

// 描画パラメータ
let R;
let linesPerFrame = 140;     // 1フレームで追加する線の数
let maxLines = 3800;         // 同時に存在する線の上限（これで白埋まり防止）
let fadeAlpha = 26;          // 全体の薄消し（大きいほど早く消える）
let baseAlpha = 26;          // 線の基本透明度
let strokeW = 0.9;

// カオス生成（logistic map）
let t1, t2;
let prevA = 0;

// 線のリングバッファ
// {a, b} だけ保存して、毎フレーム描き直す方式
let segments = [];
let head = 0;     // 次に上書きする位置
let count = 0;

function setup() {
  createCanvas(900, 900);
  pixelDensity(2);
  strokeCap(ROUND);
  strokeJoin(ROUND);
  R = min(width, height) * 0.38;

  resetAll(true);
}

function resetAll(clearBg) {
  if (clearBg) background(43, 44, 48);

  segments = new Array(maxLines);
  head = 0;
  count = 0;

  t1 = random(0.05, 0.95);
  t2 = random(0.05, 0.95);

  prevA = angleChaosA();
}

function draw() {
  if (paused) return;

  // 全体を薄く消して、古い線を自然にフェードさせる（残像）
  noStroke();
  fill(43, 44, 48, fadeAlpha);
  rect(0, 0, width, height);

  // 新しい線分を追加（古いのを上書きしていく）
  for (let i = 0; i < linesPerFrame; i++) {
    const a = prevA;
    const b = angleChaosB();

    segments[head] = { a, b };
    head = (head + 1) % maxLines;
    count = min(maxLines, count + 1);

    prevA = angleChaosA();
  }

  // 現在生きてる線だけを描く（毎フレーム描き直す）
  push();
  translate(width / 2, height / 2);
  stroke(235, 235, 235, baseAlpha);
  strokeWeight(strokeW);

  // headが次の書き込み位置なので、そこから古い順に並ぶ
  // 描画順はそこまで重要じゃないけど、自然な流れになるように古い→新しい
  const start = (head - count + maxLines) % maxLines;
  for (let i = 0; i < count; i++) {
    const idx = (start + i) % maxLines;
    const seg = segments[idx];
    if (!seg) continue;

    const x1 = cos(seg.a) * R;
    const y1 = sin(seg.a) * R;
    const x2 = cos(seg.b) * R;
    const y2 = sin(seg.b) * R;

    line(x1, y1, x2, y2);
  }
  pop();
}

// logistic map を使って角度を作る（ランダムより筋が通っててカオスが出る）
function angleChaosA() {
  const r = 3.86 + 0.09 * sin(frameCount * 0.003);
  t1 = r * t1 * (1 - t1);

  // 分布を少し歪めて、縁に濃淡を作る
  const u = pow(t1, 0.72);
  return u * TWO_PI;
}

function angleChaosB() {
  const r = 3.92 + 0.07 * cos(frameCount * 0.002);
  t2 = r * t2 * (1 - t2);

  // 位相をずらして偏りを作る
  const u = (t2 + 0.20 * sin(frameCount * 0.004)) % 1.0;
  return u * TWO_PI;
}

function keyPressed() {
  if (key === ' ') paused = !paused;
  if (key === 'r' || key === 'R') resetAll(true);
  if (key === 's' || key === 'S') saveCanvas('string_circle', 'png');

  // 速度
  if (key === '[') linesPerFrame = max(10, linesPerFrame - 10);
  if (key === ']') linesPerFrame = min(1200, linesPerFrame + 10);

  // 残像（消え方）
  if (key === '-') fadeAlpha = min(80, fadeAlpha + 2);  // 早く消える
  if (key === '+' || key === '=') fadeAlpha = max(2, fadeAlpha - 2); // 残る
}
