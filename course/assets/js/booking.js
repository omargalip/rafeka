/* الحجز: اختيار المقعد ← الاسم والإيميل والواتساب ← محجوز (وردي) ← مثبّت بعد الدفع (أحمر) */
(function () {
  'use strict';
  /* ---------- booking: pick a seat -> name / email / WhatsApp -> reserved (pink) -> confirmed after payment (red) ---------- */
  var CFG = window.BOOKING || {};
  var COURSE = 'كورس التصميم باستخدام Adobe والذكاء الاصطناعي';
  var ASSIST = { name: 'الآنسة إسلام', phone: CFG.assistantPhone || '905364886676' };
  var INFO = { morning: { label: 'الفوج الصباحي', time: 'من 10 الصبح لـ 12 الظهر' }, evening: { label: 'الفوج المسائي', time: 'من 9 لـ 11 بالليل' } };
  function seed(pat) { var o = {}; for (var i = 0; i < pat.length; i++) o[i + 1] = { s: 'confirmed', g: pat.charAt(i) }; return o; }
  var M = CFG.fallback || { morning: { capacity: 20, seats: seed('gbggbgbggbgbggbgbggb'), closed: true }, evening: { capacity: 20, seats: seed('gbggbggbgbggb'), closed: false } };
  var ICON = { g: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="8.4" r="4"/><path d="M12 2.6c-3.5 0-5.6 2.4-5.6 5.6 0 2.8-.4 4.6-1.6 6.2 1.4.6 3 .5 4-.1-.9-1-1.4-2.4-1.4-4.1v-.6c2.2-.2 4.1-1.4 5.1-3 .8 1.6 2.7 2.8 4.6 3V10c0 1.7-.5 3.1-1.4 4.1 1 .6 2.6.7 4 .1-1.2-1.6-1.6-3.4-1.6-6.2 0-3.2-2.1-5.4-5.1-5.4z"/><path d="M4.5 21.6c.4-3.2 3.6-5.6 7.5-5.6s7.1 2.4 7.5 5.6z"/></svg>', b: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="8" r="4.3"/><path d="M4.2 21.4c.4-4 3.7-7 7.8-7s7.4 3 7.8 7z"/></svg>' };
  function seatOf(v) { if (!v) return null; if (typeof v === 'string') return { s: v, g: 'g' }; return { s: v.s || 'confirmed', g: v.g === 'b' ? 'b' : 'g', n: v.n || '' }; }
  function shortName(name) { var w = String(name).trim().split(/\s+/); var sur = w.length > 1 ? w[w.length - 1] : w[0]; var c = Array.from ? Array.from(sur) : sur.split(''); if (c.length > 3 && c[0] === 'ا' && c[1] === 'ل') c = c.slice(2); return c.length <= 1 ? c.join('') : c[0] + '…' + c[c.length - 1]; }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var gender = '';
  var cur = 'evening', pickSeat = 0, mine = null;
  try { mine = JSON.parse(localStorage.getItem('omar-seat') || 'null'); } catch (e) {}
  var grid = document.getElementById('seats2'); if (!grid) return;
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg>';
  function wa(phone, msg) { return 'https://wa.me/' + String(phone).replace(/\D/g, '') + '?text=' + encodeURIComponent(msg); }
  function free(k) { var x = M[k]; if (!x || x.closed) return 0; var n = 0; for (var i = 1; i <= x.capacity; i++) if (!seatOf(x.seats[i])) n++; return n; }
  function payMsg(name, seat, k) { return 'مرحبا ' + ASSIST.name + '، أنا ' + name + ' وحجزت المقعد رقم ' + seat + ' ب' + INFO[k].label + ' (' + INFO[k].time + ') ب' + COURSE + '. بدي كمّل الدفع لثبّت المقعد.'; }

  function render() {
    document.querySelectorAll('.shift').forEach(function (el) {
      var k = el.dataset.shift, f = free(k), full = f === 0;
      el.classList.toggle('on', k === cur); el.classList.toggle('full', full);
      el.setAttribute('aria-selected', k === cur ? 'true' : 'false');
      var bd = el.querySelector('.badge'); bd.textContent = full ? 'مكتمل' : 'متاح'; bd.className = 'badge' + (full ? '' : ' open');
      el.querySelector('.shift-left').textContent = full ? 'كل المقاعد انحجزت' : ('باقي ' + f + ' من ' + M[k].capacity + ' مقعد');
    });
    var x = M[cur], h = '';
    for (var i = 1; i <= x.capacity; i++) {
      var o = seatOf(x.seats[i]) || (x.closed ? { s: 'confirmed', g: i % 5 === 2 || i % 5 === 0 ? 'b' : 'g' } : null), me = mine && mine.k === cur && +mine.s === i;
      if (!o) h += '<button type="button" class="st free" data-seat="' + i + '" aria-label="المقعد ' + i + ' فاضي، اكبس لتحجزو"><span>' + i + '</span></button>';
      else h += '<span class="st ' + o.s + ' ' + o.g + (me ? ' mine' : '') + '" role="img" aria-label="المقعد ' + i + '، ' + (o.g === 'b' ? 'شب' : 'بنت') + '، ' + (o.s === 'pending' ? 'محجوز بانتظار الدفع' : 'مثبّت') + (me ? '، هاد مقعدك' : '') + '"><span' + (o.n ? ' class="hn"' : '') + '>' + ICON[o.g] + (o.n ? '<i class="nm">' + esc(o.n) + '</i>' : '') + '<em>' + i + '</em></span></span>';
    }
    grid.innerHTML = h;
    var f = free(cur);
    document.getElementById('sb-title').textContent = 'مقاعد ' + INFO[cur].label;
    document.getElementById('sb-sub').textContent = f ? ('باقي ' + f + ' مقاعد فاضية') : 'هالفوج مكتمل';
    document.getElementById('sb-hint').textContent = f ? 'اكبس على رقم مقعد فاضي لتحجزو' : (cur === 'morning' ? 'الفوج الصباحي مكتمل، شوف الفوج المسائي' : 'المقاعد خلصت');
    document.querySelectorAll('.js-left').forEach(function (e) { e.textContent = free('evening'); });
    var mb = document.getElementById('mybook');
    if (mine && mine.n) {
      var so = M[mine.k] && seatOf(M[mine.k].seats[mine.s]); var state = so ? so.s : 'pending';
      mb.hidden = false;
      document.getElementById('mybook-t').textContent = state === 'confirmed' ? ('مقعدك رقم ' + mine.s + ' ب' + INFO[mine.k].label + ' مثبّت ✓') : ('حجزت المقعد رقم ' + mine.s + ' ب' + INFO[mine.k].label + ' · بانتظار الدفع');
      var a = document.getElementById('mybook-wa'); a.hidden = state === 'confirmed'; a.href = wa(ASSIST.phone, payMsg(mine.n, mine.s, mine.k));
    } else mb.hidden = true;
  }
  document.querySelectorAll('.shift').forEach(function (el) { el.addEventListener('click', function () { cur = el.dataset.shift; render(); }); });
  function load() {
    if (!CFG.endpoint) return;
    fetch(CFG.endpoint + '?seats=1', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.ok && j.shifts) { M = j.shifts; if (j.assistant && j.assistant.phone) ASSIST.phone = j.assistant.phone; render(); }
    }).catch(function () {});
  }
  render(); load();
  document.addEventListener('visibilitychange', function () { if (!document.hidden) load(); });

  /* ---------- the booking sheet ---------- */
  var sheet = document.getElementById('sheet'), form = document.getElementById('sh-form'), err = document.getElementById('sh-err'), go = document.getElementById('sh-go');
  var fN = document.getElementById('sh-name'), fE = document.getElementById('sh-email'), fP = document.getElementById('sh-phone'), lastFocus = null;
  function view(which) { form.hidden = which !== 'form'; document.getElementById('sh-ok').hidden = which !== 'ok'; document.getElementById('sh-fail').hidden = which !== 'fail'; }
  function open(seat) {
    pickSeat = seat; lastFocus = document.activeElement;
    document.getElementById('sh-seat').textContent = seat;
    document.getElementById('sh-h').textContent = 'حجز المقعد رقم ' + seat;
    document.getElementById('sh-sub').textContent = INFO[cur].label + ' · ' + INFO[cur].time;
    go.textContent = 'احجز المقعد ' + seat; go.disabled = false; err.hidden = true;
    gender = ''; document.querySelectorAll('.gpick button').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    view('form'); sheet.hidden = false; document.body.style.overflow = 'hidden';
    setTimeout(function () { try { fN.focus({ preventScroll: true }); } catch (e) { fN.focus(); } }, 60);
  }
  function close() { sheet.hidden = true; document.body.style.overflow = ''; if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
  grid.addEventListener('click', function (e) { var b = e.target.closest ? e.target.closest('.st.free') : null; if (b) open(+b.dataset.seat); });
  document.getElementById('sh-x').addEventListener('click', close);
  document.getElementById('ok-close').addEventListener('click', close);
  sheet.addEventListener('click', function (e) { if (e.target === sheet) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) close(); });
  document.getElementById('fail-retry').addEventListener('click', function () { view('form'); go.disabled = false; go.textContent = 'احجز المقعد ' + pickSeat; });

  document.querySelectorAll('.gpick button').forEach(function (b) { b.addEventListener('click', function () {
    gender = b.dataset.g; document.querySelectorAll('.gpick button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    document.getElementById('sh-seat').innerHTML = ICON[gender]; err.hidden = true; }); });
  function bad(msg, f) { err.textContent = msg; err.hidden = false; [fN, fE, fP].forEach(function (x) { x.removeAttribute('aria-invalid'); }); if (f) { f.setAttribute('aria-invalid', 'true'); f.focus(); } }
  function success(name, seat, k, already, g) {
    mine = { n: name, s: seat, k: k }; try { localStorage.setItem('omar-seat', JSON.stringify(mine)); } catch (e) {}
    if (!seatOf(M[k].seats[seat])) M[k].seats[seat] = { s: 'pending', g: g || 'g', n: shortName(name) };
    document.getElementById('ok-h').textContent = already ? ('إنت حاجز المقعد رقم ' + seat + ' من قبل') : ('تم الحجز ✓ المقعد رقم ' + seat + ' صار باسمك');
    document.getElementById('ok-p').textContent = INFO[k].label + ' · ' + INFO[k].time + ' · بيبدأ 15 نوفمبر. وصلك إيميل فيه تفاصيل حجزك.';
    document.getElementById('ok-wa').href = wa(ASSIST.phone, payMsg(name, seat, k));
    view('ok'); render();
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault(); err.hidden = true;
    var name = fN.value.replace(/\s+/g, ' ').trim(), email = fE.value.trim().toLowerCase(), phone = fP.value.replace(/[^\d+]/g, '');
    if (phone.indexOf('00') === 0) phone = '+' + phone.slice(2);
    var digits = phone.replace(/\D/g, '');
    if (!gender) return bad('اختار: بنت أو شب.', null);
    if (name.length < 2) return bad('اكتب اسمك الكامل.', fN);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return bad('الإيميل مو صحيح، تأكد منه (مثلاً name@gmail.com).', fE);
    if (digits.length < 8 || digits.length > 15) return bad('اكتب رقم الواتساب كامل مع مفتاح الدولة.', fP);
    if (digits.charAt(0) === '0') return bad('اكتب الرقم مع مفتاح الدولة بدل الصفر (مثلاً ‎+963 9…‎ أو ‎+90 5…‎).', fP);
    var k = cur, seat = pickSeat;
    var waMsg = 'مرحبا ' + ASSIST.name + '، بدي احجز المقعد رقم ' + seat + ' ب' + INFO[k].label + ' (' + INFO[k].time + ') ب' + COURSE + '\n' + (gender === 'b' ? 'شب' : 'بنت') + '\nالاسم: ' + name + '\nالإيميل: ' + email + '\nالواتساب: +' + digits;
    if (!CFG.endpoint) { document.getElementById('fail-h').textContent = 'خطوة أخيرة: أكّد حجزك عالواتساب'; document.getElementById('fail-p').textContent = 'جهّزنالك رسالة فيها معلوماتك والمقعد، بس ابعتها:'; document.getElementById('fail-wa').href = wa(ASSIST.phone, waMsg); return view('fail'); }
    go.disabled = true; go.textContent = 'عم نحجز…';
    var fd = new FormData(form); fd.set('name', name); fd.set('email', email); fd.set('phone', '+' + digits); fd.set('shift', k); fd.set('seat', seat); fd.set('gender', gender);
    var ctrl = window.AbortController ? new AbortController() : null, to = setTimeout(function () { if (ctrl) ctrl.abort(); }, 25000);
    fetch(CFG.endpoint, { method: 'POST', body: fd, signal: ctrl ? ctrl.signal : undefined }).then(function (r) { return r.json(); }).then(function (j) {
      clearTimeout(to);
      if (j.shifts) M = j.shifts;
      if (j.ok && (j.status === 'booked' || j.status === 'exists')) return success(j.name || name, +j.seat || seat, j.shift || k, j.status === 'exists', gender);
      render(); go.disabled = false; go.textContent = 'احجز المقعد ' + seat;
      if (j.status === 'taken') { bad('هالمقعد انحجز هلق من حدا تاني 🙏 سكّر واختار مقعد تاني.'); return; }
      bad(j.message || 'صار خطأ، جرّب كمان مرة.', j.field === 'name' ? fN : j.field === 'email' ? fE : j.field === 'phone' ? fP : null);
    }).catch(function () {
      clearTimeout(to); go.disabled = false; go.textContent = 'احجز المقعد ' + seat;
      document.getElementById('fail-wa').href = wa(ASSIST.phone, waMsg); view('fail');
    });
  });
})();
