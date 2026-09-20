// Ambient floating hearts, decorative only — used on every page
(function () {
  const host = document.getElementById('floaters');
  if (!host) return;
  const heartsChars = ['💗', '💕', '♡'];
  const count = window.innerWidth < 600 ? 8 : 14;
  for (let i = 0; i < count; i++) {
    const f = document.createElement('div');
    f.className = 'floater';
    f.textContent = heartsChars[Math.floor(Math.random() * heartsChars.length)];
    f.style.left = Math.random() * 100 + '%';
    f.style.fontSize = (14 + Math.random() * 16) + 'px';
    f.style.animationDuration = (10 + Math.random() * 14) + 's';
    f.style.animationDelay = (Math.random() * 10) + 's';
    host.appendChild(f);
  }
})();