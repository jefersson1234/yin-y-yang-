const particleCanvas = document.getElementById("particleCanvas");
const particleCtx = particleCanvas.getContext("2d");
const openNoteButton = document.getElementById("openNote");
const note = document.getElementById("note");
const closeNoteButton = note.querySelector(".close-note");
const facts = document.getElementById("facts");
const closeFactsButton = document.getElementById("closeFacts");

let width = 0;
let height = 0;
let dpr = 1;
let particles = [];
let symbol = { x: 0, y: 0, radius: 0 };
let factsOpen = false;
let splitStartedAt = 0;
let splitTargets = null;

const colors = {
  fire: [255, 142, 49],
  ember: [255, 207, 100],
  flame: [226, 67, 29],
  deepFire: [112, 31, 24],
  ice: [105, 199, 255],
  frost: [215, 241, 255],
  deepIce: [67, 100, 133],
  smokeFire: [131, 47, 35],
  smokeIce: [119, 130, 143],
  spark: [255, 255, 255]
};

class Particle {
  constructor(x, y, color, size, kind = "yin") {
    this.targetX = x;
    this.targetY = y;
    this.x = x + (Math.random() - 0.5) * 55;
    this.y = y + (Math.random() - 0.5) * 55;
    this.vx = 0;
    this.vy = 0;
    this.color = color;
    this.size = size;
    this.kind = kind;
    this.phase = Math.random() * Math.PI * 2;
    this.opacity = kind === "smoke" ? 0.2 + Math.random() * 0.24 : 0.92;
  }

  update(time) {
    let tx = this.targetX;
    let ty = this.targetY;
    const spring = 0.024;

    const drift = this.kind === "fire" ? 1 : this.kind === "ice" ? -1 : 0;
    tx += Math.sin(time * 0.0014 + this.phase) * (2 + drift);
    ty += Math.cos(time * 0.0018 + this.phase) * (2 + drift);
    if (this.kind === "smoke") {
      tx += Math.sin(time * 0.00035 + this.phase) * 10;
      ty += Math.cos(time * 0.00045 + this.phase) * 13;
    }

    if (factsOpen && this.kind !== "smoke" && splitTargets) {
      const yinHalf = this.targetY < symbol.y;
      const target = yinHalf ? splitTargets.yin : splitTargets.yang;
      const split = easeInOut((time - splitStartedAt) / 850);
      const targetX = target.x + (this.targetX - symbol.x) * target.scale;
      const targetY = target.y + (this.targetY - symbol.y) * target.scale;
      tx += (targetX - tx) * split;
      ty += (targetY - ty) * split;
    }

    this.vx = (this.vx + (tx - this.x) * spring) * 0.88;
    this.vy = (this.vy + (ty - this.y) * spring - drift * 0.012) * 0.88;
    this.x += this.vx;
    this.y += this.vy;
  }

  draw(ctx, time) {
    const pulse = 0.65 + 0.35 * Math.sin(time * 0.004 + this.phase);
    const radius = this.size * pulse;
    ctx.fillStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${this.opacity})`;
    ctx.shadowColor = `rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]})`;
    ctx.shadowBlur = this.kind === "spark" ? 6 : 0;
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function randomColor(palette) {
  const color = palette[Math.floor(Math.random() * palette.length)];
  const shade = 0.76 + Math.random() * 0.24;
  return color.map((value) => Math.round(value * shade));
}

function addParticle(x, y, palette, size, kind) {
  particles.push(new Particle(x, y, randomColor(palette), size, kind));
}

function buildParticles() {
  particles = [];
  const cx = width * 0.5;
  const radius = Math.min(width < 650 ? width * 0.4 : width * 0.235, height * 0.3, 200);
  const cy = height * 0.57;
  symbol = { x: cx, y: cy, radius };
  const step = width < 650 ? 4.5 : 5;

  for (let y = -radius; y <= radius; y += step) {
    for (let x = -radius; x <= radius; x += step) {
      const distance = Math.hypot(x, y);
      if (distance > radius) continue;

      const boundary = y <= 0
        ? Math.sqrt(Math.max(0, radius * radius / 4 - (y + radius / 2) ** 2))
        : -Math.sqrt(Math.max(0, radius * radius / 4 - (y - radius / 2) ** 2));
      const isFire = x < boundary;
      const isNearEdge = radius - distance < 8;
      const isNearCurve = Math.abs(x - boundary) < 7;
      const flameFlow = Math.sin((x + y * 0.32) * 0.045 + Math.sin(y * 0.024) * 4);
      const iceFlow = Math.cos((y - x * 0.24) * 0.04 + Math.sin(x * 0.025) * 3);
      const palette = isNearEdge || isNearCurve
        ? [colors.spark, colors.frost, colors.ember]
        : isFire
          ? flameFlow > 0.18 ? [colors.ember, colors.fire] : [colors.flame, colors.fire, colors.deepFire]
          : iceFlow > 0.25 ? [colors.frost, colors.ice] : [colors.ice, colors.deepIce, colors.smokeIce];

      addParticle(cx + x, cy + y, palette, Math.random() * 1.35 + 0.65, isFire ? "fire" : "ice");
    }
  }

  addDot(cx - radius * 0.25, cy - radius * 0.5, radius * 0.115, [colors.ember, colors.fire]);
  addDot(cx + radius * 0.25, cy + radius * 0.5, radius * 0.115, [colors.frost, colors.ice]);
  addAtmosphere(cx, cy, radius);
}

function addDot(cx, cy, radius, palette) {
  const step = 3.5;
  for (let y = -radius; y <= radius; y += step) {
    for (let x = -radius; x <= radius; x += step) {
      if (x * x + y * y <= radius * radius) {
        addParticle(cx + x, cy + y, palette, Math.random() * 1.7 + 0.8, "spark");
      }
    }
  }
}

function addAtmosphere(cx, cy, radius) {
  const count = Math.floor(Math.min(1800, width * height / 450));
  for (let i = 0; i < count; i++) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const plumeDistance = radius * (1.02 + Math.abs(randomGaussian()) * 0.42);
    const x = cx + side * plumeDistance;
    const y = cy + randomGaussian() * radius * 0.78;
    const palette = side < 0
      ? [colors.smokeFire, colors.flame, colors.deepFire]
      : [colors.smokeIce, colors.deepIce, colors.frost];
    addParticle(x, y, palette, Math.random() * 2.8 + 0.7, "smoke");
  }
}

function randomGaussian() {
  const first = Math.max(Number.EPSILON, Math.random());
  const second = Math.random();
  return Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second);
}

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  particleCanvas.width = width * dpr;
  particleCanvas.height = height * dpr;
  particleCanvas.style.width = `${width}px`;
  particleCanvas.style.height = `${height}px`;
  particleCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  buildParticles();
  if (factsOpen) updateSplitTargets();
}

function animate(time) {
  particleCtx.clearRect(0, 0, width, height);
  const glow = particleCtx.createRadialGradient(
    width * 0.5, height * 0.49, 0, width * 0.5, height * 0.49, Math.min(width, height) * 0.47
  );
  glow.addColorStop(0, "rgba(80, 90, 100, 0.08)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  particleCtx.fillStyle = "#030405";
  particleCtx.fillRect(0, 0, width, height);
  particleCtx.fillStyle = glow;
  particleCtx.fillRect(0, 0, width, height);

  particleCtx.save();
  particleCtx.globalCompositeOperation = "lighter";
  for (const particle of particles) {
    particle.update(time);
    particle.draw(particleCtx, time);
  }
  particleCtx.restore();
  requestAnimationFrame(animate);
}

function easeInOut(value) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

function openFacts() {
  factsOpen = true;
  document.body.classList.add("facts-open");
  facts.classList.add("is-open");
  facts.setAttribute("aria-hidden", "false");
  updateSplitTargets();
  splitStartedAt = performance.now();
  closeFactsButton.focus();
}

function updateSplitTargets() {
  const yinIcon = facts.querySelector(".yin-icon").getBoundingClientRect();
  const yangIcon = facts.querySelector(".yang-icon").getBoundingClientRect();
  splitTargets = {
    yin: {
      x: yinIcon.left + yinIcon.width / 2,
      y: yinIcon.top + yinIcon.height / 2,
      scale: (yinIcon.width * 0.44) / symbol.radius
    },
    yang: {
      x: yangIcon.left + yangIcon.width / 2,
      y: yangIcon.top + yangIcon.height / 2,
      scale: (yangIcon.width * 0.44) / symbol.radius
    }
  };
}

function closeFacts() {
  factsOpen = false;
  splitTargets = null;
  facts.classList.remove("is-open");
  facts.setAttribute("aria-hidden", "true");
  document.body.classList.remove("facts-open");
  particleCanvas.focus();
}

particleCanvas.addEventListener("pointerdown", (event) => {
  const rect = particleCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  if (factsOpen || Math.hypot(x - symbol.x, y - symbol.y) > symbol.radius * 1.15) return;

  openFacts();
});

particleCanvas.tabIndex = -1;
window.addEventListener("resize", () => {
  resize();
  if (factsOpen) updateSplitTargets();
});
openNoteButton.addEventListener("click", () => note.showModal());
closeNoteButton.addEventListener("click", () => note.close());
closeFactsButton.addEventListener("click", closeFacts);
window.addEventListener("keydown", (event) => {
  if (factsOpen && event.key === "Escape") closeFacts();
});
note.addEventListener("click", (event) => {
  if (event.target === note) note.close();
});
resize();
requestAnimationFrame(animate);
