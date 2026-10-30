import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { onTick } from "../lib/ticker";
import { clamp, prefersReducedMotion, warmthColor } from "../lib/util";
import { useVibe } from "../lib/vibe";

/* A hand-drawn loop, turned into a twisted calligraphic ribbon. */
function makeBrushGeometry(segments = 340, sides = 8) {
  const pts: THREE.Vector3[] = [];
  const N = 30;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const r = 1.24 + 0.26 * Math.cos(3 * a + 0.45) + 0.07 * Math.sin(5 * a + 1.2);
    pts.push(
      new THREE.Vector3(
        r * Math.cos(a) * 1.08,
        0.62 * Math.sin(3 * a + 0.6) + 0.16 * Math.sin(5 * a + 2.0),
        r * Math.sin(a) * 0.92,
      ),
    );
  }
  const curve = new THREE.CatmullRomCurve3(pts, true, "centripetal", 0.62);
  const frames = curve.computeFrenetFrames(segments, true);

  const positions: number[] = [];
  const centers: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    const p = curve.getPointAt(u);
    const nrm = frames.normals[i];
    const bin = frames.binormals[i];
    const w =
      0.185 +
      0.1 * Math.sin(Math.PI * 2 * u + 2.1) +
      0.055 * Math.sin(Math.PI * 4 * u + 0.7);
    const twist = Math.PI * 2 * u + 0.9 * Math.sin(Math.PI * 2 * u);
    const ct = Math.cos(twist);
    const st = Math.sin(twist);
    for (let j = 0; j < sides; j++) {
      const ang = (j / sides) * Math.PI * 2;
      const ca = Math.cos(ang);
      const sa = Math.sin(ang);
      const ox = nrm.x * ct + bin.x * st;
      const oy = nrm.y * ct + bin.y * st;
      const oz = nrm.z * ct + bin.z * st;
      const sx = -nrm.x * st + bin.x * ct;
      const sy = -nrm.y * st + bin.y * ct;
      const sz = -nrm.z * st + bin.z * ct;
      const rx = ca * w;
      const ry = sa * w * 0.36;
      positions.push(p.x + ox * rx + sx * ry, p.y + oy * rx + sy * ry, p.z + oz * rx + sz * ry);
      centers.push(p.x, p.y, p.z);
      uvs.push(u, j / sides);
    }
  }

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < sides; j++) {
      const j1 = (j + 1) % sides;
      const a = i * sides + j;
      const b = i * sides + j1;
      const c = (i + 1) * sides + j;
      const d = (i + 1) * sides + j1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  // make every normal point away from the centre line; winding is not trusted
  const normals = geo.getAttribute("normal");
  const posAttr = geo.getAttribute("position");
  for (let v = 0; v < posAttr.count; v++) {
    const nx = normals.getX(v);
    const ny = normals.getY(v);
    const nz = normals.getZ(v);
    const dx = posAttr.getX(v) - centers[v * 3];
    const dy = posAttr.getY(v) - centers[v * 3 + 1];
    const dz = posAttr.getZ(v) - centers[v * 3 + 2];
    if (nx * dx + ny * dy + nz * dz < 0) {
      normals.setXYZ(v, -nx, -ny, -nz);
    }
  }

  // average the seam normals so the loop closes invisibly
  const last = segments * sides;
  for (let j = 0; j < sides; j++) {
    const a = new THREE.Vector3().fromBufferAttribute(normals, j);
    const b = new THREE.Vector3().fromBufferAttribute(normals, last + j);
    const avg = a.clone().add(b).normalize();
    normals.setXYZ(j, avg.x, avg.y, avg.z);
    normals.setXYZ(last + j, avg.x, avg.y, avg.z);
  }
  normals.needsUpdate = true;

  return { geo, curve };
}

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  uniform vec2 uMouse;
  varying vec3 vN;
  varying vec3 vWorld;
  varying vec2 vUv;
  varying float vLift;

  void main() {
    vec3 p = position;
    vec3 n = normal;
    float t = uTime;
    float wave =
      sin(p.x * 3.1 + t * 0.9 + uMouse.x * 1.4) * cos(p.y * 2.7 - t * 0.7) * 0.055 +
      sin(p.z * 4.3 + t * 1.15 + uMouse.y * 0.8) * 0.032 +
      sin((p.x + p.y + p.z) * 2.1 - t * 0.45) * 0.018;
    float lift = wave * uAmp;
    p += n * lift;
    vLift = lift;
    vUv = uv;
    vec4 wp = modelMatrix * vec4(p, 1.0);
    vWorld = wp.xyz;
    vN = normalize(mat3(modelMatrix) * n);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec3 uHot;
  uniform vec3 uInk;
  uniform vec3 uBone;
  uniform vec3 uCam;
  varying vec3 vN;
  varying vec3 vWorld;
  varying vec2 vUv;
  varying float vLift;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  vec2 rot(vec2 p, float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c) * p;
  }

  void main() {
    vec3 N = normalize(vN);
    vec3 L1 = normalize(vec3(0.45, 0.85, 0.55));
    vec3 L2 = normalize(vec3(-0.75, -0.3, 0.45));
    vec3 V = normalize(uCam - vWorld);

    float d1 = max(dot(N, L1), 0.0);
    float d2 = max(dot(N, L2), 0.0);
    float shade = smoothstep(0.1, 0.92, clamp(d1 * 0.95 + d2 * 0.3 + 0.3, 0.0, 1.0));
    float fres = pow(1.0 - max(dot(N, V), 0.0), 3.4);

    vec3 deep = vec3(0.045, 0.012, 0.006);
    vec3 col = mix(deep, uHot, shade);
    col = mix(col, uBone, fres * 0.18);

    // brush striations along the stroke
    float stri = sin(vUv.x * 620.0 + sin(vUv.y * 12.0) * 2.4) * 0.5 + 0.5;
    col *= 0.9 + stri * 0.1;

    // riso halftone: dark ink dots, larger in the shadows
    vec2 cell = rot(gl_FragCoord.xy + vec2(0.0, uTime * 2.0), 0.38) / 5.6;
    float d = length(fract(cell) - 0.5);
    float radius = (0.58 - shade * 0.3) * (0.72 + fres * 0.5);
    float dots = 1.0 - smoothstep(radius - 0.05, radius + 0.015, d);
    col = mix(col, uInk * 0.9, dots * (0.52 + (1.0 - shade) * 0.2) + dots * (1.0 - shade) * 0.2);

    // specular fleck
    float spec = pow(max(dot(reflect(-L1, N), V), 0.0), 26.0);
    col += uBone * spec * 0.22;

    // ink tooth
    col += (hash(gl_FragCoord.xy + uTime) - 0.5) * 0.018;

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

const PARTICLE_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  attribute float aSize;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vA;

  void main() {
    vColor = aColor;
    vec3 p = position;
    float t = uTime * 0.13;
    float c = cos(t), s = sin(t);
    p.xz = mat2(c, -s, s, c) * p.xz;
    p.y += sin(uTime * 0.35 + position.x * 1.8) * 0.09 * uAmp;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = aSize * (13.0 / max(0.1, -mv.z)) * (0.75 + uAmp * 0.3);
    vA = smoothstep(11.0, 3.2, -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const PARTICLE_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vA;
  void main() {
    vec2 c = abs(gl_PointCoord - 0.5);
    if (max(c.x, c.y) > 0.34) discard;
    gl_FragColor = vec4(vColor, vA * 0.62);
    #include <colorspace_fragment>
  }
`;

export function Organism() {
  const mountRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const [fallback, setFallback] = useState(false);
  const { vibe } = useVibe();
  const vibeRef = useRef(vibe);
  useEffect(() => {
    vibeRef.current = vibe;
  }, [vibe]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      setFallback(true);
      return;
    }

    const reduced = prefersReducedMotion();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
    camera.position.set(0, 0.12, 5.7);

    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const { geo, curve } = makeBrushGeometry();

    const uniforms = {
      uTime: { value: 0 },
      uAmp: { value: 0.9 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uHot: { value: new THREE.Color(warmthColor(vibeRef.current.warmth)) },
      uInk: { value: new THREE.Color("#0d0c0a") },
      uBone: { value: new THREE.Color("#eee7d7") },
      uCam: { value: new THREE.Vector3() },
    };

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      side: THREE.DoubleSide,
    });
    const brush = new THREE.Mesh(geo, mat);
    group.add(brush);

    // drafting guide around the stroke
    const guidePts = curve.getPoints(260).map((p) => p.clone().multiplyScalar(1.115));
    const guideGeo = new THREE.BufferGeometry().setFromPoints(guidePts);
    const guide = new THREE.LineLoop(
      guideGeo,
      new THREE.LineBasicMaterial({ color: "#eee7d7", transparent: true, opacity: 0.2 }),
    );
    group.add(guide);

    // measuring dial
    const dial = new THREE.Group();
    const ringPts: THREE.Vector3[] = [];
    const R = 2.02;
    for (let i = 0; i <= 180; i++) {
      const a = (i / 180) * Math.PI * 2;
      ringPts.push(new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R * 0.42, 0));
    }
    const ring = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(ringPts),
      new THREE.LineBasicMaterial({ color: "#eee7d7", transparent: true, opacity: 0.16 }),
    );
    dial.add(ring);
    const tickGeo = new THREE.BufferGeometry();
    const tickPos: number[] = [];
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const inner = i % 4 === 0 ? 0.1 : 0.055;
      tickPos.push(
        Math.cos(a) * R,
        Math.sin(a) * R * 0.42,
        0,
        Math.cos(a) * (R + inner),
        Math.sin(a) * (R + inner) * 0.42,
        0,
      );
    }
    tickGeo.setAttribute("position", new THREE.Float32BufferAttribute(tickPos, 3));
    const ticks = new THREE.LineSegments(
      tickGeo,
      new THREE.LineBasicMaterial({ color: "#ff4d18", transparent: true, opacity: 0.7 }),
    );
    dial.add(ticks);
    dial.rotation.set(0.32, 0, 0.08);
    group.add(dial);

    // spore dust
    const COUNT = 420;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(COUNT * 3);
    const pCol = new Float32Array(COUNT * 3);
    const pSize = new Float32Array(COUNT);
    const bone = new THREE.Color("#eee7d7");
    const orange = new THREE.Color("#ff4d18");
    const lime = new THREE.Color("#c8e86b");
    for (let i = 0; i < COUNT; i++) {
      const r = 1.75 + Math.random() * 1.9;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pPos[i * 3] = Math.sin(ph) * Math.cos(th) * r;
      pPos[i * 3 + 1] = Math.cos(ph) * r * 0.55;
      pPos[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * r * 0.85;
      const pick = Math.random();
      const c = pick < 0.55 ? bone : pick < 0.9 ? orange : lime;
      pCol[i * 3] = c.r;
      pCol[i * 3 + 1] = c.g;
      pCol[i * 3 + 2] = c.b;
      pSize[i] = 0.8 + Math.random() * 2.6;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute("aColor", new THREE.BufferAttribute(pCol, 3));
    pGeo.setAttribute("aSize", new THREE.BufferAttribute(pSize, 1));
    const pMat = new THREE.ShaderMaterial({
      vertexShader: PARTICLE_VERT,
      fragmentShader: PARTICLE_FRAG,
      uniforms: { uTime: uniforms.uTime, uAmp: uniforms.uAmp },
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    const spores = new THREE.Points(pGeo, pMat);
    scene.add(spores);

    // interaction state
    let px = 0;
    let py = 0;
    let tx = 0;
    let ty = 0;
    let autoY = 0;
    let dragY = 0;
    let dragX = 0;
    let pulse = 0;
    let dragging = false;
    let moved = 0;
    let lastX = 0;
    let lastY = 0;
    let visible = true;

    const el = renderer.domElement;
    el.style.width = "100%";
    el.style.height = "100%";
    el.style.display = "block";
    el.style.touchAction = "pan-y";

    const onDown = (e: PointerEvent) => {
      dragging = true;
      moved = 0;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      tx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ty = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      if (dragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        moved += Math.abs(dx) + Math.abs(dy);
        dragY += dx * 0.008;
        dragX = clamp(dragX + dy * 0.005, -0.8, 0.8);
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };
    const onUp = () => {
      if (dragging && moved < 6) pulse = 1;
      dragging = false;
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("pointerleave", onUp);

    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const narrow = w / h < 1.1;
      group.scale.setScalar(narrow ? 0.86 : 1.1);
      camera.position.z = narrow ? 6.2 : 5.2;
    });
    ro.observe(mount);

    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
    });
    io.observe(mount);

    let time = 0;
    let last = 0;
    let frame = 0;

    const stop = onTick((t) => {
      const dt = last ? Math.min(0.05, t - last) : 0.016;
      last = t;
      if (!visible) return;
      time += reduced ? 0 : dt * (0.55 + vibeRef.current.tempo * 0.9);

      const k = 1 - Math.pow(0.0015, dt);
      px += (tx - px) * k * 0.7;
      py += (ty - py) * k * 0.7;
      if (!reduced && !dragging) autoY += dt * (0.12 + vibeRef.current.tempo * 0.14);

      group.rotation.y = autoY + dragY + px * 0.55;
      group.rotation.x = -0.22 + dragX - py * 0.3;
      group.rotation.z = Math.sin(time * 0.23) * 0.03;

      pulse *= 0.94;
      uniforms.uTime.value = time;
      uniforms.uAmp.value =
        0.75 + vibeRef.current.tempo * 1.1 + pulse * 1.6 + Math.abs(px) * 0.15;
      uniforms.uHot.value.set(warmthColor(vibeRef.current.warmth));
      uniforms.uMouse.value.set(px, py);
      uniforms.uCam.value.copy(camera.position);

      spores.rotation.y = -time * 0.05;
      dial.rotation.z = 0.08 + time * 0.02;
      guide.rotation.y = -time * 0.02;

      renderer.render(scene, camera);

      if ((frame++ & 15) === 0 && readoutRef.current) {
        const deg = ((((group.rotation.y * 180) / Math.PI) % 360) + 360) % 360;
        readoutRef.current.textContent = String(Math.round(deg)).padStart(3, "0");
      }
    });

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("pointerleave", onUp);
      geo.dispose();
      guideGeo.dispose();
      pGeo.dispose();
      mat.dispose();
      pMat.dispose();
      renderer.dispose();
      if (el.parentElement === mount) mount.removeChild(el);
    };
  }, []);

  return (
    <figure className="organism" data-cursor="DRAG / POKE">
      <div className="organism__view">
        <div className="organism__stage" ref={mountRef} aria-hidden="true" />
        {fallback && (
          <div className="organism__fallback" aria-hidden="true">
            <div className="orb" />
          </div>
        )}
        <div className="organism__hud" aria-hidden="true">
          <span className="hud-tl">FIG. 00 / THE HUNCH</span>
          <span className="hud-tr">
            MESH Nº 114 · AZ <span ref={readoutRef}>000</span>°
          </span>
          <span className="hud-bl">3 INKS / BONE STOCK</span>
          <span className="hud-br">MOVE THE POINTER</span>
        </div>
      </div>
      <figcaption className="organism__cap">
        <span className="cap-line" />
        <span>
          A specimen, not an ornament. It doesn’t know what it is.
          <em> Drag it. Poke it.</em>
        </span>
      </figcaption>
    </figure>
  );
}
