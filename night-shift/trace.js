"use strict";

const checkpoints = [
  { at: 110, label: "PERFORMANCE", title: "Responsive grids at scale", result: "5,000+ rows in responsive grids", detail: "Paging and compression keep ASP.NET Core responses small. Angular renders only the rows the user can see.", anchor: "performance", color: "#ffa287" },
  { at: 280, label: "RELIABILITY", title: "Uploads that recover", result: "Over 80% less time spent uploading", detail: "Resumable chunks and retries let the Python ingestion pipeline recover after an interruption.", anchor: "reliability", color: "#91ecf6" },
  { at: 470, label: "OWNERSHIP", title: "From runtime to database", result: "About 30% lower database CPU at peak", detail: "A .NET 8 upgrade, batched database calls, and tuned stored procedures cut work across the stack.", anchor: "ownership", color: "#ffcb87" },
  { at: 650, label: "TRACEABILITY", title: "CaseBrief AI", result: "Review findings alongside their sources", detail: "Follow a finding back to the document it came from and see what still needs human review.", anchor: "evidence", color: "#c5a9ff" }
];
const routeEnd = 780;
const trackWidth = 5.4;
const cameraHeight = 5.4;
const carDistance = 12;
const sparks = [
  { at: 68, lane: -2.7 }, { at: 154, lane: 2.6 }, { at: 233, lane: -2.8 },
  { at: 360, lane: 2.7 }, { at: 416, lane: -2.7 }, { at: 555, lane: 2.7 },
  { at: 613, lane: -2.7 }, { at: 712, lane: 2.7 }
];

const $ = id => document.getElementById(id);
const drive = $("drive");
const canvas = $("scene");
const ctx = canvas.getContext("2d");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const input = new Set();
const pointers = new Map();
const collected = new Set();
const routeMarkers = Array.from(document.querySelectorAll(".route-line i"));
const speedText = document.createTextNode("00 ");
$("speed").firstChild.replaceWith(speedText);
let width = 0;
let height = 0;
let depth = 0;
let horizon = 0;
let vanishingX = 0;
let cameraX = 0;
let position = 0;
let speed = 0;
let lane = 0;
let steer = 0;
let blend = 0;
let crossed = 0;
let clock = 0;
let lastFrame;
let state = "intro";
let previousSpeed = -1;
let cruise = false;
let routeVisible = true;
let roadRenderer;
let paused = false;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const path = distance => 10 * Math.sin(distance / 69) + 4 * Math.sin(distance / 32);
const seed = value => {
  const random = Math.sin(value * 127.1 + 78.23) * 43758.5453;
  return random - Math.floor(random);
};

function project(distance, offset = 0, altitude = 0) {
  const scale = depth / (distance - position + 7);
  return {
    x: vanishingX + (path(distance) + offset - cameraX) * scale,
    y: horizon + (cameraHeight - altitude) * scale,
    scale
  };
}

function shape(color, ...points) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
}

function strip(near, far, low, high, color) {
  shape(color,
    [near.x + low * near.scale, near.y],
    [near.x + high * near.scale, near.y],
    [far.x + high * far.scale, far.y],
    [far.x + low * far.scale, far.y]);
}

function drawRoad() {
  const segment = 4;
  const first = Math.floor(position / segment);
  for (let index = first + 70; index >= first; index--) {
    const a = Math.max(position, index * segment);
    const b = (index + 1) * segment;
    const near = project(a);
    const far = project(b);
    if (far.y > height) break;
    const night = index % 2 === 0;
    const faint = index > first + 44;
    ctx.fillStyle = night ? "#10192e" : "#131e35";
    ctx.fillRect(0, far.y, width, near.y - far.y + 1);
    strip(near, far, -trackWidth - .48, trackWidth + .48, night ? "#2f3851" : "#252f47");
    strip(near, far, -trackWidth, trackWidth, night ? "#1a253b" : "#1e2941");
    for (const side of [-1, 1]) {
      const edge = side * trackWidth;
      strip(near, far, edge - .056, edge + .056, faint ? "#576a8f" : night ? "#e6bcab" : "#926d8e");
      strip(near, far, edge + side * .23 - .09, edge + side * .23 + .09, night ? "#54688c" : "#945f87");
    }
    if (index % 4 < 2) strip(near, far, -.045, .045, faint ? "#68758b" : "#dcc3c5");
    // Narrow, irregular highlights suggest the reflections of city lights on wet tarmac.
    if (!faint && index % 3 !== 1) {
      const glint = seed(index * 5.1);
      const line = (index % 2 === 0 ? -1 : 1) * (2.3 + glint * 2.3);
      strip(near, far, line, line + .06 + glint * .11, index % 2 === 0 ? "#79d7fa23" : "#ffa28725");
    }
  }

  const fog = ctx.createLinearGradient(0, horizon - 5, 0, horizon + height * .16);
  fog.addColorStop(0, "#19294400");
  fog.addColorStop(.16, "#364c70ad");
  fog.addColorStop(1, "#15264400");
  ctx.fillStyle = fog;
  ctx.fillRect(0, horizon - 5, width, height * .17);
}

function drawTower(distance, side, index) {
  const offset = side * (12 + seed(index * 2 + side) * 20);
  const wide = 4 + seed(index + side * 13) * 8;
  const tall = 10 + seed(index * 4 + side) * 22;
  const length = 8 + seed(index * 7 + side) * 13;
  const a = project(distance, offset);
  const b = project(distance, offset + wide * side);
  const c = project(distance + length, offset);
  const top = project(distance, offset, tall);
  const backTop = project(distance + length, offset, tall);
  if (a.scale < 1.9 || top.y > height || Math.min(a.x, b.x, c.x) > width || Math.max(a.x, b.x, c.x) < 0) return;
  shape("#17253d", [a.x, a.y], [b.x, b.y], [b.x, top.y], [a.x, top.y]);
  shape(side > 0 ? "#293b57" : "#202e47", [a.x, a.y], [c.x, c.y], [c.x, backTop.y], [a.x, top.y]);
  shape("#425574", [a.x, top.y], [b.x, top.y], [b.x - (a.x - c.x) * .18, top.y - a.scale * .36], [a.x, top.y - a.scale * .36]);
  const windows = Math.floor(tall / 2.35);
  for (let row = 1; row < windows; row++) {
    for (let col = 1; col <= 3; col++) {
      const lit = seed(row * 29 + col * 17 + index * 67 + side) > .37;
      ctx.fillStyle = lit ? (col === 2 ? "#e187a5" : "#68b3d0") : "#394764";
      if (lit && col === 2 && index % 3 === 0) ctx.fillStyle = "#ffae79";
      const x = a.x + (b.x - a.x) * col / 4;
      const y = a.y - row * 2.35 * a.scale;
      ctx.fillRect(x - a.scale * .24, y, a.scale * .54, a.scale * .22);
    }
  }
}

function drawLamp(distance, side) {
  const offset = side * (trackWidth + 1.2);
  const foot = project(distance, offset);
  const top = project(distance, offset, 4.8);
  const head = project(distance, offset - side * .72, 4.8);
  if (foot.scale < 2.5) return;
  ctx.strokeStyle = "#704f70";
  ctx.lineWidth = Math.max(.6, foot.scale * .075);
  ctx.beginPath();
  ctx.moveTo(foot.x, foot.y);
  ctx.lineTo(top.x, top.y);
  ctx.lineTo(head.x, head.y);
  ctx.stroke();
  ctx.fillStyle = side > 0 ? "#ffbd92" : "#84ecf5";
  ctx.fillRect(head.x - foot.scale * .15, head.y - foot.scale * .09, foot.scale * .3, foot.scale * .13);
  const light = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, foot.scale * .91);
  light.addColorStop(0, side > 0 ? "#ff9c7780" : "#62dcf780");
  light.addColorStop(1, "#88598600");
  ctx.fillStyle = light;
  ctx.fillRect(head.x - foot.scale, head.y - foot.scale, foot.scale * 2, foot.scale * 2);

  const reflection = project(distance, offset - side * 1.55);
  const reach = Math.min(42, reflection.scale * 1.8);
  const sheen = ctx.createLinearGradient(0, reflection.y - 2, 0, reflection.y + reach);
  sheen.addColorStop(0, side > 0 ? "#f79e747a" : "#69dff369");
  sheen.addColorStop(1, "#78c9f300");
  ctx.fillStyle = sheen;
  ctx.beginPath();
  ctx.moveTo(reflection.x - foot.scale * .12, reflection.y - 2);
  ctx.lineTo(reflection.x + foot.scale * .12, reflection.y - 2);
  ctx.lineTo(reflection.x + foot.scale * .36, reflection.y + reach);
  ctx.lineTo(reflection.x - foot.scale * .36, reflection.y + reach);
  ctx.fill();
}

function drawGate(distance, label, color) {
  const left = project(distance, -trackWidth - .25);
  const right = project(distance, trackWidth + .25);
  const heightAtGate = left.scale * 4.35;
  const top = left.y - heightAtGate;
  const bar = Math.max(2, left.scale * .19);
  ctx.fillStyle = "#221732";
  ctx.fillRect(left.x - bar, top, bar * 2.4, heightAtGate);
  ctx.fillRect(right.x - bar, top, bar * 2.4, heightAtGate);
  ctx.fillStyle = color;
  ctx.fillRect(left.x, top, bar, heightAtGate);
  ctx.fillRect(right.x, top, bar, heightAtGate);
  ctx.fillRect(left.x, top, right.x - left.x, bar);
  ctx.fillStyle = "#0d1933";
  ctx.fillRect(left.x + bar, top + bar, right.x - left.x - 2 * bar, left.scale * 1.34);
  const fontSize = clamp(left.scale * .83, 6, 44);
  ctx.font = "750 " + fontSize + "px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(label, (left.x + right.x) / 2, top + bar + left.scale * .66, right.x - left.x - 4 * bar);
}

function drawSpark(distance, offset) {
  const p = project(distance, offset, .8 + Math.sin(clock * 3 + distance) * .12);
  const size = p.scale * .21;
  ctx.fillStyle = "#6bf8ffd0";
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - size * 1.6);
  ctx.lineTo(p.x + size, p.y);
  ctx.lineTo(p.x, p.y + size * 1.6);
  ctx.lineTo(p.x - size, p.y);
  ctx.closePath();
  ctx.fill();
}

function drawScenery() {
  const objects = [];
  for (let index = Math.floor(position / 19); index <= Math.ceil((position + 230) / 19); index++) {
    const distance = index * 19 + 4;
    if (distance - position < 3) continue;
    objects.push({ distance, draw() {
      if (index % 2 === 0) drawTower(distance, -1, index);
      if (index % 3 !== 1) drawTower(distance, 1, index);
      drawLamp(distance, index % 2 ? -1 : 1);
    } });
  }
  const gates = [...checkpoints, { at: routeEnd, label: "FINISH", color: "#f7cfb7" }];
  for (const gate of gates) {
    if (gate.at - position >= 3 && gate.at - position < 235) {
      objects.push({ distance: gate.at, draw() { drawGate(gate.at, gate.label, gate.color); } });
    }
  }
  sparks.forEach((spark, index) => {
    if (spark.at - position >= carDistance && spark.at - position < 160 && !collected.has(index)) {
      objects.push({ distance: spark.at, draw() { drawSpark(spark.at, spark.lane); } });
    }
  });
  objects.sort((a, b) => b.distance - a.distance);
  for (const object of objects) object.draw();
}

function carPanel(faces, color, vertices) {
  faces.push({ color, vertices });
}

function carBody(faces, sections, colors) {
  for (let i = 0; i < sections.length - 1; i++) {
    const [z, w, base, top] = sections[i];
    const [nextZ, nextW, nextBase, nextTop] = sections[i + 1];
    carPanel(faces, colors[0], [[-w, top, z], [w, top, z], [nextW, nextTop, nextZ], [-nextW, nextTop, nextZ]]);
    carPanel(faces, colors[1], [[-w, base, z], [-w, top, z], [-nextW, nextTop, nextZ], [-nextW, nextBase, nextZ]]);
    carPanel(faces, colors[2], [[w, base, z], [w, top, z], [nextW, nextTop, nextZ], [nextW, nextBase, nextZ]]);
  }
  const [z, w, base, top] = sections[0];
  carPanel(faces, colors[3], [[-w, base, z], [w, base, z], [w, top, z], [-w, top, z]]);
}

const fallbackCarPanels = (() => {
  const panels = [];
  carBody(panels, [[-1.97, 1.04, .34, .77], [-1.25, 1.27, .32, .94], [1.21, 1.17, .32, .94], [1.95, 1.05, .39, .71]],
    ["#ef8b84", "#a34c66", "#d76871", "#814354"]);
  carBody(panels, [[-.96, .86, .91, 1.01], [-.55, .81, .92, 1.45], [.58, .78, .93, 1.42], [1.07, .85, .93, 1.01]],
    ["#8da6bf", "#344155", "#527d9a", "#273f57"]);
  carPanel(panels, "#f09e91", [[-.8, 1.459, -.55], [.8, 1.459, -.55], [.77, 1.429, .58], [-.77, 1.429, .58]]);
  carPanel(panels, "#203047", [[-1.02, .36, -1.99], [1.02, .36, -1.99], [1.08, .53, -1.99], [-1.08, .53, -1.99]]);
  for (const side of [-1, 1]) {
    const x = side * .69;
    carPanel(panels, "#ff6159", [[x - .31, .59, -1.99], [x + .31, .59, -1.99], [x + .31, .73, -1.99], [x - .31, .73, -1.99]]);
    carPanel(panels, "#ffd4ba", [[x - .22, .68, -2], [x + .22, .68, -2], [x + .22, .71, -2], [x - .22, .71, -2]]);
    for (const z of [-1.12, 1.12]) {
      const tire = Array.from({ length: 12 }, (_, index) => {
        const angle = index * Math.PI / 6;
        return [side * 1.25, .34 + Math.cos(angle) * .31, z + Math.sin(angle) * .31];
      });
      carPanel(panels, "#101725", tire);
    }
  }
  carPanel(panels, "#ffe7bd", [[-.22, .55, -2.01], [.22, .55, -2.01], [.22, .65, -2.01], [-.22, .65, -2.01]]);
  return panels;
})();

function drawCar() {
  const at = position + carDistance;
  const center = project(at, lane);
  const angle = Math.atan2(path(at + 1) - path(at - 1), 2) + steer * .28;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const floorX = path(at) + lane;
  function point(x, y, z) {
    const distance = at + z * cosine - x * sine;
    const worldX = floorX + x * cosine + z * sine;
    const p = project(distance, worldX - path(distance), y + x * steer * .045);
    return [p.x, p.y, distance];
  }
  ctx.fillStyle = "#0b122a9e";
  ctx.beginPath();
  ctx.ellipse(center.x, center.y + 3, center.scale * 1.48, center.scale * .29, 0, 0, Math.PI * 2);
  ctx.fill();

  const panels = fallbackCarPanels.map(({color, vertices}) => {
    const points = vertices.map(vertex => point(...vertex));
    const depth = points.reduce((total, vertex) => total + vertex[2], 0) / points.length;
    return {color, points, depth};
  });
  panels.sort((a, b) => b.depth - a.depth);
  for (const {color, points} of panels) shape(color, ...points);

  for (const side of [-1, 1]) {
    const [x, y] = point(side * .69, .63, -2.02);
    const radius = Math.max(3, center.scale * .48);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, "#ff605880");
    gradient.addColorStop(1, "#ff605800");
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    if (input.has("boost") && speed > 32) {
      const glow = point(side * .53, .4, -2.15);
      const tail = point(side * .53, .34, -2.95 - Math.sin(clock * 24) * .21);
      shape("#8ef5ff", [glow[0] - 3, glow[1]], [glow[0] + 3, glow[1]], tail);
    }
  }
}

function resize() {
  const viewport = drive.getBoundingClientRect();
  width = viewport.width;
  height = viewport.height;
  const density = Math.min(devicePixelRatio || 1, 1.5);
  canvas.width = Math.round(width * density);
  canvas.height = Math.round(height * density);
  ctx.setTransform(density, 0, 0, density, 0, 0);
  horizon = height * .49;
  depth = Math.min(height * 1.12, width * 1.65);
  roadRenderer?.resize(width, height);
}

function draw() {
  if (roadRenderer) {
    roadRenderer.draw({
      position, lane, steer, blend, cameraX, clock, collected,
      boosting: input.has("boost") && speed > 32
    });
    return;
  }
  ctx.clearRect(0, 0, width, height);
  drawRoad();
  drawScenery();
  drawCar();
}

function showArrival(checkpoint) {
  $("arrival").style.setProperty("border-left-color", checkpoint.color);
  $("arrival-kicker").textContent = checkpoint.label;
  $("arrival-title").textContent = checkpoint.title;
  $("arrival-result").textContent = checkpoint.result ?? "";
  $("arrival-result").hidden = !checkpoint.result;
  $("arrival-detail").textContent = checkpoint.detail;
  $("arrival-link").href = "#" + checkpoint.anchor;
  $("arrival-link").textContent = checkpoint.link ?? "See the project";
  $("pause-drive").hidden = state === "finished";
  $("arrival").hidden = false;
}

function updateHud() {
  const progress = Math.min((position + carDistance) / routeEnd * 100, 100);
  $("route-fill").style.width = progress + "%";
  const displaySpeed = Math.round(speed * 2.5);
  if (displaySpeed !== previousSpeed) {
    speedText.nodeValue = String(displaySpeed).padStart(2, "0") + " ";
    previousSpeed = displaySpeed;
  }
}

function setState(next) {
  state = next;
  drive.dataset.state = next;
  $("cruise").disabled = next === "finished";
}

function update(elapsed) {
  const targetBlend = state === "intro" ? 0 : 1;
  blend += (targetBlend - blend) * (reducedMotion.matches ? 1 : Math.min(1, elapsed * 3.5));
  vanishingX = width * (.51 + (width < 650 ? .02 : .15) * (1 - blend));
  const targetCameraX = path(position + 12) + lane * .6;
  cameraX += (targetCameraX - cameraX) * Math.min(1, elapsed * 6);

  if (state !== "active" || paused) return;
  const before = position + carDistance;
  const direction = Number(input.has("right")) - Number(input.has("left"));
  const braking = input.has("brake");
  if (braking && cruise) setCruise(false);
  const going = input.has("go") || cruise;
  const boosting = going && input.has("boost");
  steer += (direction - steer) * Math.min(1, elapsed * 8);
  const shoulder = Math.abs(lane) > trackWidth - 1.0;
  const speedLimit = shoulder ? 19 : boosting ? 52 : cruise && !input.has("go") ? 29 : 34;
  const acceleration = braking ? -38 : going ? (boosting ? 24 : 14) : -4.8;
  speed = clamp(speed + elapsed * acceleration, 0, Math.max(speedLimit, speed - elapsed * 20));
  lane = clamp(lane + steer * elapsed * speed * .27, -trackWidth + .3, trackWidth - .3);
  position = Math.min(routeEnd - carDistance, position + speed * elapsed);
  const after = position + carDistance;

  sparks.forEach((spark, index) => {
    if (before < spark.at && after >= spark.at && Math.abs(lane - spark.lane) < 1.25) {
      collected.add(index);
      $("spark-count").textContent = collected.size + "/" + sparks.length + " sparks";
    }
  });

  while (crossed < checkpoints.length && after >= checkpoints[crossed].at) {
    showArrival(checkpoints[crossed]);
    routeMarkers[crossed].classList.add("passed");
    crossed++;
    $("route-text").textContent = crossed + " / " + checkpoints.length + " checkpoints";
    $("hud-next").textContent = crossed < checkpoints.length ? "NEXT / " + checkpoints[crossed].label : "NEXT / FINISH";
  }

  if (after >= routeEnd) {
    speed = 0;
    setState("finished");
    $("hud-next").textContent = "ROUTE COMPLETE";
    setCruise(false);
    clearInput();
    showArrival({
      label: "ROUTE COMPLETE",
      title: "End of the night shift.",
      result: "All four checkpoints visited",
      detail: "You picked up " + collected.size + " of " + sparks.length + " sparks. Browse the full projects or take another drive.",
      anchor: "projects",
      link: "Explore the projects",
      color: "#79e2ec"
    });
  }

  updateHud();
}

function frame(now) {
  const elapsed = lastFrame === undefined ? 0 : Math.min((now - lastFrame) / 1000, .2);
  clock = reducedMotion.matches ? 0 : now / 1000;
  lastFrame = now;
  if (routeVisible) {
    update(elapsed);
    draw();
  }
  requestAnimationFrame(frame);
}

function clearInput() {
  input.clear();
  pointers.clear();
  document.querySelectorAll(".touch button").forEach(button => { delete button.dataset.driving; });
}

function setCruise(enabled) {
  cruise = enabled;
  $("cruise").setAttribute("aria-pressed", String(enabled));
}

function setPaused(value) {
  paused = value;
  $("pause-drive").textContent = value ? "Resume drive" : "Pause to read";
  $("cruise").disabled = value || state === "finished";
  $("speed").classList.toggle("speed-paused", value);
  releaseKeys();
}

function start() {
  setPaused(false);
  setCruise(true);
  position = 0;
  speed = 0;
  lane = 0;
  steer = 0;
  crossed = 0;
  collected.clear();
  routeMarkers.forEach(marker => marker.classList.remove("passed"));
  $("arrival").hidden = true;
  $("route-text").textContent = "0 / " + checkpoints.length + " checkpoints";
  $("spark-count").textContent = "0/" + sparks.length + " sparks";
  $("hud-next").textContent = "NEXT / " + checkpoints[0].label;
  setState("active");
  updateHud();
  drive.focus({ preventScroll: true });
  window.scrollTo({ top: window.scrollY + drive.getBoundingClientRect().top, behavior: "instant" });
}

const keys = {
  KeyW: "go", ArrowUp: "go", KeyS: "brake", ArrowDown: "brake",
  KeyA: "left", ArrowLeft: "left", KeyD: "right", ArrowRight: "right",
  ShiftLeft: "boost", ShiftRight: "boost", Space: "brake"
};
const heldKeys = new Set();

function resolveInput() {
  input.clear();
  for (const key of heldKeys) input.add(keys[key]);
  for (const { control } of pointers.values()) input.add(control);
}
function releaseKeys() {
  heldKeys.clear();
  clearInput();
}

function routeInView() {
  const bounds = drive.getBoundingClientRect();
  return bounds.bottom > window.innerHeight * .54 && bounds.top < window.innerHeight * .45;
}

async function loadRoadRenderer() {
  const surface = $("scene-3d");
  const context = surface.getContext("webgl2", { alpha: true, antialias: true });
  if (!context) return;
  surface.addEventListener("webglcontextlost", () => {
    roadRenderer = undefined;
    delete drive.dataset.renderer;
  });
  try {
    const { createRoadRenderer } = await import("./scene-3d.js?v=1");
    if (context.isContextLost()) return;
    const renderer = createRoadRenderer({
      canvas: surface, context, path, seed, trackWidth, checkpoints, routeEnd, carDistance, sparks
    });
    renderer.resize(width, height);
    roadRenderer = renderer;
    drive.dataset.renderer = "3d";
  } catch {
    // The existing Canvas scene stays available if the 3D renderer cannot load.
  }
}

if (ctx) {
  resize();
  loadRoadRenderer().catch(() => {});
  new ResizeObserver(resize).observe(drive);
  new IntersectionObserver(([entry]) => {
    routeVisible = entry.isIntersecting;
    if (!routeVisible) releaseKeys();
  }).observe(drive);
  $("start").addEventListener("click", start);
  $("pause-drive").addEventListener("click", () => setPaused(!paused));
  $("cruise").addEventListener("click", () => {
    if (state === "active") setCruise(!cruise);
  });
  $("restart").addEventListener("click", () => {
    releaseKeys();
    start();
  });
  window.addEventListener("keydown", event => {
    if (!routeInView() || event.ctrlKey || event.altKey || event.metaKey || $("sample").open) return;
    if (state === "intro" && event.code === "Enter" && (event.target === document.body || event.target === drive)) {
      event.preventDefault();
      start();
      return;
    }
    if (state !== "intro" && event.code === "KeyR") {
      event.preventDefault();
      releaseKeys();
      start();
      return;
    }
    if (state !== "active" || paused || !keys[event.code] || (event.code === "Space" && event.target instanceof HTMLButtonElement)) return;
    event.preventDefault();
    heldKeys.add(event.code);
    resolveInput();
  });
  window.addEventListener("keyup", event => {
    if (heldKeys.delete(event.code)) resolveInput();
  });
  window.addEventListener("blur", releaseKeys);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) releaseKeys();
  });
  document.querySelectorAll(".touch button").forEach(button => {
    button.addEventListener("pointerdown", event => {
      if (state !== "active" || paused) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, { control: button.dataset.drive, button });
      button.dataset.driving = "true";
      resolveInput();
    });
    const release = event => {
      pointers.delete(event.pointerId);
      if (![...pointers.values()].some(pointer => pointer.button === button)) delete button.dataset.driving;
      resolveInput();
    };
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
  });
  requestAnimationFrame(frame);
} else {
  $("start").disabled = true;
  $("start").textContent = "Driving view unavailable";
}

const sample = $("sample");
const evidence = {
  date: "Employer letter, page 1: “Maya Rao joined on 14 March 2022.” The date appears in the packet.",
  title: "Offer letter, page 1: “Software Engineer, Data Products.” The job title appears in the packet.",
  hours: "You found the gap. Neither letter states weekly hours. Ask for a document that confirms the schedule."
};
$("sample-open").addEventListener("click", () => {
  $("sample-result").textContent = "Pick a finding to see its source.";
  sample.showModal();
});
sample.querySelectorAll("[data-fact]").forEach(button => {
  button.addEventListener("click", () => {
    $("sample-result").textContent = evidence[button.dataset.fact];
  });
});
