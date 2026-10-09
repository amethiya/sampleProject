(function(){
  var d = document.documentElement;
  var cur = document.querySelector('.curtain');
  if (!window.gsap || !window.ScrollTrigger) { d.classList.remove('anim'); if (cur) cur.remove(); return; }
  gsap.registerPlugin(ScrollTrigger);
  gsap.config({ nullTargetWarn: false });
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var inHero = function(el){ return !!el.closest('.hero, .page-hero, .page-head'); };
  var desktop = matchMedia('(min-width: 901px)').matches;

  var SEQ = '.dish, .basics, .loc, .card, .q, .logos > div, .art a, details, .intro .eyebrow, .intro .btn, .split .eyebrow, .split .lead, .split .tbl-title, .split table, .split .btn, .panel, .printed > div, main > section > .wrap > .eyebrow, .faq aside, .hs-head, .foot-top > div';
  var seq = $$(SEQ).filter(function(el){ return !inHero(el) && !el.closest('.order-card'); });

  // Visitors who ask for less motion get gentle fades only: no movement, no pinning.
  if (reduce) {
    if (cur) cur.remove();
    gsap.set(seq, { opacity: 0 });
    ScrollTrigger.batch(seq, { start: 'top 92%', once: true, onEnter: function(b){ gsap.to(b, { opacity: 1, duration: 0.8, stagger: 0.06 }); } });
    $$('.ticker-track').forEach(function(t){ t.style.animation = 'none'; });
    return;
  }

  // Split section headings into masked words, and big statements into words that brighten as you read.
  $$('main h2, .togo .big').forEach(function(h){
    if (inHero(h) || h.querySelector('.w') || h.closest('.order-card')) return;
    h.innerHTML = h.innerHTML.trim().split(/\s+/).map(function(w){ return '<span class="w"><span>' + w + '</span></span>'; }).join(' ');
  });
  $$('.scrub-words').forEach(function(p){
    p.innerHTML = p.innerHTML.trim().split(/\s+/).map(function(w){ return '<span class="sw">' + w + '</span>'; }).join(' ');
  });

  // Starting states, set while the curtain still covers the page.
  gsap.set(seq, { opacity: 0, y: 40 });
  gsap.set($$('main h2 .w > span, .togo .big .w > span').filter(function(s){ return !inHero(s) || s.closest('.order-card'); }), { yPercent: 115 });
  gsap.set('.hero-title .c', { yPercent: 120, rotateX: -70, opacity: 0, transformOrigin: '50% 100%' });
  gsap.set('.page-hero h1 .w > span, .page-head h1 .w > span', { yPercent: 115 });
  gsap.set('.hero .eyebrow, .page-hero .eyebrow, .page-head .eyebrow, .hero .lead, .page-hero .lead, .page-head .lead, .hero .ctas, .page-hero .joke, .page-head p:not(.eyebrow):not(.lead)', { opacity: 0, y: 28 });
  gsap.set('.order-card', { opacity: 0, y: 70 });
  gsap.set('.order-row', { opacity: 0, x: 30 });

  // 1. Loader: a counter runs to 100, then the curtain lifts.
  var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  var count = cur ? cur.querySelector('.count') : null;
  // Show the counter once per visit; storage can be blocked (sandboxed previews), so never let that break motion.
  var first = true;
  try { first = !sessionStorage.getItem('rr-seen'); sessionStorage.setItem('rr-seen', '1'); } catch (e) { first = !document.referrer || document.referrer.indexOf(location.host) < 0; }
  if (count && first) {
    var n = { v: 0 };
    tl.to(n, { v: 100, duration: 1.3, ease: 'power2.inOut', onUpdate: function(){ count.textContent = Math.round(n.v); } }, 0);
    tl.to(cur.children, { opacity: 0, y: -20, duration: 0.4, ease: 'power2.in' }, 1.35);
  } else if (count) { count.style.display = 'none'; }
  var lift = first && count ? 1.55 : 0.1;
  if (cur) tl.to(cur, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, lift);

  // 2. Hero: photo wipes in, letters rise one by one with a tilt, then the rest follows.
  var heroImg = document.querySelector('.hero > img, .page-hero > img');
  var t0 = lift + 0.3;
  if (heroImg) {
    var endClip = heroImg.closest('.hero') && desktop ? 'inset(0 0 0 44%)' : 'inset(0 0 0 0%)';
    tl.fromTo(heroImg, { clipPath: 'inset(0 0 0 100%)', scale: 1.25 }, { clipPath: endClip, scale: 1, duration: 1.8, ease: 'expo.inOut' }, t0);
  }
  tl.to('.hero-title .c', { yPercent: 0, rotateX: 0, opacity: 1, duration: 1.1, stagger: 0.035 }, t0 + 0.45)
    .to('.page-hero h1 .w > span, .page-head h1 .w > span', { yPercent: 0, duration: 1.2, stagger: 0.08 }, t0 + 0.4)
    .to('.hero .eyebrow, .page-hero .eyebrow, .page-head .eyebrow', { opacity: 1, y: 0, duration: 1 }, t0 + 0.35)
    .to('.hero .lead, .page-hero .lead, .page-head .lead, .hero .ctas, .page-hero .joke, .page-head p:not(.eyebrow):not(.lead)', { opacity: 1, y: 0, duration: 1.1, stagger: 0.12 }, t0 + 1.0)
    .to('.order-card', { opacity: 1, y: 0, duration: 1.3 }, t0 + 1.0)
    .to('.order-row', { opacity: 1, x: 0, duration: 0.9, stagger: 0.12 }, t0 + 1.3);

  // 3. Home hero is pinned while the photo opens to full screen and the locations appear over it.
  var pin = document.querySelector('.hero-pin');
  if (pin && desktop) {
    var hx = gsap.timeline({ scrollTrigger: { trigger: pin, start: 'top top', end: '+=110%', scrub: 0.8, pin: true, anticipatePin: 1 } });
    hx.to('.hero > img', { clipPath: 'inset(0 0 0 0%)', scale: 1.06, ease: 'none' }, 0)
      .to('.hero .wrap > div:first-child', { x: -120, opacity: 0, ease: 'none' }, 0)
      .to('.order-card', { x: 160, opacity: 0, ease: 'none' }, 0)
      .to('.hero-reveal', { opacity: 1, ease: 'none' }, 0.45)
      .fromTo('.hero-reveal .hr-line', { y: 60, scale: 0.92 }, { y: 0, scale: 1, ease: 'none' }, 0.45);
    gsap.to('.hero', { '--shade': 1, scrollTrigger: { trigger: pin, start: 'top top', end: '+=110%', scrub: true } });
  } else {
    $$('.hero > img, .page-hero > img').forEach(function(img){
      gsap.to(img, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top top', end: 'bottom top', scrub: true } });
    });
  }
  $$('.page-hero > img').forEach(function(img){
    gsap.to(img, { yPercent: 12, scale: 1.05, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top top', end: 'bottom top', scrub: true } });
  });

  // 4. Ticker runs continuously and speeds up with your scroll.
  var track = document.getElementById('ticker');
  if (track) {
    var loop = gsap.to(track, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });
    ScrollTrigger.create({ onUpdate: function(s){
      var v = Math.min(6, 1 + Math.abs(s.getVelocity()) / 250);
      gsap.to(loop, { timeScale: s.direction < 0 ? -v : v, duration: 0.3, overwrite: true });
      gsap.to(loop, { timeScale: s.direction < 0 ? -1 : 1, duration: 1.2, delay: 0.3, overwrite: false });
    } });
  }

  // 5. The six signature biscuits slide sideways while the section is pinned.
  var hs = document.querySelector('.hs');
  if (hs && desktop) {
    var tr = hs.querySelector('.hs-track');
    var dist = function(){ return Math.max(0, tr.scrollWidth - innerWidth); };
    gsap.to(tr, { x: function(){ return -dist(); }, ease: 'none', scrollTrigger: { trigger: hs, start: 'top top', end: function(){ return '+=' + dist(); }, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 } });
    $$('.hs-img img', hs).forEach(function(img){
      gsap.fromTo(img, { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: { trigger: hs, start: 'top top', end: function(){ return '+=' + dist(); }, scrub: true } });
    });
  }
  gsap.from('.hs-card', { opacity: 0, y: 80, rotate: 2, duration: 1.1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '.hs', start: 'top 75%', once: true } });

  // 6. Headings rise from a mask; statements brighten word by word.
  $$('main h2').forEach(function(h){
    if (inHero(h) || h.closest('.order-card')) return;
    gsap.to($$('.w > span', h), { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.06, scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
  });
  $$('.scrub-words').forEach(function(p){
    gsap.fromTo($$('.sw', p), { opacity: 0.14 }, { opacity: 1, stagger: 0.4, ease: 'none', scrollTrigger: { trigger: p, start: 'top 82%', end: 'bottom 45%', scrub: true } });
  });

  // 7. Photos open up and settle; full-bleed bands push in.
  $$('.reveal').forEach(function(f){
    gsap.fromTo(f, { clipPath: 'inset(18% 10% 18% 10% round 8px)' }, { clipPath: 'inset(0% 0% 0% 0% round 8px)', ease: 'none', scrollTrigger: { trigger: f, start: 'top 95%', end: 'top 35%', scrub: true } });
    var im = f.querySelectorAll('img');
    if (im.length) gsap.fromTo(im, { scale: 1.3 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom 30%', scrub: true } });
  });
  $$('.band-photo > img').forEach(function(img){
    gsap.fromTo(img, { scale: 1.3, yPercent: -8 }, { scale: 1, yPercent: 8, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // 8. The yellow band bursts open as a growing circle, then its words rise.
  $$('.togo').forEach(function(t){
    gsap.fromTo(t.querySelector('.togo-bg'), { clipPath: 'circle(0% at 50% 60%)' }, { clipPath: 'circle(120% at 50% 60%)', ease: 'none', scrollTrigger: { trigger: t, start: 'top 85%', end: 'top 25%', scrub: true } });
    gsap.to($$('.big .w > span', t), { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.04, scrollTrigger: { trigger: t, start: 'top 55%', once: true } });
    gsap.fromTo($$('.phones a', t), { opacity: 0, x: 50 }, { opacity: 1, x: 0, duration: 1, ease: 'power3.out', stagger: 0.12, scrollTrigger: { trigger: t, start: 'top 50%', once: true } });
  });

  // 9. Location cards tilt up into place; everything else arrives in sequence.
  gsap.set('.loc', { transformPerspective: 900 });
  ScrollTrigger.batch(seq, { start: 'top 90%', once: true, onEnter: function(b){
    gsap.fromTo(b, { opacity: 0, y: 40, rotateX: function(i, el){ return el.classList.contains('loc') ? -18 : 0; } }, { opacity: 1, y: 0, rotateX: 0, duration: 1.1, ease: 'power3.out', stagger: 0.09, overwrite: true });
  } });

  // 10. Page transitions: curtain down, then go.
  $$('a[href^="./"]').forEach(function(a){
    a.addEventListener('click', function(e){
      if (e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank' || !cur) return;
      var href = a.getAttribute('href');
      if (href.indexOf('#') >= 0) return;
      e.preventDefault();
      gsap.fromTo(cur, { yPercent: 100 }, { yPercent: 0, duration: 0.7, ease: 'expo.inOut', onComplete: function(){ location.href = href; } });
    });
  });
  addEventListener('pageshow', function(ev){ if (ev.persisted && cur) gsap.set(cur, { yPercent: -100 }); });
  addEventListener('load', function(){ ScrollTrigger.refresh(); });
})();
