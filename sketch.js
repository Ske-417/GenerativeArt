// 完全ランダム（位相も角度も）だけど、円周上に点を置くルールで縁を作る
// 放置しても白埋まりしないように、線は寿命つきで循環
// キー：r 再生成 / s 保存 / スペース 一時停止 / [ ] 速度 / - + 残像 / 1 2 3 分布

let paused = false;

// 描画パラメータ
let R;
let linesPerFrame = 140;
let maxLines = 3200;
let fadeAlpha = 26;
let baseAlpha = 22;
let strokeW = 0.9;

// 円周角度の分布モード
// 1: 一様（完全ランダム）
// 2: 縁が締まる（端寄り）
// 3: 強めに端寄り（より縁っぽい）
let mode = 2;

// 線のリングバッファ
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

  // 残像フェード（古い線が消えていく）
  noStroke();
  fill(43, 44, 48, fadeAlpha);
  rect(0, 0, width, height);

  // 線を追加（古いのを上書きしていく）
  for (let i = 0; i < linesPerFrame; i++) {
    const a = sampleAngle(mode);
    const b = sampleAngle(mode);

    segments[head] = { a, b };
    head = (head + 1) % maxLines;
    count = min(maxLines, count + 1);
  }

  // 今生きてる線を全部描き直す
  push();
  translate(width / 2, height / 2);
  stroke(235, 235, 235, baseAlpha);
  strokeWeight(strokeW);

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

// 角度をサンプリングする
function sampleAngle(m) {
  if (m === 1) {
    // 完全一様：θ ~ Uniform(0, 2π)
    return random(TWO_PI);
  }

  // 端寄り分布を作る
  // u ~ Uniform(0,1)
  // v = u^k (k<1で0側に寄る)
  // それを左右対称にして [0,1] 全体で端寄りにする
  // w = 0.5 + sign*(0.5*v), sign∈{-1,+1}
  // θ = 2πw
  let k = (m === 2) ? 0.72 : 0.55; // 小さいほど端が強い
  let u = random(1);
  let v = pow(u, k);
  let sign = random(1) < 0.5 ? -1 : 1;
  let w = 0.5 + sign * 0.5 * v;

  return w * TWO_PI;
}

function keyPressed() {
  if (key === ' ') paused = !paused;
  if (key === 'r' || key === 'R') resetAll(true);
  if (key === 's' || key === 'S') saveCanvas('string_circle_random', 'png');

  if (key === '[') linesPerFrame = max(10, linesPerFrame - 10);
  if (key === ']') linesPerFrame = min(1500, linesPerFrame + 10);

  if (key === '-') fadeAlpha = min(80, fadeAlpha + 2);
  if (key === '+' || key === '=') fadeAlpha = max(2, fadeAlpha - 2);

  if (key === '1') mode = 1;
  if (key === '2') mode = 2;
  if (key === '3') mode = 3;
}
