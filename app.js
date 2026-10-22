import { TwoBodySystem, INITIAL_SEPARATION } from "./physics.js";

const canvas = document.querySelector("#simulation");
const context = canvas.getContext("2d");
const controls = {
  massA: document.querySelector("#mass-a"),
  massB: document.querySelector("#mass-b"),
  orbitalSpeed: document.querySelector("#orbital-speed"),
  timeScale: document.querySelector("#time-scale"),
  trails: document.querySelector("#trails-toggle"),
  vectors: document.querySelector("#vectors-toggle"),
};
const outputs = {
  massA: document.querySelector("#mass-a-output"),
  massB: document.querySelector("#mass-b-output"),
  orbitalSpeed: document.querySelector("#orbital-speed-output"),
  timeScale: document.querySelector("#time-scale-output"),
  separation: document.querySelector("#separation-value"),
  time: document.querySelector("#time-value"),
  energy: document.querySelector("#energy-value"),
};
const playButton = document.querySelector("#play-button");
const runState = document.querySelector("#run-state");
const emptyMessage = document.querySelector("#empty-message");
const colors = { a: "#ffae76", b: "#7c9cff" };
const trails = { a: [], b: [] };
const stars = Array.from({ length: 100 }, (_, index) => {
  const seed = index + 1;
  return {
    x: ((seed * 127.1) % 1000) / 1000,
    y: ((seed * 311.7) % 1000) / 1000,
    radius: 0.4 + ((seed * 17) % 12) / 10,
    alpha: 0.15 + ((seed * 37) % 55) / 100,
  };
});

let system;
let running = true;
let previousFrame = 0;
let accumulator = 0;
let width = 0;
let height = 0;
let pixelRatio = 1;

function createSystem() {
  system = new TwoBodySystem(
    Number(controls.massA.value),
    Number(controls.massB.value),
    Number(controls.orbitalSpeed.value),
  );
  trails.a.length = 0;
  trails.b.length = 0;
  accumulator = 0;
  updateReadouts();
  draw();
}

function updateReadouts() {
  outputs.massA.value = Number(controls.massA.value).toFixed(1);
  outputs.massB.value = Number(controls.massB.value).toFixed(1);
  outputs.orbitalSpeed.value = Number(controls.orbitalSpeed.value).toFixed(3);
  outputs.timeScale.value = `${Number(controls.timeScale.value).toFixed(2).replace(/0$/, "")}×`;
  outputs.separation.textContent = system.separation.toFixed(1);
  outputs.time.textContent = system.time.toFixed(1);
  outputs.energy.textContent = system.totalEnergy.toFixed(4);
}

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  width = bounds.width;
  height = bounds.height;
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  draw();
}

function worldToScreen(body, scale, centerX, centerY) {
  return { x: centerX + body.x * scale, y: centerY + body.y * scale };
}

function drawTrail(points, color, scale, centerX, centerY) {
  if (points.length < 2) return;
  context.beginPath();
  context.moveTo(centerX + points[0].x * scale, centerY + points[0].y * scale);
  for (let index = 1; index < points.length; index += 1) {
    context.lineTo(centerX + points[index].x * scale, centerY + points[index].y * scale);
  }
  context.strokeStyle = color;
  context.lineWidth = 1.5;
  context.stroke();
}

function drawBody(body, position, mass, color, label) {
  const radius = 6 + Math.sqrt(mass) * 2;
  const glow = context.createRadialGradient(position.x, position.y, radius * 0.3, position.x, position.y, radius * 3.3);
  glow.addColorStop(0, `${color}55`);
  glow.addColorStop(1, `${color}00`);
  context.fillStyle = glow;
  context.beginPath();
  context.arc(position.x, position.y, radius * 3.3, 0, Math.PI * 2);
  context.fill();

  const surface = context.createRadialGradient(
    position.x - radius * 0.35, position.y - radius * 0.4, radius * 0.1,
    position.x, position.y, radius,
  );
  surface.addColorStop(0, "#ffffff");
  surface.addColorStop(0.22, color);
  surface.addColorStop(1, `${color}aa`);
  context.fillStyle = surface;
  context.beginPath();
  context.arc(position.x, position.y, radius, 0, Math.PI * 2);
  context.fill();

  if (controls.vectors.checked) {
    const vectorScale = 270;
    const vx = body.vx * vectorScale;
    const vy = body.vy * vectorScale;
    const length = Math.hypot(vx, vy);
    if (length > 1) {
      const endX = position.x + vx;
      const endY = position.y + vy;
      const angle = Math.atan2(vy, vx);
      context.strokeStyle = color;
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(position.x, position.y);
      context.lineTo(endX, endY);
      context.stroke();
      context.fillStyle = color;
      context.beginPath();
      context.moveTo(endX, endY);
      context.lineTo(endX - 7 * Math.cos(angle - 0.45), endY - 7 * Math.sin(angle - 0.45));
      context.lineTo(endX - 7 * Math.cos(angle + 0.45), endY - 7 * Math.sin(angle + 0.45));
      context.closePath();
      context.fill();
    }
  }

  context.font = "600 10px Inter, sans-serif";
  context.fillStyle = `${color}dd`;
  context.textAlign = "center";
  context.fillText(label, position.x, position.y + radius + 17);
}

function draw() {
  if (!context || !width || !height || !system) return;
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#0b1020";
  context.fillRect(0, 0, width, height);

  for (const star of stars) {
    context.beginPath();
    context.arc(star.x * width, star.y * height, star.radius, 0, Math.PI * 2);
    context.fillStyle = `rgba(180, 198, 255, ${star.alpha})`;
    context.fill();
  }

  const padding = 62;
  const viewDistance = Math.max(INITIAL_SEPARATION * 1.75, system.separation * 1.3);
  const scale = Math.min((width - padding * 2) / viewDistance, (height - padding * 2) / (viewDistance * 0.86));
  const centerX = width / 2;
  const centerY = height / 2;
  const positionA = worldToScreen(system.bodyA, scale, centerX, centerY);
  const positionB = worldToScreen(system.bodyB, scale, centerX, centerY);

  if (controls.trails.checked) {
    drawTrail(trails.a, `${colors.a}88`, scale, centerX, centerY);
    drawTrail(trails.b, `${colors.b}99`, scale, centerX, centerY);
  }

  drawBody(system.bodyA, positionA, system.massA, colors.a, "BODY A");
  drawBody(system.bodyB, positionB, system.massB, colors.b, "BODY B");
}

function addTrailPoints() {
  trails.a.push({ x: system.bodyA.x, y: system.bodyA.y });
  trails.b.push({ x: system.bodyB.x, y: system.bodyB.y });
  if (trails.a.length > 1800) trails.a.shift();
  if (trails.b.length > 1800) trails.b.shift();
}

function animate(timestamp) {
  if (!previousFrame) previousFrame = timestamp;
  const elapsed = Math.min((timestamp - previousFrame) / 1000, 0.05);
  previousFrame = timestamp;

  if (running) {
    accumulator += elapsed * 700 * Number(controls.timeScale.value);
    const fixedStep = 0.5;
    while (accumulator >= fixedStep) {
      system.step(fixedStep);
      accumulator -= fixedStep;
    }
    addTrailPoints();
    updateReadouts();
  }

  draw();
  window.requestAnimationFrame(animate);
}

function setRunning(nextRunning) {
  running = nextRunning;
  playButton.innerHTML = running
    ? '<span aria-hidden="true">Ⅱ</span> Pause'
    : '<span aria-hidden="true">▶</span> Resume';
  runState.textContent = running ? "LIVE SIMULATION" : "SIMULATION PAUSED";
  emptyMessage.hidden = running;
}

for (const control of [controls.massA, controls.massB, controls.orbitalSpeed]) {
  control.addEventListener("input", createSystem);
}
controls.timeScale.addEventListener("input", updateReadouts);
controls.trails.addEventListener("change", draw);
controls.vectors.addEventListener("change", draw);
playButton.addEventListener("click", () => setRunning(!running));
document.querySelector("#reset-button").addEventListener("click", () => {
  createSystem();
  setRunning(true);
});
window.addEventListener("resize", resizeCanvas);

createSystem();
resizeCanvas();
window.requestAnimationFrame(animate);
