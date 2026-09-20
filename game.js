// ============================================================
// SURPRISE OVERLAY + CONFETTI
// ============================================================
const surpriseOverlay = document.getElementById('surpriseOverlay');

function launchConfetti() {
  const chars = ['💗', '💕', '✨', '♡', '🐾'];
  for (let i = 0; i < 36; i++) {
    const c = document.createElement('div');
    c.className = 'confetti-heart';
    c.textContent = chars[Math.floor(Math.random() * chars.length)];
    c.style.left = Math.random() * 100 + 'vw';
    c.style.animationDuration = (2.4 + Math.random() * 1.8) + 's';
    c.style.fontSize = (14 + Math.random() * 14) + 'px';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 4500);
  }
}

function showSurprise() {
  launchConfetti();
  surpriseOverlay.classList.add('show');
}

// ============================================================
// FEED THE CAT (endless runner)
// ============================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const bestEl = document.getElementById('best');
const msgEl = document.getElementById('gameMsg');
const startBtn = document.getElementById('startBtn');
const magnetStateEl = document.getElementById('magnetState');

const TARGET = 21;
const MAX_LIVES = 3;
const GROUND_Y = canvas.height - 46;
const GRAVITY = 0.7;
const JUMP_VELOCITY = -13;
const RUNNER_X = 74;
const RUNNER_SIZE = 30;
const DEFAULT_MSG = 'Click / tap / press space to jump';
const MAGNET_DURATION = 360; // frames (~6s at 60fps)

let runnerY = GROUND_Y;
let velocity = 0;
let onGround = true;
let obstacles = [];
let stars = [];
let particles = [];
let score = 0;
let lives = MAX_LIVES;
let invincibleFrames = 0;
let best = parseInt(localStorage.getItem('catBest') || '0', 10);
let running = false;
let rafId = null;
let speed = 3.6;
let distanceSinceSpawn = 0;
let nextSpawnGap = 240;
let groundOffset = 0;
let tailWag = 0;
let twinklePhase = 0;

// juicy feedback state
let screenShakeFrames = 0;
let hitFlashFrames = 0;
let magnetFrames = 0;
let milestoneTimeout = null;
let shownMilestones = new Set();

bestEl.textContent = best;

function resetState() {
  runnerY = GROUND_Y;
  velocity = 0;
  onGround = true;
  obstacles = [];
  particles = [];
  score = 0;
  lives = MAX_LIVES;
  invincibleFrames = 0;
  speed = 3.6;
  distanceSinceSpawn = 0;
  nextSpawnGap = 240;
  screenShakeFrames = 0;
  hitFlashFrames = 0;
  magnetFrames = 0;
  shownMilestones = new Set();
  scoreEl.textContent = score;
  livesEl.textContent = '🐾'.repeat(lives);
  setMagnetHud(false);
  if (stars.length === 0) initStars();
}

function initStars() {
  stars = [];
  for (let i = 0; i < 40; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * (GROUND_Y - 10),
      r: 0.6 + Math.random() * 1.4,
      phase: Math.random() * Math.PI * 2
    });
  }
}

// ---------------- juicy feedback: particles, shake, flash ----------------

function spawnBurst(x, y, chars, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = 1.2 + Math.random() * 2.2;
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - 1,
      life: 28 + Math.random() * 14,
      maxLife: 42,
      char: chars[Math.floor(Math.random() * chars.length)],
      size: 10 + Math.random() * 8
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.08; // gentle gravity on particles
    p.life -= 1;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  particles.forEach((p) => {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = p.size + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.char, p.x, p.y);
    ctx.restore();
  });
}

function triggerHit() {
  screenShakeFrames = 14;
  hitFlashFrames = 16;
  spawnBurst(RUNNER_X, runnerY - RUNNER_SIZE / 2, ['💥', '😿'], 5);
}

function setMagnetHud(on, secondsLeft) {
  if (!magnetStateEl) return;
  if (on) {
    magnetStateEl.textContent = 'On (' + secondsLeft + 's)';
    magnetStateEl.classList.add('magnet-on');
  } else {
    magnetStateEl.textContent = 'Off';
    magnetStateEl.classList.remove('magnet-on');
  }
}

function checkMilestone(newScore) {
  const milestones = {
    7: "Nice! 7 down 🐾",
    14: "Almost there! 14 down 🐾"
  };
  if (milestones[newScore] && !shownMilestones.has(newScore)) {
    shownMilestones.add(newScore);
    msgEl.textContent = milestones[newScore];
    clearTimeout(milestoneTimeout);
    milestoneTimeout = setTimeout(() => {
      if (running) msgEl.textContent = DEFAULT_MSG;
    }, 1400);
  }
}

// ---------------- background: night sky, moon, hills ----------------

function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#170A16');
  grad.addColorStop(0.55, '#2B1220');
  grad.addColorStop(1, '#3D1B30');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // moon with soft glow
  const moonX = canvas.width - 80;
  const moonY = 56;
  const glow = ctx.createRadialGradient(moonX, moonY, 4, moonX, moonY, 80);
  glow.addColorStop(0, 'rgba(255, 201, 221, 0.35)');
  glow.addColorStop(1, 'rgba(255, 201, 221, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 80, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFF3F5';
  ctx.beginPath();
  ctx.arc(moonX, moonY, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(200, 150, 175, 0.35)';
  ctx.beginPath();
  ctx.arc(moonX - 7, moonY - 4, 4, 0, Math.PI * 2);
  ctx.arc(moonX + 5, moonY + 7, 3, 0, Math.PI * 2);
  ctx.fill();

  // twinkling stars
  twinklePhase += 0.03;
  stars.forEach((s) => {
    const tw = 0.5 + 0.5 * Math.sin(twinklePhase + s.phase);
    ctx.fillStyle = `rgba(255,255,255,${0.25 + tw * 0.45})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // distant hill silhouettes (two layers for depth)
  drawHillLayer(GROUND_Y - 30, 'rgba(61, 27, 48, 0.7)', 40, groundOffset * 0.25);
  drawHillLayer(GROUND_Y - 14, 'rgba(43, 18, 32, 0.9)', 26, groundOffset * 0.5);

  ctx.fillStyle = '#24101C';
  ctx.fillRect(0, GROUND_Y + 6, canvas.width, canvas.height - GROUND_Y - 6);
}

function drawHillLayer(baseY, color, amplitude, offset) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  const step = 70;
  for (let x = -step; x <= canvas.width + step; x += step) {
    const wx = x - (offset % (step * 2));
    const y = baseY - Math.abs(Math.sin(wx / 140)) * amplitude;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawGroundPath() {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  const spacing = 46;
  const start = -(groundOffset % spacing);
  for (let x = start; x < canvas.width; x += spacing) {
    drawPawPrint(x, GROUND_Y + 16);
  }
  ctx.restore();
}

function drawPawPrint(x, y) {
  ctx.beginPath();
  ctx.ellipse(x, y, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.ellipse(x + i * 4.5, y - 7, 2, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------------- cat character ----------------

function drawCat(x, y, size, legPhase) {
  ctx.save();
  ctx.translate(x, y);

  // magnet glow ring while active
  if (magnetFrames > 0) {
    const pulse = 1 + 0.08 * Math.sin(Date.now() / 90);
    const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 34 * pulse);
    glow.addColorStop(0, 'rgba(180, 140, 255, 0.35)');
    glow.addColorStop(1, 'rgba(180, 140, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 34 * pulse, 0, Math.PI * 2);
    ctx.fill();
  }

  const s = size / 30;
  ctx.scale(s, s);

  ctx.strokeStyle = '#E8934A';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-14, 4);
  ctx.quadraticCurveTo(-30, -6 + Math.sin(tailWag) * 4, -26, -20);
  ctx.stroke();

  ctx.fillStyle = '#F4A94E';
  ctx.beginPath();
  ctx.ellipse(0, 4, 17, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(14, -10, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(7, -18);
  ctx.lineTo(11, -28);
  ctx.lineTo(15, -19);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(17, -19);
  ctx.lineTo(22, -29);
  ctx.lineTo(24, -18);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#FFD9AE';
  ctx.beginPath();
  ctx.moveTo(9, -20);
  ctx.lineTo(11.5, -25);
  ctx.lineTo(13.5, -20);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#D9862E';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-6, -3); ctx.lineTo(-6, 6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(2, -5); ctx.lineTo(2, 6); ctx.stroke();

  ctx.fillStyle = '#200E19';
  ctx.beginPath(); ctx.arc(18, -11, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(11, -12, 1.6, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = '#F4A94E';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  const l1 = Math.sin(legPhase) * 6;
  const l2 = Math.sin(legPhase + Math.PI) * 6;
  ctx.beginPath(); ctx.moveTo(-8, 14); ctx.lineTo(-8 + l1, 22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6, 14); ctx.lineTo(6 + l2, 22); ctx.stroke();

  ctx.restore();
}

// ---------------- collectibles + obstacles ----------------

function drawFish(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#8FD3E8';
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(11, 0);
  ctx.lineTo(20, -8);
  ctx.lineTo(20, 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#200E19';
  ctx.beginPath();
  ctx.arc(-6, -1, 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawVitamin(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.5);
  ctx.fillStyle = '#FF8FB3';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(-14, -7, 14, 14, 7);
    ctx.fill();
  } else {
    ctx.fillRect(-14, -7, 14, 14);
  }
  ctx.fillStyle = '#FFFFFF';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(0, -7, 14, 14, 7);
    ctx.fill();
  } else {
    ctx.fillRect(0, -7, 14, 14);
  }
  ctx.restore();
}

function drawMagnetIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  const bob = Math.sin(Date.now() / 150) * 3;
  ctx.translate(0, bob);
  // simple horseshoe magnet shape
  ctx.strokeStyle = '#B98CFF';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, 10, Math.PI * 0.15, Math.PI * 0.85, false);
  ctx.stroke();
  ctx.fillStyle = '#E9DBFF';
  ctx.fillRect(-13, -2, 5, 9);
  ctx.fillRect(8, -2, 5, 9);
  ctx.fillStyle = '#B98CFF';
  ctx.fillRect(-13, 5, 5, 3);
  ctx.fillRect(8, 5, 5, 3);
  ctx.restore();
}

function drawHairball(x, groundY) {
  ctx.save();
  ctx.translate(x, groundY - 14);
  ctx.fillStyle = '#8C7A6B';
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5C4B3E';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6);
    ctx.lineTo(Math.cos(a) * 13, Math.sin(a) * 13);
    ctx.stroke();
  }
  ctx.restore();
}

function spawnObstacle() {
  const r = Math.random();
  if (r < 0.06) {
    // rare magnet power-up
    obstacles.push({
      x: canvas.width + 20,
      type: 'magnet',
      y: GROUND_Y - 70 - Math.random() * 20,
      collected: false
    });
  } else if (r < 0.06 + 0.56) {
    obstacles.push({
      x: canvas.width + 20,
      type: Math.random() < 0.5 ? 'fish' : 'vitamin',
      y: GROUND_Y - 65 - Math.random() * 20,
      collected: false
    });
  } else {
    obstacles.push({
      x: canvas.width + 20,
      type: 'hairball'
    });
  }
}

function jump() {
  if (!running) return;
  if (onGround) {
    velocity = JUMP_VELOCITY;
    onGround = false;
  }
}

function endGame(won) {
  running = false;
  cancelAnimationFrame(rafId);
  startBtn.textContent = 'Play again';
  if (score > best) {
    best = score;
    localStorage.setItem('catBest', String(best));
    bestEl.textContent = best;
  }
  if (won) {
    msgEl.textContent = "All fed up. 🐱";
    localStorage.setItem('heartsUnlocked', '1');
    showSurprise();
  } else {
    msgEl.textContent = "Out of lives — treats collected: " + score;
  }
}

function update() {
  velocity += GRAVITY;
  runnerY += velocity;
  if (runnerY >= GROUND_Y) {
    runnerY = GROUND_Y;
    velocity = 0;
    onGround = true;
  }

  if (invincibleFrames > 0) invincibleFrames--;
  if (screenShakeFrames > 0) screenShakeFrames--;
  if (hitFlashFrames > 0) hitFlashFrames--;

  if (magnetFrames > 0) {
    magnetFrames--;
    setMagnetHud(true, Math.ceil(magnetFrames / 60));
    if (magnetFrames === 0) setMagnetHud(false);
  }

  updateParticles();

  speed = Math.min(7, speed + 0.0012);
  groundOffset = (groundOffset + speed) % 46;
  tailWag += 0.15;

  distanceSinceSpawn += speed;
  if (distanceSinceSpawn >= nextSpawnGap) {
    distanceSinceSpawn = 0;
    nextSpawnGap = 190 + Math.random() * 120;
    spawnObstacle();
  }

  const magnetActive = magnetFrames > 0;
  const pickupRadiusX = magnetActive ? 60 : 28;
  const pickupRadiusY = magnetActive ? 70 : 34;

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= speed;

    if (o.type === 'hairball') {
      const hit = invincibleFrames === 0 &&
                  Math.abs(o.x - RUNNER_X) < 20 &&
                  runnerY + RUNNER_SIZE / 2 > GROUND_Y - 22;
      if (hit) {
        lives -= 1;
        livesEl.textContent = '🐾'.repeat(Math.max(lives, 0));
        invincibleFrames = 45;
        triggerHit();
        obstacles.splice(i, 1);
        if (lives <= 0) { endGame(false); return; }
        continue;
      }
    } else if (!o.collected) {
      const dx = Math.abs(o.x - RUNNER_X);
      const dy = Math.abs(o.y - runnerY);
      if (dx < pickupRadiusX && dy < pickupRadiusY) {
        o.collected = true;

        if (o.type === 'magnet') {
          magnetFrames = MAGNET_DURATION;
          setMagnetHud(true, Math.ceil(magnetFrames / 60));
          spawnBurst(o.x, o.y, ['✨', '💜'], 8);
        } else {
          score += 1;
          scoreEl.textContent = score;
          spawnBurst(o.x, o.y, ['💗', '✨'], 7);
          checkMilestone(score);
          if (score >= TARGET) { endGame(true); return; }
        }
      }
    }

    if (o.x < -30) obstacles.splice(i, 1);
  }
}

function draw() {
  ctx.save();

  if (screenShakeFrames > 0) {
    const mag = 4 * (screenShakeFrames / 14);
    ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
  }

  drawBackground();
  drawGroundPath();

  obstacles.forEach((o) => {
    if (o.type === 'hairball') drawHairball(o.x, GROUND_Y);
    else if (!o.collected) {
      if (o.type === 'fish') drawFish(o.x, o.y);
      else if (o.type === 'vitamin') drawVitamin(o.x, o.y);
      else if (o.type === 'magnet') drawMagnetIcon(o.x, o.y);
    }
  });

  const legPhase = onGround ? (Date.now() / 60) : 0;
  const squash = onGround ? 1 : 1 - Math.min(0.15, Math.abs(velocity) * 0.01);
  ctx.save();
  ctx.translate(RUNNER_X, runnerY - RUNNER_SIZE / 2);
  ctx.scale(1, squash);
  drawCat(0, 0, RUNNER_SIZE, legPhase);
  ctx.restore();

  drawParticles();

  if (hitFlashFrames > 0) {
    ctx.save();
    ctx.globalAlpha = (hitFlashFrames / 16) * 0.35;
    ctx.fillStyle = '#FF3B5C';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  ctx.restore();
}

function loop() {
  if (!running) return;
  update();
  draw();
  if (running) rafId = requestAnimationFrame(loop);
}

function startGame() {
  resetState();
  running = true;
  msgEl.textContent = DEFAULT_MSG;
  startBtn.textContent = 'Restart';
  surpriseOverlay.classList.remove('show');
  cancelAnimationFrame(rafId);
  draw();
  loop();
}

startBtn.addEventListener('click', startGame);

canvas.addEventListener('mousedown', jump);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); jump(); }, { passive: false });
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); jump(); }
});

// initial idle frame
initStars();
draw();