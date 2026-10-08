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

## 16. Exploded stack (burger layers, plates on a bar, coin stacks, crates)

The scroll lifts the layers of one object apart along a single axis, one caption per layer, then locks them back.
Build the object as a `Group` of layers ordered bottom to top, then:
```js
const order = group.children.slice().sort((a, b) => a.position.y - b.position.y);
order.forEach((c, i) => { c.userData.home = c.position.clone(); c.userData.lift = (i - (order.length - 1) / 2) * .4; });
// in frame(): burst rises and falls through the middle of the chapter
const burst = Math.sin(clamp((prog - .3) / .4) * Math.PI);
order.forEach(c => c.position.y = c.userData.home.y + c.userData.lift * burst * 1.3);
group.scale.setScalar(base * (1 - .22 * burst));              // stay inside the frame while it grows taller
```
Food colours: `new THREE.Color(hex).convertSRGBToLinear()` with `MeshStandardMaterial` (roughness ≥ .55, low
envMapIntensity); otherwise reds and yellows wash out to pastel under sRGB output. Attach captions to layers only
when the content names them (a menu item, an ingredient); otherwise use the page's section headings.

## 17. Type sandwich turntable (product-launch hero)

The business name split into two halves in giant type, left and right, with the object turning in the gap; small
spec-style captions in the corners (hours, location, a short real line). From product-launch pages.
```css
.stage { position: sticky; top: 0; height: 100vh; display: flex; align-items: center; justify-content: space-between; gap: 28vw; padding: 0 var(--pad) }
.stage .half { font: 800 clamp(3rem, 9vw, 10rem)/.92 var(--display); flex: 1 }
.stage .half + canvas + .half { text-align: right }
@media (max-width: 900px) { .stage { flex-direction: column; gap: 0; padding: 14vh var(--pad) 30vh } }
```
```js
group.rotation.y = prog * Math.PI * 3;                       // only turns and grows; never slides sideways
group.scale.setScalar(lerp(.5, .78, ease(clamp(prog / .3))));
halves[0].style.transform = `translateX(${-prog * 6}%)`; halves[1].style.transform = `translateX(${prog * 6}%)`;
```
Split on words (`"Maison" | "Lumière"`); a one-word name splits in the middle of its letters.

## 18. Dark spotlight stage with fog (deconstructed / atelier)

A near-black stage, one cone of light from above, soft fog at the floor; the object (or the business's best photo in
a frame) sits in the light and comes apart into panels on scroll (recipe 7 explode variant).
```js
const spot = new THREE.SpotLight(0xffffff, 3, 20, Math.PI / 7, .6); spot.position.set(0, 7, 2); scene.add(spot, spot.target);
scene.fog = new THREE.FogExp2(0x0b0b0d, .08);
```
CSS fallback/overlay: `background: radial-gradient(40% 55% at 50% 30%, rgba(255,255,255,.12), transparent 70%)`
plus a blurred grain layer at the bottom for fog. Serif headline right-aligned beside the object.

## 19. Layered photo depth (cut-out collage)

The hero made from 3–5 of the business's own photos at different depths: each in its own frame, offset and
overlapping, moving at a different scroll speed and pointer parallax. Reads as 3D without WebGL.
```js
layers.forEach((el, i) => gsap.to(el, { yPercent: -(i + 1) * 12, ease: 'none',
  scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } }));
addEventListener('pointermove', e => layers.forEach((el, i) =>
  gsap.to(el, { x: (e.clientX / innerWidth - .5) * (i + 1) * 14, y: (e.clientY / innerHeight - .5) * (i + 1) * 10, duration: .8 })));
```
A large framed colour block behind the middle photo gives the "photo in front of a panel" look.

## 20. Scene cards with flowing ribbons (lookbook as a film)

A pinned stage that swaps "scenes": a floating card (product photo or a service) in the centre, a small scene counter
(`Scene 3 / 7`, since the scenes really are a sequence), a serif title on the left, one real detail on the right
(a price, a year, an opening time from the content), and silk ribbons (recipe 21) flowing behind the card.
```js
const tl = gsap.timeline({ scrollTrigger: { trigger: stage, start: 'top top', end: () => '+=' + scenes.length * innerHeight, pin: true, scrub: 1 } });
scenes.forEach((s, i) => { if (i) tl.fromTo(s, { autoAlpha: 0, yPercent: 12, rotateY: -18 }, { autoAlpha: 1, yPercent: 0, rotateY: 0 })
  .to(scenes[i - 1], { autoAlpha: 0, yPercent: -12, rotateY: 18 }, '<'); });
```

## 21. Silk ribbon (fabric bands in WebGL)

Build a flat band along a curve from Frenet frames (a flattened tube z-fights and shows stripes):
```js
function ribbon(curve, n, w) {
  const fr = curve.computeFrenetFrames(n, false), pos = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const p = curve.getPointAt(i / n), tw = i / n * Math.PI * 1.5;
    const b = fr.binormals[i].clone().multiplyScalar(Math.cos(tw)).add(fr.normals[i].clone().multiplyScalar(Math.sin(tw))).multiplyScalar(w);
    pos.push(p.x + b.x, p.y + b.y, p.z + b.z, p.x - b.x, p.y - b.y, p.z - b.z);
    if (i < n) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}
// material: MeshPhysicalMaterial({ color: accent, roughness: .3, clearcoat: 1, side: THREE.DoubleSide })
```

## 22. Image to particles (logo or photo dissolves into points)

Sample the business's own logo or photo into a point cloud that assembles on load and drifts apart on scroll. The
image proxy sends `Access-Control-Allow-Origin: *`, so load it with `crossOrigin = 'anonymous'` and read pixels:
```js
const img = new Image(); img.crossOrigin = 'anonymous'; img.src = proxiedUrl;
img.onload = () => { const c = document.createElement('canvas'), W = 160, H = Math.round(160 * img.height / img.width);
  c.width = W; c.height = H; const x = c.getContext('2d'); x.drawImage(img, 0, 0, W, H);
  const d = x.getImageData(0, 0, W, H).data, pts = [], cols = [];
  for (let y = 0; y < H; y += 2) for (let i = 0; i < W; i += 2) { const k = (y * W + i) * 4;
    if (d[k + 3] > 128 && d[k] + d[k + 1] + d[k + 2] < 700) { pts.push((i - W / 2) / 40, (H / 2 - y) / 40, 0); cols.push(d[k] / 255, d[k + 1] / 255, d[k + 2] / 255); } }
  /* BufferGeometry with position + color, PointsMaterial({ vertexColors: true, size: .03 }) */ };
```
Animate each point from a random start to its target with one progress value; wrap the pixel read in try/catch and
keep the plain image if the canvas is tainted.
