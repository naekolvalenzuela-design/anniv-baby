// ============================================================
// Renders the video-call photo album from videoCallPhotos.js
// and powers the click-to-enlarge lightbox. No editing needed —
// just edit the photo list in videoCallPhotos.js.
// ============================================================
(function () {
  const album = document.getElementById('vcAlbum');
  if (!album) return;

  const photos = (typeof videoCallPhotos !== 'undefined') ? videoCallPhotos : [];

  if (photos.length === 0) {
    album.innerHTML = `
      <div class="vc-empty">
        No photos yet — add filenames to <code>videoCallPhotos.js</code>
        and drop the images in the <code>/photos</code> folder.
      </div>`;
    return;
  }

  // small seeded RNG so the scatter looks the same every time you
  // reload the page, instead of re-shuffling on every visit
  function seededRandom(seed) {
    let t = seed + 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // ---- build scattered polaroid pile ----
  photos.forEach((src, i) => {
    const fig = document.createElement('button');
    fig.className = 'vc-thumb';
    fig.type = 'button';
    fig.setAttribute('aria-label', 'Open photo ' + (i + 1) + ' of ' + photos.length);

    const rot = (seededRandom(i * 3 + 1) * 16 - 8).toFixed(1);       // -8deg to 8deg
    const lift = (seededRandom(i * 3 + 2) * 18 - 9).toFixed(1);      // -9px to 9px
    const z = Math.floor(seededRandom(i * 3 + 3) * 100);
    fig.style.setProperty('--rot', rot + 'deg');
    fig.style.setProperty('--lift', lift + 'px');
    fig.style.zIndex = z;

    const img = document.createElement('img');
    img.src = src;
    img.loading = 'lazy';
    img.alt = 'Video call screenshot ' + (i + 1);
    img.onerror = () => { fig.classList.add('vc-thumb-missing'); img.remove(); fig.textContent = src; };
    fig.appendChild(img);
    fig.addEventListener('click', () => openLightbox(i));
    album.appendChild(fig);
  });

  // ---- lightbox ----
  const lb = document.createElement('div');
  lb.className = 'vc-lightbox';
  lb.innerHTML = `
    <button class="vc-lb-close" aria-label="Close">&times;</button>
    <button class="vc-lb-prev" aria-label="Previous">&#10094;</button>
    <img class="vc-lb-img" alt="">
    <button class="vc-lb-next" aria-label="Next">&#10095;</button>
    <div class="vc-lb-count"></div>
  `;
  document.body.appendChild(lb);

  const lbImg = lb.querySelector('.vc-lb-img');
  const lbCount = lb.querySelector('.vc-lb-count');
  let current = 0;

  function openLightbox(i) {
    current = i;
    render();
    lb.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lb.classList.remove('show');
    document.body.style.overflow = '';
  }
  function render() {
    lbImg.src = photos[current];
    lbCount.textContent = (current + 1) + ' / ' + photos.length;
  }
  function next() { current = (current + 1) % photos.length; render(); }
  function prev() { current = (current - 1 + photos.length) % photos.length; render(); }

  lb.querySelector('.vc-lb-close').addEventListener('click', closeLightbox);
  lb.querySelector('.vc-lb-next').addEventListener('click', next);
  lb.querySelector('.vc-lb-prev').addEventListener('click', prev);
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });

  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('show')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });
})();