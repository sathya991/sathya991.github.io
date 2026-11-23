import {
  AdditiveBlending, AmbientLight, BoxGeometry, BufferGeometry, CanvasTexture,
  Color, CylinderGeometry, DirectionalLight, DoubleSide, Float32BufferAttribute,
  Fog, Group, HemisphereLight, InstancedMesh, Mesh, MeshBasicMaterial,
  MeshStandardMaterial, Object3D, OctahedronGeometry, PerspectiveCamera,
  PlaneGeometry, Scene, Sprite, SpriteMaterial,
  SRGBColorSpace, TorusGeometry, WebGLRenderer
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

function ribbon(scene, spans, left, right, y, material) {
  const vertices = [];
  for (const [start, finish] of spans) {
    vertices.push(
      left, y, -start, right, y, -start, left, y, -finish,
      right, y, -start, right, y, -finish, left, y, -finish
    );
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geo.computeVertexNormals();
  scene.add(new Mesh(geo, material));
}

function buildRoad(scene, trackWidth, distance, asphalt, color) {
  const shoulder = new MeshStandardMaterial({color: 0x1c2b44, roughness: .72});
  const roadPaint = new MeshBasicMaterial({color: 0xaabed3});
  const edge = new MeshBasicMaterial({color: new Color(color).multiplyScalar(.62)});
  const first = trackWidth + 3.4;
  const segments = Array.from({length: Math.ceil((distance - first) / 3)}, (_, i) => [first + i * 3, first + (i + 1) * 3]);
  const dashedSegments = segments.filter((_, index) => index >= 2 && index % 4 < 2);
  ribbon(scene, segments, -trackWidth - 3.4, trackWidth + 3.4, -.035, shoulder);
  ribbon(scene, segments, -trackWidth, trackWidth, 0, asphalt);
  ribbon(scene, dashedSegments, -.045, .045, .012, roadPaint);
  for (const side of [-1, 1]) {
    const x = side * (trackWidth - .14);
    ribbon(scene, segments.slice(2), x - .065, x + .065, .014, edge);
  }
  for (let stripe = -4; stripe <= 4; stripe++) {
    box(scene, roadPaint, .42, .012, 1.85, stripe * 1.09, .015, -first - 1.7);
  }
}

function buildJunction(scene, junctionAt, trackWidth, asphalt) {
  const terrain = new Mesh(new PlaneGeometry(520, 520), new MeshStandardMaterial({
    color: 0x0c1226, roughness: .95
  }));
  terrain.position.set(0, -.087, -junctionAt);
  terrain.rotation.x = -Math.PI / 2;
  scene.add(terrain);
  const half = trackWidth + 3.4;
  box(scene, asphalt, half * 2, .08, half * 2, 0, -.04, -junctionAt);
  const island = new MeshStandardMaterial({color: 0x2e3f65, roughness: .74});
  const curb = new MeshBasicMaterial({color: 0x87b6d6});
  for (const x of [-1, 1]) {
    for (const z of [-1, 1]) {
      box(scene, island, 3.27, .22, 3.27, x * (half - 1.64), .08, -junctionAt + z * (half - 1.64));
      box(scene, curb, 3.27, .048, .055, x * (half - 1.64), .18, -junctionAt + z * (half - 3.28));
      box(scene, curb, .055, .048, 3.27, x * (half - 3.28), .18, -junctionAt + z * (half - 1.64));
    }
  }
}

function facadeTexture(seed, variation) {
  const colors = ["#64ffe9", "#ff5cb0", "#ffc489", "#ae9bff"];
  return canvasTexture(96, 192, (context, width, height) => {
    context.fillStyle = "#161c38";
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

function buildTowers(scene, seed, distance, color, lightTexture) {
  const sets = Array.from({length: 4}, () => []);
  const roofs = [];
  const lights = [];
  for (let i = 1; i * 17 < distance; i++) {
    for (const side of [-1, 1]) {
      for (let row = 0; row < 2; row++) {
        const key = i * 37 + side * 61 + row * 273;
        if (seed(key) < .16) continue;
        const z = i * 17 + seed(key + 8) * 6;
        const w = 5 + seed(key + 4) * 7;
        const h = 8 + seed(key + 5) * (row ? 34 : 19);
        const d = 7 + seed(key + 6) * 8;
        const x = side * (13 + row * 13 + w / 2 + seed(key + 7) * 5);
        const style = Math.floor(seed(key + 9) * sets.length);
        sets[style].push({x, y: h / 2, z: -z, w, h, d});
        roofs.push({x, y: h + .39, z: -z, w: w * .83, h: .78, d: d * .85});
        const inner = x - side * (w / 2 + .045);
        const nearFace = -z + d / 2 + .06;
        lights.push({x: inner, y: h - .03, z: -z, w: .09, h: .13, d: d + .2});
        lights.push({x, y: h - .03, z: nearFace, w: w + .04, h: .13, d: .09});
        if (row === 0 && i % 2 === 1) {
          lights.push({x: inner, y: h / 2, z: nearFace, w: .13, h, d: .13});
          glow(scene, lightTexture, color, inner, h - .1, nearFace, 6, .34);
          reflection(scene, lightTexture, color, side * 4.2, .027, -z, 3.9, 13, .40);
        }
      }
    }
  }
  const roofMaterial = new MeshStandardMaterial({color: 0x364666, roughness: .91});
  for (const [style, towers] of sets.entries()) {
    const texture = facadeTexture(seed, style);
    const wall = new MeshStandardMaterial({
      map: texture, emissiveMap: texture, emissive: 0xadbbee,
      emissiveIntensity: .86, roughness: .79, metalness: .12
    });
    placeBoxes(scene, towers, [wall, wall, roofMaterial, roofMaterial, wall, wall]);
  }
  placeBoxes(scene, roofs, roofMaterial);
  placeBoxes(scene, lights, new MeshBasicMaterial({color}));
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

function buildLamps(scene, trackWidth, distance, lightTexture) {
  const poles = [];
  const bars = [];
  const heads = [];
  for (let at = 18; at < distance; at += 19) {
    const side = Math.floor(at / 19) % 2 === 0 ? 1 : -1;
    const x = side * (trackWidth + 1.22);
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

function buildGates(scene, trackWidth, gates, lightTexture) {
  const frame = new MeshStandardMaterial({color: 0x22324b, roughness: .43, metalness: .51});
  for (const gate of gates) {
    const group = new Group();
    const half = trackWidth + .25;
    group.position.set(0, 0, -gate.at);
    if (gate.reverse) group.rotation.y = Math.PI;
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
  const paint = new MeshStandardMaterial({color: 0x547ba2, metalness: .41, roughness: .28, side: DoubleSide});
  const trim = new MeshStandardMaterial({color: 0x151e31, metalness: .41, roughness: .47});
  const chrome = new MeshStandardMaterial({color: 0xb9cade, metalness: .57, roughness: .31});
  const glass = new MeshStandardMaterial({
    color: 0x263c58, emissive: 0x213954, emissiveIntensity: .21,
    roughness: .20, metalness: .33, side: DoubleSide
  });
  const tire = new MeshStandardMaterial({color: 0x0b111b, roughness: .93});
  const red = new MeshBasicMaterial({color: 0xff344d});
  const amber = new MeshBasicMaterial({color: 0xff8c4a});
  const white = new MeshBasicMaterial({color: 0xffe5bb});
  wedge(car, paint, [
    {z: 2.30, width: 2.06, bottom: .36, top: .91},
    {z: 1.65, width: 2.23, bottom: .32, top: 1.02},
    {z: -1.61, width: 2.21, bottom: .32, top: 1.02},
    {z: -2.28, width: 2.02, bottom: .35, top: .87}
  ]);
  wedge(car, glass, [
    {z: 1.18, width: 1.76, bottom: 1.00, top: 1.08},
    {z: .67, width: 1.62, bottom: 1.02, top: 1.54},
    {z: -.61, width: 1.64, bottom: 1.02, top: 1.54},
    {z: -1.27, width: 1.73, bottom: 1.01, top: 1.09}
  ]);
  box(car, paint, 1.66, .064, 1.29, 0, 1.548, .03);
  box(car, trim, 1.94, .16, .17, 0, .49, 2.29);
  box(car, trim, 1.94, .17, .16, 0, .49, -2.28);
  box(car, paint, 1.91, .052, .15, 0, .965, 2.12);
  const plate = canvasTexture(192, 52, (ctx, width, height) => {
    ctx.fillStyle = "#f7e8d0";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#26395b";
    ctx.font = "bold 36px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("M5 E39", width / 2, height / 2 + 1);
  });
  const plateMesh = new Mesh(new PlaneGeometry(.46, .125), new MeshBasicMaterial({map: plate}));
  plateMesh.position.set(0, .626, 2.317);
  car.add(plateMesh);
  const badge = new Mesh(new CylinderGeometry(.061, .061, .012, 16), chrome);
  badge.rotation.x = Math.PI / 2;
  badge.position.set(0, .814, 2.318);
  car.add(badge);

  const wheelGeometry = new CylinderGeometry(.373, .373, .30, 20);
  const hubs = new CylinderGeometry(.239, .239, .034, 16);
  const halos = new TorusGeometry(.102, .013, 8, 20);
  const exhaustPipe = new CylinderGeometry(.073, .073, .21, 16);
  const exhaustTip = new CylinderGeometry(.052, .052, .011, 16);
  const exhausts = [];
  for (const side of [-1, 1]) {
    box(car, trim, .075, .065, 3.08, side * 1.11, .66, .03);
    box(car, trim, .042, .44, .106, side * .857, 1.269, .01);
    for (const z of [-.65, .59]) {
      box(car, chrome, .038, .045, .19, side * 1.111, .882, z);
      box(car, trim, .022, .39, .032, side * 1.108, .779, z + .27);
    }
    box(car, paint, .28, .145, .22, side * 1.015, 1.154, -.92);
    for (const z of [-1.41, 1.42]) {
      const tireMesh = new Mesh(wheelGeometry, tire);
      tireMesh.rotation.z = Math.PI / 2;
      tireMesh.position.set(side * 1.024, .373, z);
      car.add(tireMesh);
      const hub = new Mesh(hubs, trim);
      hub.rotation.z = Math.PI / 2;
      hub.position.set(side * 1.17, .373, z);
      car.add(hub);
      for (let spoke = 0; spoke < 10; spoke++) {
        const angle = spoke * Math.PI / 5;
        const bar = box(car, chrome, .025, .17, .027, side * 1.195, .373 + Math.cos(angle) * .133, z + Math.sin(angle) * .133);
        bar.rotation.x = angle;
      }
    }
    box(car, trim, .64, .218, .04, side * .69, .758, 2.301);
    box(car, red, .545, .095, .03, side * .70, .731, 2.329);
    box(car, amber, .525, .035, .031, side * .70, .82, 2.332);
    glow(car, lightTexture, 0xff354b, side * .70, .75, 2.354, 1.09, .61);
    reflection(rig, lightTexture, 0xff4356, side * .70, .031, 2.76, .98, 2.8, .53);

    box(car, chrome, .223, .187, .062, side * .134, .733, -2.285);
    box(car, trim, .173, .139, .066, side * .134, .733, -2.3);
    for (const x of [.49, .75]) {
      const lamp = new Mesh(halos, white);
      lamp.position.set(side * x, .736, -2.31);
      car.add(lamp);
    }
    glow(car, lightTexture, 0xcaf1ff, side * .63, .734, -2.305, .82, .57);
    for (const x of [.55, .73]) {
      const pipe = new Mesh(exhaustPipe, chrome);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(side * x, .384, 2.338);
      car.add(pipe);
      const tip = new Mesh(exhaustTip, trim);
      tip.rotation.x = Math.PI / 2;
      tip.position.set(side * x, .384, 2.446);
      car.add(tip);
    }
    exhausts.push(glow(car, lightTexture, cold, side * .65, .385, 2.48, .56, .60));
  }
  return {rig, car, exhausts};
}

export function createRoadRenderer({canvas, context, seed, trackWidth, routes, junctionAt, carDistance, sparks}) {
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
  const asphalt = new MeshStandardMaterial({color: 0x202b48, roughness: .43, metalness: .20});
  buildJunction(scene, junctionAt, trackWidth, asphalt);
  const gemGeometry = new OctahedronGeometry(.28);
  const gemMaterial = new MeshBasicMaterial({color: 0x95f2ff});
  const gems = [];
  for (const [key, route] of Object.entries(routes)) {
    const district = new Group();
    district.position.z = -junctionAt;
    district.rotation.y = route.yaw;
    scene.add(district);
    const distance = route.length + 115;
    buildRoad(district, trackWidth, distance, asphalt, route.color);
    const districtSeed = value => seed(value + Math.round((route.yaw + Math.PI) * 1000));
    buildTowers(district, districtSeed, distance, route.color, lightTexture);
    buildLamps(district, trackWidth, distance, lightTexture);
    const districtGates = [{at: route.length + 9, label: route.label, color: route.color}];
    if (key === "south") districtGates.push({at: 15.5, label: "CROSSROADS", color: "#93f6e3", reverse: true});
    buildGates(district, trackWidth, districtGates, lightTexture);
    for (const spark of sparks.filter(spark => spark.route === key)) {
      const gem = new Mesh(gemGeometry, gemMaterial);
      gem.position.set(spark.lane, .83, junctionAt - spark.at);
      glow(gem, lightTexture, cold, 0, 0, 0, 1.25, .56);
      district.add(gem);
      gems.push({ id: spark.id, mesh: gem });
    }
  }
  const {rig, car, exhausts} = buildCar(scene, lightTexture);

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
    draw({position, lane, steer, blend, cameraX, clock, collected, yaw, boosting}) {
      const offset = Math.round(-width * (width < 650 ? .034 : .175) * (1 - blend));
      const viewKey = [position, lane, steer, offset, cameraX, clock, yaw].join("/");
      if (viewKey === positionKey) return;
      positionKey = viewKey;
      if (offset !== previousOffset) {
        camera.setViewOffset(width, height, offset, 0, width, height);
        previousOffset = offset;
      }
      const sine = Math.sin(yaw);
      const cosine = Math.cos(yaw);
      const world = (x, y, at) => {
        const distance = at - junctionAt;
        return [x * cosine - distance * sine, y, -junctionAt - distance * cosine - x * sine];
      };
      camera.position.set(...world(cameraX, width < 650 ? 5.5 : 5.4, position - 3.3));
      camera.lookAt(...world(cameraX * .62, 2.45, position + 38));
      rig.position.set(...world(lane, .01, position + carDistance));
      rig.rotation.y = yaw - steer * .23;
      car.rotation.z = -steer * .075;
      for (const exhaust of exhausts) exhaust.visible = boosting;
      gems.forEach(({id, mesh}, index) => {
        mesh.visible = !collected.has(id);
        mesh.position.y = .83 + Math.sin(clock * 3.5 + index) * .14;
        mesh.rotation.y = clock * 1.52 + index;
      });
      renderer.render(scene, camera);
    }
  };
}
