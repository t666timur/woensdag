// ============================================
// WOENSDAG — Main JS
// Three.js + GSAP ScrollTrigger + Advanced 3D
// Custom Shaders, Section Objects, Morph Anim
// ============================================

gsap.registerPlugin(ScrollTrigger);

// ============================================
// THREE.JS — Setup
// ============================================
const canvas = document.getElementById('bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// ============================================
// PARTICLE CONFIGS — 4 морф-конфигурации
// ============================================
const PARTICLE_COUNT = 1200;

function buildScatter() {
  const arr = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    arr[i * 3]     = (Math.random() - 0.5) * 18;
    arr[i * 3 + 1] = (Math.random() - 0.5) * 18;
    arr[i * 3 + 2] = (Math.random() - 0.5) * 12;
  }
  return arr;
}

function buildSphere() {
  const arr = new Float32Array(PARTICLE_COUNT * 3);
  const radius = 4;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const phi   = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    arr[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
    arr[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    arr[i * 3 + 2] = radius * Math.cos(phi);
  }
  return arr;
}

function buildTorus() {
  const arr = new Float32Array(PARTICLE_COUNT * 3);
  const R = 4, r = 1.4;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI * 2;
    arr[i * 3]     = (R + r * Math.cos(v)) * Math.cos(u);
    arr[i * 3 + 1] = (R + r * Math.cos(v)) * Math.sin(u);
    arr[i * 3 + 2] = r * Math.sin(v);
  }
  return arr;
}

function buildWave() {
  const arr = new Float32Array(PARTICLE_COUNT * 3);
  const cols = Math.ceil(Math.sqrt(PARTICLE_COUNT));
  const rows = Math.ceil(PARTICLE_COUNT / cols);
  const spacingX = 16 / cols;
  const spacingZ = 10 / rows;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = (col - cols * 0.5) * spacingX;
    const z = (row - rows * 0.5) * spacingZ;
    const y = Math.sin(x * 0.6) * Math.cos(z * 0.6) * 1.2;
    arr[i * 3]     = x;
    arr[i * 3 + 1] = y;
    arr[i * 3 + 2] = z;
  }
  return arr;
}

const configA = buildScatter();
const configB = buildSphere();
const configC = buildTorus();
const configD = buildWave();

// Текущие позиции (стартуем со скаттера)
const currentPositions = new Float32Array(configA);
const targetPositions  = new Float32Array(configA);

// Объект для GSAP-анимации морфинга
const morphState = { progress: 0 };

// ============================================
// CUSTOM SHADERS
// ============================================
const vertexShader = `
  uniform float uTime;
  uniform float uSize;
  uniform float uProgress;
  attribute vec3 aTargetPosition;
  attribute vec3 aColor;
  varying vec3 vColor;

  void main() {
    vColor = aColor;
    vec3 pos = mix(position, aTargetPosition, uProgress);

    // subtle wave drift
    pos.y += sin(pos.x * 2.0 + uTime) * 0.1;
    pos.x += cos(pos.z * 2.0 + uTime * 0.7) * 0.08;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uSize * (1.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform float uOpacity;
  varying vec3 vColor;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
    gl_FragColor = vec4(vColor, alpha * uOpacity);
  }
`;

// Цвета для частиц
const particleColors = new Float32Array(PARTICLE_COUNT * 3);
for (let i = 0; i < PARTICLE_COUNT; i++) {
  particleColors[i * 3]     = 0.784; // r — lime #c8ff00
  particleColors[i * 3 + 1] = 1.0;
  particleColors[i * 3 + 2] = 0.0;
}

const particleGeo = new THREE.BufferGeometry();
particleGeo.setAttribute('position',        new THREE.BufferAttribute(new Float32Array(configA), 3));
particleGeo.setAttribute('aTargetPosition', new THREE.BufferAttribute(new Float32Array(configA), 3));
particleGeo.setAttribute('aColor',          new THREE.BufferAttribute(particleColors, 3));

const particleMat = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime:     { value: 0 },
    uSize:     { value: 80 },
    uProgress: { value: 0 },
    uOpacity:  { value: 0.6 }
  },
  transparent: true,
  depthWrite: false
});

const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

// ============================================
// HELPER: запустить морфинг к целевому конфигу
// ============================================
function morphTo(targetConfig, duration) {
  // Сохраняем текущие позиции как базу
  const posAttr = particleGeo.getAttribute('position');
  for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
    currentPositions[i] = posAttr.array[i];
  }

  // Задаём новую цель
  const targetAttr = particleGeo.getAttribute('aTargetPosition');
  for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
    targetAttr.array[i] = targetConfig[i];
  }
  targetAttr.needsUpdate = true;

  // Обновляем position буфер текущими позициями
  for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
    posAttr.array[i] = currentPositions[i];
  }
  posAttr.needsUpdate = true;

  // Сбрасываем прогресс и анимируем
  particleMat.uniforms.uProgress.value = 0;
  gsap.to(particleMat.uniforms.uProgress, {
    value: 1,
    duration: duration || 1.8,
    ease: 'power2.inOut',
    onComplete: () => {
      // После завершения обновляем position буфер финальными позициями
      for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
        posAttr.array[i] = targetConfig[i];
      }
      for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
        targetAttr.array[i] = targetConfig[i];
      }
      posAttr.needsUpdate   = true;
      targetAttr.needsUpdate = true;
      particleMat.uniforms.uProgress.value = 0;
    }
  });
}

// ============================================
// SECTION 3D OBJECTS
// ============================================
const sectionObjects = {};

function makeMesh(geo, color, opacity, wireframe) {
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    wireframe: wireframe !== false,
    depthWrite: false
  });
  return new THREE.Mesh(geo, mat);
}

// Hero — IcosahedronGeometry wireframe
sectionObjects.hero = makeMesh(
  new THREE.IcosahedronGeometry(2, 1),
  0xc8ff00, 0.15, true
);
sectionObjects.hero.position.set(3, 0, -4);

// Corporate — TorusGeometry wireframe
sectionObjects.corporate = makeMesh(
  new THREE.TorusGeometry(1.5, 0.4, 16, 100),
  0x6464ff, 0.12, true
);
sectionObjects.corporate.position.set(-3, 0.5, -4);

// Cyber — OctahedronGeometry solid
sectionObjects.cyber = makeMesh(
  new THREE.OctahedronGeometry(2, 0),
  0x00f5ff, 0.08, false
);
sectionObjects.cyber.position.set(3.5, -0.5, -3.5);

// Process — TorusKnotGeometry wireframe
sectionObjects.process = makeMesh(
  new THREE.TorusKnotGeometry(1.2, 0.3, 100, 16),
  0xc8ff00, 0.1, true
);
sectionObjects.process.position.set(-2.5, 0, -4.5);

// About — SphereGeometry wireframe
sectionObjects.about = makeMesh(
  new THREE.SphereGeometry(1.8, 8, 8),
  0xc9a84c, 0.1, true
);
sectionObjects.about.position.set(3, 1, -4);

// Luxury — RingGeometry flat
sectionObjects.luxury = makeMesh(
  new THREE.RingGeometry(1.5, 2, 64),
  0xc9a84c, 0.08, false
);
sectionObjects.luxury.position.set(-2, -0.5, -3.5);
sectionObjects.luxury.rotation.x = Math.PI * 0.25;

// Contact — IcosahedronGeometry wireframe solid
sectionObjects.contact = makeMesh(
  new THREE.IcosahedronGeometry(1.5, 0),
  0xc8ff00, 0.15, true
);
sectionObjects.contact.position.set(0, 1.5, -4);

// Добавляем все объекты в сцену, изначально невидимые
Object.values(sectionObjects).forEach(obj => {
  obj.material.opacity = 0;
  scene.add(obj);
});

// Целевые opacity для каждого объекта (когда он активен)
const objectTargetOpacity = {
  hero:      0.15,
  corporate: 0.12,
  cyber:     0.08,
  process:   0.1,
  about:     0.1,
  luxury:    0.08,
  contact:   0.15
};

// ============================================
// SCROLL: показываем/скрываем 3D объекты
// ============================================
function showObject(name) {
  const obj = sectionObjects[name];
  if (!obj) return;
  gsap.to(obj.material, { opacity: objectTargetOpacity[name], duration: 0.8, ease: 'power2.out' });
}

function hideObject(name) {
  const obj = sectionObjects[name];
  if (!obj) return;
  gsap.to(obj.material, { opacity: 0, duration: 0.6, ease: 'power2.in' });
}

// Настройка видимости объектов по секциям
const sectionNames = ['hero', 'corporate', 'cyber', 'process', 'about', 'luxury', 'contact'];
sectionNames.forEach(name => {
  const el = document.getElementById(name);
  if (!el) return;
  ScrollTrigger.create({
    trigger: el,
    start: 'top 70%',
    end: 'bottom 30%',
    onEnter:      () => { sectionNames.forEach(n => n !== name && hideObject(n)); showObject(name); },
    onEnterBack:  () => { sectionNames.forEach(n => n !== name && hideObject(n)); showObject(name); },
    onLeave:      () => hideObject(name),
    onLeaveBack:  () => hideObject(name)
  });
});

// Начальное состояние — hero виден
showObject('hero');

// ============================================
// SCROLL: морфинг частиц по секциям
// ============================================
// Hero виден по умолчанию — configA (scatter)

ScrollTrigger.create({
  trigger: '.t1',
  start: 'top center',
  onEnter:     () => morphTo(configB, 1.8),  // Corporate → sphere
  onEnterBack: () => morphTo(configA, 1.8)   // Hero → scatter
});

ScrollTrigger.create({
  trigger: '.t2',
  start: 'top center',
  onEnter:     () => morphTo(configD, 1.6),  // Cyber → wave
  onEnterBack: () => morphTo(configB, 1.6)   // Corporate → sphere
});

ScrollTrigger.create({
  trigger: '.t3',
  start: 'top center',
  onEnter:     () => morphTo(configC, 2.0),  // Process → torus
  onEnterBack: () => morphTo(configD, 1.6)   // Cyber → wave
});

ScrollTrigger.create({
  trigger: '.t3b',
  start: 'top center',
  onEnter:     () => morphTo(configB, 1.8),  // About → sphere
  onEnterBack: () => morphTo(configC, 2.0)   // Process → torus
});

ScrollTrigger.create({
  trigger: '.t3c',
  start: 'top center',
  onEnter:     () => morphTo(configA, 2.0),  // Luxury → sparse scatter
  onEnterBack: () => morphTo(configB, 1.8)   // About → sphere
});

ScrollTrigger.create({
  trigger: '.t4',
  start: 'top center',
  onEnter:     () => morphTo(configD, 1.6),  // Contact → expanding wave
  onEnterBack: () => morphTo(configA, 2.0)   // Luxury → scatter
});

// ============================================
// SCROLL: цвет и opacity шейдерных частиц
// ============================================
const colorCache = { r: 0.784, g: 1.0, b: 0.0 };

function updateParticleColors(r, g, b) {
  colorCache.r = r; colorCache.g = g; colorCache.b = b;
  const colorAttr = particleGeo.getAttribute('aColor');
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    colorAttr.array[i * 3]     = r;
    colorAttr.array[i * 3 + 1] = g;
    colorAttr.array[i * 3 + 2] = b;
  }
  colorAttr.needsUpdate = true;
}

ScrollTrigger.create({
  trigger: '.t1', start: 'top center', end: 'bottom center',
  onUpdate: (self) => {
    const p = self.progress;
    updateParticleColors(0.784*(1-p)+0.39*p, 1*(1-p)+0.51*p, 0*(1-p)+1*p);
    particleMat.uniforms.uOpacity.value = 0.6 - p * 0.2;
  }
});

ScrollTrigger.create({
  trigger: '.t2', start: 'top center', end: 'bottom center',
  onUpdate: (self) => {
    const p = self.progress;
    updateParticleColors(0.39*(1-p), 0.51*(1-p)+0.96*p, 1);
    particleMat.uniforms.uOpacity.value = 0.4 + p * 0.3;
  }
});

ScrollTrigger.create({
  trigger: '.t3', start: 'top center', end: 'bottom center',
  onUpdate: (self) => {
    const p = self.progress;
    particleMat.uniforms.uOpacity.value = 0.7*(1-p) + p*0.3;
    particles.scale.setScalar(1 + p * 0.3);
  }
});

ScrollTrigger.create({
  trigger: '.t3b', start: 'top center', end: 'bottom center',
  onUpdate: (self) => {
    const p = self.progress;
    particleMat.uniforms.uOpacity.value = 0.3*(1-p) + p*0.05;
    particles.scale.setScalar(1.3 - p * 0.3);
  }
});

ScrollTrigger.create({
  trigger: '.t3c', start: 'top center', end: 'bottom center',
  onUpdate: (self) => {
    const p = self.progress;
    particleMat.uniforms.uOpacity.value = 0.05 + p * 0.1;
    particles.scale.setScalar(1 + p * 0.2);
  }
});

ScrollTrigger.create({
  trigger: '.t4', start: 'top center', end: 'bottom center',
  onUpdate: (self) => {
    const p = self.progress;
    particleMat.uniforms.uOpacity.value = 0.15 + p * 0.5;
    updateParticleColors(0.784, 1, 0);
    particles.scale.setScalar(1.2 - p * 0.2);
  }
});

// ============================================
// RESIZE + MOUSE
// ============================================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 0.3;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 0.3;
});

// ============================================
// RENDER LOOP
// ============================================
const clock = new THREE.Clock();

function animateThree() {
  requestAnimationFrame(animateThree);

  const elapsed = clock.getElapsedTime();
  particleMat.uniforms.uTime.value = elapsed;

  // Rotation лёгкая для всего поля частиц
  particles.rotation.y = elapsed * 0.03;
  particles.rotation.x = elapsed * 0.01;

  // Camera parallax от мыши
  camera.position.x += (mouseX - camera.position.x) * 0.02;
  camera.position.y += (-mouseY - camera.position.y) * 0.02;

  // Анимация 3D объектов секций
  const t = elapsed;
  if (sectionObjects.hero.material.opacity > 0.001) {
    sectionObjects.hero.rotation.x = t * 0.2;
    sectionObjects.hero.rotation.y = t * 0.15;
  }
  if (sectionObjects.corporate.material.opacity > 0.001) {
    sectionObjects.corporate.rotation.y = t * 0.4;
    sectionObjects.corporate.rotation.x = t * 0.1;
  }
  if (sectionObjects.cyber.material.opacity > 0.001) {
    sectionObjects.cyber.rotation.x = t * 0.8;
    sectionObjects.cyber.rotation.z = t * 0.5;
  }
  if (sectionObjects.process.material.opacity > 0.001) {
    sectionObjects.process.rotation.x = t * 0.15;
    sectionObjects.process.rotation.y = t * 0.2;
  }
  if (sectionObjects.about.material.opacity > 0.001) {
    sectionObjects.about.rotation.y = t * 0.12;
    sectionObjects.about.rotation.x = Math.sin(t * 0.3) * 0.2;
  }
  if (sectionObjects.luxury.material.opacity > 0.001) {
    sectionObjects.luxury.rotation.z = t * 0.08;
    sectionObjects.luxury.position.y = -0.5 + Math.sin(t * 0.4) * 0.15;
  }
  if (sectionObjects.contact.material.opacity > 0.001) {
    sectionObjects.contact.rotation.x = t * 0.6;
    sectionObjects.contact.rotation.y = t * 0.4;
  }

  renderer.render(scene, camera);
}

animateThree();

// ============================================
// SCROLL PROGRESS + NAVBAR
// ============================================
const progressBar = document.getElementById('scroll-progress');
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  const total = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = (window.scrollY / total * 100) + '%';
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// ============================================
// HERO ENTRANCE
// ============================================
gsap.timeline({ delay: 0.3 })
  .to('.hero-tag',        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' })
  .to('.hero-title .word',{ opacity: 1, y: 0, duration: 0.9, stagger: 0.15, ease: 'power3.out' }, '-=0.4')
  .to('.hero-sub',        { opacity: 1, duration: 0.8, ease: 'power2.out' }, '-=0.4')
  .to('.btn-primary',     { opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.3');

// ============================================
// 3D TRANSITION 1: Hero → Corporate
// Hero складывается вверх как крышка (rotateX)
// Corporate влетает снизу с глубины
// ============================================
gsap.set('#hero', { transformOrigin: '50% 0%', transformPerspective: 1200 });
gsap.set('#corporate', { transformOrigin: '50% 100%', transformPerspective: 1200 });

const tl1 = gsap.timeline({
  scrollTrigger: {
    trigger: '.t1',
    start: 'top bottom',
    end: 'bottom top',
    scrub: 1.2,
  }
});

tl1
  .fromTo('#hero',
    { rotateX: 0, filter: 'brightness(1)' },
    { rotateX: -55, filter: 'brightness(0.2)', ease: 'none' }
  )
  .fromTo('#corporate',
    { rotateX: 35, scale: 0.85, filter: 'brightness(0.4)' },
    { rotateX: 0, scale: 1, filter: 'brightness(1)', ease: 'none' },
    0
  );

// ============================================
// 3D TRANSITION 2: Corporate → Cyber
// Corporate уходит с вращением по Y (как страница книги)
// Cyber врывается по Z (zoom из глубины)
// ============================================
gsap.set('#corporate', { transformPerspective: 1200 });
gsap.set('#cyber', { transformPerspective: 1200 });

const tl2 = gsap.timeline({
  scrollTrigger: {
    trigger: '.t2',
    start: 'top bottom',
    end: 'bottom top',
    scrub: 1.2,
  }
});

tl2
  .fromTo('#corporate',
    { rotateY: 0, x: 0, filter: 'brightness(1)' },
    { rotateY: -70, x: '-15%', filter: 'brightness(0.1)', ease: 'none' }
  )
  .fromTo('#cyber',
    { scale: 0.5, z: -400, filter: 'brightness(0)' },
    { scale: 1, z: 0, filter: 'brightness(1)', ease: 'none' },
    0
  );

// ============================================
// 3D TRANSITION 3: Cyber → Process
// Cyber взрывается — масштаб растёт до бесконечности
// Process появляется с переворотом по X сверху вниз
// ============================================
gsap.set('#process', { transformPerspective: 1200 });

const tl3 = gsap.timeline({
  scrollTrigger: {
    trigger: '.t3',
    start: 'top bottom',
    end: 'bottom top',
    scrub: 1.2,
  }
});

tl3
  .fromTo('#cyber',
    { scale: 1, opacity: 1 },
    { scale: 2.5, opacity: 0, ease: 'none' }
  )
  .fromTo('#process',
    { rotateX: -50, opacity: 0, filter: 'brightness(0.3)' },
    { rotateX: 0, opacity: 1, filter: 'brightness(1)', ease: 'none' },
    0
  );

// ============================================
// 3D TRANSITION 3b: Process → About
// Process уходит с вращением по Y
// About влетает с противоположного угла
// ============================================
gsap.set('#about', { transformPerspective: 1200 });

const tl3b = gsap.timeline({
  scrollTrigger: {
    trigger: '.t3b',
    start: 'top bottom',
    end: 'bottom top',
    scrub: 1.2,
  }
});

tl3b
  .fromTo('#process',
    { rotateY: 0, filter: 'brightness(1)' },
    { rotateY: -60, filter: 'brightness(0.1)', ease: 'none' }
  )
  .fromTo('#about',
    { rotateY: 60, scale: 0.9, filter: 'brightness(0.3)' },
    { rotateY: 0, scale: 1, filter: 'brightness(1)', ease: 'none' },
    0
  );

// ============================================
// 3D TRANSITION 3c: About → Luxury
// About складывается вперёд по X
// Luxury появляется снизу с масштабом
// ============================================
gsap.set('#luxury', { transformOrigin: '50% 0%', transformPerspective: 1200 });

const tl3c = gsap.timeline({
  scrollTrigger: {
    trigger: '.t3c',
    start: 'top bottom',
    end: 'bottom top',
    scrub: 1.2,
  }
});

tl3c
  .fromTo('#about',
    { rotateX: 0, filter: 'brightness(1)' },
    { rotateX: -55, filter: 'brightness(0.2)', ease: 'none' }
  )
  .fromTo('#luxury',
    { rotateX: 35, scale: 0.85, opacity: 0 },
    { rotateX: 0, scale: 1, opacity: 1, ease: 'none' },
    0
  );

// ============================================
// 3D TRANSITION 4: Luxury → Contact
// Luxury сдвигается в перспективе вправо (rotateY)
// Contact поднимается из-под земли (translateY + rotateX)
// ============================================
gsap.set('#luxury', { transformPerspective: 1200 });
gsap.set('#contact', { transformOrigin: '50% 100%', transformPerspective: 1200 });

const tl4 = gsap.timeline({
  scrollTrigger: {
    trigger: '.t4',
    start: 'top bottom',
    end: 'bottom top',
    scrub: 1.2,
  }
});

tl4
  .fromTo('#luxury',
    { rotateY: 0, x: 0 },
    { rotateY: 60, x: '20%', filter: 'brightness(0.2)', ease: 'none' }
  )
  .fromTo('#contact',
    { rotateX: 40, y: '10%', filter: 'brightness(0.3)' },
    { rotateX: 0, y: '0%', filter: 'brightness(1)', ease: 'none' },
    0
  );

// ============================================
// CORPORATE — glass cards entrance
// ============================================
gsap.utils.toArray('.glass-card').forEach((card, i) => {
  gsap.to(card, {
    opacity: 1, x: 0, duration: 0.7, delay: i*0.15, ease: 'power3.out',
    scrollTrigger: { trigger: card, start: 'top 85%' }
  });
});

// ============================================
// CYBER — counters
// ============================================
document.querySelectorAll('.stat-num').forEach(counter => {
  const target = parseInt(counter.getAttribute('data-target'));
  ScrollTrigger.create({
    trigger: counter, start: 'top 80%', once: true,
    onEnter: () => {
      gsap.to({ val: 0 }, {
        val: target, duration: 2, ease: 'power2.out',
        onUpdate: function() { counter.textContent = Math.round(this.targets()[0].val); }
      });
    }
  });
});

// ============================================
// LUXURY — 3D rocking frame on scroll
// ============================================
gsap.from('.luxury-eyebrow', { opacity: 0, y: 20, duration: 0.8, scrollTrigger: { trigger: '.luxury-eyebrow', start: 'top 80%' } });
gsap.from('.luxury-title',   { opacity: 0, y: 40, duration: 1,   scrollTrigger: { trigger: '.luxury-title', start: 'top 80%' } });
gsap.from('.luxury-frame',   { opacity: 0, scale: 0.8, rotation: 5, duration: 1.2, scrollTrigger: { trigger: '.luxury-frame', start: 'top 80%' } });

ScrollTrigger.create({
  trigger: '.s-luxury', start: 'top bottom', end: 'bottom top', scrub: true,
  onUpdate: (self) => {
    gsap.set('.luxury-frame', { rotateY: (self.progress - 0.5)*25, rotateX: (self.progress - 0.5)*-12 });
  }
});

// ============================================
// PROCESS — steps entrance
// ============================================
gsap.utils.toArray('.step').forEach((step, i) => {
  gsap.to(step, {
    opacity: 1, y: 0, duration: 0.7, delay: i * 0.15, ease: 'power3.out',
    scrollTrigger: { trigger: '.steps', start: 'top 80%' }
  });
});

// ============================================
// ABOUT — entrance animations
// ============================================
gsap.from('.about-bg-text', { opacity: 0, scale: 0.8, duration: 1.5, ease: 'power3.out', scrollTrigger: { trigger: '.s-about', start: 'top 80%' } });
gsap.from('.about-eyebrow', { opacity: 0, y: 20, duration: 0.8, scrollTrigger: { trigger: '.about-center', start: 'top 80%' } });
gsap.from('.about-desc',    { opacity: 0, y: 30, duration: 1, delay: 0.2, scrollTrigger: { trigger: '.about-center', start: 'top 80%' } });
gsap.from('.about-tags-inline span', { opacity: 0, y: 15, stagger: 0.1, duration: 0.6, delay: 0.4, scrollTrigger: { trigger: '.about-tags-inline', start: 'top 85%' } });

// About bg-text parallax
ScrollTrigger.create({
  trigger: '.s-about', start: 'top bottom', end: 'bottom top', scrub: true,
  onUpdate: (self) => {
    gsap.set('.about-bg-text', { y: (self.progress - 0.5) * 80 });
  }
});

// ============================================
// CIRCLE REVEAL — About → Luxury
// Медленное раздувание круга открывает новый стиль
// ============================================
gsap.timeline({
  scrollTrigger: {
    trigger: '#reveal-luxury',
    start: 'top 90%',
    end: 'bottom 10%',
    scrub: 2.5,          // медленно, плавно
    onUpdate: (self) => {
      const p = self.progress;
      // ease-in: медленно в начале, быстро в конце
      const eased = Math.pow(p, 2.2);
      const pct = (eased * 152).toFixed(1);
      document.getElementById('reveal-luxury').style.clipPath =
        `circle(${pct}% at 50% 50%)`;
      // content inside fades in after circle is big enough
      if (p > 0.5) {
        const innerP = (p - 0.5) / 0.5;
        const inner = document.querySelector('#reveal-luxury .circle-reveal-inner');
        if (inner) {
          inner.style.opacity = innerP;
          inner.style.transform = `scale(${0.9 + innerP * 0.1})`;
        }
      }
    }
  }
});

// ============================================
// CIRCLE REVEAL — Luxury → Contact
// Тёмный круг раздувается в Contact
// ============================================
gsap.timeline({
  scrollTrigger: {
    trigger: '#reveal-contact',
    start: 'top 90%',
    end: 'bottom 20%',
    scrub: 2.5,
    onUpdate: (self) => {
      const p = self.progress;
      const eased = Math.pow(p, 2.2);
      const pct = (eased * 152).toFixed(1);
      document.getElementById('reveal-contact').style.clipPath =
        `circle(${pct}% at 50% 50%)`;
    }
  }
});

// ============================================
// CONTACT — price cards
// ============================================
gsap.utils.toArray('.price-card').forEach((card, i) => {
  gsap.to(card, {
    opacity: 1, y: 0, duration: 0.7, delay: i*0.15, ease: 'power3.out',
    scrollTrigger: { trigger: '.pricing', start: 'top 80%' }
  });
});

// ============================================
// 3D TILT — cards on hover
// ============================================
document.querySelectorAll('.glass-card, .price-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    gsap.to(card, { rotateX: -y*12, rotateY: x*12, transformPerspective: 800, duration: 0.3, ease: 'power2.out' });
  });
  card.addEventListener('mouseleave', () => {
    gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.5, ease: 'power3.out' });
  });
});

// ============================================
// PARALLAX section labels
// ============================================
gsap.utils.toArray('.section-label').forEach(label => {
  gsap.to(label, {
    y: -50, ease: 'none',
    scrollTrigger: { trigger: label.closest('.section'), start: 'top bottom', end: 'bottom top', scrub: true }
  });
});
