// 完全ランダム（位相も角度も）＋ 円周上の糸掛け
// 弦の長さで透明度を変える：長い弦ほど薄く、短い弦ほど濃く
// 放置しても白埋まりしない：残像フェード＋線数上限で循環
// キー：r 再生成 / s 保存 / スペース 一時停止
//      [ ] 速度 / - + 残像 / 1 2 3 分布

let paused = false;

let R;
let linesPerFrame = 140;
let maxLines = 3600;

let fadeAlpha = 26;     // 全体の薄消し（大きいほど早く消える）
let baseAlpha = 28;     // 線の基準透明度（ここから長さで上下）
let strokeW = 0.9;

// 角度分布
let mode = 2;

// 線のリングバッファ
// a,b に加えて lenNorm（0〜1）を保持
let segments = [];
let head = 0;
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
}

function draw() {
  if (paused) return;

  // 残像フェード
  noStroke();
  fill(43, 44, 48, fadeAlpha);
  rect(0, 0, width, height);

  // 線追加
  for (let i = 0; i < linesPerFrame; i++) {
    const a = sampleAngle(mode);
    const b = sampleAngle(mode);

    // 円周上の2点から、弦の長さ（正規化）を計算
    // 円周点：P=(Rcos a, Rsin a), Q=(Rcos b, Rsin b)
    // 弦長 L = |P-Q| = 2R * sin(|Δθ|/2)
    // よって lenNorm = sin(|Δθ|/2) は 0〜1 に収まる
    let d = angleDiff(a, b);          // 0〜π
    let lenNorm = sin(d * 0.5);       // 0〜1

    segments[head] = { a, b, lenNorm };
    head = (head + 1) % maxLines;
    count = min(maxLines, count + 1);
  }

  // 描画
  push();
  translate(width / 2, height / 2);
  strokeWeight(strokeW);

  const start = (head - count + maxLines) % maxLines;
  for (let i = 0; i < count; i++) {
    const idx = (start + i) % maxLines;
    const seg = segments[idx];
    if (!seg) continue;

    // 長い弦ほど薄く、短い弦ほど濃く
    // lenNorm=0（短い）→ 濃い
    // lenNorm=1（直径）→ 薄い
    const w = 1.0 - seg.lenNorm;           // 1→短い, 0→長い
    const aAlpha = baseAlpha * (0.25 + 0.95 * pow(w, 1.7));
    stroke(235, 235, 235, aAlpha);

    const x1 = cos(seg.a) * R;
    const y1 = sin(seg.a) * R;
    const x2 = cos(seg.b) * R;
    const y2 = sin(seg.b) * R;

    line(x1, y1, x2, y2);
  }
  pop();
}

// 角度サンプル
function sampleAngle(m) {
  if (m === 1) {
    return random(TWO_PI);
  }

  let k = (m === 2) ? 0.72 : 0.55; // 小さいほど端が強い
  let u = random(1);
  let v = pow(u, k);
  let sign = random(1) < 0.5 ? -1 : 1;
  let w = 0.5 + sign * 0.5 * v;
  return w * TWO_PI;
}

// 角度差を 0〜π に正規化
function angleDiff(a, b) {
  let d = abs(a - b) % TWO_PI;
  if (d > PI) d = TWO_PI - d;
  return d;
}

function keyPressed() {
  if (key === ' ') paused = !paused;
  if (key === 'r' || key === 'R') resetAll(true);
  if (key === 's' || key === 'S') saveCanvas('string_circle_lenfade', 'png');

  if (key === '[') linesPerFrame = max(10, linesPerFrame - 10);
  if (key === ']') linesPerFrame = min(1500, linesPerFrame + 10);

  if (key === '-') fadeAlpha = min(80, fadeAlpha + 2);
  if (key === '+' || key === '=') fadeAlpha = max(2, fadeAlpha - 2);

  if (key === '1') mode = 1;
  if (key === '2') mode = 2;
  if (key === '3') mode = 3;
}
