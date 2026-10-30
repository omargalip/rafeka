/* صور: ظهور ناعم للصور، شريطين شغل الطلاب ومقاطع الدروس، وتكبير الصورة */
(function () {
  'use strict';
  /* ---------- images: fade in only when fully loaded (no half images) ---------- */
  function imgOn(e) { if (e.target && e.target.tagName === 'IMG') e.target.classList.add('on'); }
  document.addEventListener('load', imgOn, true); document.addEventListener('error', imgOn, true);   // catches every image, clones too
  document.querySelectorAll('img').forEach(function (im) { if (!(im.complete && im.naturalWidth) && (im.getAttribute('src') || im.hasAttribute('data-src'))) im.classList.add('fade'); });

  /* ---------- student work: endless strip (two rows, opposite directions), drag to scrub, tap to enlarge ---------- */
  var lb = document.getElementById('lb'), lbImg = lb && lb.querySelector('img');
  function openLb(src) { if (!lb) return; lbImg.src = src; lb.hidden = false; }
  if (lb) { lb.addEventListener('click', function () { lb.hidden = true; lbImg.removeAttribute('src'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') lb.hidden = true; }); }
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function loadImgs(root) {
    root.querySelectorAll('source[data-srcset]').forEach(function (so) { so.srcset = so.getAttribute('data-srcset'); so.removeAttribute('data-srcset'); });
    root.querySelectorAll('img[data-src]').forEach(function (im) {
      im.classList.add('fade');
      im.src = im.getAttribute('data-src'); im.removeAttribute('data-src');
    });
  }
  document.querySelectorAll('.marq').forEach(function (m) {
    var tr = m.querySelector('.marq-track'); if (!tr) return;
    var unit = tr.innerHTML, k = 1, w1 = tr.scrollWidth || 1;
    while (w1 * k < (m.clientWidth || 400) + 300 && k < 6) k++;   // make one loop wider than the screen
    var u = ''; for (var i = 0; i < k; i++) u += unit;
    tr.innerHTML = u + u;                                        // two identical halves = seamless loop
    var all = tr.children.length;
    [].slice.call(tr.children).forEach(function (c, i) { if (i >= all / (2 * k)) { c.setAttribute('aria-hidden', 'true'); if (c.tagName === 'BUTTON') c.tabIndex = -1; var im = c.querySelector('img'); if (im && im.alt) im.alt = ''; } });
    var vis = false, running = false;
    function go() { if (running || reduce) return; running = true; last = 0; requestAnimationFrame(tick); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es.forEach(function (e) { vis = e.isIntersecting; if (vis) { loadImgs(m); go(); } }); }, { rootMargin: '600px 0px' }).observe(m);
    } else { vis = true; loadImgs(m); }
    var dir = +m.dataset.dir || -1, x = 0, speed = +m.dataset.speed || 28, last = 0, drag = null, moved = 0, hold = 0;
    function half() { return tr.scrollWidth / 2; }
    function wrap() { var h = half(); if (!h) return; while (x <= -h) x += h; while (x > 0) x -= h; }
    function tick(t) {
      if (!vis && !drag) { running = false; return; }               // stop when off screen (saves battery)
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;
      if (!drag && t > hold) x += dir * speed * dt;
      wrap(); tr.style.transform = 'translate3d(' + x + 'px,0,0)';
      requestAnimationFrame(tick);
    }
    if (!('IntersectionObserver' in window)) go();
    if (reduce) { m.style.overflowX = 'auto'; return; }
    m.addEventListener('pointerdown', function (e) { drag = { sx: e.clientX, x0: x }; moved = 0; go(); });
    m.addEventListener('pointermove', function (e) { if (!drag) return; var d = e.clientX - drag.sx; moved = Math.max(moved, Math.abs(d)); x = drag.x0 + d; });
    function up(e) {
      if (!drag) return; drag = null; hold = performance.now() + 1500;
      if (moved < 6 && !m.dataset.nolb && e && e.target && e.target.tagName === 'IMG') openLb(e.target.currentSrc || e.target.src);
    }
    m.addEventListener('pointerup', up); m.addEventListener('pointercancel', function () { drag = null; });
    m.addEventListener('pointerleave', function () { drag = null; });
    m.addEventListener('click', function (e) { if (moved >= 6) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);   // a drag is not a tap
  });
})();
