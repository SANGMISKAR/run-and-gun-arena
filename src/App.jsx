import React, { useEffect, useRef, useState } from 'react';

const WIDTH = 960;
const HEIGHT = 540;
const GROUND = 460;

const LEVELS = [
  { name: 'Jungle Outpost', subtitle: 'Warm-up assault', sky: ['#071426', '#173b52'], target: 900, boss: 'Titan Walker' },
  { name: 'Neon Factory', subtitle: 'Lights, lasers, danger', sky: ['#210b36', '#6b275d'], target: 1400, boss: 'Core Crusher' },
  { name: 'Volcano Base', subtitle: 'Final extraction', sky: ['#280b0b', '#8f3d25'], target: 2000, boss: 'Magma Lord' },
];

function App() {
  const canvasRef = useRef(null);
  const [screen, setScreen] = useState('menu');
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(3);
  const [weapon, setWeapon] = useState('BLASTER');
  const [bossHealth, setBossHealth] = useState(0);

  useEffect(() => {
    if (screen !== 'playing') return undefined;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const keys = new Set();
    const touchKeys = new Set();
    const level = LEVELS[selectedLevel];
    const player = { x: 120, y: GROUND - 42, width: 28, height: 42, velocityY: 0, facing: 1, cooldown: 0, invulnerable: 0, weapon: 'BLASTER', weaponTimer: 0 };
    const bullets = [];
    const enemies = [];
    const pickups = [];
    const particles = [];
    const platforms = selectedLevel === 1
      ? [{ x: 70, y: 350, width: 190, height: 16 }, { x: 350, y: 280, width: 190, height: 16 }, { x: 670, y: 360, width: 210, height: 16 }]
      : [{ x: 80, y: 365, width: 180, height: 16 }, { x: 370, y: 315, width: 170, height: 16 }, { x: 680, y: 380, width: 200, height: 16 }];
    let animationFrame;
    let lastTime = performance.now();
    let spawnTimer = 0.3;
    let boss = null;
    let worldOffset = 0;
    let currentScore = 0;
    let currentHealth = 3;
    let running = true;
    let audioContext;

    const beep = (frequency, duration, type = 'square') => {
      try {
        audioContext ||= new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.08, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
        oscillator.connect(gain).connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
      } catch {
        // Audio is optional and can be unavailable in restricted browsers.
      }
    };
    const burst = (x, y, color, count = 8) => {
      for (let i = 0; i < count; i += 1) particles.push({ x, y, velocityX: (Math.random() - 0.5) * 170, velocityY: (Math.random() - 0.8) * 170, life: 0.4, color });
    };
    const addScore = (amount) => {
      currentScore += amount;
      setScore(currentScore);
    };
    const damagePlayer = () => {
      if (player.invulnerable > 0) return;
      currentHealth -= 1;
      player.invulnerable = 1.3;
      setHealth(currentHealth);
      burst(player.x + player.width / 2, player.y + player.height / 2, '#f94144');
      beep(90, 0.16, 'sawtooth');
      if (currentHealth <= 0) {
        running = false;
        setScreen('gameover');
      }
    };
    const shoot = () => {
      if (!running || player.cooldown > 0) return;
      const directions = player.weapon === 'SPREAD' ? [-0.18, 0, 0.18] : [0];
      directions.forEach((angle) => bullets.push({ x: player.x + (player.facing > 0 ? player.width : 0), y: player.y + 17, velocityX: player.facing * Math.cos(angle) * 650, velocityY: Math.sin(angle) * 650, damage: player.weapon === 'RAPID' ? 1 : 2, life: 1.5 }));
      player.cooldown = player.weapon === 'RAPID' ? 0.08 : 0.2;
      burst(player.x + (player.facing > 0 ? player.width : 0), player.y + 17, '#ffd166', 3);
      beep(player.weapon === 'SPREAD' ? 520 : 680, 0.05);
    };
    const jump = () => {
      const standingOnGround = player.y + player.height >= GROUND - 1;
      const standingOnPlatform = platforms.some((platform) => player.x + player.width > platform.x && player.x < platform.x + platform.width && Math.abs(player.y + player.height - platform.y) < 3);
      if (standingOnGround || standingOnPlatform) {
        player.velocityY = -470;
        beep(260, 0.06);
      }
    };
    const spawnEnemy = () => {
      const fromRight = Math.random() > 0.2;
      const roll = Math.random();
      const type = roll < 0.2 ? 'jumper' : roll < 0.42 ? 'shooter' : 'grunt';
      enemies.push({
        type, x: fromRight ? WIDTH + 30 : -40, y: type === 'jumper' ? GROUND - 44 : GROUND - 34,
        width: type === 'jumper' ? 28 : 26, height: type === 'jumper' ? 44 : 34,
        speed: type === 'jumper' ? 90 : type === 'shooter' ? 35 : 55 + Math.random() * 35,
        direction: fromRight ? -1 : 1, cooldown: 1 + Math.random() * 2, jumpTimer: 1,
      });
    };
    const spawnPickup = (x, y) => pickups.push({ x, y, width: 22, height: 22, type: Math.random() > 0.5 ? 'SPREAD' : 'RAPID', life: 12 });
    const spawnBoss = () => {
      boss = { x: WIDTH - 130, y: 280, width: 80, height: 110, health: 24 + selectedLevel * 8, maxHealth: 24 + selectedLevel * 8, cooldown: 1, direction: -1 };
      setBossHealth(boss.health);
      beep(70, 0.5, 'sawtooth');
    };
    const onKeyDown = (event) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' ', 'a', 'd', 'w', 'Enter'].includes(event.key)) event.preventDefault();
      keys.add(event.key.toLowerCase());
      if (event.key === ' ' || event.key.toLowerCase() === 'w' || event.key.toLowerCase() === 'arrowup') jump();
      if (event.key.toLowerCase() === 'j' || event.key.toLowerCase() === 'z') shoot();
      if (event.key === 'Enter' && !running) setScreen('menu');
    };
    const onKeyUp = (event) => keys.delete(event.key.toLowerCase());
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    const setTouch = (key, active) => {
      if (active) touchKeys.add(key);
      else touchKeys.delete(key);
      if (key === 'jump' && active) jump();
      if (key === 'fire' && active) shoot();
    };
    window.runGunTouch = setTouch;

    const update = (delta) => {
      if (!running) return;
      const seconds = Math.min(delta / 1000, 0.04);
      const movingLeft = keys.has('a') || keys.has('arrowleft') || touchKeys.has('left');
      const movingRight = keys.has('d') || keys.has('arrowright') || touchKeys.has('right');
      const movement = (movingRight ? 1 : 0) - (movingLeft ? 1 : 0);
      if (movement) {
        player.facing = movement;
        player.x += movement * 230 * seconds;
        worldOffset += movement * 24 * seconds;
      }
      player.x = Math.max(18, Math.min(WIDTH - player.width - 18, player.x));
      player.velocityY += 1100 * seconds;
      const previousBottom = player.y + player.height;
      player.y += player.velocityY * seconds;
      let landingY = GROUND;
      platforms.forEach((platform) => {
        if (previousBottom <= platform.y && player.y + player.height >= platform.y && player.x + player.width > platform.x && player.x < platform.x + platform.width && player.velocityY >= 0) landingY = Math.min(landingY, platform.y);
      });
      if (player.y + player.height >= landingY) { player.y = landingY - player.height; player.velocityY = 0; }
      player.cooldown = Math.max(0, player.cooldown - seconds);
      player.invulnerable = Math.max(0, player.invulnerable - seconds);
      player.weaponTimer = Math.max(0, player.weaponTimer - seconds);
      if (player.weaponTimer === 0) player.weapon = 'BLASTER';
      if (keys.has('j') || keys.has('z') || touchKeys.has('fire')) shoot();
      spawnTimer -= seconds;
      if (!boss && currentScore < level.target && spawnTimer <= 0) { spawnEnemy(); spawnTimer = Math.max(0.55, 1.25 - currentScore / 1600); }
      if (!boss && currentScore >= level.target) spawnBoss();
      bullets.forEach((bullet) => { bullet.x += bullet.velocityX * seconds; bullet.y += bullet.velocityY * seconds; bullet.life -= seconds; });
      for (let i = bullets.length - 1; i >= 0; i -= 1) if (bullets[i].life <= 0 || bullets[i].x < -30 || bullets[i].x > WIDTH + 30 || bullets[i].y < -30 || bullets[i].y > HEIGHT) bullets.splice(i, 1);
      enemies.forEach((enemy) => {
        enemy.x += enemy.direction * enemy.speed * seconds;
        enemy.cooldown -= seconds;
        if (enemy.type === 'jumper') { enemy.jumpTimer -= seconds; if (enemy.jumpTimer <= 0) { enemy.jumpTimer = 1.5; enemy.y -= 80; } else if (enemy.y < GROUND - enemy.height) enemy.y += 180 * seconds; }
        if (enemy.type === 'shooter' && enemy.cooldown <= 0 && Math.abs(enemy.x - player.x) < 360) { enemy.cooldown = 1.7; bullets.push({ x: enemy.x, y: enemy.y + 15, velocityX: enemy.x > player.x ? -300 : 300, velocityY: 0, enemyShot: true, damage: 1, life: 2 }); beep(160, 0.04); }
      });
      for (let i = enemies.length - 1; i >= 0; i -= 1) {
        const enemy = enemies[i];
        let destroyed = false;
        for (let j = bullets.length - 1; j >= 0; j -= 1) {
          const bullet = bullets[j];
          if (!bullet.enemyShot && bullet.x > enemy.x && bullet.x < enemy.x + enemy.width && bullet.y > enemy.y && bullet.y < enemy.y + enemy.height) {
            bullets.splice(j, 1); enemies.splice(i, 1); addScore(100); if (Math.random() < 0.16) spawnPickup(enemy.x, enemy.y); burst(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ffca3a'); beep(120, 0.08); destroyed = true; break;
          }
        }
        if (!destroyed && player.invulnerable <= 0 && player.x < enemy.x + enemy.width && player.x + player.width > enemy.x && player.y < enemy.y + enemy.height && player.y + player.height > enemy.y) { enemies.splice(i, 1); damagePlayer(); }
      }
      for (let i = bullets.length - 1; i >= 0; i -= 1) {
        const bullet = bullets[i];
        if (bullet.enemyShot && player.invulnerable <= 0 && bullet.x > player.x && bullet.x < player.x + player.width && bullet.y > player.y && bullet.y < player.y + player.height) { bullets.splice(i, 1); damagePlayer(); }
        if (boss && !bullet.enemyShot && bullet.x > boss.x && bullet.x < boss.x + boss.width && bullet.y > boss.y && bullet.y < boss.y + boss.height) { bullets.splice(i, 1); boss.health -= bullet.damage; setBossHealth(Math.max(0, boss.health)); burst(bullet.x, bullet.y, '#ffca3a', 2); if (boss.health <= 0) { addScore(1000); boss = null; setBossHealth(0); running = false; setScreen('victory'); beep(880, 0.4); } }
      }
      if (boss) {
        boss.x += boss.direction * 25 * seconds;
        if (boss.x < 560 || boss.x > 820) boss.direction *= -1;
        boss.cooldown -= seconds;
        if (boss.cooldown <= 0) { boss.cooldown = 1.1; bullets.push({ x: boss.x, y: boss.y + 50, velocityX: -260, velocityY: (player.y - boss.y) * 0.5, enemyShot: true, damage: 1, life: 3 }); }
        if (player.invulnerable <= 0 && player.x < boss.x + boss.width && player.x + player.width > boss.x && player.y < boss.y + boss.height && player.y + player.height > boss.y) damagePlayer();
      }
      for (let i = pickups.length - 1; i >= 0; i -= 1) {
        const pickup = pickups[i]; pickup.life -= seconds; pickup.y += Math.sin(pickup.life * 5) * seconds * 8;
        if (pickup.life <= 0) { pickups.splice(i, 1); continue; }
        if (player.x < pickup.x + pickup.width && player.x + player.width > pickup.x && player.y < pickup.y + pickup.height && player.y + player.height > pickup.y) { player.weapon = pickup.type; player.weaponTimer = 10; setWeapon(pickup.type); pickups.splice(i, 1); beep(740, 0.15); }
      }
      for (let i = particles.length - 1; i >= 0; i -= 1) { const particle = particles[i]; particle.x += particle.velocityX * seconds; particle.y += particle.velocityY * seconds; particle.velocityY += 400 * seconds; particle.life -= seconds; if (particle.life <= 0) particles.splice(i, 1); }
    };
    const draw = () => {
      context.clearRect(0, 0, WIDTH, HEIGHT);
      const sky = context.createLinearGradient(0, 0, 0, HEIGHT); sky.addColorStop(0, level.sky[0]); sky.addColorStop(1, level.sky[1]); context.fillStyle = sky; context.fillRect(0, 0, WIDTH, HEIGHT);
      context.fillStyle = selectedLevel === 2 ? '#b94b2d' : selectedLevel === 1 ? '#a33f84' : '#1d5260';
      for (let i = -1; i < 12; i += 1) { const x = i * 110 - ((worldOffset * 0.4) % 110); context.beginPath(); context.moveTo(x, 310); context.lineTo(x + 55, 250); context.lineTo(x + 130, 310); context.fill(); }
      context.fillStyle = selectedLevel === 2 ? '#321517' : '#102d37'; context.fillRect(0, GROUND, WIDTH, HEIGHT - GROUND);
      context.strokeStyle = selectedLevel === 1 ? '#db68bd' : '#2f7580'; context.lineWidth = 2;
      for (let x = -20; x < WIDTH + 30; x += 40) { context.beginPath(); context.moveTo(x - ((worldOffset * 0.7) % 40), GROUND); context.lineTo(x + 30 - ((worldOffset * 0.7) % 40), HEIGHT); context.stroke(); }
      platforms.forEach((platform) => { context.fillStyle = selectedLevel === 1 ? '#d45bc3' : selectedLevel === 2 ? '#e36b35' : '#f4a261'; context.fillRect(platform.x, platform.y, platform.width, platform.height); context.fillStyle = '#7f4f24'; context.fillRect(platform.x, platform.y + platform.height, platform.width, 7); });
      bullets.forEach((bullet) => { context.fillStyle = bullet.enemyShot ? '#ff6b6b' : '#ffe66d'; context.fillRect(bullet.x - 5, bullet.y - 2, 10, 4); });
      enemies.forEach((enemy) => { const color = enemy.type === 'shooter' ? '#9b5de5' : enemy.type === 'jumper' ? '#00bbf9' : '#e63946'; context.fillStyle = color; context.fillRect(enemy.x, enemy.y + 10, enemy.width, enemy.height - 10); context.fillStyle = '#f1fa8c'; context.fillRect(enemy.x + 5, enemy.y, enemy.width - 10, 13); });
      pickups.forEach((pickup) => { context.fillStyle = pickup.type === 'SPREAD' ? '#ff9f1c' : '#00f5d4'; context.fillRect(pickup.x, pickup.y, pickup.width, pickup.height); context.fillStyle = '#08111e'; context.font = 'bold 14px monospace'; context.fillText(pickup.type === 'SPREAD' ? 'S' : 'R', pickup.x + 6, pickup.y + 16); });
      if (boss) { context.fillStyle = '#571845'; context.fillRect(boss.x, boss.y, boss.width, boss.height); context.fillStyle = '#f94144'; context.fillRect(boss.x + 15, boss.y + 15, 50, 25); context.fillStyle = '#ffd166'; context.fillRect(boss.x + 22, boss.y + 55, 36, 35); context.fillStyle = '#f8f9fa'; context.fillRect(560, 30, 280, 12); context.fillStyle = '#f94144'; context.fillRect(560, 30, 280 * (boss.health / boss.maxHealth), 12); context.fillStyle = '#fff'; context.font = 'bold 14px monospace'; context.fillText(level.boss.toUpperCase(), 560, 24); }
      particles.forEach((particle) => { context.globalAlpha = Math.max(0, particle.life * 2); context.fillStyle = particle.color; context.fillRect(particle.x, particle.y, 4, 4); }); context.globalAlpha = 1;
      if (player.invulnerable <= 0 || Math.floor(player.invulnerable * 12) % 2 === 0) { context.fillStyle = '#3a86ff'; context.fillRect(player.x + 4, player.y + 13, 20, 29); context.fillStyle = '#ffca3a'; context.fillRect(player.x + 7, player.y, 14, 15); context.fillStyle = '#111827'; context.fillRect(player.x + 10, player.y + 4, 3, 4); context.fillRect(player.x + 16, player.y + 4, 3, 4); context.fillStyle = '#94d2bd'; context.fillRect(player.x + (player.facing > 0 ? 21 : -13), player.y + 18, 16, 6); }
    };
    const frame = (now) => { const delta = now - lastTime; lastTime = now; update(delta); draw(); animationFrame = requestAnimationFrame(frame); };
    animationFrame = requestAnimationFrame(frame);
    return () => { running = false; cancelAnimationFrame(animationFrame); window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); delete window.runGunTouch; };
  }, [screen, selectedLevel]);

  const start = (levelIndex = selectedLevel) => { setSelectedLevel(levelIndex); setScore(0); setHealth(3); setWeapon('BLASTER'); setBossHealth(0); setScreen('playing'); };
  const touchButton = (key, label) => <button className={`touch-button ${key}`} onPointerDown={() => window.runGunTouch?.(key, true)} onPointerUp={() => window.runGunTouch?.(key, false)} onPointerLeave={() => window.runGunTouch?.(key, false)}>{label}</button>;

  return (
    <main className="app-shell">
      <section className="hero"><div><p className="eyebrow">RUN // GUN // SURVIVE</p><h1>Run &amp; Gun Arena</h1><p className="subtitle">Original arcade action. Three missions. One final boss.</p></div><div className="scoreboard"><div><span>SCORE</span><strong>{String(score).padStart(6, '0')}</strong></div><div><span>ARMOR</span><strong className="hearts">{'♥'.repeat(health)}{'♡'.repeat(3 - health)}</strong></div><div><span>WEAPON</span><strong>{weapon}</strong></div></div></section>
      <section className="game-frame">
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} aria-label="Run and gun game arena" />
        {screen === 'menu' && <div className="overlay menu"><p className="eyebrow">SELECT MISSION</p><h2>Choose your drop zone</h2><div className="level-grid">{LEVELS.map((item, index) => <button key={item.name} className={selectedLevel === index ? 'level-card active' : 'level-card'} onClick={() => setSelectedLevel(index)}><b>0{index + 1}</b><strong>{item.name}</strong><small>{item.subtitle}</small><em>BOSS: {item.boss}</em></button>)}</div><button className="launch" onClick={() => start()}>Deploy ▶</button></div>}
        {(screen === 'gameover' || screen === 'victory') && <div className="overlay"><p className="eyebrow">{screen === 'victory' ? 'MISSION COMPLETE' : 'MISSION FAILED'}</p><h2>{screen === 'victory' ? 'Base secured.' : 'Keep moving.'}</h2><p>You scored {score} points.</p><button className="launch" onClick={() => setScreen('menu')}>Mission select ↵</button></div>}
        {screen === 'playing' && <div className="touch-controls">{touchButton('left', '◀')}{touchButton('right', '▶')}{touchButton('jump', '▲')}{touchButton('fire', '●')}</div>}
      </section>
      <footer className="controls"><span><b>A / D</b> move</span><span><b>W / SPACE</b> jump</span><span><b>J / Z</b> fire</span><span><b>OR USE TOUCH BUTTONS</b></span></footer>
    </main>
  );
}

export default App;
