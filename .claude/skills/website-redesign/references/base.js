// Generated from packages/core/src/redesign/system.ts by `npm run skill:catalog`. Do not edit by hand.
(function(){
  var d = document.documentElement;
  var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var t = document.querySelector('.menu-toggle'), m = document.getElementById('mobile-menu');
  if (t && m) t.addEventListener('click', function(){ var o = t.getAttribute('aria-expanded') !== 'true'; t.setAttribute('aria-expanded', String(o)); m.classList.toggle('open', o); t.textContent = o ? 'Close' : 'Menu'; });
  var h = document.querySelector('header.site');
  if (h) { var sc = function(){ h.classList.toggle('scrolled', scrollY > 12); }; sc(); addEventListener('scroll', sc, { passive: true }); }
  // Keep the site's own photos, but drop tiny, broken or logo-like images.
  $$('img:not([data-keep])').forEach(function(i){
    function bad(){ if (i.dataset.fallback) { i.src = i.dataset.fallback; delete i.dataset.fallback; return; } i.style.display = 'none'; }
    function c(){ var w = i.naturalWidth, hh = i.naturalHeight || 1; if (w && (w < 240 || w / hh > 2.8 || hh / w > 2.8)) bad(); }
    if (i.complete) c(); else i.addEventListener('load', c);
    i.addEventListener('error', bad);
  });
  // Themes: seven house palettes, remembered per site, revealed in a circle from the chosen swatch.
  var site = d.getAttribute('data-site') || location.pathname.split('/').slice(0, 3).join('/');
  var store = function(k, v){ try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; };
  var btn = document.querySelector('.theme-btn'), panel = document.getElementById('theme-panel');
  var opts = panel ? $$('.tp-opt', panel) : [];
  var cards = $$('.th-card');
  var sync = function(){
    var cur = d.getAttribute('data-theme');
    opts.forEach(function(o){ var on = o.getAttribute('data-id') === cur; o.setAttribute('aria-checked', String(on)); o.tabIndex = on ? 0 : -1; });
    cards.forEach(function(c){ var on = c.getAttribute('data-id') === cur; c.classList.toggle('showing', on); var t = c.querySelector('.th-try'); if (t) t.setAttribute('aria-pressed', String(on)); });
    var s = btn && btn.querySelector('.sw'); if (s) s.setAttribute('data-theme', cur);
  };
  var apply = function(id, from){
    if (d.getAttribute('data-theme') === id) return;
    store('rr-theme:' + site, id);
    var rc = from ? from.getBoundingClientRect() : null;
    var x = rc ? rc.left + rc.width / 2 : innerWidth / 2, y = rc ? rc.top + rc.height / 2 : innerHeight / 2;
    var set = function(){ d.setAttribute('data-theme', id); sync(); };
    if (document.startViewTransition && !reduce) {
      var rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      var tr = document.startViewTransition(set);
      tr.ready.then(function(){ d.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + rad + 'px at ' + x + 'px ' + y + 'px)'] }, { duration: 850, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' }); }).catch(function(){});
    } else { d.classList.add('theme-fade'); set(); setTimeout(function(){ d.classList.remove('theme-fade'); }, 500); }
  };
  if (btn && panel) {
    var isOpen = function(){ return panel.classList.contains('open'); };
    var open = function(){ panel.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); var c = opts.filter(function(o){ return o.getAttribute('aria-checked') === 'true'; })[0] || opts[0]; setTimeout(function(){ c.focus(); }, 30); };
    var close = function(back){ panel.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); if (back) btn.focus(); };
    btn.addEventListener('click', function(){ if (isOpen()) close(); else open(); });
    var x0 = panel.querySelector('.tp-close'); if (x0) x0.addEventListener('click', function(){ close(true); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && isOpen()) close(true); });
    document.addEventListener('pointerdown', function(e){ if (isOpen() && !panel.contains(e.target) && !btn.contains(e.target)) close(); });
    opts.forEach(function(o, i){
      o.addEventListener('click', function(){ apply(o.getAttribute('data-id'), o.querySelector('.tp-sw')); });
      o.addEventListener('keydown', function(e){
        var last = opts.length - 1, n = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = i === last ? 0 : i + 1;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = i === 0 ? last : i - 1;
        if (e.key === 'Home') n = 0;
        if (e.key === 'End') n = last;
        if (n === null) return;
        e.preventDefault(); apply(opts[n].getAttribute('data-id'), opts[n].querySelector('.tp-sw')); opts[n].focus();
      });
    });
  }
  // Theme chooser section: preview each theme, mark a favourite, copy the choice to send by email.
  var chooser = document.querySelector('.themes');
  if (chooser && cards.length) {
    var nameEl = chooser.querySelector('.th-name'), text = chooser.querySelector('.th-text'), copy = chooser.querySelector('.th-copy'), note = chooser.querySelector('.th-note');
    var siteName = (document.querySelector('.logo-text') || {}).textContent || document.title;
    var page = location.href.split('#')[0].split('?')[0];
    var setFav = function(id, save){
      var card = cards.filter(function(c){ return c.getAttribute('data-id') === id; })[0];
      cards.forEach(function(c){ var on = c === card; c.classList.toggle('fav', on); var f = c.querySelector('.th-fav'); if (f) { f.setAttribute('aria-pressed', String(on)); f.lastChild.textContent = on ? ' Favourite' : ' Love it'; } });
      if (!card) return;
      var nm = card.getAttribute('data-name');
      if (nameEl) nameEl.textContent = nm;
      if (text) text.value = siteName.trim() + ': my favourite theme is ' + nm + ' (' + id + '). ' + page + '?theme=' + id;
      if (copy) copy.disabled = false;
      if (note) note.textContent = '';
      if (save) store('rr-fav:' + site, id);
    };
    cards.forEach(function(c){
      var id = c.getAttribute('data-id');
      var t = c.querySelector('.th-try'); if (t) t.addEventListener('click', function(){ apply(id, c.querySelector('.th-mini')); });
      var f = c.querySelector('.th-fav'); if (f) f.addEventListener('click', function(){ setFav(id, true); apply(id, c.querySelector('.th-mini')); });
    });
    if (copy && text) copy.addEventListener('click', function(){
      var done = function(){ if (note) note.textContent = 'Copied. Paste it into an email to us.'; };
      var fallback = function(){ text.focus(); text.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) {} if (ok) done(); else if (note) note.textContent = 'Select the text and copy it.'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text.value).then(done, fallback); else fallback();
    });
    var saved = store('rr-fav:' + site);
    if (saved) setFav(saved, false);
  }
  sync();
  // Page index: a photograph follows the pointer and changes with the row under it (mouse only).
  if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) $$('.index[data-previews]').forEach(function(list){
    var host = list.parentNode; if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    var box = document.createElement('div'); box.className = 'preview'; box.setAttribute('aria-hidden', 'true');
    var im = document.createElement('img'); im.alt = ''; im.setAttribute('referrerpolicy', 'no-referrer'); im.setAttribute('data-keep', ''); box.appendChild(im); host.appendChild(box);
    var tx = 0, ty = 0, x = 0, y = 0, raf = 0, on = false;
    var loop = function(){ x += (tx - x) * 0.18; y += (ty - y) * 0.18; box.style.transform = 'translate3d(' + (x - 112) + 'px,' + (y - 144) + 'px,0)'; raf = on || Math.abs(tx - x) + Math.abs(ty - y) > 1 ? requestAnimationFrame(loop) : 0; };
    list.addEventListener('pointermove', function(e){ var r = host.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; if (!raf) raf = requestAnimationFrame(loop); });
    $$('a[data-preview]', list).forEach(function(a){ a.addEventListener('pointerenter', function(){ var src = a.getAttribute('data-preview'); if (!src) return; if (im.getAttribute('src') !== src) im.src = src; on = true; box.classList.add('on'); if (!raf) raf = requestAnimationFrame(loop); }); });
    list.addEventListener('pointerleave', function(){ on = false; box.classList.remove('on'); });
  });
})();
