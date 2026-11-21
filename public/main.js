/* CKF Foundation: site behaviour. No dependencies. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var I = window.CKFI18n || { s: function (k) { return k; }, lang: function () { return 'en'; } };
  document.documentElement.classList.add('js');

  /* safe storage (Safari private mode and some in-app browsers throw) */
  var mem = {};
  function sget(k) { try { var v = localStorage.getItem(k); return v === null ? (mem[k] || null) : v; } catch (e) { return mem[k] || null; } }
  function sset(k, v) { mem[k] = v; try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }

  /* reveal on scroll */
  var rv = $$('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (e) { io.observe(e); });
  } else { rv.forEach(function (e) { e.classList.add('in'); }); }

  /* header: Canopy state in the hero, Roots pill after it */
  var hd = $('#hd'), hero = $('.hero'), act = $('#act');
  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop, h = hero.offsetHeight;
    hd.classList.toggle('pilled', y > h - 140);
    act.classList.toggle('on', y > h * 0.7);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* full-screen menu */
  var menu = $('#menu'), openers = $$('[data-menu-open]'), lastFocus;
  function setMenu(o) {
    menu.classList.toggle('open', o);
    menu.setAttribute('aria-hidden', o ? 'false' : 'true');
    document.documentElement.classList.toggle('lock', o);
    document.body.classList.toggle('lock', o);
    openers.forEach(function (b) { b.setAttribute('aria-expanded', o ? 'true' : 'false'); });
    if (o) { lastFocus = document.activeElement; var f = $('a,button', menu); if (f) f.focus(); }
    else if (lastFocus) lastFocus.focus();
  }
  openers.forEach(function (b) { b.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); }); });
  $$('[data-menu-close]').forEach(function (b) { b.addEventListener('click', function () { setMenu(false); }); });
  $$('a[href^="#"]', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false); });

  /* mission / vision slider (text comes from i18n so it follows the language) */
  var KEYS = ['mission', 'vision', 'objective', 'promise'], k = 0, sT = $('#sText'), sL = $('#sLabel');
  function paint() { sL.textContent = I.s('m.' + KEYS[k]); sT.textContent = I.s('t.' + KEYS[k]); }
  function show(n) {
    k = (n + KEYS.length) % KEYS.length; sT.style.opacity = 0;
    setTimeout(function () { paint(); sT.style.opacity = 1; }, 220);
  }
  paint();
  $('#prev').addEventListener('click', function () { show(k - 1); });
  $('#next').addEventListener('click', function () { show(k + 1); });
  document.addEventListener('ckf:lang', paint);

  /* gentle parallax on the promise band */
  var par = $$('[data-parallax]');
  if (par.length && !reduce) {
    var ticking = false;
    var run = function () {
      par.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect(), vh = window.innerHeight;
        if (r.bottom < -80 || r.top > vh + 80) return;
        var f = parseFloat(el.getAttribute('data-parallax')) || 0.1;
        el.style.transform = 'translate3d(0,' + ((r.top + r.height / 2 - vh / 2) * -f).toFixed(1) + 'px,0)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
    run();
  }

  /* dotted map: switches between Nigeria and Delta State and keeps looping every 3 seconds */
  var map = $('#map'), pin = $('#pin'), pillBtn = $('#pillBtn');
  var VIEWS = { nigeria: { l: '32.9%', t: '80.1%', left: false }, delta: { l: '86.4%', t: '27.1%', left: true } };
  var chips = $$('.chips button'), current = 'nigeria';
  function setView(v) {
    current = v; map.setAttribute('data-view', v);
    chips.forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-view') === v ? 'true' : 'false'); });
    pin.style.left = VIEWS[v].l; pin.style.top = VIEWS[v].t; pin.classList.toggle('left', VIEWS[v].left);
  }
  var visible = false, pausedUntil = 0, hovering = false, mw = $('.mapwrap');
  chips.forEach(function (b) {
    b.addEventListener('click', function () { setView(b.getAttribute('data-view')); pausedUntil = Date.now() + 9000; });
  });
  mw.addEventListener('pointerenter', function (e) { hovering = e.pointerType === 'mouse'; }); /* touch taps must not freeze the loop on iPhone */
  mw.addEventListener('pointerleave', function () { hovering = false; });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.35 }).observe(mw);
  } else { visible = true; }
  if (!reduce) {
    setInterval(function () {
      if (!visible || hovering || document.hidden || Date.now() < pausedUntil || pin.classList.contains('open')) return;
      setView(current === 'nigeria' ? 'delta' : 'nigeria');
    }, 3000);
  }
  pillBtn.addEventListener('click', function () {
    var o = pin.classList.toggle('open');
    pillBtn.setAttribute('aria-expanded', o ? 'true' : 'false');
  });

  /* take-action links preselect an interest in the form */
  function tickInterest(val) { $$('#opts input').forEach(function (i) { if (i.value === val) i.checked = true; }); }
  $$('[data-interest]').forEach(function (a) { a.addEventListener('click', function () { tickInterest(a.getAttribute('data-interest')); }); });

  /* ---------- cookie notice ---------- */
  var CK = 'ckf_consent', consent = sget(CK); /* 'all' | 'necessary' | null */
  var cookieEl = $('#cookie');
  function loadAnalytics() {
    /* Optional visit statistics: only ever loaded after the visitor taps Accept.
       Uses Vercel Web Analytics (cookie-free, anonymous). It reports data once "Web Analytics" is switched on in the Vercel project. */
    if (window.__ckfAnalytics) return; window.__ckfAnalytics = true;
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    var s = document.createElement('script'); s.defer = true; s.src = '/_vercel/insights/script.js'; document.head.appendChild(s);
  }
  function setConsent(v) {
    consent = v; sset(CK, v);
    try { document.cookie = 'ckf_consent=' + v + '; max-age=15552000; path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : ''); } catch (e) { /* ignore */ }
    if (v === 'all') loadAnalytics();
    cookieEl.classList.remove('show');
    setTimeout(function () { cookieEl.hidden = true; }, 500);
  }
  if (consent === 'all') loadAnalytics();
  if (!consent) {
    setTimeout(function () {
      if (sget(CK)) return;
      cookieEl.hidden = false;
      requestAnimationFrame(function () { requestAnimationFrame(function () { cookieEl.classList.add('show'); }); });
    }, 3000);
  }
  $('#ckYes').addEventListener('click', function () { setConsent('all'); });
  $('#ckNo').addEventListener('click', function () { setConsent('necessary'); });

  /* ---------- sending forms to /api/submit (-> Google Sheet) ---------- */
  function send(payload) {
    payload.page = location.href; payload.lang = I.lang(); payload.consent = sget(CK) || 'not chosen';
    return fetch('/api/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok && j.ok, j: j }; }); });
  }
  function failMsg(res) { return I.s(res.j && res.j.error === 'not_configured' ? 'nc' : 'err'); }
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* contact / get-involved form */
  var form = $('#form'), status = $('#status');
  function say(el, msg, cls) { el.textContent = msg; el.className = 'status ' + (cls || ''); }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.elements.name.value.trim(), email = form.elements.email.value.trim();
    if (!name) { say(status, I.s('e.name'), 'err'); form.elements.name.focus(); return; }
    if (!EMAIL_RE.test(email)) { say(status, I.s('e.email'), 'err'); form.elements.email.focus(); return; }
    var interests = $$('#opts input:checked').map(function (i) { return i.value; });
    var btn = $('.submit', form); btn.disabled = true; say(status, I.s('sending'));
    send({ type: 'enquiry', name: name, email: email, phone: form.elements.phone.value.trim(), interests: interests, message: form.elements.message.value.trim(), company: form.elements.company.value })
      .then(function (res) { if (res.ok) { form.reset(); say(status, I.s('ok'), 'ok'); } else { say(status, failMsg(res), 'err'); } })
      .catch(function () { say(status, I.s('net'), 'err'); })
      .then(function () { btn.disabled = false; });
  });

  /* ---------- newsletter pop-up (about 10 seconds after arrival, once) ---------- */
  var NL = 'ckf_newsletter', nl = $('#nl'), nlCard = $('.nl-card', nl), nlForm = $('#nlForm'), nlStatus = $('#nlStatus'), nlOpen = false, nlPrev;
  function nlEligible() {
    var v = sget(NL); if (!v) return true;
    try { v = JSON.parse(v); } catch (e) { return false; }
    return v.s === 'dismissed' && (Date.now() - v.t) > 30 * 864e5; /* come back after 30 days if it was only dismissed */
  }
  function nlRemember(state) { sset(NL, JSON.stringify({ s: state, t: Date.now() })); }
  function nlShow() {
    if (nlOpen) return; nlOpen = true; nlPrev = document.activeElement;
    nl.hidden = false; document.body.classList.add('lock');
    requestAnimationFrame(function () { requestAnimationFrame(function () { nl.classList.add('show'); nlCard.focus(); }); });
  }
  function nlClose(state) {
    if (!nlOpen) return; nlOpen = false; nlRemember(state || 'dismissed');
    nl.classList.remove('show'); document.body.classList.remove('lock');
    setTimeout(function () { nl.hidden = true; }, 400);
    if (nlPrev && nlPrev.focus) { try { nlPrev.focus(); } catch (e) { /* ignore */ } }
  }
  function nlTry() {
    if (!nlEligible() || nlOpen) return;
    /* never stack on top of the cookie notice, the menu, or a half-filled form */
    var busy = !cookieEl.hidden || menu.classList.contains('open') || document.activeElement === form.elements.name || document.activeElement === form.elements.email || document.activeElement === form.elements.message;
    if (busy) { setTimeout(nlTry, 2500); return; }
    nlShow();
  }
  if (nlEligible()) setTimeout(nlTry, 10000);
  $$('[data-nl-close]', nl).forEach(function (b) { b.addEventListener('click', function () { nlClose('dismissed'); }); });
  document.addEventListener('keydown', function (e) {
    if (!nlOpen) return;
    if (e.key === 'Escape') { nlClose('dismissed'); return; }
    if (e.key === 'Tab') { /* keep focus inside the pop-up */
      var f = $$('button,input,a[href]', nlCard).filter(function (x) { return !x.disabled && x.offsetParent !== null && x.tabIndex !== -1; });
      if (!f.length) return; var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === nlCard)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  nlForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = nlForm.elements.email.value.trim();
    if (!EMAIL_RE.test(email)) { say(nlStatus, I.s('e.email'), 'err'); nlForm.elements.email.focus(); return; }
    var btn = $('.submit', nlForm); btn.disabled = true; say(nlStatus, I.s('sending'));
    send({ type: 'newsletter', name: nlForm.elements.name.value.trim(), email: email, company: nlForm.elements.company.value })
      .then(function (res) {
        if (res.ok) { nlForm.reset(); say(nlStatus, I.s('nl.ok'), 'ok'); nlRemember('subscribed'); setTimeout(function () { nlClose('subscribed'); }, 2200); }
        else { say(nlStatus, failMsg(res), 'err'); }
      })
      .catch(function () { say(nlStatus, I.s('net'), 'err'); })
      .then(function () { btn.disabled = false; });
  });
})();
