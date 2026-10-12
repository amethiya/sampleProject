// Generated from packages/core/src/redesign/system.ts by `npm run skill:catalog`. Do not edit by hand.
(function(){
  var d = document.documentElement;
  var intro = document.querySelector('.intro');
  var M = window.Motion;
  var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var touched = [];
  var showAll = function(){ d.classList.remove('anim'); if (intro && intro.parentNode) intro.remove(); touched.forEach(function(el){ el.style.transform = ''; el.style.opacity = ''; el.style.clipPath = ''; }); };
  if (!M || !M.animate || !M.inView || !M.scroll || !d.classList.contains('anim')) { showAll(); return; }
  var animate = M.animate, inView = M.inView, scroll = M.scroll, stagger = M.stagger;
  var EXPO = [0.16, 1, 0.3, 1], EASE = [0.22, 1, 0.36, 1], IN_OUT = [0.65, 0, 0.35, 1];
  var clamp = function(v){ return v < 0 ? 0 : v > 1 ? 1 : v; };
  var top = function(el){ return !!el.closest('.hx, .page-top'); };
  var mark = function(el){ touched.push(el); return el; };
  try {
    // 1. Opening curtain: once per browser session (on every page when storage is unavailable and the visit is new).
    var first = true;
    try { first = !sessionStorage.getItem('rr-intro'); sessionStorage.setItem('rr-intro', '1'); } catch (e) { first = !document.referrer || document.referrer.indexOf(location.host) < 0; }
    var t0 = 0.05;
    if (intro && first) {
      intro.classList.add('play');
      animate(intro.querySelector('.s'), { opacity: [0, 1], y: [16, 0] }, { duration: 0.8, ease: EXPO, delay: 0.1 });
      animate(intro.querySelector('.n'), { opacity: [0, 1], y: [40, 0] }, { duration: 1, ease: EXPO, delay: 0.2 });
      animate(intro.querySelector('.r'), { scaleX: [0, 1] }, { duration: 1.15, ease: IN_OUT, delay: 0.15 });
      animate(intro, { clipPath: ['inset(0% 0% 0% 0%)', 'inset(0% 0% 100% 0%)'] }, { duration: 0.9, ease: EXPO, delay: 1.35 }).then(function(){ intro.remove(); });
      t0 = 1.6;
    } else if (intro) intro.remove();

    // 2. Headlines rise out of their masks: the first screen at once, the rest as they arrive.
    var lines = $$('.line > span').map(mark);
    lines.filter(top).forEach(function(s, i){ animate(s, { y: ['108%', '0%'] }, { duration: 1.1, ease: EXPO, delay: t0 + 0.05 + i * 0.1 }); });
    lines.filter(function(s){ return !top(s); }).forEach(function(s){ inView(s.parentNode, function(){ animate(s, { y: ['108%', '0%'] }, { duration: 1.1, ease: EXPO }); }, { margin: '0px 0px -10% 0px' }); });

    // 3. Supporting copy fades up: the first screen after the headline, the rest in arriving groups.
    var rises = $$('.rise').map(mark);
    var firstRises = rises.filter(top);
    if (firstRises.length) animate(firstRises, { opacity: [0, 1], y: [28, 0] }, { duration: 1, ease: EASE, delay: stagger(0.1, { startDelay: t0 + 0.45 }) });
    var queue = [], queued = false;
    rises.filter(function(el){ return !top(el); }).forEach(function(el){ inView(el, function(){
      queue.push(el); if (queued) return; queued = true;
      requestAnimationFrame(function(){ var b = queue; queue = []; queued = false; animate(b, { opacity: [0, 1], y: [28, 0] }, { duration: 1, ease: EASE, delay: stagger(0.08) }); });
    }, { margin: '0px 0px -8% 0px' }); });

    // 4. Rolling figures (odometer): digits roll into place.
    var roll = function(scope){
      $$('[data-roll]', scope).forEach(function(el, k){
        if (el.dataset.rolled) return; el.dataset.rolled = '1';
        var text = el.textContent; el.setAttribute('aria-label', text); el.textContent = '';
        text.split('').forEach(function(ch, i){
          var n = '0123456789'.indexOf(ch);
          if (n < 0) { var s = document.createElement('span'); s.textContent = ch; s.setAttribute('aria-hidden', 'true'); el.appendChild(s); return; }
          var w = document.createElement('span'); w.className = 'rc'; w.setAttribute('aria-hidden', 'true');
          var col = document.createElement('span'); col.className = 'rcol';
          for (var j = 0; j < 10; j++) { var x = document.createElement('span'); x.textContent = String(j); col.appendChild(x); }
          w.appendChild(col); el.appendChild(w);
          animate(col, { y: ['0em', -n + 'em'] }, { duration: 1.6, ease: EXPO, delay: k * 0.15 + i * 0.09 });
        });
      });
    };

    // 5. The hero photograph grows to full bleed while the headline drifts away; then shade, caption and figures.
    $$('.xp').forEach(function(xp){
      var host = xp.closest('.hero-x') || xp;
      var frame = mark(xp.querySelector('.xp-frame')), img = mark(xp.querySelector('.xp-img')), shade = mark(xp.querySelector('.xp-shade')), cap = mark(xp.querySelector('.xp-cap')), seal = xp.querySelector('.seal'), head = host.querySelector('.hx');
      if (seal) mark(seal); if (head) mark(head);
      var gut = function(){ var w = innerWidth, p = w >= 768 ? 40 : 20; return Math.max(p, (w - 1344) / 2 + p); };
      var rolled = false;
      animate(frame, { opacity: [0, 1] }, { duration: 1.2, ease: EASE, delay: t0 + 0.25 });
      scroll(function(p){
        var g = gut() * (1 - clamp(p / 0.42));
        frame.style.clipPath = 'inset(0px ' + g.toFixed(1) + 'px 0px ' + g.toFixed(1) + 'px)';
        if (img) img.style.transform = 'scale(' + (1.18 - 0.18 * clamp(p / 0.5)).toFixed(4) + ')';
        if (head) { head.style.transform = 'translateY(' + (-90 * clamp(p / 0.35)).toFixed(1) + 'px)'; head.style.opacity = (1 - clamp((p - 0.05) / 0.25)).toFixed(3); }
        if (shade) shade.style.opacity = clamp((p - 0.3) / 0.25).toFixed(3);
        var c = clamp((p - 0.42) / 0.18);
        if (cap) { cap.style.opacity = c.toFixed(3); cap.style.transform = 'translateY(' + (48 * (1 - clamp((p - 0.42) / 0.2))).toFixed(1) + 'px)'; }
        if (seal) { seal.style.opacity = c.toFixed(3); seal.style.transform = 'rotate(' + (140 * p).toFixed(1) + 'deg)'; }
        if (!rolled && p > 0.45) { rolled = true; roll(xp); }
      }, { target: host, offset: ['start start', 'end end'] });
    });
    $$('[data-roll]').forEach(function(el){ if (!el.closest('.xp')) inView(el, function(){ roll(el.parentNode); }); });

    // 6. The track: vertical scrolling moves it sideways; each panel's number fills in as it arrives (desktop).
    if (matchMedia('(min-width: 1024px) and (min-height: 640px)').matches) $$('.track').forEach(function(sec){
      var list = sec.querySelector('.track-list'), panels = $$('.panel', sec), bar = sec.querySelector('.track-bar i'), count = sec.querySelector('.track-count b');
      if (!list || panels.length < 3) return;
      sec.classList.add('is-h'); mark(list);
      var dist = 0;
      var size = function(){ dist = Math.max(0, list.scrollWidth - innerWidth); sec.style.height = (dist + innerHeight) + 'px'; };
      size(); addEventListener('resize', size); if (window.ResizeObserver) new ResizeObserver(size).observe(list);
      var act = -1;
      scroll(function(p){
        list.style.transform = 'translate3d(' + (-p * dist).toFixed(1) + 'px,0,0)';
        if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
        var a = Math.min(panels.length - 1, Math.max(0, Math.round(p * (panels.length - 1))));
        if (a !== act) { act = a; panels.forEach(function(x, i){ x.classList.toggle('on', i === a); }); if (count) count.textContent = (a < 9 ? '0' : '') + (a + 1); }
      }, { target: sec, offset: ['start start', 'end end'] });
    });

    // 7. Parallax: photographs drift slowly against the scroll inside their frames.
    $$('[data-parallax]').forEach(function(el){
      var im = el.querySelector('img'); if (!im) return;
      var amt = parseFloat(el.getAttribute('data-parallax')) || 8;
      im.style.top = (-amt) + '%'; im.style.height = (100 + 2 * amt) + '%'; mark(im);
      scroll(function(p){ im.style.transform = 'translate3d(0,' + ((p * 2 - 1) * amt * 0.8).toFixed(2) + '%,0)'; }, { target: el, offset: ['start end', 'end start'] });
    });
  } catch (err) {
    // Never leave content hidden: show everything as it is, without motion.
    if (window.console) console.error('[motion]', err);
    showAll();
  }
})();
