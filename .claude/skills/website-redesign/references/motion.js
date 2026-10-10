// Generated from packages/core/src/redesign/system.ts by `npm run skill:catalog`. Do not edit by hand.
(function(){
  var d = document.documentElement;
  var cur = document.querySelector('.curtain');
  var M = window.Motion;
  if (!M || !M.animate || !M.inView || !M.scroll || !M.motionValue) { d.classList.remove('anim'); if (cur) cur.remove(); return; }
  var animate = M.animate, inView = M.inView, scroll = M.scroll, stagger = M.stagger;
  // GSAP-equivalent easing curves.
  var EXPO_OUT = [0.16, 1, 0.3, 1], EXPO_IN_OUT = [0.87, 0, 0.13, 1], P2_OUT = [0.33, 1, 0.68, 1], P3_OUT = [0.22, 1, 0.36, 1], P2_IN_OUT = [0.65, 0, 0.35, 1], P2_IN = [0.32, 0, 0.67, 0];
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktop = matchMedia('(min-width: 901px)').matches;
  var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var topOfPage = function(el){ return !!el.closest('.hero, .page-top'); };
  var clamp = function(v){ return v < 0 ? 0 : v > 1 ? 1 : v; };
  var cubicOut = function(t){ return 1 - Math.pow(1 - t, 3); };
  var go = function(els, kf, opts){ els = [].concat(els).filter(Boolean); return els.length ? animate(els, kf, opts) : null; };
  var touched = [];
  var hide = function(els, s){ [].concat(els).filter(Boolean).forEach(function(el){ touched.push(el); for (var k in s) el.style[k] = s[k]; }); };
  var byOrder = function(a, b){ return a.compareDocumentPosition(b) & 4 ? -1 : 1; };
  var onEnter = function(els, fn, margin){ els.forEach(function(el){ inView(el, function(){ fn(el); }, { margin: margin || '0px 0px -10% 0px' }); }); };
  // Scroll-linked effects, smoothed by a spring (like GSAP's scrub: 1) unless smooth is false.
  var linked = function(target, offset, fn, smooth){
    fn(0);
    var v = M.motionValue(0);
    var out = smooth === false || !M.springValue ? v : M.springValue(v, { stiffness: 120, damping: 30, restDelta: 0.0005 });
    out.on('change', fn);
    scroll(function(p){ v.set(p); }, { target: target, offset: offset });
  };

  var SEQ = 'main section .disc, main section .muted, main section .sub, main section .ulink, main section .ctas, .zig-txt, .dish-card, .svc, .slide, .order .loc, .order .phones, details, .price-list li, table.drinks tr, .tbl-title, .art a, .logos > div, .framed > .disc, .contact > *, .printed > div, .foot-cta > div, .foot-grid > *';
  var seq = $$(SEQ).filter(function(el){ return !topOfPage(el) && !el.closest('.cloud-reveal'); });

  // Elements that arrive together are revealed as one staggered group.
  var queue = [], queued = false;
  var arrive = function(el){
    queue.push(el);
    if (queued) return;
    queued = true;
    requestAnimationFrame(function(){
      var batch = queue.sort(byOrder); queue = []; queued = false;
      if (reduce) go(batch, { opacity: [0, 1] }, { duration: 0.8, delay: stagger(0.05) });
      else go(batch, { opacity: [0, 1], y: [34, 0] }, { duration: 1.1, ease: P3_OUT, delay: stagger(0.08) });
    });
  };

  try {
    // Fewer-motion visitors: soft fades only.
    if (reduce) {
      if (cur) cur.remove();
      hide(seq, { opacity: '0' });
      onEnter(seq, arrive, '0px 0px -8% 0px');
      return;
    }

    // Echo headings: three outlined copies that collapse into the real line.
    $$('.echo').forEach(function(h){
      var html = h.innerHTML;
      for (var i = 3; i >= 1; i--) {
        var g = document.createElement('span');
        g.className = 'ghost'; g.setAttribute('aria-hidden', 'true'); g.innerHTML = html; g.dataset.i = i;
        h.appendChild(g);
      }
      h.dataset.color = getComputedStyle(h).color;
    });
    var transparent = function(c){ return c.replace(/rgba?\(([^)]+)\)/, function(_, v){ var p = v.split(','); return 'rgba(' + p[0] + ',' + p[1] + ',' + p[2] + ',0)'; }); };
    var echoIn = function(h, delay){
      delay = delay || 0;
      var fs = parseFloat(getComputedStyle(h).fontSize) || 40;
      $$('.ghost', h).forEach(function(g, i){
        animate(g, { y: [g.dataset.i * 0.42 * fs, 0], opacity: [0.9, 0] }, { duration: 1.3, ease: EXPO_OUT, delay: delay + i * 0.06 });
      });
      animate(h, { color: [transparent(h.dataset.color), h.dataset.color] }, { duration: 0.9, ease: P2_OUT, delay: delay + 0.35 })
        .then(function(){ h.style.color = ''; });
    };

    // Starting states while the curtain still covers the page.
    hide(seq, { opacity: '0', transform: 'translateY(34px)' });
    $$('.echo').forEach(function(h){ hide(h, { color: transparent(h.dataset.color) }); hide($$('.ghost', h), { opacity: '0' }); });
    var heroRest = $$('.hero .sub, .hero .muted, .hero .ctas, .page-top .muted, .page-top p:not(.disc), .page-top .btn');
    var heroDisc = $$('.hero .disc, .page-top .disc');
    hide(heroDisc.concat(heroRest), { opacity: '0', transform: 'translateY(24px)' });
    hide($$('.plate-stage .plate'), { opacity: '0', transform: 'rotate(-120deg) scale(0.7)' });
    hide($$('.plate-stage .dust'), { opacity: '0', transform: 'rotate(-30deg) scale(0.6)' });
    var photos = $$('.dish-card .ph, .story .ph');
    hide(photos, { clipPath: 'inset(100% 0% 0% 0%)' });
    hide($$('.info'), { clipPath: 'inset(0% 100% 0% 0%)' });

    // 1. Loader: counter and line run to 100, then the curtain lifts.
    var first = true;
    try { first = !sessionStorage.getItem('rr-seen'); sessionStorage.setItem('rr-seen', '1'); } catch (e) { first = !document.referrer || document.referrer.indexOf(location.host) < 0; }
    var count = cur && cur.querySelector('.count'), line = cur && cur.querySelector('.bar-line i');
    var lift = 0.1;
    if (cur && first) {
      animate(0, 100, { duration: 1.4, ease: P2_IN_OUT, onUpdate: function(v){ if (count) count.textContent = Math.round(v); } });
      go(line, { scaleX: [0, 1] }, { duration: 1.4, ease: P2_IN_OUT });
      go($$(':scope > *', cur), { opacity: [1, 0], y: [0, -16] }, { duration: 0.4, ease: P2_IN, delay: stagger(0.04, { startDelay: 1.45 }) });
      lift = 1.7;
    } else if (cur) { hide($$(':scope > *', cur), { opacity: '0' }); }
    go(cur, { y: ['0%', '-100%'] }, { duration: 1.1, ease: EXPO_IN_OUT, delay: lift });

    // 2. First screen: plate spins into place inside its dust; heading collapses from its echoes.
    var t0 = lift + 0.45;
    go($$('.plate-stage .dust'), { opacity: [0, 1], scale: [0.6, 1], rotate: [-30, 0] }, { duration: 1.8, ease: EXPO_OUT, delay: t0 });
    go($$('.plate-stage .plate'), { opacity: [0, 1], rotate: [-120, 0], scale: [0.7, 1] }, { duration: 1.8, ease: EXPO_OUT, delay: t0 + 0.05 });
    go(heroDisc, { opacity: [0, 1], y: [24, 0] }, { duration: 1, ease: EXPO_OUT, delay: t0 + 0.1 });
    $$('.hero .echo, .page-top .echo').forEach(function(h){ echoIn(h, t0 + 0.2); });
    go(heroRest, { opacity: [0, 1], y: [24, 0] }, { duration: 1.1, ease: EXPO_OUT, delay: stagger(0.1, { startDelay: t0 + 0.7 }) });

    // Plates keep turning slowly as you scroll and follow the pointer a little (springs).
    $$('.plate-stage').forEach(function(s){
      var pl = s.querySelector('.plate'), du = s.querySelector('.dust');
      linked(s, ['start 80px', 'end start'], function(p){
        if (pl) pl.style.rotate = (70 * p).toFixed(2) + 'deg';
        if (du) { du.style.rotate = (-25 * p).toFixed(2) + 'deg'; du.style.scale = (1 + 0.12 * p).toFixed(4); }
      });
    });
    var hp = document.querySelector('.hero .plate-stage');
    if (hp && M.springValue && matchMedia('(pointer: fine)').matches) {
      var px = M.motionValue(0), py = M.motionValue(0);
      var sx = M.springValue(px, { stiffness: 60, damping: 20 }), sy = M.springValue(py, { stiffness: 60, damping: 20 });
      var put = function(){ hp.style.translate = sx.get().toFixed(1) + 'px ' + sy.get().toFixed(1) + 'px'; };
      sx.on('change', put); sy.on('change', put);
      addEventListener('pointermove', function(e){ px.set((e.clientX / innerWidth - 0.5) * 24); py.set((e.clientY / innerHeight - 0.5) * 18); });
    }

    // 3. Clouds part to reveal the full-screen photo, pinned with position: sticky while you scroll.
    var cr = document.querySelector('.cloud-reveal');
    if (cr) {
      var stick = document.createElement('div');
      stick.className = 'cr-stick';
      while (cr.firstChild) stick.appendChild(cr.firstChild);
      cr.appendChild(stick);
      cr.classList.add('pinned');
      cr.style.height = (desktop ? 220 : 180) + 'vh';
      var box = stick.querySelector('.clouds');
      var made = [];
      for (var i = 0; box && i < 34; i++) {
        var c = document.createElement('div');
        c.className = 'cloud';
        var size = 260 + Math.random() * 420;
        var x = Math.random() * 100, y = Math.random() * 100;
        c.style.width = size + 'px'; c.style.height = size * (0.62 + Math.random() * 0.3) + 'px';
        c.style.left = 'calc(' + x + '% - ' + size / 2 + 'px)'; c.style.top = 'calc(' + y + '% - ' + size / 3 + 'px)';
        c._dx = (x - 50) * (6 + Math.random() * 6); c._dy = (y - 50) * (4 + Math.random() * 4);
        c._delay = 0.004 * Math.abs(i - 16.5);
        box.appendChild(c); made.push(c);
      }
      var photo = stick.querySelector(':scope > img');
      var titles = $$('.title > *', stick);
      linked(cr, ['start start', 'end end'], function(p){
        var t = p * 0.93;
        made.forEach(function(c){
          var q = clamp((t - c._delay) / 0.5); q = q * q;
          c.style.translate = (c._dx * q).toFixed(1) + 'px ' + (c._dy * q).toFixed(1) + 'px';
          c.style.scale = (1 + 0.6 * q).toFixed(3);
          c.style.opacity = (1 - q).toFixed(3);
        });
        if (photo) photo.style.scale = (1.25 - 0.25 * clamp(t / 0.5)).toFixed(4);
        titles.forEach(function(el, i){
          var q = cubicOut(clamp((t - 0.35 - 0.08 * i) / 0.5));
          el.style.opacity = q.toFixed(3);
          el.style.translate = '0 ' + (40 * (1 - q)).toFixed(1) + 'px';
          el.style.letterSpacing = (0.12 * (1 - q)).toFixed(3) + 'em';
        });
      });
    }

    // 4. Section headings collapse from their echoes as they arrive.
    $$('.echo').forEach(function(h){ if (!topOfPage(h)) inView(h, function(){ echoIn(h); }, { margin: '0px 0px -14% 0px' }); });

    // 5. Menu plates roll in from the side, turning, inside a puff of dust.
    $$('.zig').forEach(function(z){
      var s = z.classList.contains('flip') ? -1 : 1;
      var im = z.querySelector('.zig-img img'), dust = z.querySelector('.zig-img .dust');
      var a = 0, b = 0, c = 0;
      var draw = function(){
        if (im) {
          var e = cubicOut(a);
          im.style.translate = (-220 * s * (1 - e)).toFixed(1) + 'px 0';
          im.style.rotate = (-160 * s * (1 - e) + 40 * s * b).toFixed(2) + 'deg';
          im.style.scale = (0.8 + 0.2 * e).toFixed(4);
          im.style.opacity = e.toFixed(3);
        }
        if (dust) {
          var f = cubicOut(c);
          dust.style.opacity = f.toFixed(3);
          dust.style.scale = (0.4 + 0.6 * f).toFixed(4);
          dust.style.rotate = (-40 * s * (1 - f)).toFixed(2) + 'deg';
        }
      };
      linked(z, ['start 0.9', 'center 0.55'], function(p){ a = p; draw(); });
      linked(z, ['start 0.8', 'center 0.5'], function(p){ c = p; draw(); });
      linked(z, ['center 0.5', 'end start'], function(p){ b = p; draw(); });
    });

    // 6. Photos open up and settle; dark call-to-action photos drift; the info strip draws across.
    onEnter(photos, function(f){
      animate(f, { clipPath: ['inset(100% 0% 0% 0%)', 'inset(0% 0% 0% 0%)'] }, { duration: 1.4, ease: EXPO_IN_OUT });
      go(f.querySelector('img'), { scale: [1.35, 1] }, { duration: 1.8, ease: EXPO_OUT });
    }, '0px 0px -12% 0px');
    $$('.order > img').forEach(function(img){
      linked(img.parentElement, ['start end', 'end start'], function(p){
        img.style.scale = (1.25 - 0.25 * p).toFixed(4);
        img.style.translate = '0 ' + (-8 + 16 * p).toFixed(2) + '%';
      }, false);
    });
    // (Its items arrive with it: in-view checks ignore elements inside a clipped parent.)
    hide($$('.info > div'), { opacity: '0', transform: 'translateY(34px)' });
    onEnter($$('.info'), function(s){
      animate(s, { clipPath: ['inset(0% 100% 0% 0%)', 'inset(0% 0% 0% 0%)'] }, { duration: 1.6, ease: EXPO_IN_OUT });
      go($$(':scope > div', s), { opacity: [0, 1], y: [34, 0] }, { duration: 1.1, ease: P3_OUT, delay: stagger(0.12, { startDelay: 0.35 }) });
    }, '0px 0px -12% 0px');

    // Footer wordmark draws in as you reach the bottom.
    $$('.wordmark').forEach(function(w){
      linked(w, ['start end', 'end end'], function(p){
        w.style.letterSpacing = (0.12 - 0.11 * p).toFixed(4) + 'em';
        w.style.opacity = p.toFixed(3);
        w.style.translate = '0 ' + (60 * (1 - p)).toFixed(1) + 'px';
      });
    });

    // 7. Everything else arrives in sequence.
    onEnter(seq, arrive);

    // 8. Page transitions: curtain down, then go.
    $$('a[href^="./"]').forEach(function(a){
      a.addEventListener('click', function(e){
        if (e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank' || !cur) return;
        var href = a.getAttribute('href');
        if (href.indexOf('#') >= 0) return;
        e.preventDefault();
        $$(':scope > *', cur).forEach(function(el){ el.style.opacity = '0'; });
        animate(cur, { y: ['100%', '0%'] }, { duration: 0.75, ease: EXPO_IN_OUT }).then(function(){ location.href = href; });
      });
    });
    addEventListener('pageshow', function(ev){ if (ev.persisted && cur) cur.style.transform = 'translateY(-100%)'; });
  } catch (err) {
    // Never leave content hidden: show everything as it is without motion.
    if (window.console) console.error('[motion]', err);
    d.classList.remove('anim');
    if (cur) cur.remove();
    touched.forEach(function(el){ el.style.opacity = ''; el.style.transform = ''; el.style.clipPath = ''; el.style.color = ''; });
  }
})();
