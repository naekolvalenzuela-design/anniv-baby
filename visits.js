// ============================================================
// VISITS PAGE: tab switching between visits, click-to-enlarge
// lightbox for real photos. No editing needed here — add <img>
// tags inside .photo-slot divs in visits.html, this handles
// the rest automatically.
// ============================================================
(function () {

  // ---- tab switching ----
  const tabs = document.querySelectorAll('.visit-tab');
  const panels = document.querySelectorAll('.visit-card');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-target');

      tabs.forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      panels.forEach((p) => {
        p.classList.remove('active', 'just-shown');
        if (p.id === targetId) {
          p.classList.add('active');
          // restart the fade-in animation on the newly shown panel
          requestAnimationFrame(() => p.classList.add('just-shown'));
        }
      });
    });
  });

  // ---- lightbox ----
  const photos = Array.from(document.querySelectorAll('.visit-photos .photo-slot img'));
  if (photos.length === 0) return; // nothing to enlarge yet (still placeholders)

  const lb = document.createElement('div');
  lb.className = 'visit-lightbox';
  lb.innerHTML = `
    <button class="vl-close" aria-label="Close">&times;</button>
    <img alt="">
  `;
  document.body.appendChild(lb);
  const lbImg = lb.querySelector('img');

  function open(src, alt) {
    lbImg.src = src;
    lbImg.alt = alt || '';
    lb.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    lb.classList.remove('show');
    document.body.style.overflow = '';
  }

  photos.forEach((img) => {
    const slot = img.closest('.photo-slot');
    slot.setAttribute('tabindex', '0');
    slot.setAttribute('role', 'button');
    slot.setAttribute('aria-label', 'Open photo');
    slot.addEventListener('click', () => open(img.src, img.alt));
    slot.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(img.src, img.alt); }
    });
  });

  lb.querySelector('.vl-close').addEventListener('click', close);
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  document.addEventListener('keydown', (e) => {
    if (lb.classList.contains('show') && e.key === 'Escape') close();
  });
})();