const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// プレイヤー画像
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

// ===== プレイヤー =====
let x = canvas.width / 2;
let y = canvas.height - 100;
let speed = 4;
let moving = false;
let directionX = 0;
let directionY = 0;

// アニメーション
let frameCounter = 0;
let flipToggle = 1;

// 入力管理（フリック用）
let touchStartX = 0;
let touchStartY = 0;

// 長押し無効化
document.addEventListener("contextmenu", (e) => e.preventDefault());
document.addEventListener("selectstart", (e) => e.preventDefault());

// PC操作
let keys = {};
document.addEventListener("keydown", (e) => { 
  keys[e.key] = true; 
  if (gameState === "start" && e.key === " ") startGame();
});
document.addEventListener("keyup", (e) => { keys[e.key] = false; });

// スマホ：フリック & ボタンタップ
document.addEventListener("touchstart", (e) => {
  if (gameState === "start") {
    startGame();
    return;
  }
  if (gameState === "gameover") {
    // 再チャレンジボタン判定
    let tx = e.touches[0].clientX;
    let ty = e.touches[0].clientY;
    if (
      tx > canvas.width / 2 - 100 &&
      tx < canvas.width / 2 + 100 &&
      ty > canvas.height / 2 + 20 &&
      ty < canvas.height / 2 + 70
    ) {
      resetGame();
    }
    return;
  }
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

// ====== 敵クラス ======
class Enemy {
  constructor(type, x, y, size = 80) {
    this.type = type;
    this.img = enemyImages[type];
    this.x = x;
    this.y = y;
    this.size = size;
    this.speedY = 2;

    this.frameCounter = 0;
    this.flipToggle = 1;

    // HPと得点
    if (type === "red") { this.hp = 1; this.score = 10; }
    if (type === "yellow") { this.hp = 2; this.score = 20; }
    if (type === "green") { this.hp = 3; this.score = 30; }
  }

  update() {
    this.y += this.speedY;
    this.frameCounter++;
    if (this.frameCounter % 20 === 0) {
      this.flipToggle *= -1;
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.flipToggle, 1);
    ctx.drawImage(this.img, -this.size / 2, -this.size / 2, this.size, this.size);
    ctx.restore();
  }
}

// ====== 弾クラス ======
class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 10;
    this.speedY = -6;
  }
  update() { this.y += this.speedY; }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = "cyan";
    ctx.fill();
  }
}

let bullets = [];
let enemies = [];
let score = 0;
let combo = 0;
let lastKillTime = 0;

let lastSpawn = 0;
let gameState = "start"; // "start" | "playing" | "gameover"

// 弾を自動発射
setInterval(() => {
  if (gameState === "playing") bullets.push(new Bullet(x, y - 50));
}, 500);

// ===== 敵生成 =====
function spawnEnemies() {
  const startY = -50;
  const enemySize = 80; 
  const totalWidth = enemySize * 4;
  const startX = (canvas.width - totalWidth) / 2;

  for (let i = 0; i < 4; i++) {
    let ex = startX + i * enemySize + enemySize / 2;
    let col;
    const r = Math.random();
    if (r < 0.7) col = "red";
    else if (r < 0.9) col = "yellow";
    else col = "green";
    enemies.push(new Enemy(col, ex, startY, enemySize));
  }
}

function updateSpawns() {
  let now = Date.now();
  let interval = 3000;
  if (score >= 1000) interval = 1000;
  else if (score >= 500) interval = 2000;

  if (now - lastSpawn > interval) {
    spawnEnemies();
    lastSpawn = now;
  }
}

// ====== ゲーム制御 ======
function startGame() {
  gameState = "playing";
  resetGame();
}
function resetGame() {
  x = canvas.width / 2;
  y = canvas.height - 100;
  bullets = [];
  enemies = [];
  score = 0;
  combo = 0;
  lastKillTime = 0;
  lastSpawn = 0;
  gameState = "playing";
}

// ====== ゲームループ ======
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState === "start") {
    // スタート画面
    ctx.fillStyle = "white";
    ctx.font = "bold 50px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("MY SHOOTING GAME", canvas.width / 2, canvas.height / 2 - 60);
    ctx.font = "30px sans-serif";
    ctx.fillText("TAP or PRESS SPACE to START", canvas.width / 2, canvas.height / 2);
  }

  else if (gameState === "playing") {
    updateSpawns();

    // PC操作
    moving = false;
    if (keys["ArrowLeft"]) { x -= speed; moving = true; }
    if (keys["ArrowRight"]) { x += speed; moving = true; }
    if (keys["ArrowUp"]) { y -= speed; moving = true; }
    if (keys["ArrowDown"]) { y += speed; moving = true; }

    // スマホ操作
    if (directionX !== 0 || directionY !== 0) {
      x += directionX * speed;
      y += directionY * speed;
      moving = true;
    }

    // 画面外制限
    x = Math.max(50, Math.min(canvas.width - 50, x));
    y = Math.max(50, Math.min(canvas.height - 50, y));

    // プレイヤーアニメーション
    if (moving) {
      frameCounter++;
      if (frameCounter % 15 === 0) flipToggle *= -1;
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

    // 弾
    bullets.forEach((b, i) => {
      b.update();
      b.draw();
      if (b.y < 0) bullets.splice(i, 1);
    });

    // 敵
    enemies.forEach((enemy, ei) => {
      enemy.update();
      enemy.draw();

      if (enemy.y > canvas.height + 50) enemies.splice(ei, 1);

      let dx = x - enemy.x;
      let dy = y - enemy.y;
      if (Math.sqrt(dx*dx + dy*dy) < 60) {
        gameState = "gameover";
      }

      bullets.forEach((b, bi) => {
        let dx2 = b.x - enemy.x;
        let dy2 = b.y - enemy.y;
        if (Math.sqrt(dx2*dx2 + dy2*dy2) < 40) {
          bullets.splice(bi, 1);
          enemy.hp -= 1;
          if (enemy.hp <= 0) {
            let now = Date.now();
            if (now - lastKillTime <= 1000) {
              combo++;
              score += enemy.score + combo * 10;
            } else {
              combo = 0;
              score += enemy.score;
            }
            lastKillTime = now;
            enemies.splice(ei, 1);
          }
        }
      });
    });

    // スコア表示
    ctx.fillStyle = "white";
    ctx.font = "20px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("SCORE: " + score, 20, 30);
    ctx.fillText("COMBO: " + combo, 20, 60);
  }

  else if (gameState === "gameover") {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "red";
    ctx.font = "bold 40px sans-serif"; // 少し小さく
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 60);

    ctx.fillStyle = "white";
    ctx.font = "25px sans-serif";
    ctx.fillText("SCORE: " + score, canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillText("COMBO: " + combo, canvas.width / 2, canvas.height / 2 + 20);

    // 再チャレンジボタン
    ctx.fillStyle = "#00ccff";
    ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2 + 40, 200, 50);
    ctx.fillStyle = "white";
    ctx.font = "20px sans-serif";
    ctx.fillText("RETRY", canvas.width / 2, canvas.height / 2 + 75);

    // PCクリックで再挑戦
    canvas.onclick = (e) => {
      if (gameState === "gameover") {
        if (
          e.offsetX > canvas.width / 2 - 100 &&
          e.offsetX < canvas.width / 2 + 100 &&
          e.offsetY > canvas.height / 2 + 40 &&
          e.offsetY < canvas.height / 2 + 90
        ) {
          resetGame();
        }
      }
    };
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
