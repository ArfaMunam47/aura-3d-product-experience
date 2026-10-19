import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import { BottleMesh } from "./Bottle";
import { auraStore, useAura, variantById, type DetailView } from "@/lib/aura-store";

type Pose = { x: number; y: number; s: number; ry: number; rz: number; show: number; bg: string };

/** One pose per [data-scene] element, in DOM order. x is a fraction of the half-viewport width. */
/** Visible height at z=0 is ≈6.3 units; bottle is 3.6 units tall, so s≈0.85 fills ~48% of the screen. */
export const POSES: Record<string, Pose> = {
  hero: { x: 0.44, y: -0.05, s: 0.88, ry: 0.25, rz: -0.36, show: 1, bg: "#A9C4E2" },
  reveal: { x: 0.42, y: 0, s: 0.8, ry: 1.3, rz: 0.3, show: 1, bg: "#FBF6EE" },
  viewer: { x: 0, y: 0, s: 0.95, ry: 0, rz: 0, show: 1, bg: "#F6C9B2" },
  form: { x: -0.42, y: 0, s: 0.92, ry: 0.9, rz: 0.12, show: 1, bg: "#CFE2C3" },
  cap: { x: -0.42, y: -1.7, s: 1.45, ry: 2.2, rz: 0.05, show: 1, bg: "#BFD8B4" },
  ritual: { x: -0.42, y: 0.9, s: 1.15, ry: 3.4, rz: -0.05, show: 1, bg: "#E6EFDE" },
  collection: { x: 0, y: -6, s: 0.6, ry: 4.5, rz: 0, show: 0, bg: "#FFFFFF" },
  world: { x: 0, y: -6, s: 0.6, ry: 5.2, rz: 0, show: 0, bg: "#F7E3D3" },
  final: { x: 0.44, y: -0.05, s: 0.85, ry: Math.PI * 2 + 0.25, rz: -0.36, show: 1, bg: "#A9C4E2" },
};

const DETAIL: Record<DetailView, { s: number; y: number } | null> = {
  full: null,
  cap: { s: 1.6, y: -2.0 },
  finish: { s: 1.3, y: -0.2 },
  base: { s: 1.5, y: 1.7 },
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);
const tmpA = new THREE.Color();
const tmpB = new THREE.Color();

/** Continuous scene position: integer = centred on scene i. */
function readScroll() {
  const els = Array.from(document.querySelectorAll<HTMLElement>("[data-scene]"));
  const c = window.innerHeight / 2;
  const mids = els.map((el) => {
    const r = el.getBoundingClientRect();
    return r.top + r.height / 2;
  });
  const mid = (k: number) => mids[k] ?? 0;
  let i = 0;
  while (i < mids.length - 1 && mid(i + 1) <= c) i++;
  let f = 0;
  if (i < mids.length - 1 && mid(i) <= c) f = (c - mid(i)) / (mid(i + 1) - mid(i));
  if (i === 0 && mid(0) > c) f = 0;
  const hero = POSES["hero"] as Pose;
  const a: Pose = POSES[els[i]?.dataset["scene"] ?? "hero"] ?? hero;
  const b: Pose = POSES[els[Math.min(i + 1, els.length - 1)]?.dataset["scene"] ?? "hero"] ?? a;
  return { a, b, f: ease(Math.min(Math.max(f, 0), 1)), activeName: els[f > 0.5 ? i + 1 : i]?.dataset["scene"] };
}

function Rig() {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const { camera, viewport, size } = useThree();
  const variant = useAura((s) => variantById(s.variant));
  const pointer = useRef({ x: 0, y: 0 });
  const cur = useRef({ x: 0, y: 0, s: 1, ry: 0, rz: 0, show: 1, dx: 0, dy: 0 });

  useFrame((state, raw) => {
    const dt = Math.min(raw, 0.05);
    const { a, b, f, activeName } = readScroll();
    const st = auraStore.get();
    const mobile = size.width < 820;
    const halfW = viewport.width / 2;

    const inViewer = activeName === "viewer" ? 1 : 0;
    let tx = lerp(a.x, b.x, f) * halfW * (mobile ? 0.55 : 1);
    let ty = lerp(a.y, b.y, f);
    let ts = lerp(a.s, b.s, f) * (mobile ? 0.5 : 1);
    const show = lerp(a.show, b.show, f);
    const d = DETAIL[st.detail];
    if (inViewer && d) {
      ts = d.s * (mobile ? 0.7 : 1);
      ty = d.y * (mobile ? 0.7 : 1);
    }
    if (mobile && !inViewer) ty -= 1.9;

    // background
    tmpA.set(a.bg);
    tmpB.set(b.bg);
    tmpA.lerp(tmpB, f);
    document.documentElement.style.setProperty("--scene-bg", `#${tmpA.getHexString()}`);

    const k = 1 - Math.exp(-5 * dt);
    const c = cur.current;
    c.x = lerp(c.x, tx, k);
    c.y = lerp(c.y, ty, k);
    c.s = lerp(c.s, ts * (0.001 + show), k);
    c.ry = lerp(c.ry, lerp(a.ry, b.ry, f), k);
    c.rz = lerp(c.rz, lerp(a.rz, b.rz, f), k);
    c.dx = lerp(c.dx, inViewer ? st.dragX : 0, 1 - Math.exp(-10 * dt));
    c.dy = lerp(c.dy, inViewer ? st.dragY : 0, 1 - Math.exp(-10 * dt));

    const t = state.clock.elapsedTime;
    const idle = inViewer ? 0 : 1;
    if (group.current) {
      group.current.position.set(c.x, c.y + Math.sin(t * 0.9) * 0.03 * idle, 0);
      group.current.scale.setScalar(c.s);
      group.current.rotation.set(c.dy, 0, c.rz + Math.sin(t * 0.6) * 0.015 * idle);
    }
    if (inner.current) inner.current.rotation.y = c.ry + c.dx + Math.sin(t * 0.4) * 0.12 * idle;

    // restrained pointer parallax on the camera
    pointer.current.x = lerp(pointer.current.x, state.pointer.x, k);
    pointer.current.y = lerp(pointer.current.y, state.pointer.y, k);
    camera.position.x = pointer.current.x * 0.25 * idle;
    camera.position.y = pointer.current.y * 0.15 * idle;
    camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={group}>
      <group position={[0, -1.8, 0]}>
        <group ref={inner}>
          <BottleMesh body={variant.body} cap={variant.cap} />
        </group>
      </group>
    </group>
  );
}

export function Studio() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 5]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-5, 2, -3]} intensity={0.6} color="#F6C7AE" />
      <Environment resolution={256}>
        <Lightformer intensity={2.2} position={[0, 5, 2]} scale={[10, 4, 1]} rotation-x={Math.PI / 2} />
        <Lightformer intensity={1.4} color="#FFE4D4" position={[-5, 1, 1]} rotation-y={Math.PI / 2} scale={[3, 8, 1]} />
        <Lightformer intensity={1.2} color="#D9E8F6" position={[5, 1, 1]} rotation-y={-Math.PI / 2} scale={[3, 8, 1]} />
        <Lightformer intensity={0.6} position={[0, 0, -6]} scale={[12, 6, 1]} />
      </Environment>
    </>
  );
}

export function Stage() {
  return (
    <div className="pointer-events-none fixed inset-0 stage-layer" aria-hidden>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, 10], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={() => setTimeout(() => auraStore.set({ ready: true }), 250)}
        eventSource={typeof document !== "undefined" ? document.body : undefined}
        eventPrefix="client"
      >
        <Studio />
        <Rig />
      </Canvas>
    </div>
  );
}
