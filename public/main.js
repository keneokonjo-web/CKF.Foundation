/* CKF Foundation: site behaviour. No dependencies. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

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

  /* mission / vision slider */
  var items = [
    ['Mission', 'Carrying our parents’ legacy forward by investing in education, health, and opportunity for the people of Ogwashi-Ukwu and beyond.'],
    ['Vision', 'Healthy, educated, thriving communities where no one is held back by poverty.'],
    ['Our objective', 'Assisting less privileged Nigerians, particularly in Ogwashi-Ukwu, Delta State, with education, primary health care, community welfare and jobs for young people.'],
    ['Our promise', 'Education. Health. Opportunity. A legacy that lives on.']
  ], k = 0, sT = $('#sText'), sL = $('#sLabel');
  sT.textContent = items[0][1];
  function show(n) {
    k = (n + items.length) % items.length; sT.style.opacity = 0;
    setTimeout(function () { sL.textContent = items[k][0]; sT.textContent = items[k][1]; sT.style.opacity = 1; }, 220);
  }
  $('#prev').addEventListener('click', function () { show(k - 1); });
  $('#next').addEventListener('click', function () { show(k + 1); });

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

  /* form -> /api/submit -> Google Sheet */
  var form = $('#form'), status = $('#status');
  function say(msg, cls) { status.textContent = msg; status.className = 'status ' + (cls || ''); }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.elements.name.value.trim(), email = form.elements.email.value.trim();
    if (!name) { say('Please enter your name.', 'err'); form.elements.name.focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { say('Please enter a valid email address.', 'err'); form.elements.email.focus(); return; }
    var interests = $$('#opts input:checked').map(function (i) { return i.value; });
    var btn = $('.submit', form); btn.disabled = true; say('Sending…');
    var payload = { name: name, email: email, phone: form.elements.phone.value.trim(), interests: interests, message: form.elements.message.value.trim(), company: form.elements.company.value, page: location.href };
    fetch('/api/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok && j.ok, j: j }; }); })
      .then(function (res) {
        if (res.ok) { form.reset(); say('Thank you. Your message has reached the CKF team.', 'ok'); }
        else { say(res.j && res.j.error === 'not_configured' ? 'Our form is not switched on yet. Please try again soon.' : 'Sorry, something went wrong. Please try again.', 'err'); }
      })
      .catch(function () { say('Could not reach the server. Please check your connection and try again.', 'err'); })
      .then(function () { btn.disabled = false; });
  });
})();
