import {
  AdditiveBlending, AmbientLight, BoxGeometry, BufferGeometry, CanvasTexture,
  Color, CylinderGeometry, DirectionalLight, DoubleSide, Float32BufferAttribute,
  Fog, Group, HemisphereLight, InstancedMesh, Mesh, MeshBasicMaterial,
  MeshStandardMaterial, Object3D, OctahedronGeometry, PerspectiveCamera,
  PlaneGeometry, Scene, Sprite, SpriteMaterial,
  SRGBColorSpace, WebGLRenderer
} from "./vendor/three.module.min.js";

const cold = 0x73e4ff;
const warm = 0xffa27f;
const unitBox = new BoxGeometry(1, 1, 1);
const stamp = new Object3D();

function box(parent, material, width, height, depth, x, y, z) {
  const mesh = new Mesh(unitBox, material);
  mesh.scale.set(width, height, depth);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function canvasTexture(width, height, paint) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  paint(canvas.getContext("2d"), width, height);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function glowTexture() {
  return canvasTexture(64, 64, (context, width) => {
    const middle = width / 2;
    const gradient = context.createRadialGradient(middle, middle, 0, middle, middle, middle);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(.24, "#ffffff9e");
    gradient.addColorStop(.63, "#ffffff33");
    gradient.addColorStop(1, "#ffffff00");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, width);
  });
}

function glow(parent, map, color, x, y, z, size, opacity) {
  const light = new Sprite(new SpriteMaterial({
    map, color, opacity, blending: AdditiveBlending, depthWrite: false
  }));
  light.position.set(x, y, z);
  light.scale.set(size, size, 1);
  parent.add(light);
  return light;
}

function reflection(parent, map, color, x, y, z, width, length, opacity) {
  const material = new MeshBasicMaterial({
    map, color, transparent: true, opacity, blending: AdditiveBlending,
    depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1
  });
  const mesh = new Mesh(new PlaneGeometry(width, length), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function ribbon(scene, path, spans, left, right, y, material) {
  const vertices = [];
  for (const [start, finish] of spans) {
    const a = path(start);
    const b = path(finish);
    vertices.push(
      a + left, y, -start, a + right, y, -start, b + left, y, -finish,
      a + right, y, -start, b + right, y, -finish, b + left, y, -finish
    );
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geo.computeVertexNormals();
  scene.add(new Mesh(geo, material));
}

function buildRoad(scene, path, trackWidth, distance) {
  const asphalt = new MeshStandardMaterial({color: 0x182a47, roughness: .48, metalness: .26});
  const shoulder = new MeshStandardMaterial({color: 0x1c2b44, roughness: .72});
  const roadPaint = new MeshBasicMaterial({color: 0xb9d8ed});
  const edge = new MeshBasicMaterial({color: 0x56748f});
  const segments = Array.from({length: Math.ceil(distance / 3)}, (_, i) => [i * 3, (i + 1) * 3]);
  const dashedSegments = segments.filter((_, index) => index % 4 < 2);
  ribbon(scene, path, segments, -trackWidth - 3.4, trackWidth + 3.4, -.035, shoulder);
  ribbon(scene, path, segments, -trackWidth, trackWidth, 0, asphalt);
  ribbon(scene, path, dashedSegments, -.045, .045, .012, roadPaint);
  for (const side of [-1, 1]) {
    const x = side * (trackWidth - .14);
    ribbon(scene, path, segments, x - .065, x + .065, .014, edge);
  }
  const terrain = new Mesh(new PlaneGeometry(600, distance + 140), new MeshStandardMaterial({
    color: 0x0d192d, roughness: .95
  }));
  terrain.position.set(0, -.085, -distance / 2);
  terrain.rotation.x = -Math.PI / 2;
  scene.add(terrain);
}

function facadeTexture(seed, variation) {
  const colors = ["#86cded", "#e991ac", "#ffbd86", "#bad8f7"];
  return canvasTexture(96, 192, (context, width, height) => {
    context.fillStyle = "#233551";
    context.fillRect(0, 0, width, height);
    const columns = variation % 2 === 0 ? 4 : 5;
    const rows = variation < 2 ? 11 : 8;
    const columnSize = width / columns;
    const rowSize = height / rows;
    for (let row = 0; row < rows; row++) {
      context.fillStyle = "#2f4663";
      context.fillRect(0, row * rowSize, width, 2);
      for (let column = 0; column < columns; column++) {
        const level = seed(row * 17 + column * 37 + variation * 43);
        const x = column * columnSize + 4;
        const y = row * rowSize + 5;
        const w = columnSize - 8;
        const h = rowSize - 9;
        context.fillStyle = level > .46 ? colors[(row + column + variation) % colors.length] : "#1a293d";
        context.fillRect(x, y, w, h);
        if (level > .77) {
          context.fillStyle = "#fff3ccaa";
          context.fillRect(x + 1, y + 1, w * .52, 2);
        }
      }
    }
  });
}

function buildTowers(scene, path, seed, distance) {
  const sets = Array.from({length: 4}, () => []);
  const roofs = [];
  for (let i = 0; i * 17 < distance; i++) {
    for (const side of [-1, 1]) {
      for (let row = 0; row < 2; row++) {
        const key = i * 37 + side * 61 + row * 273;
        if (seed(key) < .16) continue;
        const z = i * 17 + seed(key + 8) * 6;
        const w = 5 + seed(key + 4) * 7;
        const h = 8 + seed(key + 5) * (row ? 34 : 19);
        const d = 7 + seed(key + 6) * 8;
        const x = path(z) + side * (13 + row * 13 + w / 2 + seed(key + 7) * 5);
        const style = Math.floor(seed(key + 9) * sets.length);
        sets[style].push({x, y: h / 2, z: -z, w, h, d});
        roofs.push({x, y: h + .39, z: -z, w: w * .83, h: .78, d: d * .85});
      }
    }
  }
  const roofMaterial = new MeshStandardMaterial({color: 0x364666, roughness: .91});
  for (const [style, towers] of sets.entries()) {
    const texture = facadeTexture(seed, style);
    const wall = new MeshStandardMaterial({
      map: texture, emissiveMap: texture, emissive: 0x8bb4ee,
      emissiveIntensity: .45, roughness: .79, metalness: .12
    });
    placeBoxes(scene, towers, [wall, wall, roofMaterial, roofMaterial, wall, wall]);
  }
  placeBoxes(scene, roofs, roofMaterial);
}

function placeBoxes(scene, boxes, material) {
  const batch = new InstancedMesh(unitBox, material, boxes.length);
  boxes.forEach(({x, y, z, w, h, d}, index) => {
    stamp.position.set(x, y, z);
    stamp.scale.set(w, h, d);
    stamp.updateMatrix();
    batch.setMatrixAt(index, stamp.matrix);
  });
  scene.add(batch);
}

function buildLamps(scene, path, trackWidth, distance, lightTexture) {
  const poles = [];
  const bars = [];
  const heads = [];
  for (let at = 18; at < distance; at += 19) {
    const side = Math.floor(at / 19) % 2 === 0 ? 1 : -1;
    const x = path(at) + side * (trackWidth + 1.22);
    const color = side === 1 ? warm : cold;
    const headX = x - side * .88;
    poles.push({x, y: 2.6, z: -at, w: .14, h: 5.2, d: .14});
    bars.push({x: x - side * .49, y: 5.16, z: -at, w: 1.06, h: .12, d: .11});
    heads.push({x: headX, y: 5.11, z: -at, w: .52, h: .09, d: .24, color});
    glow(scene, lightTexture, color, headX, 5.1, -at, 1.85, .48);
    reflection(scene, lightTexture, color, headX - side * .7, .023, -at - .35, 2.25, 6.8, .37);
  }
  const metal = new MeshStandardMaterial({color: 0x415875, metalness: .63, roughness: .55});
  placeBoxes(scene, poles.concat(bars), metal);
  for (const color of [cold, warm]) {
    placeBoxes(scene, heads.filter(head => head.color === color), new MeshBasicMaterial({color}));
  }
}

function buildGates(scene, path, trackWidth, checkpoints, routeEnd, lightTexture) {
  const frame = new MeshStandardMaterial({color: 0x22324b, roughness: .43, metalness: .51});
  const gates = [...checkpoints, {at: routeEnd, label: "FINISH", color: "#f7cfb7"}];
  for (const gate of gates) {
    const group = new Group();
    const half = trackWidth + .25;
    group.position.set(path(gate.at), 0, -gate.at);
    const led = new MeshBasicMaterial({color: gate.color});
    for (const side of [-1, 1]) {
      const x = side * half;
      box(group, frame, .33, 5.27, .47, x, 2.64, 0);
      box(group, led, .09, 5.23, .04, x, 2.62, .27);
      box(group, frame, .68, .22, .72, x, .12, 0);
      glow(group, lightTexture, gate.color, x, 5.1, .3, .81, .44);
    }
    box(group, frame, half * 2 + .24, .7, .51, 0, 5.06, 0);
    box(group, led, half * 2, .04, .025, 0, 4.73, .278);
    const plaque = canvasTexture(512, 72, (ctx, width, height) => {
      ctx.fillStyle = "#12213c";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = gate.color;
      ctx.font = "bold 41px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(gate.label, width / 2, height / 2 + 2);
    });
    const sign = new Mesh(new PlaneGeometry(half * 2 - .55, .57), new MeshBasicMaterial({map: plaque}));
    sign.position.set(0, 5.08, .28);
    group.add(sign);
    scene.add(group);
  }
}

function wedge(parent, material, sections) {
  const vertices = [];
  const faces = [];
  for (const {z, width, bottom, top} of sections) {
    const x = width / 2;
    vertices.push(-x, bottom, z, x, bottom, z, x, top, z, -x, top, z);
  }
  function quad(a, b, c, d) {
    faces.push(a, b, c, a, c, d);
  }
  for (let i = 0; i < sections.length - 1; i++) {
    const a = i * 4;
    quad(a + 3, a + 2, a + 6, a + 7);
    quad(a, a + 3, a + 7, a + 4);
    quad(a + 1, a + 5, a + 6, a + 2);
    quad(a, a + 4, a + 5, a + 1);
  }
  const last = vertices.length / 3 - 4;
  quad(0, 1, 2, 3);
  quad(last, last + 3, last + 2, last + 1);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(faces);
  const flat = geometry.toNonIndexed();
  flat.computeVertexNormals();
  parent.add(new Mesh(flat, material));
}

function buildCar(scene, lightTexture) {
  const rig = new Group();
  const car = new Group();
  rig.add(car);
  scene.add(rig);
  const paint = new MeshStandardMaterial({color: 0xec665f, metalness: .53, roughness: .31, side: DoubleSide});
  const trim = new MeshStandardMaterial({color: 0x233043, metalness: .68, roughness: .39});
  const glass = new MeshStandardMaterial({
    color: 0x326a88, emissive: 0x34698d, emissiveIntensity: .22,
    roughness: .25, metalness: .4, side: DoubleSide
  });
  const tire = new MeshStandardMaterial({color: 0x0b121c, roughness: .91});
  const red = new MeshBasicMaterial({color: 0xff4d52});
  const white = new MeshBasicMaterial({color: 0xffe2b9});
  wedge(car, paint, [
    {z: 1.86, width: 2.25, bottom: .35, top: .82},
    {z: 1.36, width: 2.41, bottom: .32, top: .99},
    {z: -1.21, width: 2.35, bottom: .32, top: .93},
    {z: -1.94, width: 2.13, bottom: .35, top: .72}
  ]);
  wedge(car, glass, [
    {z: .91, width: 1.73, bottom: .91, top: 1.05},
    {z: .46, width: 1.63, bottom: .93, top: 1.43},
    {z: -.61, width: 1.61, bottom: .94, top: 1.42},
    {z: -1.06, width: 1.73, bottom: .91, top: 1.03}
  ]);
  box(car, paint, 1.65, .08, 1.13, 0, 1.44, -.07);
  box(car, trim, 2.18, .20, .17, 0, .45, 1.88);
  box(car, trim, 2.04, .15, .18, 0, .46, -1.94);
  box(car, trim, 1.97, .09, .36, 0, 1.03, 1.46);
  box(car, white, .44, .11, .025, 0, .61, 1.886);
  const wheelGeometry = new CylinderGeometry(.37, .37, .31, 16);
  const hubs = new CylinderGeometry(.22, .22, .33, 12);
  const exhausts = [];
  for (const side of [-1, 1]) {
    for (const z of [-1.2, 1.14]) {
      for (const [geometry, material] of [[wheelGeometry, tire], [hubs, trim]]) {
        const wheel = new Mesh(geometry, material);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(side * 1.11, .37, z);
        car.add(wheel);
      }
    }
    box(car, red, .7, .092, .035, side * .68, .71, 1.89);
    box(car, white, .55, .084, .035, side * .72, .65, -1.955);
    glow(car, lightTexture, 0xff354b, side * .68, .71, 1.925, 1.17, .57);
    exhausts.push(glow(car, lightTexture, cold, side * .56, .39, 2.07, .72, .67));
    reflection(rig, lightTexture, 0xff4356, side * .68, .031, 2.26, .86, 2.35, .43);
  }
  return {rig, car, exhausts};
}

export function createRoadRenderer({canvas, context, path, seed, trackWidth, checkpoints, routeEnd, carDistance, sparks}) {
  const renderer = new WebGLRenderer({canvas, context, alpha: true, antialias: true});
  renderer.setClearColor(0x000000, 0);
  const scene = new Scene();
  scene.fog = new Fog(0x263759, 30, 179);
  const camera = new PerspectiveCamera(54, 1, .12, 220);
  const lightTexture = glowTexture();
  scene.add(new HemisphereLight(0xb6d9ff, 0x263147, 1.68), new AmbientLight(0x8f9cc4, .63));
  const moon = new DirectionalLight(0x9ad8ff, 2.2);
  moon.position.set(-16, 22, 12);
  const sunset = new DirectionalLight(0xff9e84, .96);
  sunset.position.set(16, 9, -24);
  scene.add(moon, sunset);
  const distance = routeEnd + 210;
  buildRoad(scene, path, trackWidth, distance);
  buildTowers(scene, path, seed, distance);
  buildLamps(scene, path, trackWidth, distance, lightTexture);
  buildGates(scene, path, trackWidth, checkpoints, routeEnd, lightTexture);
  const {rig, car, exhausts} = buildCar(scene, lightTexture);
  const gemGeometry = new OctahedronGeometry(.28);
  const gemMaterial = new MeshBasicMaterial({color: 0x95f2ff});
  const gems = sparks.map(({at, lane}) => {
    const gem = new Mesh(gemGeometry, gemMaterial);
    gem.position.set(path(at) + lane, .83, -at);
    glow(gem, lightTexture, cold, 0, 0, 0, 1.25, .56);
    scene.add(gem);
    return gem;
  });

  let width = 1;
  let height = 1;
  let previousOffset = NaN;
  let positionKey = "";
  return {
    resize(w, h) {
      width = Math.max(1, Math.round(w));
      height = Math.max(1, Math.round(h));
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.45));
      renderer.setSize(width, height, false);
      camera.fov = width < 650 ? 62 : 54;
      previousOffset = NaN;
      positionKey = "";
    },
    draw({position, lane, steer, blend, cameraX, clock, collected, boosting}) {
      const offset = Math.round(-width * (width < 650 ? .034 : .175) * (1 - blend));
      const viewKey = [position, lane, steer, offset, cameraX, clock].join("/");
      if (viewKey === positionKey) return;
      positionKey = viewKey;
      if (offset !== previousOffset) {
        camera.setViewOffset(width, height, offset, 0, width, height);
        previousOffset = offset;
      }
      camera.position.set(cameraX, width < 650 ? 5.8 : 5.7, -position + 1);
      camera.lookAt(cameraX * .62 + path(position + 32) * .38, 4.15, -position - 38);
      const at = position + carDistance;
      rig.position.set(path(at) + lane, 0, -at);
      const heading = Math.atan2(path(at + 1) - path(at - 1), 2);
      rig.rotation.y = -heading - steer * .23;
      car.rotation.z = -steer * .075;
      for (const exhaust of exhausts) exhaust.visible = boosting;
      gems.forEach((gem, index) => {
        gem.visible = !collected.has(index);
        gem.position.y = .83 + Math.sin(clock * 3.5 + index) * .14;
        gem.rotation.y = clock * 1.52 + index;
      });
      renderer.render(scene, camera);
    }
  };
}
