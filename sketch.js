// 参考画像みたいに、円周点を選んで糸を張り続ける
// 円は時間で成長していく
// キー：r 再生成 / c クリア / s 保存 / スペース 一時停止

let Rmax;
let Rcur = 1;

let t1 = 0.123456; // logistic map state
let t2 = 0.654321;

let prevA = 0;
let prevB = 0;

let paused = false;

// 調整ツマミ
let linesPerFrame = 120;   // 1フレームで何本足すか
let growSpeed = 2.2;       // 半径の成長速度
let alphaLine = 18;        // 線の透明度
let strokeW = 0.9;         // 線の太さ

function setup() {
  createCanvas(900, 900);
  pixelDensity(2);
  strokeCap(ROUND);
  strokeJoin(ROUND);

  Rmax = min(width, height) * 0.38;

  resetAll(true);
}

function resetAll(clearBg) {
  if (clearBg) background(43, 44, 48);

  Rcur = 1;

  // 初期値を少しランダムにして雰囲気変える
  t1 = random(0.05, 0.95);
  t2 = random(0.05, 0.95);

  prevA = angleFromChaosA();
  prevB = angleFromChaosB();
}

function draw() {
  if (paused) return;

  // 半径を成長させる
  Rcur = min(Rmax, Rcur + growSpeed);

  // 円の輪郭は毎フレーム薄く上書きして存在感キープ
  push();
  translate(width / 2, height / 2);
  noFill();
  stroke(235, 235, 235, 90);
  strokeWeight(1);
  circle(0, 0, Rcur * 2);
  pop();

  // 糸を足す（積み上げ式）
  push();
  translate(width / 2, height / 2);
  stroke(235, 235, 235, alphaLine);
  strokeWeight(strokeW);

  for (let i = 0; i < linesPerFrame; i++) {
    const a = angleFromChaosA();
    const b = angleFromChaosB();

    const x1 = cos(prevA) * Rcur;
    const y1 = sin(prevA) * Rcur;
    const x2 = cos(b) * Rcur;
    const y2 = sin(b) * Rcur;

    line(x1, y1, x2, y2);

    prevA = a;
    prevB = b;
  }

  pop();
}

// カオス角度生成：logistic mapを使う（ランダムより筋が通ってる）
function angleFromChaosA() {
  // r を時間でゆっくり揺らすと、雰囲気が呼吸する
  const r = 3.86 + 0.08 * sin(frameCount * 0.003);
  t1 = r * t1 * (1 - t1);

  // 端っこに寄りやすいように、分布を少し歪める
  const u = pow(t1, 0.7);

  return u * TWO_PI;
}

function angleFromChaosB() {
  const r = 3.92 + 0.06 * cos(frameCount * 0.002);
  t2 = r * t2 * (1 - t2);

  // 片側に寄る塊ができやすいように、位相を少しズラす
  const u = (t2 + 0.18 * sin(frameCount * 0.004)) % 1.0;

  return u * TWO_PI;
}

function keyPressed() {
  if (key === 'r' || key === 'R') resetAll(true);
  if (key === 'c' || key === 'C') background(43, 44, 48);
  if (key === 's' || key === 'S') saveCanvas('growing_circle_string', 'png');
  if (key === ' ') paused = !paused;
}
