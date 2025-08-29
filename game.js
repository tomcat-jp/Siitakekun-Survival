const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 画像
const imgMove = new Image();
imgMove.src = "mushroom_back.png";

const imgIdle = new Image();
imgIdle.src = "mushroom_face.png";

// キャラ情報
let x = canvas.width / 2;
let y = canvas.height / 2;
let speed = 4;
let moving = false;
let directionX = 0; // -1=左, 1=右
let directionY = 0; // -1=上, 1=下

// アニメーション用
let frameCounter = 0;
let flipToggle = 1;

// 入力管理（フリック用）
let touchStartX = 0;
let touchStartY = 0;

// OSの長押しメニューを無効化
document.addEventListener("contextmenu", (e) => e.preventDefault());
document.addEventListener("selectstart", (e) => e.preventDefault());

// PC操作（矢印キー）
let keys = {};
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});
document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// スマホ：フリック検出
document.addEventListener("touchstart", (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});

document.addEventListener("touchmove", (e) => {
  const dx = e.touches[0].clientX - touchStartX;
  const dy = e.touches[0].clientY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy)) {
    // 横方向フリック
    directionX = dx > 0 ? 1 : -1;
    directionY = 0;
  } else {
    // 縦方向フリック
    directionY = dy > 0 ? 1 : -1;
    directionX = 0;
  }
  moving = true;
});

document.addEventListener("touchend", () => {
  directionX = 0;
  directionY = 0;
  moving = false;
});

// ゲームループ
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // PCキー操作
  if (keys["ArrowLeft"]) {
    x -= speed;
    moving = true;
  }
  if (keys["ArrowRight"]) {
    x += speed;
    moving = true;
  }
  if (keys["ArrowUp"]) {
    y -= speed;
    moving = true;
  }
  if (keys["ArrowDown"]) {
    y += speed;
    moving = true;
  }

  // スマホ操作
  if (moving) {
    x += directionX * speed;
    y += directionY * speed;
  }

  // 画面外に出ないよう制御
  x = Math.max(50, Math.min(canvas.width - 50, x));
  y = Math.max(50, Math.min(canvas.height - 50, y));

  // アニメーション管理
  if (moving) {
    frameCounter++;
    if (frameCounter % 15 === 0) {
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
    ctx.scale(flipToggle, 1);
    ctx.drawImage(imgMove, -50, -50, 100, 100);
  } else {
    ctx.drawImage(imgIdle, -50, -50, 100, 100);
  }

  ctx.restore();

  requestAnimationFrame(gameLoop);
}

gameLoop();
