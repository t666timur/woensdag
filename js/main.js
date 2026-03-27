// ============================================
// WOENSDAG — Main JS
// Three.js + GSAP ScrollTrigger
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

// Particles
const count = 1200;
const positions = new Float32Array(count * 3);
for (let i = 0; i < count * 3; i++) {
  positions[i] = (Math.random() - 0.5) * 20;
}

const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const mat = new THREE.PointsMaterial({
  size: 0.015,
  color: 0xc8ff00,
  transparent: true,
  opacity: 0.6,
  sizeAttenuation: true,
});

const particles = new THREE.Points(geo, mat);
scene.add(particles);

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Mouse parallax
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 0.3;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 0.3;
});

// Animate Three.js
let currentColor = new THREE.Color(0xc8ff00);
const targetColor = new THREE.Color(0xc8ff00);

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
// SCROLL PROGRESS
// ============================================
const progressBar = document.getElementById('scroll-progress');
window.addEventListener('scroll', () => {
  const total = document.documentElement.scrollHeight - window.innerHeight;
  const progress = (window.scrollY / total) * 100;
  progressBar.style.width = progress + '%';
});

// ============================================
// NAVBAR
// ============================================
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// ============================================
// HERO ENTRANCE
// ============================================
const heroTl = gsap.timeline({ delay: 0.3 });
heroTl
  .to('.hero-tag', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' })
  .to('.hero-title .word', {
    opacity: 1, y: 0, duration: 0.9,
    stagger: 0.15, ease: 'power3.out'
  }, '-=0.4')
  .to('.hero-sub', { opacity: 1, duration: 0.8, ease: 'power2.out' }, '-=0.4')
  .to('.btn-primary', { opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.3');

// ============================================
// SECTION TRANSITIONS — ScrollTrigger
// ============================================

// Transition 1→2: particles colour shift + section scale
ScrollTrigger.create({
  trigger: '.t1',
  start: 'top center',
  end: 'bottom center',
  onUpdate: (self) => {
    const p = self.progress;
    mat.color.setRGB(
      0.784 * (1 - p) + 0.39 * p,
      1 * (1 - p) + 0.51 * p,
      0 * (1 - p) + 1 * p
    );
    mat.opacity = 0.6 - p * 0.2;
    particles.rotation.z = p * 0.5;
  }
});

// Corporate cards entrance
gsap.utils.toArray('.glass-card').forEach((card, i) => {
  gsap.to(card, {
    opacity: 1,
    x: 0,
    duration: 0.7,
    delay: i * 0.15,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: card,
      start: 'top 80%',
    }
  });
});

// Transition 2→3: particles back to neon
ScrollTrigger.create({
  trigger: '.t2',
  start: 'top center',
  end: 'bottom center',
  onUpdate: (self) => {
    const p = self.progress;
    mat.color.setRGB(
      0.39 * (1 - p) + 0 * p,
      0.51 * (1 - p) + 0.96 * p,
      1 * (1 - p) + 1 * p
    );
    mat.opacity = 0.4 + p * 0.3;
    particles.rotation.z = 0.5 - p * 0.5;
  }
});

// Cyber section: glitch intensify on scroll
ScrollTrigger.create({
  trigger: '.s-cyber',
  start: 'top center',
  end: 'bottom center',
  onUpdate: (self) => {
    const p = self.progress;
    particles.rotation.y += p * 0.002;
  }
});

// Counter animation
const counters = document.querySelectorAll('.stat-num');
counters.forEach(counter => {
  const target = parseInt(counter.getAttribute('data-target'));
  ScrollTrigger.create({
    trigger: counter,
    start: 'top 80%',
    once: true,
    onEnter: () => {
      gsap.to({ val: 0 }, {
        val: target,
        duration: 2,
        ease: 'power2.out',
        onUpdate: function() {
          counter.textContent = Math.round(this.targets()[0].val);
        }
      });
    }
  });
});

// Transition 3→4: neon to light
ScrollTrigger.create({
  trigger: '.t3',
  start: 'top center',
  end: 'bottom center',
  onUpdate: (self) => {
    const p = self.progress;
    mat.color.setRGB(
      0 + p * 0.784,
      0.96 * (1 - p) + p * 0.784,
      1 * (1 - p) + p * 0.784
    );
    mat.opacity = 0.7 * (1 - p) + p * 0.1;
    particles.scale.setScalar(1 + p * 0.5);
  }
});

// Luxury text entrance
gsap.from('.luxury-eyebrow', {
  opacity: 0, y: 20, duration: 0.8,
  scrollTrigger: { trigger: '.luxury-eyebrow', start: 'top 80%' }
});

gsap.from('.luxury-title', {
  opacity: 0, y: 40, duration: 1, ease: 'power3.out',
  scrollTrigger: { trigger: '.luxury-title', start: 'top 80%' }
});

gsap.from('.luxury-frame', {
  opacity: 0, scale: 0.8, rotation: 5, duration: 1.2, ease: 'power3.out',
  scrollTrigger: { trigger: '.luxury-frame', start: 'top 80%' }
});

// Luxury frame 3D rotation on scroll
ScrollTrigger.create({
  trigger: '.s-luxury',
  start: 'top bottom',
  end: 'bottom top',
  scrub: true,
  onUpdate: (self) => {
    const p = self.progress;
    gsap.set('.luxury-frame', {
      rotateY: (p - 0.5) * 20,
      rotateX: (p - 0.5) * -10,
    });
  }
});

// Transition 4→5: light back to dark
ScrollTrigger.create({
  trigger: '.t4',
  start: 'top center',
  end: 'bottom center',
  onUpdate: (self) => {
    const p = self.progress;
    mat.opacity = 0.1 + p * 0.5;
    mat.color.setRGB(
      0.784 * (1 - p) + 0.784 * p,
      0.784 * (1 - p) + 1 * p,
      0.784 * (1 - p) + 0 * p
    );
    particles.scale.setScalar(1.5 - p * 0.5);
  }
});

// Pricing cards entrance
gsap.utils.toArray('.price-card').forEach((card, i) => {
  gsap.to(card, {
    opacity: 1,
    y: 0,
    duration: 0.7,
    delay: i * 0.15,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.pricing',
      start: 'top 80%',
    }
  });
});

// ============================================
// 3D TILT ON CARDS
// ============================================
document.querySelectorAll('.glass-card, .price-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(card, {
      rotateX: -y * 10,
      rotateY: x * 10,
      transformPerspective: 800,
      duration: 0.3,
      ease: 'power2.out',
    });
  });
  card.addEventListener('mouseleave', () => {
    gsap.to(card, {
      rotateX: 0, rotateY: 0,
      duration: 0.5, ease: 'power3.out'
    });
  });
});

// ============================================
// PARALLAX on scroll
// ============================================
gsap.utils.toArray('.section').forEach(section => {
  const label = section.querySelector('.section-label');
  if (label) {
    gsap.to(label, {
      y: -40,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      }
    });
  }
});
