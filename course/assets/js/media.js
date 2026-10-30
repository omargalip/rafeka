/* فيديوهات: كبسة تشغيل ← تحميل مع نسبة ← تشغيل. صوت واحد بنفس الوقت، مربع صغير وقت السكرول، وفيديوهات الصف الساكتة */
(function () {
  'use strict';
  /* ---------- videos: one tap "تشغيل الفيديو" -> loads fully (with %) -> plays. One sound at a time. ---------- */
  var Q = 'sd';
  try { var sv = localStorage.getItem('omar-q2'); if (sv === 'hd' || sv === 'sd') Q = sv; } catch (e) {}
  var qbtns = document.querySelectorAll('.qbtn');
  function paintQ() { qbtns.forEach(function (b) { b.dataset.q = Q; b.textContent = Q === 'hd' ? 'الجودة: عالية HD' : 'الجودة: خفيفة'; }); }
  var ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
  var ICON_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
  var vids = [].slice.call(document.querySelectorAll('video[data-v]'));
  var S = new WeakMap(), active = null;
  function st(v) { var o = S.get(v); if (!o) { o = {}; S.set(v, o); } return o; }
  function title(v) { return v.id === 'lesson' ? (document.getElementById('lesson-now') || {}).textContent : (v.dataset.title || 'فيديو'); }

  function fetchBlob(url, signal, onPct) {
    return fetch(url, signal ? { signal: signal } : {}).then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status);
      var total = +r.headers.get('content-length') || 0;
      if (!r.body || !r.body.getReader) return r.blob();
      var rd = r.body.getReader(), got = 0, parts = [];
      return (function pump() { return rd.read().then(function (x) {
        if (x.done) return new Blob(parts, { type: 'video/mp4' });
        parts.push(x.value); got += x.value.length;
        if (total && onPct) onPct(Math.min(99, Math.round(got * 100 / total)));
        return pump();
      }); })();
    }).then(function (b) { return URL.createObjectURL(b.type === 'video/mp4' ? b : new Blob([b], { type: 'video/mp4' })); });
  }

  function setGate(v, mode, pct) {
    var o = st(v), g = o.gate; g.hidden = false; g.className = 'gate' + (mode === 'loading' ? ' loading' : '');
    var size = v.dataset[Q + 's'];
    if (mode === 'idle') { g.querySelector('.pill').innerHTML = ICON_PLAY + '<span>تشغيل الفيديو</span>' + (size ? '<small dir="ltr">' + size + ' MB</small>' : ''); g.setAttribute('aria-label', 'تشغيل الفيديو'); }
    if (mode === 'loading') { g.querySelector('.pill').innerHTML = '<span class="spin"></span><span>عم يجهز ' + (pct || 0) + '%</span>'; g.setAttribute('aria-label', 'عم يجهز الفيديو، اكبس لإلغاء'); }
    g.querySelector('.bar i').style.width = (mode === 'loading' ? (pct || 0) : 0) + '%';
    o.pct = pct || 0; dockPaint();
  }
  function cancelLoad(v) { var o = st(v); if (o.ctrl) { o.ctrl.abort(); o.ctrl = null; } }
  function stopOthers(v) { vids.forEach(function (x) { if (x === v) return; if (st(x).mode === 'loading') cancelLoad(x); if (!x.paused) x.pause(); }); }
  function reset(v) {
    var o = st(v); cancelLoad(v);
    if (o.blob) { URL.revokeObjectURL(o.blob); o.blob = null; }
    v.pause(); v.removeAttribute('src'); v.controls = false; try { v.load(); } catch (e) {}
    o.mode = 'idle'; o.q = null; setGate(v, 'idle');
  }
  function playNow(v) {
    var o = st(v); stopOthers(v); active = v; o.gate.hidden = true; v.controls = true;
    var p = v.play(); if (p && p.catch) p.catch(function () { o.mode = 'ready'; o.gate.hidden = false; o.gate.className = 'gate'; o.gate.querySelector('.pill').innerHTML = ICON_PLAY + '<span>تشغيل</span>'; });
    dockPaint();
  }
  function start(v) {
    var o = st(v); stopOthers(v); active = v;
    if (o.mode === 'ready' && o.q === Q) { playNow(v); return; }
    var url = v.dataset[Q]; if (!url) return;
    var ctrl = window.AbortController ? new AbortController() : null; o.ctrl = ctrl; o.mode = 'loading'; o.q = Q;
    setGate(v, 'loading', 0);
    fetchBlob(url, ctrl && ctrl.signal, function (p) { if (o.mode === 'loading') setGate(v, 'loading', p); }).then(function (u) {
      o.ctrl = null; o.blob = u; v.src = u; v.preload = 'auto'; try { v.load(); } catch (e) {}
      o.mode = 'ready';
      if (active === v) playNow(v); else setGate(v, 'idle');
    }).catch(function (e) {
      o.ctrl = null;
      if (e && e.name === 'AbortError') { o.mode = 'idle'; setGate(v, 'idle'); if (active === v) { active = null; } dockPaint(); return; }
      v.src = url; v.preload = 'auto'; o.mode = 'ready';           // fallback: normal streaming
      if (active === v) playNow(v); else setGate(v, 'idle');
    });
    dockPaint();
  }

  /* ---------- mini box while scrolling: shows what is loading/playing, with pause + close ---------- */
  var dock = document.createElement('div'); dock.className = 'dock'; dock.hidden = true; dock.setAttribute('role', 'region'); dock.setAttribute('aria-label', 'الفيديو الشغّال');
  dock.innerHTML = '<button type="button" class="dock-main"><b class="dock-t"></b><span class="dock-s"></span></button><button type="button" class="dock-btn dock-pp" aria-label="إيقاف مؤقت"></button><button type="button" class="dock-btn dock-x" aria-label="إغلاق الفيديو">×</button><span class="bar"><i></i></span>';
  document.body.appendChild(dock);
  var inView = new WeakMap();
  function dockPaint() {
    var v = active; if (!v) { dock.hidden = true; return; }
    var o = st(v), loading = o.mode === 'loading', playing = !v.paused && !v.ended;
    if (!loading && !playing && !o.userPaused) { dock.hidden = true; return; }
    dock.hidden = !!inView.get(v.parentNode);
    dock.querySelector('.dock-t').textContent = title(v);
    dock.querySelector('.dock-s').textContent = loading ? ('عم يجهز ' + (o.pct || 0) + '%') : playing ? 'عم يشتغل' : 'موقّف';
    var pp = dock.querySelector('.dock-pp'); pp.hidden = loading; pp.innerHTML = playing ? ICON_PAUSE : ICON_PLAY; pp.setAttribute('aria-label', playing ? 'إيقاف مؤقت' : 'تكملة');
    dock.querySelector('.bar i').style.width = (loading ? (o.pct || 0) : (v.duration ? v.currentTime / v.duration * 100 : 0)) + '%';
  }
  dock.querySelector('.dock-pp').addEventListener('click', function () { var v = active; if (!v) return; if (v.paused) { st(v).userPaused = false; playNow(v); } else { st(v).userPaused = true; v.pause(); } });
  dock.querySelector('.dock-x').addEventListener('click', function () { var v = active; if (!v) return; var o = st(v); if (o.mode === 'loading') cancelLoad(v); else v.pause(); o.userPaused = false; active = null; dockPaint(); });
  dock.querySelector('.dock-main').addEventListener('click', function () { if (active) active.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  var vio = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { inView.set(e.target, e.isIntersecting); }); dockPaint(); }, { threshold: 0.25 }) : null;

  vids.forEach(function (v) {
    var o = st(v); v.controls = false; v.removeAttribute('src');
    var box = document.createElement('span'); box.className = 'vbox';
    v.parentNode.insertBefore(box, v); box.appendChild(v);
    var g = document.createElement('button'); g.type = 'button'; g.className = 'gate';
    g.innerHTML = '<span class="pill"></span><span class="bar"><i></i></span>';
    box.appendChild(g); o.gate = g;
    g.addEventListener('click', function () {
      if (o.mode === 'loading') { cancelLoad(v); return; }   // tap again while loading = cancel
      start(v);
    });
    v.addEventListener('play', function () { if (active !== v) { stopOthers(v); active = v; } o.userPaused = false; o.gate.hidden = true; dockPaint(); });
    v.addEventListener('pause', function () { if (active === v && !v.ended) o.userPaused = true; dockPaint(); });
    v.addEventListener('timeupdate', dockPaint);
    v.addEventListener('ended', function () { v.controls = false; o.userPaused = false; o.gate.hidden = false; o.gate.className = 'gate'; o.gate.querySelector('.pill').innerHTML = ICON_PLAY + '<span>شوفو كمان مرة</span>'; if (active === v) active = null; dockPaint(); });
    if (vio) vio.observe(box);
    o.mode = 'idle'; setGate(v, 'idle');
  });
  qbtns.forEach(function (b) { b.addEventListener('click', function () {
    Q = Q === 'hd' ? 'sd' : 'hd'; try { localStorage.setItem('omar-q2', Q); } catch (e) {} paintQ();
    vids.forEach(function (v) { var o = st(v); if (o.mode === 'idle') setGate(v, 'idle'); else if (o.q !== Q && v.paused && o.mode !== 'loading') reset(v); });
  }); });
  paintQ();

  /* lesson playlist: choosing a clip = play it */
  var lv = document.getElementById('lesson'), now = document.getElementById('lesson-now');
  if (lv) document.querySelectorAll('.lcard').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.lcard').forEach(function (x) { x.removeAttribute('aria-current'); });
      b.setAttribute('aria-current', 'true');
      reset(lv); lv.dataset.sd = b.dataset.sd; lv.dataset.hd = b.dataset.hd; lv.dataset.sds = b.dataset.sds; lv.dataset.hds = b.dataset.hds;
      lv.poster = b.dataset.poster; now.textContent = b.dataset.title;
      start(lv);
      lv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  /* silent loop clips: load into memory (works on every phone), play only while on screen */
  var loops = [].slice.call(document.querySelectorAll('video[data-loop]'));
  loops.forEach(function (v) { v.dataset.url = v.getAttribute('src'); v.removeAttribute('src'); v.muted = true; v.setAttribute('muted', ''); });
  function loadLoop(v) {
    if (v.dataset.state) return; v.dataset.state = 'loading';
    fetchBlob(v.dataset.url).then(function (u) { v.src = u; v.dataset.state = 'ok'; if (v.dataset.vis === '1') { var p = v.play(); if (p && p.catch) p.catch(function () {}); } })
      .catch(function () { v.src = v.dataset.url; v.dataset.state = 'ok'; if (v.dataset.vis === '1') { var p = v.play(); if (p && p.catch) p.catch(function () {}); } });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) {
      var v = e.target; v.dataset.vis = e.isIntersecting ? '1' : '0';
      if (e.isIntersecting) { loadLoop(v); if (v.dataset.state === 'ok') { var p = v.play(); if (p && p.catch) p.catch(function () {}); } } else v.pause();
    }); }, { rootMargin: '300px 0px', threshold: 0 });
    loops.forEach(function (v) { io.observe(v); });
  } else loops.forEach(loadLoop);
})();
