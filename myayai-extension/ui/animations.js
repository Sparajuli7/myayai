// Confetti animation using canvas
function showConfetti(duration = 3000) {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  for (let i = 0; i < 100; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 5 + 5,
      speed: Math.random() * 3 + 2,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`
    });
  }

  let startTime = Date.now();
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.y += p.speed;
      if (p.y > canvas.height) p.y = -p.size;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });

    if (Date.now() - startTime < duration) {
      requestAnimationFrame(animate);
    } else {
      document.body.removeChild(canvas);
    }
  }
  animate();
}

// Floating +XP notification
function showFloatingXP(xp, targetElement) {
  const notification = document.createElement('div');
  notification.textContent = `+${xp} XP`;
  notification.style.position = 'absolute';
  notification.style.background = 'rgba(0, 255, 0, 0.8)';
  notification.style.color = 'white';
  notification.style.padding = '5px 10px';
  notification.style.borderRadius = '5px';
  notification.style.zIndex = '10000';
  notification.style.transition = 'all 1s ease-out';

  const rect = targetElement.getBoundingClientRect();
  notification.style.left = `${rect.left + rect.width / 2 - 30}px`;
  notification.style.top = `${rect.top - 30}px`;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.transform = 'translateY(-50px)';
    notification.style.opacity = '0';
  }, 100);

  setTimeout(() => {
    document.body.removeChild(notification);
  }, 1200);
}

// Progress bar fill animation
function animateProgressBar(progressBar, targetValue, duration = 1000) {
  let startValue = parseFloat(progressBar.style.width) || 0;
  let startTime = Date.now();

  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const value = startValue + (targetValue - startValue) * progress;
    progressBar.style.width = `${value}%`;

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  animate();
}

// Badge unlock animation
function showBadgeUnlock(badgeName) {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.background = 'rgba(0,0,0,0.5)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '10000';

  const content = document.createElement('div');
  content.style.background = 'white';
  content.style.padding = '20px';
  content.style.borderRadius = '10px';
  content.style.textAlign = 'center';
  content.innerHTML = `<h2>Achievement Unlocked!</h2><p>${badgeName}</p>`;

  overlay.appendChild(content);
  document.body.appendChild(overlay);

  setTimeout(() => {
    document.body.removeChild(overlay);
  }, 3000);
}

// Level up fanfare
function showLevelUp(level) {
  showConfetti(5000);
  const audio = new Audio('/assets/sounds/level-up.mp3'); // Assuming sound file exists
  audio.play().catch(() => console.log('Sound playback failed'));

  const notification = document.createElement('div');
  notification.textContent = `Level Up! Level ${level}`;
  notification.style.position = 'fixed';
  notification.style.top = '50%';
  notification.style.left = '50%';
  notification.style.transform = 'translate(-50%, -50%) scale(0)';
  notification.style.background = 'gold';
  notification.style.color = 'black';
  notification.style.padding = '20px';
  notification.style.borderRadius = '10px';
  notification.style.zIndex = '10001';
  notification.style.transition = 'transform 0.5s ease-in-out';

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.transform = 'translate(-50%, -50%) scale(1)';
  }, 100);

  setTimeout(() => {
    notification.style.transform = 'translate(-50%, -50%) scale(0)';
  }, 2000);

  setTimeout(() => {
    document.body.removeChild(notification);
  }, 2500);
}

export { showConfetti, showFloatingXP, animateProgressBar, showBadgeUnlock, showLevelUp };
