// ============================================================
// Adds a ✕ close button for the letter envelope. It's created
// automatically (no HTML needed) and only becomes visible once
// the envelope is opened — that's handled by the CSS rule
// "body:has(.envelope.open) .envelope-close-btn" in style.css.
// ============================================================
(function () {
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.className = 'envelope-close-btn';
  closeBtn.setAttribute('aria-label', 'Close letter');
  document.body.appendChild(closeBtn);

  closeBtn.addEventListener('click', () => {
    const envelope = document.querySelector('.envelope');
    const stage = document.querySelector('.envelope-stage');
    if (envelope) envelope.classList.remove('open');
    if (stage) stage.classList.remove('expanded');
  });
})();