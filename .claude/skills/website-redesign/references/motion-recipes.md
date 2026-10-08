# Motion recipe library

Proven patterns (the same ones the Revamp Radar template engine uses). Libraries come from `content.json.libraries`:
GSAP 3.12.5 + ScrollTrigger (cdnjs), Lenis 1.1.13 (jsdelivr), Three.js r128 (cdnjs) + RoomEnvironment (jsdelivr).
Load scripts at the end of `<body>`, in that order, before your inline script.

## 0. Progressive enhancement switch

```html
<html class="no-js"><head><script>document.documentElement.className='js';</script>
```
```css
.js .rv { opacity: 0; transform: translateY(26px); }            /* hidden only when JS runs */
@media (prefers-reduced-motion: reduce) { .js .rv { opacity: 1; transform: none; } }
```
```js
if (!(window.gsap && window.ScrollTrigger)) { document.documentElement.className = 'no-js'; return; }
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
gsap.registerPlugin(ScrollTrigger);
```

## 1. Smooth scroll (Lenis + ScrollTrigger)

```js
let lenis = null;
if (!reduce && window.Lenis) {
  lenis = new Lenis({ lerp: 0.09 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
// in-page links: lenis ? lenis.scrollTo(el, { offset: -70 }) : el.scrollIntoView()
```

## 2. Orchestrated page load

```js
gsap.timeline()
  .to('.loader-bar i', { scaleX: 1, duration: .9, ease: 'power2.inOut' })
  .to('.loader', { yPercent: -100, duration: .9, ease: 'expo.inOut', onComplete: () => loader.remove() })
  .to('.hero-title .w > span', { y: 0, duration: 1.1, ease: 'expo.out', stagger: .08 }, '-=.45')
  .to('.hero .rv', { opacity: 1, y: 0, duration: .9, ease: 'power3.out', stagger: .08 }, '-=.8');
```
Wrap each headline word as `<span class="w"><span>word</span></span>` with `.w { overflow: hidden; display: inline-block }`
and `.js .w > span { transform: translateY(108%) }`.

## 3. Heading rise from a mask (on scroll)

```js
document.querySelectorAll('.section-title').forEach(h => {
  const words = h.textContent.trim().split(/\s+/); h.textContent = '';
  words.forEach(w => { const o = document.createElement('span'); o.className = 'tw';
    const i = document.createElement('span'); i.textContent = w; o.append(i); h.append(o, ' '); });
  gsap.from(h.querySelectorAll('.tw > span'), { yPercent: 110, duration: 1, ease: 'expo.out', stagger: .06,
    scrollTrigger: { trigger: h, start: 'top 88%' } });
});
```

## 4. Words sharpen from blur while reading (scrubbed)

```js
gsap.fromTo(statement.querySelectorAll('.sw'), { opacity: .16, filter: 'blur(5px)' },
  { opacity: 1, filter: 'blur(0px)', stagger: .5, ease: 'none',
    scrollTrigger: { trigger: statement, start: 'top 75%', end: 'bottom 55%', scrub: true } });
```

## 5. Image mask reveal + inner parallax

```js
gsap.fromTo(fig, { clipPath: 'inset(14% 10% 14% 10% round 22px)' },
  { clipPath: 'inset(0% 0% 0% 0% round 22px)', ease: 'none',
    scrollTrigger: { trigger: fig, start: 'top 92%', end: 'center 60%', scrub: true } });
gsap.fromTo(fig.querySelector('img'), { scale: 1.2 }, { scale: 1, ease: 'none',
  scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
```

## 6. Pinned horizontal gallery (desktop only)

```js
gsap.matchMedia().add('(min-width: 901px)', () => {
  const dist = () => Math.max(0, track.scrollWidth - innerWidth);
  gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: section, start: 'top top',
    end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true } });
});
```
On mobile use `overflow-x: auto; scroll-snap-type: x mandatory`.

## 7. Pinned 3D chapter (the signature moment)

Markup: a section ~340vh tall with a `position: sticky; top: 0; height: 100vh` stage containing the canvas,
outlined background type, captions (`.cap-0` left, `.cap-1` right, `.cap-2` bottom) and a progress line.
Drive everything from one progress value:
```js
let target = 0, prog = 0;
ScrollTrigger.create({ trigger: chapter, start: 'top top', end: 'bottom bottom', onUpdate: s => target = s.progress });
function frame() {
  prog += (target - prog) * .08;                       // smooth follow
  const k1 = ease(clamp((prog - .28) / .12)), k2 = ease(clamp((prog - .62) / .12));
  group.position.x = lerp(lerp(1.7, -1.7, k1), 0, k2); // right → left → centre, opposite the caption
  group.scale.setScalar(lerp(.62, 1.05, ease(clamp(prog / .22))));
  group.rotation.y = prog * Math.PI * 2.2;
  // exploded view: each child moves out along its own direction, then back
  const burst = Math.sin(clamp((prog - .3) / .4) * Math.PI);
  group.children.forEach(c => c.position.copy(c.userData.home).addScaledVector(c.userData.dir, burst * spread));
  caps.forEach((c, i) => { const a = [.04, .38, .72][i]; c.style.opacity = win(prog, a, a + .26, .07); });
  bgType[0].style.transform = `translateX(${10 - prog * 60}%)`;
  renderer.render(scene, camera);
}
```
Orbit variant: move the camera instead — `camera.position.set(Math.sin(a) * r, y, Math.cos(a) * r); camera.lookAt(0, 0, 0)`.

## 8. Studio-lit object

```js
const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.outputEncoding = THREE.sRGBEncoding;
const pm = new THREE.PMREMGenerator(r);
scene.environment = pm.fromScene(new THREE.RoomEnvironment(), .04).texture;
const mat = (color, metal, rough) => new THREE.MeshPhysicalMaterial({ color, metalness: metal, roughness: rough, clearcoat: 1, clearcoatRoughness: .2 });
scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, .5));
const rim = new THREE.PointLight(accent, 2.2, 20); rim.position.set(-5, 2, -3); scene.add(rim);
// light themes: lower envMapIntensity (~.45) so metals don't blow out
```
Render only while visible:
```js
let on = true; new IntersectionObserver(e => on = e[0].isIntersecting).observe(canvas);
(function tick() { requestAnimationFrame(tick); if (on) frame(); })();
```

## 9. Particle field

```js
const N = 1600, pos = new Float32Array(N * 3);
for (let i = 0; i < N; i++) { const u = Math.random() * 2 - 1, t = Math.random() * Math.PI * 2, rad = 2.4 + Math.random() * 1.8;
  pos.set([rad * Math.sqrt(1 - u * u) * Math.cos(t), rad * u, rad * Math.sqrt(1 - u * u) * Math.sin(t)], i * 3); }
const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: accent, size: .035, transparent: true, opacity: 0, depthWrite: false }));
```
Steam (café): spawn points near the cup rim, move up with sine drift, fade out with height.

## 10. Photo hero with WebGL ripple

A subdivided plane (96×96) showing the hero photo: vertex shader adds sine waves + a bump near the pointer;
fragment shader does a `cover` fit, slight zoom on scroll and a tiny RGB split near the pointer (≤0.0012).
Only for CORS-enabled images (images.unsplash.com); use a CSS background for the business's own photos.

## 11. Kinetic headline (gym, bold poster)

```js
gsap.from(chars, { yPercent: 120, rotate: 8, opacity: 0, duration: .7, ease: 'back.out(1.6)', stagger: .03 });
```

## 12. SVG line drawing (routes, icons, signatures)

```js
const len = path.getTotalLength();
gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, ease: 'none',
  scrollTrigger: { trigger: path, start: 'top 80%', end: 'bottom 40%', scrub: true } });
```

## 13. Marquee that leans with scroll velocity

```js
const skew = gsap.quickTo('.marquee-inner', 'skewX', { duration: .4, ease: 'power3' });
ScrollTrigger.create({ onUpdate: s => skew(gsap.utils.clamp(-8, 8, s.getVelocity() / -300)) });
```

## 14. Magnetic buttons + cursor (fine pointers only)

```js
if (matchMedia('(pointer: fine)').matches) btns.forEach(b => {
  b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect();
    gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .3, y: (e.clientY - r.top - r.height / 2) * .4, duration: .4 }); });
  b.addEventListener('pointerleave', () => gsap.to(b, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.4)' }));
});
```

## 15. Count-up (only real numbers from the content)

```js
gsap.from(el, { textContent: 0, duration: 1.4, ease: 'power2.out', snap: { textContent: 1 },
  scrollTrigger: { trigger: el, start: 'top 85%' } });
```
