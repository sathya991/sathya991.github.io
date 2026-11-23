"use strict";

const junctionAt = 83;
const trackWidth = 5.4;
const cameraHeight = 5.4;
const carDistance = 12;
const approachEnd = junctionAt - 5;
const routes = {
  north: { yaw: 0, length: 92, label: "CASEBRIEF AI", title: "CaseBrief AI", result: "Review findings alongside their sources", detail: "A local PDF review prototype links flagged evidence back to the original page for human review.", anchor: "evidence", color: "#bda0ff" },
  west: { yaw: Math.PI / 2, length: 87, label: "AFTERMATCH", title: "AfterMatch", result: "Turn a replay into a practice plan", detail: "A Dota 2 match timeline links rule-based coaching to events recorded in the replay.", anchor: "aftermatch", color: "#68f4e3" },
  east: { yaw: -Math.PI / 2, length: 97, label: "MY TIME", title: "My Time", result: "See what’s next in your timetable", detail: "An Android prototype that uses Firebase to manage timetables and show the active task.", anchor: "my-time", color: "#ff88c4" },
  south: { yaw: Math.PI, length: 86, label: "WORKSOFT", title: "Engineering at Worksoft", result: "Over 80% less time spent uploading", detail: "Three case studies cover a resumable Python pipeline, large Angular grids, and performance tuning across .NET and SQL Server.", anchor: "work", color: "#ffc38d", link: "See the case studies" }
};
const sparks = Object.entries(routes).flatMap(([route, {length}], index) => [
  { id: route + "-first", route, at: junctionAt + 29, lane: index % 2 ? 2.6 : -2.6 },
  { id: route + "-second", route, at: junctionAt + length - 23, lane: index % 2 ? -2.6 : 2.6 }
]);

const $ = id => document.getElementById(id);
const drive = $("drive");
const canvas = $("scene");
const ctx = canvas.getContext("2d");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const input = new Set();
const pointers = new Map();
const collected = new Set();
const visited = new Set();
const routeButtons = Array.from(document.querySelectorAll("[data-route]"));
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
let routeKey = null;
let yaw = 0;
let turnProgress = 0;
let engineElapsed = 0;
let clock = 0;
let lastFrame;
let state = "intro";
let previousSpeed = -1;
let cruise = false;
let routeVisible = true;
let roadRenderer;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const canDrive = () => state === "approach" || state === "branch";
const seed = value => {
  const random = Math.sin(value * 127.1 + 78.23) * 43758.5453;
  return random - Math.floor(random);
};

function project(distance, offset = 0, altitude = 0) {
  const scale = depth / (distance - position + 7);
  return {
    x: vanishingX + (offset - cameraX) * scale,
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

  if (junctionAt + trackWidth > position) {
    const near = project(Math.max(position, junctionAt - trackWidth));
    const far = project(junctionAt + trackWidth);
    strip(near, far, -250, 250, "#202c43");
    ctx.fillStyle = "#121c38";
    ctx.fillRect(0, far.y - 2, width, 2);
    for (let mark = -14; mark <= 14; mark++) {
      const offset = mark * 5;
      if (Math.abs(offset) < trackWidth + 1) continue;
      strip(project(junctionAt - .045), project(junctionAt + .045), offset, offset + 2.4, "#92a3bb");
    }
    for (const offset of [-trackWidth - 2, trackWidth + 2]) {
      for (let stripe = -4; stripe <= 4; stripe++) {
        const a = junctionAt + stripe + .1;
        if (a > position) strip(project(a), project(a + .39), offset - .68, offset + .68, "#87a1bf");
      }
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
  const neon = ["#72f4ee", "#ff6db0", "#ad8cff", "#ffc38d"][index % 4];
  ctx.save();
  ctx.shadowColor = neon;
  ctx.shadowBlur = Math.min(14, a.scale * .48);
  ctx.fillStyle = neon;
  ctx.fillRect(a.x, top.y, b.x - a.x, Math.max(1, a.scale * .10));
  ctx.fillRect(a.x, top.y, Math.max(1, a.scale * .10), a.y - top.y);
  ctx.restore();
  const windows = Math.floor(tall / 2.35);
  for (let row = 1; row < windows; row++) {
    for (let col = 1; col <= 3; col++) {
      const lit = seed(row * 29 + col * 17 + index * 67 + side) > .37;
      ctx.fillStyle = lit ? (col === 2 ? neon : "#71c0d8") : "#25314b";
      if (lit && col === 2 && index % 3 === 0) ctx.fillStyle = "#ffae79";
      const x = a.x + (b.x - a.x) * col / 4;
      const y = a.y - row * 2.35 * a.scale;
      ctx.fillRect(x - a.scale * .32, y, a.scale * .74, a.scale * .32);
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
    if (distance - position < 3 || Math.abs(distance - junctionAt) < 19) continue;
    objects.push({ distance, draw() {
      if (index % 2 === 0) drawTower(distance, -1, index);
      if (index % 3 !== 1) drawTower(distance, 1, index);
      drawLamp(distance, index % 2 ? -1 : 1);
    } });
  }
  const route = routes[routeKey] || routes.north;
  const gateAt = junctionAt + route.length + 9;
  if (gateAt - position < 190) {
    objects.push({ distance: gateAt, draw() { drawGate(gateAt, route.label, route.color); } });
  }
  if (!routeKey && junctionAt - position > 23) {
    const signAt = junctionAt - 13;
    objects.push({ distance: signAt, draw() { drawGate(signAt, "CROSSROADS", "#9df8e9"); } });
  }
  for (const spark of sparks) {
    if (spark.route === routeKey && spark.at - position >= carDistance - 1 && !collected.has(spark.id)) {
      objects.push({ distance: spark.at, draw() { drawSpark(spark.at, spark.lane); } });
    }
  }
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
  carBody(panels, [[-2.31, 1.04, .35, .91], [-1.65, 1.12, .33, 1.02], [1.62, 1.12, .34, 1.02], [2.27, 1.01, .37, .87]],
    ["#668eb0", "#344a73", "#4f6c94", "#273d5c"]);
  carBody(panels, [[-1.18, .88, 1.01, 1.08], [-.68, .81, 1.02, 1.54], [.61, .82, 1.02, 1.54], [1.28, .87, 1.01, 1.08]],
    ["#537696", "#202f4b", "#233e61", "#273f57"]);
  carPanel(panels, "#769ab8", [[-.8, 1.549, -.68], [.8, 1.549, -.68], [.81, 1.549, .61], [-.81, 1.549, .61]]);
  carPanel(panels, "#1b2941", [[-1.02, .36, -2.32], [1.02, .36, -2.32], [1.06, .52, -2.32], [-1.06, .52, -2.32]]);
  carPanel(panels, "#4b647f", [[-.98, .93, -2.22], [.98, .93, -2.22], [.98, .965, -2.22], [-.98, .965, -2.22]]);
  for (const side of [-1, 1]) {
    const x = side * .7;
    carPanel(panels, "#ff3e58", [[x - .28, .66, -2.326], [x + .28, .66, -2.326], [x + .28, .85, -2.326], [x - .28, .85, -2.326]]);
    carPanel(panels, "#ffd1a3", [[x - .23, .77, -2.33], [x + .23, .77, -2.33], [x + .23, .80, -2.33], [x - .23, .80, -2.33]]);
    for (const z of [-1.42, 1.42]) {
      const wheel = Array.from({ length: 16 }, (_, index) => {
        const angle = index * Math.PI / 8;
        return [side * 1.14, .36 + Math.cos(angle) * .35, z + Math.sin(angle) * .35];
      });
      carPanel(panels, "#111829", wheel);
      carPanel(panels, "#a3b1c8", wheel.map(([, y, at]) => [side * 1.145, .36 + (y - .36) * .63, z + (at - z) * .63]));
    }
    for (const pipe of [.55, .74]) {
      const ring = Array.from({length: 10}, (_, index) => {
        const angle = index * Math.PI / 5;
        return [side * pipe + Math.cos(angle) * .069, .405 + Math.sin(angle) * .067, -2.36];
      });
      carPanel(panels, "#a3b3c8", ring);
      carPanel(panels, "#151b2a", ring.map(([x, y]) => [side * pipe + (x - side * pipe) * .66, .405 + (y - .405) * .66, -2.365]));
    }
  }
  carPanel(panels, "#f2debf", [[-.20, .57, -2.33], [.20, .57, -2.33], [.20, .69, -2.33], [-.20, .69, -2.33]]);
  return panels;
})();

function drawCar() {
  const at = position + carDistance;
  const center = project(at, lane);
  const angle = steer * .28 - (state === "turning" ? Math.sin(turnProgress * Math.PI) * yaw * .30 : 0);
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  function point(x, y, z) {
    const distance = at + z * cosine - x * sine;
    const worldX = lane + x * cosine + z * sine;
    const p = project(distance, worldX, y + x * steer * .045);
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

  const [plateX, plateY] = point(0, .625, -2.338);
  ctx.font = "750 " + Math.max(4, center.scale * .103) + "px monospace";
  ctx.fillStyle = "#1c2435";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("M5 E39", plateX, plateY, center.scale * .38);
  const [badgeX, badgeY] = point(0, .807, -2.338);
  ctx.fillStyle = "#c9dcef";
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, Math.max(1, center.scale * .036), 0, Math.PI * 2);
  ctx.fill();

  for (const side of [-1, 1]) {
    const [x, y] = point(side * .69, .73, -2.34);
    const radius = Math.max(3, center.scale * .48);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, "#ff605880");
    gradient.addColorStop(1, "#ff605800");
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    if (input.has("boost") && speed > 32) {
      const glow = point(side * .64, .4, -2.43);
      const tail = point(side * .64, .34, -2.95 - Math.sin(clock * 24) * .21);
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
      position, lane, steer, blend, cameraX, clock, collected, yaw,
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
  $("arrival").hidden = false;
}

function updateHud() {
  const carAt = position + carDistance;
  const progress = routeKey ? (carAt - junctionAt) / routes[routeKey].length : (carAt - carDistance) / (approachEnd - carDistance);
  $("route-fill").style.width = clamp(progress * 100, 0, 100) + "%";
  const displaySpeed = Math.round(speed * 2.5);
  if (displaySpeed !== previousSpeed) {
    speedText.nodeValue = String(displaySpeed).padStart(2, "0") + " ";
    previousSpeed = displaySpeed;
  }
}

function setState(next) {
  state = next;
  drive.dataset.state = next;
  $("cruise").disabled = !canDrive();
}

function showJunction() {
  releaseKeys();
  setCruise(false);
  routeKey = null;
  yaw = 0;
  position = approachEnd - carDistance;
  speed = lane = steer = cameraX = 0;
  $("arrival").hidden = true;
  $("hud-next").textContent = "CROSSROADS";
  setState("junction");
  $("junction").hidden = false;
  $("junction-title").focus({ preventScroll: true });
  updateHud();
}

function chooseRoute(key) {
  if (state !== "junction") return;
  routeKey = key;
  turnProgress = 0;
  $("junction").hidden = true;
  $("hud-next").textContent = "NEXT / " + routes[key].label;
  setState("turning");
  drive.focus({ preventScroll: true });
}

function arrive() {
  releaseKeys();
  setCruise(false);
  speed = 0;
  setState("parked");
  visited.add(routeKey);
  routeButtons.find(button => button.dataset.route === routeKey).classList.add("visited");
  $("route-text").textContent = visited.size + " / " + Object.keys(routes).length + " stops visited";
  $("hud-next").textContent = "PARKED / " + routes[routeKey].label;
  showArrival(routes[routeKey]);
  $("arrival-title").focus({ preventScroll: true });
}

function update(elapsed) {
  const targetBlend = state === "intro" ? 0 : 1;
  blend += (targetBlend - blend) * (reducedMotion.matches ? 1 : Math.min(1, elapsed * 3.5));
  vanishingX = width * (.51 + (width < 650 ? .02 : .15) * (1 - blend));
  if (state === "turning") vanishingX += Math.sin(turnProgress * Math.PI) * yaw * width * .05;
  cameraX += (lane * .6 - cameraX) * Math.min(1, elapsed * 6);

  if (state === "turning") {
    turnProgress = reducedMotion.matches ? 1 : Math.min(turnProgress + elapsed / .83, 1);
    const eased = turnProgress * turnProgress * (3 - 2 * turnProgress);
    position = approachEnd - carDistance + (junctionAt - approachEnd) * eased;
    yaw = routes[routeKey].yaw * eased;
    if (turnProgress === 1) {
      setState("branch");
      setCruise(true);
    }
  } else if (canDrive()) {
    const before = position + carDistance;
    const direction = Number(input.has("right")) - Number(input.has("left"));
    const braking = input.has("brake");
    if (braking && cruise) setCruise(false);
    const going = input.has("go") || cruise;
    const boosting = going && input.has("boost");
    const end = state === "approach" ? approachEnd : junctionAt + routes[routeKey].length;
    const remaining = end - before;
    steer += (direction - steer) * Math.min(1, elapsed * 8);
    const shoulder = Math.abs(lane) > trackWidth - 1;
    const cruisingLimit = shoulder ? 15 : boosting ? 43 : cruise && !input.has("go") ? 25 : 31;
    const speedLimit = Math.min(cruisingLimit, Math.max(4, Math.sqrt(2 * 24 * remaining)));
    const acceleration = braking ? -38 : going ? (boosting ? 24 : 15) : -4.8;
    speed = clamp(speed + elapsed * acceleration, 0, Math.max(speedLimit, speed - elapsed * 34));
    lane = clamp(lane + steer * elapsed * speed * .27, -trackWidth + .3, trackWidth - .3);
    position = Math.min(end - carDistance, position + speed * elapsed);
    const after = position + carDistance;

    for (const spark of sparks) {
      if (spark.route === routeKey && before < spark.at && after >= spark.at && Math.abs(lane - spark.lane) < 1.25) {
        collected.add(spark.id);
        $("spark-count").textContent = collected.size + "/" + sparks.length + " sparks";
      }
    }
    if (after >= end) {
      if (state === "approach") showJunction();
      else arrive();
    }
  }

  engineElapsed += elapsed;
  if (engineElapsed >= .058) {
    engineElapsed = 0;
    drive.dispatchEvent(new CustomEvent("night-shift:engine", { detail: {
      speed, throttle: canDrive() && (cruise || input.has("go")), boost: input.has("boost"),
      running: state !== "intro" && state !== "parked"
    } }));
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

function start() {
  releaseKeys();
  position = speed = lane = steer = cameraX = yaw = 0;
  routeKey = null;
  visited.clear();
  collected.clear();
  routeButtons.forEach(button => button.classList.remove("visited"));
  $("junction").hidden = true;
  $("arrival").hidden = true;
  $("route-text").textContent = "0 / " + Object.keys(routes).length + " stops visited";
  $("spark-count").textContent = "0/" + sparks.length + " sparks";
  $("hud-next").textContent = "NEXT / CROSSROADS";
  setState("approach");
  setCruise(true);
  updateHud();
  drive.focus({ preventScroll: true });
  window.scrollTo({ top: window.scrollY + drive.getBoundingClientRect().top, behavior: "instant" });
}

const keys = {
  KeyW: "go", ArrowUp: "go", KeyS: "brake", ArrowDown: "brake",
  KeyA: "left", ArrowLeft: "left", KeyD: "right", ArrowRight: "right",
  ShiftLeft: "boost", ShiftRight: "boost", Space: "brake"
};
const directions = { go: "north", left: "west", right: "east", brake: "south" };
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
    const { createRoadRenderer } = await import("./scene-3d.js?v=2");
    if (context.isContextLost()) return;
    const renderer = createRoadRenderer({
      canvas: surface, context, seed, trackWidth, routes, junctionAt, carDistance, sparks
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
    if (!routeVisible) {
      releaseKeys();
      drive.dispatchEvent(new CustomEvent("night-shift:engine", { detail: { running: false } }));
    }
  }).observe(drive);
  $("start").addEventListener("click", start);
  $("back-to-junction").addEventListener("click", showJunction);
  routeButtons.forEach(button => button.addEventListener("click", () => chooseRoute(button.dataset.route)));
  $("cruise").addEventListener("click", () => {
    if (canDrive()) setCruise(!cruise);
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
    if (state === "parked" && event.code === "Escape") {
      event.preventDefault();
      showJunction();
      return;
    }
    if (state === "junction" && event.code !== "Space" && directions[keys[event.code]]) {
      event.preventDefault();
      if (!event.repeat) chooseRoute(directions[keys[event.code]]);
      return;
    }
    if (!canDrive() || !keys[event.code] || (event.code === "Space" && event.target instanceof HTMLButtonElement)) return;
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
      if (!canDrive()) return;
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
