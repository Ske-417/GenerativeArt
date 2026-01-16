// クリフォードアトラクタを線で描いて、美しく整える版
// キー操作：
//  r で再生成（パラメータを少し変える）
//  s で保存（png）

let params = { a: -1.4, b: 1.6, c: 1.0, d: 0.7 };
let seed = 12345;

function setup() {
  createCanvas(900, 900);
  pixelDensity(2);
  strokeCap(ROUND);
  strokeJoin(ROUND);
  regenerate();
}

function regenerate() {
  randomSeed(seed);
  background(11, 12, 16);

  // パラメータを少し揺らして同系統の変化を出す
  params = {
    a: -1.4 + random(-0.25, 0.25),
    b:  1.6 + random(-0.25, 0.25),
    c:  1.0 + random(-0.25, 0.25),
    d:  0.7 + random(-0.25, 0.25),
  };

  // 描画設定（美しくする肝）
  noFill();
  stroke(230, 235, 255, 18);  // 薄い線を重ねて発光っぽく
  strokeWeight(0.8);

  // アトラクタ生成
  // x_{n+1} = sin(a*y_n) + c*cos(a*x_n)
  // y_{n+1} = sin(b*x_n) + d*cos(b*y_n)
  let x = 0.1;
  let y = 0.1;

  // ウォームアップ（軌道を安定領域に入れる）
  for (let i = 0; i < 2000; i++) {
    [x, y] = cliffordStep(x, y, params);
  }

  // 描画：短い線分を大量に重ねる
  // 連続線にすると破綻しやすいので、微細なストロークで上品にまとめる
  const steps = 220000;
  const scale = 210;     // 画面への拡大
  const drift = 0.65;    // 線の追従具合（小さいほど滑らか寄り）

  let px = x, py = y;
  let sx = 0, sy = 0;

  translate(width / 2, height / 2);

  for (let i = 0; i < steps; i++) {
    [x, y] = cliffordStep(x, y, params);

    // 速度方向を少し平滑化して線を美しく
    const vx = x - px;
    const vy = y - py;
    sx = lerp(sx, vx, drift);
    sy = lerp(sy, vy, drift);

    const x1 = px * scale;
    const y1 = py * scale;
    const x2 = (px + sx) * scale;
    const y2 = (py + sy) * scale;

    line(x1, y1, x2, y2);

    px = x;
    py = y;
  }

  // 仕上げにほんの少しだけトーンを落ち着かせる
  // これでギラつきが減って、密度の美しさが出る
  push();
  resetMatrix();
  noStroke();
  fill(11, 12, 16, 24);
  rect(0, 0, width, height);
  pop();
}

function cliffordStep(x, y, p) {
  const nx = sin(p.a * y) + p.c * cos(p.a * x);
  const ny = sin(p.b * x) + p.d * cos(p.b * y);
  return [nx, ny];
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    seed += 1;
    regenerate();
  }
  if (key === 's' || key === 'S') {
    saveCanvas('chaos_lines', 'png');
  }
}
