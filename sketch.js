// 円周上の点同士を直線で結ぶ糸掛け
// 角度は完全ランダムだが、分布を歪めて縁を作る
// 弦の長さで透明度を変え、白埋まりしにくくする
// UIスライダーで色や消え方をリアルタイム調整

let paused = false;

let R;
let maxLines = 3600;
let segments = [];
let head = 0;
let count = 0;

// UI要素
let ui = {};

function setup() {
  createCanvas(900, 900);
  pixelDensity(2);
  strokeCap(ROUND);
  strokeJoin(ROUND);

  // HSLで扱う（スライダーと相性がいい）
  colorMode(HSL, 360, 100, 100, 255);

  R = min(width, height) * 0.38;

  bindUI();
  resetAll(true);
}

function bindUI() {
  const $ = (id) => document.getElementById(id);

  ui.bgH = $('bgH'); ui.bgS = $('bgS'); ui.bgL = $('bgL');
  ui.lnH = $('lnH'); ui.lnS = $('lnS'); ui.lnL = $('lnL');

  ui.baseA = $('baseA');
  ui.fadeA = $('fadeA');
  ui.speed = $('speed');
  ui.bias = $('bias');

  ui.bgHVal = $('bgHVal'); ui.bgSVal = $('bgSVal'); ui.bgLVal = $('bgLVal');
  ui.lnHVal = $('lnHVal'); ui.lnSVal = $('lnSVal'); ui.lnLVal = $('lnLVal');
  ui.baseAVal = $('baseAVal'); ui.fadeAVal = $('fadeAVal');
  ui.speedVal = $('speedVal'); ui.biasVal = $('biasVal');

  $('resetBtn').addEventListener('click', () => resetAll(true));
  $('pauseBtn').addEventListener('click', () => {
    paused = !paused;
    $('pauseBtn').textContent = paused ? '再開' : '停止';
  });

  // 値表示を毎回更新
  const updateLabels = () => {
    ui.bgHVal.textContent = ui.bgH.value;
    ui.bgSVal.textContent = ui.bgS.value;
    ui.bgLVal.textContent = ui.bgL.value;

    ui.lnHVal.textContent = ui.lnH.value;
    ui.lnSVal.textContent = ui.lnS.value;
    ui.lnLVal.textContent = ui.lnL.value;

    ui.baseAVal.textContent = ui.baseA.value;
    ui.fadeAVal.textContent = ui.fadeA.value;
    ui.speedVal.textContent = ui.speed.value;
    ui.biasVal.textContent = ui.bias.value;
  };

  // 全スライダー変更でラベル更新
  ['bgH','bgS','bgL','lnH','lnS','lnL','baseA','fadeA','speed','bias'].forEach((id) => {
    $(id).addEventListener('input', updateLabels);
  });
  updateLabels();
}

function resetAll(clearBg) {
  segments = new Array(maxLines);
  head = 0;
  count = 0;

  if (clearBg) {
    const bg = getBGColor(255);
    background(bg);
  }
}

function draw() {
  if (paused) return;

  // UIから値を読む
  const fadeAlpha = toInt(ui.fadeA.value);
  const baseAlpha = toInt(ui.baseA.value);
  const linesPerFrame = toInt(ui.speed.value);

  // 背景を薄く重ねてフェード
  noStroke();
  fill(getBGColor(fadeAlpha));
  rect(0, 0, width, height);

  // 線追加
  for (let i = 0; i < linesPerFrame; i++) {
    const a = sampleAngle();
    const b = sampleAngle();

    // Δθ を 0〜π に正規化
    const d = angleDiff(a, b);

    // 弦長の正規化指標：lenNorm = sin(Δθ/2) ∈ [0,1]
    const lenNorm = sin(d * 0.5);

    segments[head] = { a, b, lenNorm };
    head = (head + 1) % maxLines;
    count = min(maxLines, count + 1);
  }

  // 描画
  push();
  translate(width / 2, height / 2);
  strokeWeight(0.9);

  const start = (head - count + maxLines) % maxLines;
  for (let i = 0; i < count; i++) {
    const idx = (start + i) % maxLines;
    const seg = segments[idx];
    if (!seg) continue;

    // 長い弦ほど薄く、短い弦ほど濃く
    const w = 1.0 - seg.lenNorm; // 1:短い, 0:長い
    const aAlpha = baseAlpha * (0.25 + 0.95 * pow(w, 1.7));

    stroke(getLineColor(aAlpha));

    const x1 = cos(seg.a) * R;
    const y1 = sin(seg.a) * R;
    const x2 = cos(seg.b) * R;
    const y2 = sin(seg.b) * R;

    line(x1, y1, x2, y2);
  }
  pop();
}

// 完全ランダム角度だが、縁を作るために分布を少し歪める
function sampleAngle() {
  // bias: 0〜100
  // 0 だと完全一様、100 だと端寄りが強い
  const bias = toInt(ui.bias.value);

  if (bias <= 0) {
    return random(TWO_PI);
  }

  // 端寄り強度を k に変換（小さいほど端が強い）
  // bias 0 → k=1.0（ほぼ一様）
  // bias 100 → k=0.45（かなり端寄り）
  const k = lerp(1.0, 0.45, bias / 100);

  // u ~ U(0,1)
  // v = u^k（k<1で端寄り）
  // 左右対称化：w = 0.5 ± 0.5 v
  const u = random(1);
  const v = pow(u, k);
  const sign = random(1) < 0.5 ? -1 : 1;
  const w = 0.5 + sign * 0.5 * v;

  return w * TWO_PI;
}

function angleDiff(a, b) {
  let d = abs(a - b) % TWO_PI;
  if (d > PI) d = TWO_PI - d;
  return d;
}

function getBGColor(alpha) {
  const h = toInt(ui.bgH.value);
  const s = toInt(ui.bgS.value);
  const l = toInt(ui.bgL.value);
  return color(h, s, l, alpha);
}

function getLineColor(alpha) {
  const h = toInt(ui.lnH.value);
  const s = toInt(ui.lnS.value);
  const l = toInt(ui.lnL.value);
  return color(h, s, l, alpha);
}

function toInt(v) {
  return v | 0;
}

function keyPressed() {
  if (key === ' ') paused = !paused;
  if (key === 'r' || key === 'R') resetAll(true);
  if (key === 's' || key === 'S') saveCanvas('string_circle_ui', 'png');
}
