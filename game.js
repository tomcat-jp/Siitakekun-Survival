const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 画像
const imgMove = new Image();
imgMove.src = "mushroom_back.png";

const imgIdle = new Image();
imgIdle.src = "mushroom_face.png";

// 敵キャラ画像
const enemyImages = {
  red: new Image(),
  yellow: new Image(),
  green: new Image(),
};
enemyImages.red.src = "enemy_red.png";
enemyImages.yellow.src = "enemy_yellow.png";
enemyImages.green.src = "enemy_green.png";

// キャラ情報
let x = canvas.width / 2;
let y = canvas.height / 2;
let speed = 4;
let moving = false;
let directionX = 0;
let directionY = 0;

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
    directionX = dx > 0 ? 1 : -1;
    directionY = 0;
  } else {
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

// 敵キャラクラス
class Enemy {
  constructor(img) {
    this.img = img;
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = 80;
    this.speedX = (Math.random() - 0.5) * 4; // -2～2
    this.speedY = (Math.random() - 0.5) * 4;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    // 画面端で反射
    if (this.x < 40 || this.x > canvas.width - 40) this.speedX *= -1;
    if (this.y < 40 || this.y > canvas.height - 40) this.speedY *= -1;
  }

  draw() {
    ctx.drawImage(this.img, this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
  }
}

// 敵を3体生成（赤・黄・緑）
const enemies = [
  new Enemy(enemyImages.red),
  new Enemy(enemyImages.yellow),
  new Enemy(enemyImages.green),
];

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

  // プレイヤー描画
  ctx.save();
  ctx.translate(x, y);

  if (moving) {
    ctx.scale(flipToggle, 1);
    ctx.drawImage(imgMove, -50, -50, 100, 100);
  } else {
    ctx.drawImage(imgIdle, -50, -50, 100, 100);
  }

  ctx.restore();

  // 敵描画＆移動
  enemies.forEach((enemy) => {
    enemy.update();
    enemy.draw();
  });

  requestAnimationFrame(gameLoop);
}

gameLoop();
