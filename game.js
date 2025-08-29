const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// スマホ画面いっぱいにキャンバスをフィット
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 画像読み込み
const imgMove = new Image();
imgMove.src = "mushroom_back.png";

const imgIdle = new Image();
imgIdle.src = "mushroom_face.png";

// キャラ情報
let x = canvas.width / 2;
let y = canvas.height - 200;
let speed = 4;
let moving = false;
let direction = 1; // 1=右, -1=左

// アニメーション用
let frameCounter = 0;
let flipToggle = 1; // 1=通常, -1=反転

// 入力（スマホ＋PC対応）
let keys = {};

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

document.addEventListener("touchstart", (e) => {
  if (e.touches[0].clientX < window.innerWidth / 2) {
    keys["ArrowLeft"] = true;
  } else {
    keys["ArrowRight"] = true;
  }
});

document.addEventListener("touchend", () => {
  keys["ArrowLeft"] = false;
  keys["ArrowRight"] = false;
});

// ゲームループ
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  moving = false;

  // 左右移動処理
  if (keys["ArrowLeft"]) {
    x -= speed;
    direction = -1;
    moving = true;
  }
  if (keys["ArrowRight"]) {
    x += speed;
    direction = 1;
    moving = true;
  }

  // 画面外に出ないよう制御
  x = Math.max(0, Math.min(canvas.width, x));

  // 移動中ならフレームカウンタを進める
  if (moving) {
    frameCounter++;
    if (frameCounter % 15 === 0) {  // 15フレームごとに切り替え
      flipToggle *= -1;
    }
  } else {
    frameCounter = 0;
    flipToggle = 1;
  }

  // 描画
  ctx.save();
  ctx.translate(x, y);

  if (moving) {
    // 左右移動中：flipToggle で交互に反転
    ctx.scale(flipToggle, 1);
    ctx.drawImage(imgMove, -50, -50, 100, 100);
  } else {
    // 停止中：顔つき
    ctx.drawImage(imgIdle, -50, -50, 100, 100);
  }

  ctx.restore();

  requestAnimationFrame(gameLoop);
}

gameLoop();
