// Generated from packages/core/src/redesign/ui-kit.ts by `npm run skill:catalog`. Do not edit by hand.
(function(){
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var io = 'IntersectionObserver' in window;
  var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var num = function(el, a, d){ var v = parseFloat(el.getAttribute(a)); return isFinite(v) ? v : d; };
  function layer(el, cls){
    var s = el.querySelector(':scope > .' + cls);
    if (!s){ s = document.createElement('span'); s.className = cls; s.setAttribute('aria-hidden', 'true'); el.appendChild(s); }
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    return s;
  }
  function onView(els, fn){
    if (!io){ els.forEach(fn); return; }
    var ob = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ ob.unobserve(e.target); fn(e.target); } }); }, { rootMargin: '0px 0px -50px 0px' });
    els.forEach(function(el){ ob.observe(el); });
  }
  function onScroll(fn){
    var busy = false;
    var run = function(){ busy = false; fn(); };
    addEventListener('scroll', function(){ if (!busy){ busy = true; requestAnimationFrame(run); } }, { passive: true });
    addEventListener('resize', run);
    fn();
  }
  // Add a transition without dropping the element's own (the outline buttons' colour wipe, for example).
  function addTransition(el, t){
    var base = getComputedStyle(el).transition;
    el.style.transition = (base && !/^all 0s/.test(base) ? base + ', ' : '') + t;
  }
  // Hide an element (blur + fade + offset) and bring it back when it scrolls into view.
  function hide(el, blur, move, dur, ease, delay){
    if (getComputedStyle(el).display === 'inline') el.style.display = 'inline-block';
    var t = dur + 's ' + ease + ' ' + delay + 's';
    addTransition(el, 'opacity ' + t + ', filter ' + t + ', translate ' + t);
    el.style.opacity = '0'; el.style.filter = 'blur(' + blur + 'px)'; el.style.translate = move;
  }
  function show(el){ el.style.opacity = ''; el.style.filter = ''; el.style.translate = ''; }

  // Magic UI: Border Beam, Shine Border (decorative layers)
  $$('.mu-beam').forEach(function(el){ layer(el, 'mu-beam-ray'); });
  $$('.mu-shine').forEach(function(el){ layer(el, 'mu-shine-ray'); });

  // Magic UI: Marquee (clones the track; the copies are hidden from assistive tech and keyboard)
  if (!reduce) $$('.mu-marquee').forEach(function(el){
    var track = el.querySelector('.mu-marquee-track');
    if (!track) return;
    for (var i = 1, n = num(el, 'data-repeat', 4); i < n; i++){
      var c = track.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      $$('a, button', c).forEach(function(a){ a.tabIndex = -1; });
      el.appendChild(c);
    }
    el.classList.add('is-ready');
  });

  // Magic UI: Scroll Progress
  var bars = $$('.mu-progress');
  if (bars.length) onScroll(function(){
    var max = document.documentElement.scrollHeight - innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    bars.forEach(function(b){ b.style.transform = 'scaleX(' + p.toFixed(4) + ')'; });
  });

  // Magic UI: Number Ticker (counts to the number already in the text; ends on the original text exactly)
  if (!reduce) $$('[data-mu-ticker]').forEach(function(el){
    if (el.children.length) return;
    var txt = el.textContent, m = txt.match(/\d[\d,]*(\.\d+)?/);
    if (!m) return;
    var target = parseFloat(m[0].replace(/,/g, '')), dec = m[1] ? m[1].length - 1 : 0, grouped = m[0].indexOf(',') > -1;
    var start = num(el, 'data-start', 0), dur = num(el, 'data-duration', 1.6) * 1000;
    if (!isFinite(target)) return;
    var pre = txt.slice(0, m.index), post = txt.slice(m.index + m[0].length);
    var fmt = function(v){
      var s = v.toFixed(dec);
      if (grouped){ var p = s.split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); s = p.join('.'); }
      return pre + s + post;
    };
    el.style.fontVariantNumeric = 'tabular-nums';
    el.textContent = fmt(start);
    onView([el], function(){
      var t0 = null;
      var step = function(t){
        if (t0 === null) t0 = t;
        var k = Math.min(1, (t - t0) / dur);
        el.textContent = k < 1 ? fmt(start + (target - start) * (1 - Math.pow(1 - k, 4))) : txt;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  });

  if (!reduce && io){
    // Magic UI: Blur Fade
    $$('[data-mu-blur-fade]').forEach(function(el){
      var o = num(el, 'data-offset', 6), d = el.getAttribute('data-direction') || 'down';
      var move = d === 'up' ? '0 ' + o + 'px' : d === 'left' ? o + 'px 0' : d === 'right' ? -o + 'px 0' : '0 ' + -o + 'px';
      hide(el, 6, move, 0.4, 'ease-out', 0.04 + num(el, 'data-delay', 0));
    });
    onView($$('[data-mu-blur-fade]'), show);

    // Smooth UI: Shimmer Sweep
    $$('[data-su-sweep]').forEach(function(el){ hide(el, 8, '-22px 0', 0.85, 'cubic-bezier(.22,1,.36,1)', num(el, 'data-delay', 0)); });
    onView($$('[data-su-sweep]'), show);

    // Smooth UI: Mask Reveal Up (lines split at <br>)
    $$('[data-su-mask-reveal]').forEach(function(el){
      var lines = [[]];
      Array.prototype.slice.call(el.childNodes).forEach(function(n){
        if (n.nodeName === 'BR'){ lines.push([]); el.removeChild(n); } else lines[lines.length - 1].push(n);
      });
      var base = num(el, 'data-delay', 0), stagger = num(el, 'data-stagger', 90) / 1000;
      // Lines are blocks, so the <br> becomes a space: the text still reads as words to assistive tech.
      var inners = lines.filter(function(l){ return l.length; }).map(function(l, i, all){
        if (i < all.length - 1) l.push(document.createTextNode(' '));
        var outer = document.createElement('span'), inner = document.createElement('span');
        outer.className = 'su-mask'; inner.className = 'su-mask-in';
        l.forEach(function(n){ inner.appendChild(n); });
        outer.appendChild(inner); el.appendChild(outer);
        hide(inner, 6, '0 30px', 0.76, 'cubic-bezier(.22,1,.36,1)', base + i * stagger);
        return inner;
      });
      onView([el], function(){ inners.forEach(show); });
    });
  }

  // Smooth UI: Scroll Reveal Paragraph (words light up with scroll)
  var paras = reduce ? [] : $$('[data-su-scroll-reveal]').map(function(p){
    var words = [];
    (function walk(n){
      Array.prototype.slice.call(n.childNodes).forEach(function(c){
        if (c.nodeType === 1) return walk(c);
        if (c.nodeType !== 3) return;
        var f = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(function(w){
          if (!w) return;
          if (/^\s+$/.test(w)) return f.appendChild(document.createTextNode(w));
          var s = document.createElement('span'); s.className = 'su-word'; s.textContent = w; words.push(s); f.appendChild(s);
        });
        n.replaceChild(f, c);
      });
    })(p);
    return { p: p, w: words };
  });
  if (paras.length) onScroll(function(){
    var vh = innerHeight;
    paras.forEach(function(it){
      var pr = Math.max(0, Math.min(1, (vh * 0.9 - it.p.getBoundingClientRect().top) / (vh * 0.65))), n = it.w.length;
      it.w.forEach(function(s, i){ s.style.opacity = String(0.18 + 0.82 * Math.max(0, Math.min(1, pr * n - i))); });
    });
  });

  if (!hover || reduce) return;

  // Magic UI: Magic Card (spotlight)
  $$('.mu-spotlight').forEach(function(c){
    layer(c, 'mu-spot');
    c.addEventListener('pointermove', function(e){
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
      c.classList.add('is-lit');
    });
    c.addEventListener('pointerleave', function(){ c.classList.remove('is-lit'); });
  });

  // Smooth UI: Glow Hover Cards
  $$('[data-su-glow]').forEach(function(g){
    var kids = Array.prototype.slice.call(g.children);
    kids.forEach(function(k){ layer(k, 'su-glow-ray'); });
    g.addEventListener('pointermove', function(e){
      kids.forEach(function(k){ var r = k.getBoundingClientRect(); k.style.setProperty('--gx', (e.clientX - r.left) + 'px'); k.style.setProperty('--gy', (e.clientY - r.top) + 'px'); });
      g.style.setProperty('--glow-on', '1');
    });
    g.addEventListener('pointerleave', function(){ g.style.setProperty('--glow-on', '0'); });
  });

  // Smooth UI: Tilt Card
  $$('[data-su-tilt]').forEach(function(c){
    var max = num(c, 'data-tilt-max', 8), glare = layer(c, 'su-glare'), depth = $$('[data-tilt-depth]', c);
    addTransition(c, 'transform .25s ease-out');
    c.addEventListener('pointermove', function(e){
      var r = c.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width * 2 - 1, ny = (e.clientY - r.top) / r.height * 2 - 1;
      c.style.transform = 'perspective(900px) rotateX(' + (-ny * max).toFixed(2) + 'deg) rotateY(' + (nx * max).toFixed(2) + 'deg) scale(1.03)';
      glare.style.opacity = '1';
      glare.style.background = 'radial-gradient(circle at ' + ((nx + 1) * 50).toFixed(1) + '% ' + ((ny + 1) * 50).toFixed(1) + '%, rgba(255,255,255,.18), transparent 60%)';
      depth.forEach(function(d){ var k = Math.min(1, Math.max(0, num(d, 'data-tilt-depth', 0))); d.style.translate = (nx * k * 24).toFixed(1) + 'px ' + (ny * k * 24).toFixed(1) + 'px'; });
    });
    c.addEventListener('pointerleave', function(){ c.style.transform = ''; glare.style.opacity = '0'; depth.forEach(function(d){ d.style.translate = ''; }); });
  });

  // Smooth UI: Magnetic Button
  var mags = $$('[data-su-magnetic]'), pt = null, busy = false;
  mags.forEach(function(m){ addTransition(m, 'translate .4s cubic-bezier(.2,.8,.2,1.1)'); });
  var pull = function(){
    busy = false;
    mags.forEach(function(m){
      var r = m.getBoundingClientRect(), dx = pt.x - (r.left + r.width / 2), dy = pt.y - (r.top + r.height / 2);
      var s = num(m, 'data-strength', 0.25), near = Math.hypot(dx, dy) < num(m, 'data-radius', 100) + Math.max(r.width, r.height) / 2;
      m.style.translate = near ? (dx * s).toFixed(1) + 'px ' + (dy * s).toFixed(1) + 'px' : '';
    });
  };
  if (mags.length){
    document.addEventListener('pointermove', function(e){ pt = { x: e.clientX, y: e.clientY }; if (!busy){ busy = true; requestAnimationFrame(pull); } }, { passive: true });
    document.documentElement.addEventListener('pointerleave', function(){ mags.forEach(function(m){ m.style.translate = ''; }); });
  }

  // 21st.dev-style: Background Paths (fine accent lines drifting along their curves)
  $$('.tw-paths').forEach(function(el){
    if (el.firstChild) return;
    var host = el.parentElement;
    if (host && getComputedStyle(host).position === 'static') host.style.position = 'relative';
    if (host && getComputedStyle(host).overflow === 'visible') host.style.overflow = 'hidden';
    var n = Math.min(40, Math.max(4, num(el, 'data-lines', 18))), out = '';
    for (var i = 0; i < n; i++){
      var y = 30 + i * (340 / n), dash = 260 + (i * 37) % 240;
      out += '<path pathLength="1000" stroke-width="' + (0.5 + i * 0.04).toFixed(2) + '" stroke-opacity="' + (0.06 + i * 0.012).toFixed(3) + '"'
        + ' stroke-dasharray="' + dash + ' ' + (1000 - dash) + '" style="--d:' + (18 + (i * 7) % 14) + 's;animation-delay:-' + ((i * 1.7) % 12).toFixed(1) + 's"'
        + ' d="M-60 ' + y.toFixed(1) + ' C 240 ' + (y - 130 + i * 4).toFixed(1) + ', 620 ' + (y + 150 - i * 3).toFixed(1) + ', 1060 ' + (y - 50).toFixed(1) + '"/>';
    }
    el.innerHTML = '<svg viewBox="0 0 1000 400" preserveAspectRatio="none" focusable="false">' + out + '</svg>';
  });

  // 21st.dev-style: Scroll Media Expansion (the frame opens from an inset, rounded card to full width)
  var ex = $$('.tw-expand');
  if (ex.length && !reduce) onScroll(function(){
    var h = innerHeight;
    ex.forEach(function(el){
      var r = el.getBoundingClientRect();
      if (r.bottom < -h || r.top > h * 2) return;
      var e = 1 - Math.pow(1 - Math.min(1, Math.max(0, (h - r.top) / (h * 0.9))), 2), q = 1 - e;
      var f = el.querySelector('.tw-expand-frame'), im = f && f.querySelector('img');
      if (f) f.style.clipPath = 'inset(' + (q * 12).toFixed(2) + '% ' + (q * 20).toFixed(2) + '% round ' + (q * 28).toFixed(1) + 'px)';
      if (im) im.style.scale = (1.18 - 0.18 * e).toFixed(4);
    });
  });
})();
