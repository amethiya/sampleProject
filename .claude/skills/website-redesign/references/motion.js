(function(){
  var d = document.documentElement;
  var cur = document.querySelector('.curtain');
  if (!window.gsap || !window.ScrollTrigger) { d.classList.remove('anim'); if (cur) cur.remove(); return; }
  gsap.registerPlugin(ScrollTrigger);
  gsap.config({ nullTargetWarn: false });
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktop = matchMedia('(min-width: 901px)').matches;
  var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var topOfPage = function(el){ return !!el.closest('.hero, .page-top'); };

  var SEQ = 'main section .disc, main section .muted, main section .sub, main section .ulink, main section .ctas, .info > div, .zig-txt, .dish-card, .svc, .slide, .order .loc, .order .phones, details, .price-list li, table.drinks tr, .tbl-title, .art a, .logos > div, .framed > .disc, .contact > *, .printed > div, .story .ph';
  var seq = $$(SEQ).filter(function(el){ return !topOfPage(el) && !el.closest('.cloud-reveal'); });

  // Fewer-motion visitors: soft fades only.
  if (reduce) {
    if (cur) cur.remove();
    gsap.set(seq, { opacity: 0 });
    ScrollTrigger.batch(seq, { start: 'top 92%', once: true, onEnter: function(b){ gsap.to(b, { opacity: 1, duration: 0.8, stagger: 0.05 }); } });
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
  });
  var echoIn = function(h, delay){
    var tl = gsap.timeline({ delay: delay || 0 });
    var ghosts = $$('.ghost', h);
    tl.fromTo(ghosts, { y: function(i, el){ return (el.dataset.i * 0.42) + 'em'; }, opacity: 0.9 }, { y: 0, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: 0.06 }, 0)
      .fromTo(h, { color: 'rgba(236,230,218,0)' }, { color: 'rgba(236,230,218,1)', duration: 0.9, ease: 'power2.out' }, 0.35);
    return tl;
  };

  // Starting states while the curtain still covers the page.
  gsap.set(seq, { opacity: 0, y: 34 });
  $$('.echo').forEach(function(h){ gsap.set(h, { color: 'rgba(236,230,218,0)' }); gsap.set($$('.ghost', h), { opacity: 0 }); });
  gsap.set('.hero .disc, .hero .sub, .hero .muted, .hero .ctas, .page-top .disc, .page-top .muted, .page-top .btn, .page-top p', { opacity: 0, y: 24 });
  gsap.set('.plate-stage .plate', { opacity: 0, rotate: -120, scale: 0.7 });
  gsap.set('.plate-stage .dust', { opacity: 0, scale: 0.6, rotate: -30 });

  // 1. Loader: counter and line run to 100, then the curtain lifts.
  var first = true;
  try { first = !sessionStorage.getItem('rr-seen'); sessionStorage.setItem('rr-seen', '1'); } catch (e) { first = !document.referrer || document.referrer.indexOf(location.host) < 0; }
  var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  var count = cur && cur.querySelector('.count'), line = cur && cur.querySelector('.bar-line i');
  var lift = 0.1;
  if (cur && first) {
    var n = { v: 0 };
    tl.to(n, { v: 100, duration: 1.4, ease: 'power2.inOut', onUpdate: function(){ count.textContent = Math.round(n.v); } }, 0)
      .to(line, { scaleX: 1, duration: 1.4, ease: 'power2.inOut' }, 0)
      .to(cur.children, { opacity: 0, y: -16, duration: 0.4, ease: 'power2.in', stagger: 0.04 }, 1.45);
    lift = 1.7;
  } else if (cur) { gsap.set(cur.children, { opacity: 0 }); }
  if (cur) tl.to(cur, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, lift);

  // 2. First screen: plate spins into place inside its flour dust; heading collapses from its echoes.
  var t0 = lift + 0.45;
  tl.to('.plate-stage .dust', { opacity: 1, scale: 1, rotate: 0, duration: 1.8 }, t0)
    .to('.plate-stage .plate', { opacity: 1, rotate: 0, scale: 1, duration: 1.8 }, t0 + 0.05)
    .to('.hero .disc, .page-top .disc', { opacity: 1, y: 0, duration: 1 }, t0 + 0.1)
    .add(function(){ $$('.hero .echo, .page-top .echo').forEach(function(h){ echoIn(h); }); }, t0 + 0.2)
    .to('.hero .sub, .hero .muted, .hero .ctas, .page-top .muted, .page-top p:not(.disc), .page-top .btn', { opacity: 1, y: 0, duration: 1.1, stagger: 0.1 }, t0 + 0.7);

  // Plates keep turning slowly as you scroll and follow the pointer a little.
  $$('.plate-stage').forEach(function(s){
    gsap.to(s.querySelector('.plate'), { rotate: 70, ease: 'none', scrollTrigger: { trigger: s, start: 'top top+=80', end: 'bottom top', scrub: 1 } });
    gsap.to(s.querySelector('.dust'), { rotate: -25, scale: 1.12, ease: 'none', scrollTrigger: { trigger: s, start: 'top top+=80', end: 'bottom top', scrub: 1 } });
  });
  if (matchMedia('(pointer: fine)').matches) {
    var hp = document.querySelector('.hero .plate-stage');
    if (hp) {
      var qx = gsap.quickTo(hp, 'x', { duration: 1.2, ease: 'power3' }), qy = gsap.quickTo(hp, 'y', { duration: 1.2, ease: 'power3' });
      addEventListener('pointermove', function(e){ qx((e.clientX / innerWidth - 0.5) * 24); qy((e.clientY / innerHeight - 0.5) * 18); });
    }
  }

  // 3. Flour clouds part to reveal the full-screen photo.
  var cr = document.querySelector('.cloud-reveal');
  if (cr) {
    var box = cr.querySelector('.clouds');
    var made = [];
    for (var i = 0; i < 34; i++) {
      var c = document.createElement('div');
      c.className = 'cloud';
      var size = 260 + Math.random() * 420;
      var x = Math.random() * 100, y = Math.random() * 100;
      c.style.width = size + 'px'; c.style.height = size * (0.62 + Math.random() * 0.3) + 'px';
      c.style.left = 'calc(' + x + '% - ' + size / 2 + 'px)'; c.style.top = 'calc(' + y + '% - ' + size / 3 + 'px)';
      c.dataset.dx = (x - 50) * (6 + Math.random() * 6); c.dataset.dy = (y - 50) * (4 + Math.random() * 4);
      box.appendChild(c); made.push(c);
    }
    var ct = gsap.timeline({ scrollTrigger: { trigger: cr, start: 'top top', end: desktop ? '+=120%' : '+=80%', scrub: 1, pin: true, anticipatePin: 1 } });
    ct.to(made, { x: function(i, el){ return el.dataset.dx * 1; }, y: function(i, el){ return el.dataset.dy * 1; }, scale: 1.6, opacity: 0, ease: 'power1.in', stagger: { each: 0.004, from: 'center' } }, 0)
      .fromTo(cr.querySelector('img'), { scale: 1.25 }, { scale: 1, ease: 'none' }, 0)
      .fromTo(cr.querySelectorAll('.title > *'), { opacity: 0, y: 40, letterSpacing: '0.12em' }, { opacity: 1, y: 0, letterSpacing: '0em', stagger: 0.08, ease: 'power2.out' }, 0.35);
  }

  // 4. Section headings collapse from their echoes as they arrive.
  $$('.echo').forEach(function(h){
    if (topOfPage(h)) return;
    ScrollTrigger.create({ trigger: h, start: 'top 86%', once: true, onEnter: function(){ echoIn(h); } });
  });

  // 5. Menu plates roll in from the side, turning, inside a puff of flour.
  $$('.zig').forEach(function(z){
    var flip = z.classList.contains('flip');
    var im = z.querySelector('.zig-img img'), dust = z.querySelector('.zig-img .dust');
    gsap.fromTo(im, { x: flip ? 220 : -220, rotate: flip ? 160 : -160, opacity: 0, scale: 0.8 }, { x: 0, rotate: 0, opacity: 1, scale: 1, ease: 'power2.out', scrollTrigger: { trigger: z, start: 'top 90%', end: 'center 55%', scrub: 1 } });
    gsap.fromTo(dust, { opacity: 0, scale: 0.4, rotate: flip ? 40 : -40 }, { opacity: 1, scale: 1, rotate: 0, ease: 'power2.out', scrollTrigger: { trigger: z, start: 'top 80%', end: 'center 50%', scrub: 1 } });
    gsap.to(im, { rotate: flip ? -40 : 40, ease: 'none', scrollTrigger: { trigger: z, start: 'center 50%', end: 'bottom top', scrub: 1 } });
  });

  // 6. Photos open up and settle.
  $$('.dish-card .ph, .story .ph').forEach(function(f){
    gsap.fromTo(f, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: f, start: 'top 88%', once: true } });
    gsap.fromTo(f.querySelector('img'), { scale: 1.35 }, { scale: 1, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: f, start: 'top 88%', once: true } });
  });
  $$('.order > img').forEach(function(img){
    gsap.fromTo(img, { scale: 1.25, yPercent: -8 }, { scale: 1, yPercent: 8, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  // The info strip's line draws across; icons glow in.
  $$('.info').forEach(function(s){
    gsap.fromTo(s, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: s, start: 'top 88%', once: true } });
  });

  // 7. Everything else arrives in sequence.
  ScrollTrigger.batch(seq, { start: 'top 90%', once: true, onEnter: function(b){ gsap.to(b, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.08, overwrite: true }); } });

  // 8. Page transitions: curtain down, then go.
  $$('a[href^="./"]').forEach(function(a){
    a.addEventListener('click', function(e){
      if (e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank' || !cur) return;
      var href = a.getAttribute('href');
      if (href.indexOf('#') >= 0) return;
      e.preventDefault();
      gsap.set(cur.children, { opacity: 0 });
      gsap.fromTo(cur, { yPercent: 100 }, { yPercent: 0, duration: 0.75, ease: 'expo.inOut', onComplete: function(){ location.href = href; } });
    });
  });
  addEventListener('pageshow', function(ev){ if (ev.persisted && cur) gsap.set(cur, { yPercent: -100 }); });
  addEventListener('load', function(){ ScrollTrigger.refresh(); });
})();
