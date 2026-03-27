// ============================================
// WOENSDAG — Main JS
// Three.js + GSAP ScrollTrigger + Real 3D
// ============================================

gsap.registerPlugin(ScrollTrigger);

// ============================================
// THREE.JS — Particle Field
// ============================================
const canvas = document.getElementById('bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const count = 1500;
const positions = new Float32Array(count * 3);
for (let i = 0; i < count * 3; i++) positions[i] = (Math.random() - 0.5) * 20;

const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const mat = new THREE.PointsMaterial({ size: 0.015, color: 0xc8ff00, transparent: true, opacity: 0.6 });
const particles = new THREE.Points(geo, mat);
scene.add(particles);

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

function animateThree() {
  requestAnimationFrame(animateThree);
  particles.rotation.y += 0.0005;
  particles.rotation.x += 0.0002;
  camera.position.x += (mouseX - camera.position.x) * 0.02;
  camera.position.y += (-mouseY - camera.position.y) * 0.02;
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
// 3D TRANSITION 3: Cyber → Luxury
// Cyber взрывается — масштаб растёт до бесконечности
// Luxury появляется с переворотом по X сверху вниз
// ============================================
gsap.set('#luxury', { transformOrigin: '50% 0%', transformPerspective: 1200 });

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
  .fromTo('#luxury',
    { rotateX: -60, opacity: 0, filter: 'brightness(0.3)' },
    { rotateX: 0, opacity: 1, filter: 'brightness(1)', ease: 'none' },
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
// PARTICLE COLOR SHIFTS по секциям
// ============================================
ScrollTrigger.create({
  trigger: '.t1', start: 'top center', end: 'bottom center',
  onUpdate: (self) => {
    const p = self.progress;
    mat.color.setRGB(0.784*(1-p)+0.39*p, 1*(1-p)+0.51*p, 0*(1-p)+1*p);
    mat.opacity = 0.6 - p*0.2;
  }
});
ScrollTrigger.create({
  trigger: '.t2', start: 'top center', end: 'bottom center',
  onUpdate: (self) => {
    const p = self.progress;
    mat.color.setRGB(0.39*(1-p), 0.51*(1-p)+0.96*p, 1*(1-p)+1*p);
    mat.opacity = 0.4 + p*0.3;
  }
});
ScrollTrigger.create({
  trigger: '.t3', start: 'top center', end: 'bottom center',
  onUpdate: (self) => {
    const p = self.progress;
    mat.opacity = 0.7*(1-p) + p*0.05;
    particles.scale.setScalar(1 + p*0.5);
  }
});
ScrollTrigger.create({
  trigger: '.t4', start: 'top center', end: 'bottom center',
  onUpdate: (self) => {
    const p = self.progress;
    mat.opacity = 0.05 + p*0.5;
    mat.color.setRGB(0.784, 1, 0);
    particles.scale.setScalar(1.5 - p*0.5);
  }
});

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
