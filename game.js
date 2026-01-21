const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const retryBtn = document.getElementById("retryBtn");

let gameOver = false;
let startScreen = true;
let score = 0;
let combo = 0;
let enemies = [];
let bullets = [];
let items = [];      // 追加：アイテム配列
let powerLevel = 0;  // 追加：弾の強化レベル（🍄取得数）
let lastSpawnTime = 0;
let lastKillTime = 0;
let boss = null;
let bossAppeared = false;
let gameClear = false;

// プレイヤー
const player = {
  x: canvas.width / 2,
  y: canvas.height - 80,
  size: 120,
  speed: 5,
  moving: false,
  moveLeft: false,
  moveRight: false,
  moveUp: false,
  moveDown: false,
  frameCounter: 0,
  flipToggle: 1
};

// 敵画像
const enemyImages = {
  red: new Image(),
  yellow: new Image(),
  green: new Image(),
};
enemyImages.red.src = "enemy_red.png";
enemyImages.yellow.src = "enemy_yellow.png";
enemyImages.green.src = "enemy_green.png";

// プレイヤー画像
const playerImg = new Image();
const playerStopImg = new Image();
playerImg.src = "mushroom_back.png";   // 移動中
playerStopImg.src = "mushroom_face.png"; // 停止中

// タイトル画面画像
const titleImg = new Image();
titleImg.src = "2SnapShot.png"; // ← 同じフォルダに配置してください

// ------------------ 弾クラス（角度対応に変更） ------------------
class Bullet {
  // angle は度（-90 が上）
  constructor(x, y, angle = -90) {
    this.x = x;
    this.y = y;
    this.size = 8;
    this.speed = 6;
    this.angle = angle * Math.PI / 180;
  }
  update() {
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
  }
  draw() {
    ctx.fillStyle = "cyan";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ------------------ アイテムクラス（🍄） ------------------
class Item {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 28;
    this.speedY = 2;
  }

  update() {
    this.y += this.speedY;
  }

  draw() {
    ctx.font = "26px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🍄", this.x, this.y);
  }
}

// ------------------ 敵クラス ------------------
class Enemy {
  constructor(type, x, y, size) {
    this.type = type;
    this.img = enemyImages[type];
    this.x = x;
    this.y = y;
    this.size = size;
    this.speedY = 2;
    this.frameCounter = 0;
    this.flipToggle = 1;

    if (type === "red") { this.hp = 1; this.score = 10; }
    if (type === "yellow") { this.hp = 2; this.score = 20; }
    if (type === "green") { this.hp = 3; this.score = 30; }
  }
  update() {
    this.y += this.speedY;
    this.frameCounter++;
    if (this.frameCounter % 20 === 0) this.flipToggle *= -1;
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.flipToggle, 1);
    ctx.drawImage(this.img, -this.size/2, -this.size/2, this.size, this.size);
    ctx.restore();
  }
}

// ------------------ ボスクラス ------------------
class Boss {
  constructor() {
    this.x = canvas.width / 2;
    this.y = canvas.height / 4;
    this.size = 200;
    this.hp = 100;

    this.vx = 3;
    this.vy = 2;

    this.img = new Image();
    this.img.src = "mushroom_rainbow.png";
  }

  update() {
    // 不規則移動（壁反射 + 乱数ブレ）
    this.x += this.vx;
    this.y += this.vy;

    if (Math.random() < 0.02) {
      this.vx += (Math.random() - 0.5) * 2;
      this.vy += (Math.random() - 0.5) * 2;
    }

    // 壁反射
    if (this.x < this.size/2 || this.x > canvas.width - this.size/2) {
      this.vx *= -1;
    }
    if (this.y < this.size/2 || this.y > canvas.height/2) {
      this.vy *= -1;
    }
  }

  draw() {
    ctx.drawImage(
      this.img,
      this.x - this.size/2,
      this.y - this.size/2,
      this.size,
      this.size
    );

    // HPバー
    ctx.fillStyle = "red";
    ctx.fillRect(50, 20, (canvas.width - 50) * (this.hp / 100), 10);
    ctx.strokeStyle = "white";
    ctx.strokeRect(50, 20, canvas.width - 50, 10);
  }
}


// 敵生成（中央4体）
function spawnEnemies() {
  if (gameOver || startScreen) return;
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

// ------------------ スタート画面描画 ------------------
function drawStartScreen() {
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 縦横比を保持して中央に配置
  let imgAspect = titleImg.width / titleImg.height;
  let canvasAspect = canvas.width / canvas.height;
  let drawWidth, drawHeight;

  if (imgAspect > canvasAspect) {
    drawWidth = canvas.width;
    drawHeight = canvas.width / imgAspect;
  } else {
    drawHeight = canvas.height;
    drawWidth = canvas.height * imgAspect;
  }

  let offsetX = (canvas.width - drawWidth) / 2;
  let offsetY = (canvas.height - drawHeight) / 2;

  ctx.drawImage(titleImg, offsetX, offsetY, drawWidth, drawHeight);

  // スタート案内の文字だけ残す
  const titleFontSize = Math.min(canvas.width / 12, 40);
  ctx.textAlign = "center";
  ctx.font = `${titleFontSize/1.5}px Arial`;

  // 白い縁取り（6px）
  ctx.lineWidth = 6;
  ctx.strokeStyle = "white";
  ctx.strokeText("タップしてスタート", canvas.width / 2, canvas.height * 0.70);

  // 黒文字
  ctx.fillStyle = "black";
  ctx.fillText("タップしてスタート", canvas.width / 2, canvas.height * 0.70);
}

// ------------------ GAME OVER画面 ------------------
function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "40px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 60);

  ctx.font = "24px Arial";
  ctx.fillText(`SCORE: ${score}`, canvas.width / 2, canvas.height / 2 - 20);
  ctx.fillText(`COMBO: ${combo}`, canvas.width / 2, canvas.height / 2 + 20);

  retryBtn.style.display = "block";

  // 共有ボタンを生成（なければ作る）
  let shareBtn = document.getElementById("shareBtn");
  if (!shareBtn) {
    shareBtn = document.createElement("button");
    shareBtn.id = "shareBtn";
    shareBtn.textContent = "Xで共有";
    shareBtn.style.position = "absolute";
    shareBtn.style.top = "75%";
    shareBtn.style.left = "50%";
    shareBtn.style.transform = "translate(-50%, -50%)";
    shareBtn.style.padding = "10px 20px";
    shareBtn.style.fontSize = "18px";
    shareBtn.style.background = "#1DA1F2";
    shareBtn.style.color = "white";
    shareBtn.style.border = "none";
    shareBtn.style.borderRadius = "6px";
    shareBtn.style.cursor = "pointer";
    document.body.appendChild(shareBtn);
  }

  shareBtn.onclick = () => {
    const text = `#しいたけくんゲーム\nスコア: ${score}\nhttps://tomcat-jp.github.io/Siitakekun-Survival/`; // ← 配布URLに変更
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };
}

// ------------------ 弾発射処理（powerLevel に依存） ------------------
function shootBullets() {
  const x = player.x;
  const y = player.y - player.size / 2;

  if (powerLevel <= 0) {
    // 通常：正面1発
    bullets.push(new Bullet(x, y, -90));
  } else if (powerLevel === 1) {
    // 1個取得：前方45度の角度で2方向に連射
    // 前方を-90とし、45度振る → -90 ± 22.5? spec said 45deg but "前方45度の角度で2方向" 
    // 解釈：中心が前方で、左右が前方±22.5だと狭い。ここは「左右45度ずつ」にします（-45, -135）
    // ただしより自然に前寄せにしたいので -90 +/- 22.5 を採用する実装案も考えられます。
    // 指示通り「前方45度の角度で2方向」に忠実にするなら左右に45°ずつ（-90±45）＝ -45, -135
    bullets.push(new Bullet(x, y, -90 - 45)); // 左上 (-135)
    bullets.push(new Bullet(x, y, -90 + 45)); // 右上 (-45)
  } else {
    // 2個取得以上：前方60度の角度で20度ずつ3方向に連射
    // 前方60度で、間隔20度 → 中心を-90、左右は ±20（合計幅40）。しかし "前方60度で20度ずつ3方向" と解釈すると
    // 中心が前方で、左右が前方±20 → 合計幅40（== 60?） 指示はやや曖昧。
    // ここでは「前方を中心に、左右20度ずつ（計3方向）で発射」を採用（-110, -90, -70） => 全体幅40°
    bullets.push(new Bullet(x, y, -90 - 20)); // 左
    bullets.push(new Bullet(x, y, -90));       // 中央
    bullets.push(new Bullet(x, y, -90 + 20)); // 右
  }
}

// ------------------ ゲームループ ------------------
function gameLoop(timestamp) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);


  if (startScreen) {
    drawStartScreen();
  } else if (gameOver) {
    drawGameOver();
  } else if (gameClear) {
    drawGameClear();  
  } else {
    // ボス出現判定
    if (!bossAppeared && score >= 5000) {
      boss = new Boss();
      bossAppeared = true;
      enemies = []; // 通常敵を消す
    }

    // 敵出現間隔
    let interval = 3000;
    if (score >= 1000) interval = 1000;
    else if (score >= 500) interval = 2000;
    if (timestamp - lastSpawnTime > interval) {
      spawnEnemies();
      lastSpawnTime = timestamp;
    }

    // 弾発射（自動連射） - 元の周期を維持
    if (timestamp % 600 < 20) {
      shootBullets();
    }

    // 弾
    bullets.forEach(b => b.update());
    bullets.forEach(b => b.draw());
    bullets = bullets.filter(b => b.y > -b.size && b.x > -b.size && b.x < canvas.width + b.size);

    // 敵
    enemies.forEach(e => e.update());
    enemies.forEach(e => e.draw());
    if (boss) {
      boss.update();
      boss.draw();
    }
    
    if (boss) {
      bullets.forEach((b, bi) => {
        if (
          b.x > boss.x - boss.size/2 &&
          b.x < boss.x + boss.size/2 &&
         b.y > boss.y - boss.size/2 &&
         b.y < boss.y + boss.size/2
        ) {
          boss.hp--;
          bullets.splice(bi, 1);

          if (boss.hp <= 0) {
            boss = null;
            gameClear = true;
          }
        }
      });
    }



    // 弾 vs 敵
    bullets.forEach((b, bi) => {
      enemies.forEach((e, ei) => {
        if (
          b.x > e.x - e.size/2 &&
          b.x < e.x + e.size/2 &&
          b.y > e.y - e.size/2 &&
          b.y < e.y + e.size/2
        ) {
          e.hp--;
          bullets.splice(bi, 1);
          if (e.hp <= 0) {
            // 敵を削除してスコア/コンボ処理
            const ex = e.x;
            const ey = e.y;
            enemies.splice(ei, 1);
            let now = performance.now();
            if (now - lastKillTime < 1000) {
              combo++;
              score += e.score + combo * 5;
            } else {
              combo = 0;
              score += e.score;
            }
            lastKillTime = now;

            // 5%の確率でアイテムを落とす
            if (Math.random() < 0.05) {
              items.push(new Item(ex, ey));
            }
          }
        }
      });
    });

    // 敵 vs プレイヤー（円形判定）
    enemies.forEach(e => {
      let dx = e.x - player.x;
      let dy = e.y - player.y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < (e.size / 2 + player.size / 2) * 0.7) {
        gameOver = true;
      }
    });

    enemies = enemies.filter(e => e.y < canvas.height + 50);

    // アイテム更新・描画
    items.forEach(i => i.update());
    items.forEach(i => i.draw());
    items = items.filter(i => i.y < canvas.height + 40);

    // アイテム取得判定
    items.forEach((item, ii) => {
      let dx = item.x - player.x;
      let dy = item.y - player.y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < (item.size + player.size) / 2) {
        powerLevel++;
        items.splice(ii, 1);
        // （オプション）最大レベルを2に制限したい場合は以下をアンコメント
        // if (powerLevel > 2) powerLevel = 2;
      }
    });

    // PC操作
    if (player.moveLeft) player.x -= player.speed;
    if (player.moveRight) player.x += player.speed;
    if (player.moveUp) player.y -= player.speed;
    if (player.moveDown) player.y += player.speed;

    // 画面外に出ないよう制御
    if (player.x < player.size/2) player.x = player.size/2;
    if (player.x > canvas.width - player.size/2) player.x = canvas.width - player.size/2;
    if (player.y < player.size/2) player.y = player.size/2;
    if (player.y > canvas.height - player.size/2) player.y = canvas.height - player.size/2;

    // プレイヤー移動アニメーション
    if (player.moving) {
      player.frameCounter++;
      if (player.frameCounter % 20 === 0) {
        player.flipToggle *= -1;
      }
    } else {
      player.frameCounter = 0;
      player.flipToggle = 1;
    }

    // プレイヤー描画（反転対応）
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.scale(player.flipToggle, 1);
    ctx.drawImage(
      player.moving ? playerImg : playerStopImg,
      -player.size / 2,
      -player.size / 2,
      player.size,
      player.size
    );
    ctx.restore();

    // スコア表示（スマホ対応・可変フォント・右にオフセット）
    let scoreFontSize = Math.min(canvas.width / 20, 20); // 最大20px、幅に応じて縮小
    ctx.font = `${scoreFontSize}px Arial`;
    ctx.fillStyle = "white";
    ctx.textAlign = "left";

    // 半角3文字分 ≒ フォントサイズ × 3
    let offsetX = scoreFontSize * 3;

    ctx.fillText("SCORE: " + score, 10 + offsetX, scoreFontSize + 10);
    ctx.fillText("COMBO: " + combo, 10 + offsetX, scoreFontSize * 2 + 20);

    // 追加表示：現在の弾レベル（UI）
    ctx.textAlign = "right";
    ctx.fillText(`LV: ${powerLevel}`, canvas.width - 10, scoreFontSize + 10);
  }
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// スタート
canvas.addEventListener("click", () => {
  if (startScreen) {
    startScreen = false;
    lastSpawnTime = performance.now();
  }
});

// PCキー入力（上下対応）
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") { player.moveLeft = true; player.moving = true; }
  if (e.key === "ArrowRight" || e.key === "d") { player.moveRight = true; player.moving = true; }
  if (e.key === "ArrowUp" || e.key === "w") { player.moveUp = true; player.moving = true; }
  if (e.key === "ArrowDown" || e.key === "s") { player.moveDown = true; player.moving = true; }
});
document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") player.moveLeft = false;
  if (e.key === "ArrowRight" || e.key === "d") player.moveRight = false;
  if (e.key === "ArrowUp" || e.key === "w") player.moveUp = false;
  if (e.key === "ArrowDown" || e.key === "s") player.moveDown = false;
  player.moving = player.moveLeft || player.moveRight || player.moveUp || player.moveDown;
});

// スマホ操作（スワイプ中は移動し続ける）
let touchStartX = null, touchStartY = null;
canvas.addEventListener("touchstart", (e) => {
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
});
canvas.addEventListener("touchmove", (e) => {
  const touch = e.touches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy)) {
    player.moveLeft = dx < 0;
    player.moveRight = dx > 0;
    player.moveUp = false;
    player.moveDown = false;
  } else {
    player.moveUp = dy < 0;
    player.moveDown = dy > 0;
    player.moveLeft = false;
    player.moveRight = false;
  }
  player.moving = true;
});
canvas.addEventListener("touchend", () => {
  player.moveLeft = false;
  player.moveRight = false;
  player.moveUp = false;
  player.moveDown = false;
  player.moving = false;
});

// 再チャレンジ
retryBtn.addEventListener("click", () => {
  gameOver = false;
  score = 0;
  combo = 0;
  enemies = [];
  bullets = [];
  items = [];      // アイテムもリセット
  powerLevel = 0;  // レベルリセット
  lastSpawnTime = performance.now();
  retryBtn.style.display = "none";

  const shareBtn = document.getElementById("shareBtn");
  if (shareBtn) shareBtn.remove();
});
//ゲームクリア
function drawGameClear() {
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "gold";
  ctx.font = "48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME CLEAR!", canvas.width/2, canvas.height/2 - 40);

  ctx.font = "24px Arial";
  ctx.fillText(`FINAL SCORE: ${score}`, canvas.width/2, canvas.height/2 + 20);
    // 共有ボタンを生成（なければ作る）
  let shareBtn = document.getElementById("shareBtn");
  if (!shareBtn) {
    shareBtn = document.createElement("button");
    shareBtn.id = "shareBtn";
    shareBtn.textContent = "Xで共有";
    shareBtn.style.position = "absolute";
    shareBtn.style.top = "75%";
    shareBtn.style.left = "50%";
    shareBtn.style.transform = "translate(-50%, -50%)";
    shareBtn.style.padding = "10px 20px";
    shareBtn.style.fontSize = "18px";
    shareBtn.style.background = "#1DA1F2";
    shareBtn.style.color = "white";
    shareBtn.style.border = "none";
    shareBtn.style.borderRadius = "6px";
    shareBtn.style.cursor = "pointer";
    document.body.appendChild(shareBtn);
  }

  shareBtn.onclick = () => {
    const text = `#しいたけくんゲーム\nスコア: ${score}\nhttps://tomcat-jp.github.io/Siitakekun-Survival/`; // ← 配布URLに変更
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };
}

