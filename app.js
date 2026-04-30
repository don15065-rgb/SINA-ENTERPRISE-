/* ============================================================
   SINA Enterprise — Three.js 3D Engine
   Scenes: Hero (stethoscope + particles), About (SE logo),
           Markets (DNA helix), Services (3 mini icons)
   ============================================================ */

/* Scripts load at end of <body>, so DOM is ready — no DOMContentLoaded needed.
   We defer via requestAnimationFrame to ensure browser has done first layout pass. */
requestAnimationFrame(() => {
  initHeroScene();
  initLogoScene();
  initDNAScene();
  initServiceIcons();
  initScrollReveal();
  initNav();
  initForm();
});

/* ============================================================
   SHARED HELPERS
   ============================================================ */

function mkMetal(color, emissive, emissiveIntensity) {
  return new THREE.MeshStandardMaterial({
    color: color,
    metalness: 0.95,
    roughness: 0.05,
    emissive: emissive || 0x001122,
    emissiveIntensity: emissiveIntensity || 0.25,
  });
}

function mkBox(w, h, d, pos, mat) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(...pos);
  return mesh;
}

/* ============================================================
   SCENE 1 — HERO: Stethoscope + Particle Network
   ============================================================ */

function initHeroScene() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(58, 1, 0.1, 200);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  function resize() {
    const w = canvas.clientWidth  || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  camera.position.set(0, 0, 9);

  /* --- Lighting --- */
  scene.add(new THREE.AmbientLight(0x0a1a33, 1.2));

  const keyLight = new THREE.DirectionalLight(0x00e5ff, 3.5);
  keyLight.position.set(6, 6, 8);
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0x0044ff, 2.5, 40);
  fillLight.position.set(-10, -4, 4);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0x00e5ff, 1.8, 25);
  rimLight.position.set(0, 10, -6);
  scene.add(rimLight);

  const glowLight = new THREE.PointLight(0x00e5ff, 1, 15);
  glowLight.position.set(3, 0, 2);
  scene.add(glowLight);

  /* --- Materials --- */
  const cyanMetal = mkMetal(0x00c8e0, 0x003344, 0.3);
  const darkMetal = mkMetal(0x091825, 0x000000, 0);
  darkMetal.metalness = 0.7;
  darkMetal.roughness = 0.3;

  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x00e5ff,
    emissiveIntensity: 0.7,
    metalness: 0.3,
    roughness: 0.5,
  });

  /* --- Build 3D Stethoscope --- */
  const stetho = buildStethoscope(cyanMetal, darkMetal, glowMat);
  stetho.position.set(2.8, -0.5, 0);
  scene.add(stetho);

  /* --- Particle Network --- */
  const particles = buildParticleNetwork();
  scene.add(particles);

  /* --- Floating Wireframe Gems --- */
  const gems = buildGems();
  scene.add(gems);

  /* --- Mouse Parallax --- */
  let mx = 0, my = 0;
  window.addEventListener('mousemove', e => {
    mx = (e.clientX / window.innerWidth  - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* --- Animate --- */
  let t = 0;
  (function loop() {
    requestAnimationFrame(loop);
    t += 0.008;

    stetho.rotation.y   += 0.004;
    stetho.rotation.x    = 0.08 + Math.sin(t * 0.55) * 0.04;
    stetho.position.y    = -0.5 + Math.sin(t * 0.38) * 0.12;

    particles.rotation.y += 0.0004;

    gems.children.forEach((g, i) => {
      g.rotation.x += 0.004 + i * 0.001;
      g.rotation.z += 0.003 + i * 0.0008;
      g.position.y += Math.sin(t + i * 1.4) * 0.001;
    });

    camera.position.x += (mx * 0.25 - camera.position.x) * 0.04;
    camera.position.y += (-my * 0.2  - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  })();
}

/* --- Stethoscope geometry --- */
function buildStethoscope(metalMat, darkMat, glowMat) {
  const g = new THREE.Group();

  /* Chest piece disc */
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.1, 48), metalMat);
  disc.rotation.x = Math.PI / 2;
  g.add(disc);

  /* Outer ring */
  g.add(new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.065, 16, 64), metalMat));

  /* Inner accent ring */
  g.add(new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.022, 12, 48), glowMat));

  /* Membrane (dark circle) */
  const mem = new THREE.Mesh(new THREE.CircleGeometry(0.5, 48), darkMat);
  mem.position.z = 0.06;
  g.add(mem);

  /* Center glow dot */
  const dot = new THREE.Mesh(new THREE.CircleGeometry(0.09, 24), glowMat);
  dot.position.z = 0.07;
  g.add(dot);

  /* Main tube (head → Y-junction) */
  const mainPts = [
    new THREE.Vector3( 0,    0,     0.09),
    new THREE.Vector3( 0,    0.45,  0.32),
    new THREE.Vector3( 0.08, 0.95,  0.18),
    new THREE.Vector3( 0,    1.45,  0.02),
    new THREE.Vector3( 0,    1.95,  0.1 ),
  ];
  g.add(new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mainPts), 32, 0.048, 10, false),
    metalMat
  ));

  /* Y-junction ball */
  const jBall = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), metalMat);
  jBall.position.set(0, 1.95, 0.1);
  g.add(jBall);

  /* Left ear tube */
  const leftPts = [
    new THREE.Vector3( 0,     1.95,  0.10),
    new THREE.Vector3(-0.28,  2.20,  0.18),
    new THREE.Vector3(-0.58,  2.38,  0.06),
    new THREE.Vector3(-0.90,  2.42, -0.04),
  ];
  g.add(new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(leftPts), 16, 0.042, 10, false),
    metalMat
  ));

  /* Right ear tube */
  const rightPts = [
    new THREE.Vector3( 0,    1.95,  0.10),
    new THREE.Vector3( 0.28, 2.20,  0.18),
    new THREE.Vector3( 0.58, 2.38,  0.06),
    new THREE.Vector3( 0.90, 2.42, -0.04),
  ];
  g.add(new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rightPts), 16, 0.042, 10, false),
    metalMat
  ));

  /* Earpieces */
  const earGeo = new THREE.SphereGeometry(0.105, 20, 20);
  const lEar = new THREE.Mesh(earGeo, metalMat);
  lEar.position.set(-0.90, 2.42, -0.04);
  g.add(lEar);
  const rEar = new THREE.Mesh(earGeo.clone(), metalMat);
  rEar.position.set( 0.90, 2.42, -0.04);
  g.add(rEar);

  /* Ear tip cylinders (glow) */
  const tipGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.14, 14);
  const lTip = new THREE.Mesh(tipGeo, glowMat);
  lTip.position.set(-0.90, 2.42, -0.12); lTip.rotation.x = Math.PI / 2;
  g.add(lTip);
  const rTip = new THREE.Mesh(tipGeo.clone(), glowMat);
  rTip.position.set( 0.90, 2.42, -0.12); rTip.rotation.x = Math.PI / 2;
  g.add(rTip);

  /* Scale & center */
  g.scale.setScalar(1.15);
  g.position.y = -1.15;
  return g;
}

/* --- Particle Network --- */
function buildParticleNetwork() {
  const grp   = new THREE.Group();
  const COUNT = 500;
  const SPREAD_X = 22, SPREAD_Y = 12, SPREAD_Z = 8;
  const pts = [];

  for (let i = 0; i < COUNT; i++) {
    pts.push(new THREE.Vector3(
      (Math.random() - 0.5) * SPREAD_X,
      (Math.random() - 0.5) * SPREAD_Y,
      (Math.random() - 0.5) * SPREAD_Z - 2
    ));
  }

  /* Dot cloud */
  const posArr = new Float32Array(COUNT * 3);
  pts.forEach((p, i) => { posArr[i*3]=p.x; posArr[i*3+1]=p.y; posArr[i*3+2]=p.z; });
  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
  grp.add(new THREE.Points(dotGeo, new THREE.PointsMaterial({
    color: 0x00e5ff, size: 0.045, transparent: true, opacity: 0.75, sizeAttenuation: true,
  })));

  /* Connection lines */
  const linePos = [];
  let lineCount = 0;
  const MAX_LINES = 1800;
  outer:
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      if (lineCount >= MAX_LINES) break outer;
      if (pts[i].distanceTo(pts[j]) < 3.2) {
        linePos.push(pts[i].x, pts[i].y, pts[i].z, pts[j].x, pts[j].y, pts[j].z);
        lineCount++;
      }
    }
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePos), 3));
  grp.add(new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({
    color: 0x00e5ff, transparent: true, opacity: 0.055,
  })));

  return grp;
}

/* --- Floating wireframe gems --- */
function buildGems() {
  const grp = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x00e5ff,
    emissiveIntensity: 0.35,
    metalness: 0.9,
    roughness: 0.1,
    wireframe: true,
  });

  const defs = [
    { geo: new THREE.OctahedronGeometry(0.18),    pos: [-5.5,  2.5, -2.5] },
    { geo: new THREE.TetrahedronGeometry(0.14),   pos: [ 6.5, -2.5, -1.5] },
    { geo: new THREE.OctahedronGeometry(0.12),    pos: [-6.0, -1.5, -3.0] },
    { geo: new THREE.IcosahedronGeometry(0.12),   pos: [ 4.0,  3.5, -2.0] },
    { geo: new THREE.OctahedronGeometry(0.09),    pos: [-2.5, -3.5, -2.5] },
    { geo: new THREE.TetrahedronGeometry(0.10),   pos: [ 7.0,  1.0, -1.0] },
    { geo: new THREE.IcosahedronGeometry(0.08),   pos: [-4.0,  0.5, -4.0] },
  ];

  defs.forEach(({ geo, pos }) => {
    const m = new THREE.Mesh(geo, mat.clone());
    m.position.set(...pos);
    grp.add(m);
  });

  return grp;
}

/* ============================================================
   SCENE 2 — ABOUT: 3D SINA "SE" Logo
   ============================================================ */

function initLogoScene() {
  const canvas = document.getElementById('logo-canvas');
  if (!canvas) return;

  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  function resize() {
    const w = canvas.clientWidth || 480, h = canvas.clientHeight || 480;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  camera.position.set(0, 0, 5.5);

  /* --- Lighting --- */
  scene.add(new THREE.AmbientLight(0x0a1a33, 0.9));

  const key = new THREE.DirectionalLight(0x00e5ff, 4.5);
  key.position.set(6, 6, 6);
  scene.add(key);

  const fill = new THREE.PointLight(0x0055ff, 2.5, 25);
  fill.position.set(-6, -4, 4);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffffff, 1.2);
  rim.position.set(-4, 0, -6);
  scene.add(rim);

  const glow = new THREE.PointLight(0x00e5ff, 1.5, 12);
  glow.position.set(0, 0, 3);
  scene.add(glow);

  /* --- Logo --- */
  const logo = buildSELogo();
  scene.add(logo);

  /* --- Orbit rings --- */
  const orbits = buildOrbitRings();
  scene.add(orbits);

  /* --- Animate --- */
  let t = 0;
  (function loop() {
    requestAnimationFrame(loop);
    t += 0.008;

    logo.rotation.y   += 0.007;
    logo.position.y    = Math.sin(t * 0.5) * 0.12;

    orbits.rotation.y -= 0.009;
    orbits.rotation.x  = Math.sin(t * 0.35) * 0.28;

    renderer.render(scene, camera);
  })();
}

function buildSELogo() {
  const grp = new THREE.Group();
  const D   = 0.22;  /* extrude depth */

  const mat = mkMetal(0x00c8e0, 0x003344, 0.35);
  const glowEdge = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x00e5ff,
    emissiveIntensity: 0.55,
    metalness: 0.4,
    roughness: 0.4,
  });

  /* === Letter S (left) === */
  const S = new THREE.Group();
  const sw = 0.14, sl = 0.6, sh = 0.13;
  S.add(mkBox(sl, sh, D, [ 0,    0.52, 0], mat));  /* top bar    */
  S.add(mkBox(sw, 0.38, D, [-0.24, 0.24, 0], mat));  /* upper left */
  S.add(mkBox(sl, sh, D, [ 0,    0,   0], mat));  /* mid bar    */
  S.add(mkBox(sw, 0.38, D, [ 0.24,-0.24, 0], mat));  /* lower right*/
  S.add(mkBox(sl, sh, D, [ 0,   -0.52, 0], mat));  /* bot bar    */
  S.position.x = -0.72;
  grp.add(S);

  /* === Letter E (right) === */
  const E = new THREE.Group();
  E.add(mkBox(sw, 1.24, D, [-0.27,  0,    0], mat));  /* vertical   */
  E.add(mkBox(sl, sh,   D, [ 0,     0.52, 0], mat));  /* top bar    */
  E.add(mkBox(sl * 0.75, sh, D, [-0.075, 0, 0], mat));  /* mid bar    */
  E.add(mkBox(sl, sh,   D, [ 0,    -0.52, 0], mat));  /* bot bar    */
  E.position.x = 0.48;
  grp.add(E);

  /* === Outer border frame === */
  const BW = 0.028, BH = 1.7, BW2 = 3.4;
  const frameMat = glowEdge;
  grp.add(mkBox(BW2, BW,  BW, [ 0,    0.88, 0], frameMat)); /* top    */
  grp.add(mkBox(BW2, BW,  BW, [ 0,   -0.88, 0], frameMat)); /* bottom */
  grp.add(mkBox(BW,  BH,  BW, [-1.72, 0,    0], frameMat)); /* left   */
  grp.add(mkBox(BW,  BH,  BW, [ 1.72, 0,    0], frameMat)); /* right  */

  /* === Corner glow dots === */
  const dotGeo = new THREE.SphereGeometry(0.055, 12, 12);
  [[-1.72, 0.88], [1.72, 0.88], [-1.72, -0.88], [1.72, -0.88]].forEach(([x, y]) => {
    const d = new THREE.Mesh(dotGeo, glowEdge);
    d.position.set(x, y, 0);
    grp.add(d);
  });

  return grp;
}

function buildOrbitRings() {
  const grp   = new THREE.Group();
  const COUNT = 90;

  const ringDef = [
    { r: 2.4,  tilt: 0,            color: 0x00e5ff, size: 0.055, opacity: 0.6  },
    { r: 2.0,  tilt: Math.PI/2,    color: 0x0066ff, size: 0.04,  opacity: 0.4  },
    { r: 2.8,  tilt: Math.PI/3,    color: 0x00e5ff, size: 0.03,  opacity: 0.3  },
  ];

  ringDef.forEach(({ r, tilt, color, size, opacity }) => {
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const a = (i / COUNT) * Math.PI * 2;
      pos[i*3]   = Math.cos(a) * r;
      pos[i*3+1] = 0;
      pos[i*3+2] = Math.sin(a) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const ring = new THREE.Points(geo, new THREE.PointsMaterial({
      color, size, transparent: true, opacity, sizeAttenuation: true,
    }));
    ring.rotation.x = tilt;
    grp.add(ring);
  });

  return grp;
}

/* ============================================================
   SCENE 3 — MARKETS: DNA Double Helix
   ============================================================ */

function initDNAScene() {
  const canvas = document.getElementById('dna-canvas');
  if (!canvas) return;

  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  function resize() {
    const w = canvas.clientWidth || 500, h = canvas.clientHeight || 700;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  camera.position.set(0, 0, 6.5);

  /* --- Lighting --- */
  scene.add(new THREE.AmbientLight(0x0a1a33, 0.7));

  const key = new THREE.DirectionalLight(0x00e5ff, 3.5);
  key.position.set(4, 6, 6);
  scene.add(key);

  const fill = new THREE.PointLight(0x0044ff, 2, 25);
  fill.position.set(-6, -4, 3);
  scene.add(fill);

  const dna = buildDNAHelix();
  scene.add(dna);

  let t = 0;
  (function loop() {
    requestAnimationFrame(loop);
    t += 0.006;
    dna.rotation.y  += 0.006;
    dna.position.y   = Math.sin(t * 0.9) * 0.25;
    renderer.render(scene, camera);
  })();
}

function buildDNAHelix() {
  const grp = new THREE.Group();

  const strand1Mat = mkMetal(0x00e5ff, 0x001133, 0.3);
  const strand2Mat = mkMetal(0x0055ff, 0x000033, 0.3);
  const rungMat    = new THREE.MeshStandardMaterial({
    color: 0x003355, metalness: 0.7, roughness: 0.3,
    emissive: 0x001122, emissiveIntensity: 0.2,
  });
  const nodeMat    = mkMetal(0x00e5ff, 0x00e5ff, 0.5);

  const TURNS = 4.5, HEIGHT = 7, RADIUS = 0.75, STEPS = 22;
  const TOTAL = Math.floor(TURNS * STEPS);

  /* Build helix point arrays */
  const pts1 = [], pts2 = [];
  for (let i = 0; i <= TOTAL; i++) {
    const frac  = i / TOTAL;
    const angle = frac * TURNS * Math.PI * 2;
    const y     = (frac - 0.5) * HEIGHT;
    pts1.push(new THREE.Vector3(Math.cos(angle)           * RADIUS, y, Math.sin(angle)           * RADIUS));
    pts2.push(new THREE.Vector3(Math.cos(angle + Math.PI) * RADIUS, y, Math.sin(angle + Math.PI) * RADIUS));
  }

  const curve1 = new THREE.CatmullRomCurve3(pts1);
  const curve2 = new THREE.CatmullRomCurve3(pts2);
  grp.add(new THREE.Mesh(new THREE.TubeGeometry(curve1, TOTAL * 3, 0.048, 8, false), strand1Mat));
  grp.add(new THREE.Mesh(new THREE.TubeGeometry(curve2, TOTAL * 3, 0.048, 8, false), strand2Mat));

  /* Rungs + nodes */
  const RUNGS = Math.floor(TURNS * 5);
  const nodeGeo = new THREE.SphereGeometry(0.075, 12, 12);

  for (let i = 0; i < RUNGS; i++) {
    const frac  = i / RUNGS;
    const angle = frac * TURNS * Math.PI * 2;
    const y     = (frac - 0.5) * HEIGHT;
    const p1    = new THREE.Vector3(Math.cos(angle)           * RADIUS, y, Math.sin(angle)           * RADIUS);
    const p2    = new THREE.Vector3(Math.cos(angle + Math.PI) * RADIUS, y, Math.sin(angle + Math.PI) * RADIUS);

    grp.add(new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3([p1, p2]), 4, 0.026, 6, false),
      rungMat
    ));

    const n1 = new THREE.Mesh(nodeGeo, nodeMat.clone());
    n1.position.copy(p1);
    grp.add(n1);

    const n2 = new THREE.Mesh(nodeGeo.clone(), nodeMat.clone());
    n2.position.copy(p2);
    grp.add(n2);
  }

  return grp;
}

/* ============================================================
   SCENE 4 — SERVICES: Three mini 3D icons
   ============================================================ */

function initServiceIcons() {
  [
    { id: 'svc-canvas-1', build: buildCrossIcon    },
    { id: 'svc-canvas-2', build: buildBoxIcon      },
    { id: 'svc-canvas-3', build: buildCapsuleIcon  },
  ].forEach(({ id, build }) => {
    const canvas = document.getElementById(id);
    if (!canvas) return;

    canvas.width  = 80;
    canvas.height = 80;

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(48, 1, 0.1, 50);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

    renderer.setSize(80, 80);
    renderer.setClearColor(0x000000, 0);
    camera.position.set(0, 0, 2.8);

    scene.add(new THREE.AmbientLight(0x0a1a33, 0.6));
    const light = new THREE.DirectionalLight(0x00e5ff, 3.5);
    light.position.set(3, 3, 3);
    scene.add(light);

    const model = build();
    scene.add(model);

    (function loop() {
      requestAnimationFrame(loop);
      model.rotation.y += 0.016;
      model.rotation.x  = Math.sin(Date.now() * 0.001) * 0.15;
      renderer.render(scene, camera);
    })();
  });
}

function buildCrossIcon() {
  const g   = new THREE.Group();
  const mat = mkMetal(0x00e5ff, 0x001133, 0.4);
  g.add(mkBox(0.9,  0.24, 0.18, [0, 0, 0], mat));
  g.add(mkBox(0.24, 0.9,  0.18, [0, 0, 0], mat));
  return g;
}

function buildBoxIcon() {
  const g   = new THREE.Group();
  const mat = mkMetal(0x00e5ff, 0x001133, 0.4);
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.75), mat));
  const wire = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.78, 0.78),
    new THREE.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true, transparent: true, opacity: 0.3 })
  );
  g.add(wire);
  return g;
}

function buildCapsuleIcon() {
  const g    = new THREE.Group();
  const mat1 = mkMetal(0x00e5ff, 0x001133, 0.4);
  const mat2 = mkMetal(0x0055ff, 0x000033, 0.4);

  /* Body cylinder */
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.45, 18), mat1));
  /* Top hemisphere */
  const top = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2), mat1
  );
  top.position.y = 0.225;
  g.add(top);
  /* Bottom hemisphere */
  const bot = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 18, 9, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat2
  );
  bot.position.y = -0.225;
  g.add(bot);
  g.rotation.z = Math.PI / 4;
  return g;
}

/* ============================================================
   SCROLL REVEAL
   ============================================================ */

function initScrollReveal() {
  const targets = document.querySelectorAll(
    '.principle, .service-card, .step, .market-card, .stat-item, ' +
    '.about-text, .section-header, .contact-text, .contact-form, ' +
    '.process-steps, .services-grid, .markets-content > p, ' +
    '.markets-content > h2, .markets-content > .label'
  );

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(el => obs.observe(el));
}

/* ============================================================
   NAVIGATION
   ============================================================ */

function initNav() {
  const nav      = document.getElementById('navbar');
  const toggle   = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const links    = navLinks ? navLinks.querySelectorAll('a') : [];
  const sections = document.querySelectorAll('section[id]');

  /* Scroll state */
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);

    /* Highlight active link */
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
    });
    links.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  }, { passive: true });

  /* Mobile toggle */
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
    links.forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));
  }
}

/* ============================================================
   CONTACT FORM
   ============================================================ */

function initForm() {
  const form    = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.btn-submit');
    btn.textContent = 'Submitted ✓';
    btn.style.background = '#00cc88';
    btn.disabled = true;
    if (success) success.classList.add('visible');
    setTimeout(() => {
      btn.textContent = 'Submit Requirement →';
      btn.style.background = '';
      btn.disabled = false;
      if (success) success.classList.remove('visible');
      form.reset();
    }, 4000);
  });
}
