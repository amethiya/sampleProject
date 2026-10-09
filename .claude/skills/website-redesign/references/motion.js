(function(){
  var d = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cur = document.querySelector('.curtain');
  if (reduce || !window.gsap || !window.ScrollTrigger) { d.classList.remove('anim'); if (cur) cur.remove(); return; }
  gsap.registerPlugin(ScrollTrigger);
  var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var inHero = function(el){ return !!el.closest('.hero, .page-hero, .page-head'); };

  // Native scrolling on purpose: smooth-scroll libraries can make trackpad and touch scrolling stick.

  // Split headings into masked words (hero titles are split in the HTML already).
  $$('main h2, .togo .big').forEach(function(h){
    if (inHero(h) || h.querySelector('.w')) return;
    var html = h.innerHTML.trim().split(/\s+/).map(function(w){ return '<span class="w"><span>' + w + '</span></span>'; }).join(' ');
    h.innerHTML = html;
  });
  // Words that brighten as you read.
  $$('.scrub-words').forEach(function(p){
    p.innerHTML = p.innerHTML.trim().split(/\s+/).map(function(w){ return '<span class="sw">' + w + '</span>'; }).join(' ');
  });

  // Starting states, set while the curtain still covers the page.
  var SEQ = '.dish, .basics, .loc, .card, .q, .logos > div, .art a, details, .intro .eyebrow, .intro .btn, .split .eyebrow, .split .lead, .split .tbl-title, .split table, .split .btn, .panel, .printed > div, main > section > .wrap > .eyebrow, .faq aside';
  var seq = $$(SEQ).filter(function(el){ return !inHero(el) && !el.closest('.order-card'); });
  gsap.set(seq, { opacity: 0, y: 36 });
  gsap.set($$('main h2 .w > span').filter(function(s){ return !inHero(s); }), { yPercent: 110 });
  gsap.set('.hero h1 .w > span, .page-hero h1 .w > span, .page-head h1 .w > span', { yPercent: 110 });
  gsap.set('.hero .eyebrow, .page-hero .eyebrow, .page-head .eyebrow, .hero .lead, .page-hero .lead, .page-head .lead, .hero .ctas, .page-hero .joke, .page-head p:not(.eyebrow):not(.lead)', { opacity: 0, y: 24 });

  // Opening: curtain lifts, hero photo wipes in, headline rises word by word.
  var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  if (cur) tl.to(cur, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, 0.05);
  var heroImg = document.querySelector('.hero > img, .page-hero > img');
  if (heroImg) tl.fromTo(heroImg, { clipPath: 'inset(0 0 0 100%)', scale: 1.18 }, { clipPath: 'inset(0 0 0 0%)', scale: 1, duration: 1.6, ease: 'expo.inOut' }, 0.35);
  tl.to('.hero h1 .w > span, .page-hero h1 .w > span, .page-head h1 .w > span', { yPercent: 0, duration: 1.2, stagger: 0.07 }, 0.75)
    .to('.hero .eyebrow, .page-hero .eyebrow, .page-head .eyebrow', { opacity: 1, y: 0, duration: 1 }, 0.7)
    .to('.hero .lead, .page-hero .lead, .page-head .lead, .hero .ctas, .page-hero .joke, .page-head p:not(.eyebrow):not(.lead)', { opacity: 1, y: 0, duration: 1.1, stagger: 0.1 }, 1.05);
  if (document.querySelector('.order-card')) {
    tl.fromTo('.order-card', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 1.3 }, 1.0)
      .fromTo('.order-row', { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.9, stagger: 0.1 }, 1.35);
  }

  // Hero photos drift slower than the page.
  $$('.hero > img, .page-hero > img').forEach(function(img){
    gsap.to(img, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top top', end: 'bottom top', scrub: true } });
  });
  gsap.to('.hero .wrap', { yPercent: -8, opacity: 0.35, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // Section headings rise from a mask.
  $$('main h2').forEach(function(h){
    if (inHero(h)) return;
    gsap.to($$('.w > span', h), { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.05, scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
  });
  // Big statements brighten word by word.
  $$('.scrub-words').forEach(function(p){
    gsap.fromTo($$('.sw', p), { opacity: 0.16 }, { opacity: 1, stagger: 0.4, ease: 'none', scrollTrigger: { trigger: p, start: 'top 82%', end: 'bottom 45%', scrub: true } });
  });
  // Photos open up and settle as they come into view.
  $$('.reveal').forEach(function(f){
    gsap.fromTo(f, { clipPath: 'inset(16% 8% 16% 8% round 6px)' }, { clipPath: 'inset(0% 0% 0% 0% round 6px)', ease: 'none', scrollTrigger: { trigger: f, start: 'top 95%', end: 'top 40%', scrub: true } });
    var im = f.querySelectorAll('img');
    if (im.length) gsap.fromTo(im, { scale: 1.22 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom 30%', scrub: true } });
  });
  // Full-bleed photo bands: slow push-in.
  $$('.band-photo > img').forEach(function(img){
    gsap.fromTo(img, { scale: 1.25, yPercent: -6 }, { scale: 1, yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  // Content arrives in sequence.
  ScrollTrigger.batch(seq, { start: 'top 90%', once: true, onEnter: function(b){ gsap.to(b, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.08, overwrite: true }); } });
  // Butter band: phone numbers slide in.
  gsap.fromTo('.togo .phones a', { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 1, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: '.togo', start: 'top 80%', once: true } });

  // Page transitions: curtain down, then go.
  $$('a[href^="./"]').forEach(function(a){
    a.addEventListener('click', function(e){
      if (e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
      var href = a.getAttribute('href');
      if (href.indexOf('#') >= 0 && href.split('#')[0].replace('./', '') === location.pathname.split('/').pop().replace('index.html', '')) return;
      e.preventDefault();
      gsap.fromTo(cur, { yPercent: 100 }, { yPercent: 0, duration: 0.7, ease: 'expo.inOut', onComplete: function(){ location.href = href; } });
    });
  });
  addEventListener('pageshow', function(ev){ if (ev.persisted && cur) gsap.set(cur, { yPercent: -100 }); });

  // Safety net: nothing stays hidden if a trigger never fires.
  setTimeout(function(){ ScrollTrigger.refresh(); }, 600);
})();
