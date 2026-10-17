import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { BottleMesh } from "./Bottle";
import { Studio } from "./Stage";
import { VARIANTS, auraStore, scrollToId, useAura } from "@/lib/aura-store";

const SLOTS = [
  { x: -3.3, z: -0.6, y: 0.15 },
  { x: -1.1, z: 0.2, y: 0 },
  { x: 1.1, z: -0.4, y: 0.25 },
  { x: 3.3, z: 0.3, y: -0.05 },
];

function Item({ i, visible, hovered }: { i: number; visible: boolean; hovered: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const v = VARIANTS[i];
  const born = useRef<number | null>(null);
  useFrame((s, d) => {
    if (!ref.current) return;
    if (visible && born.current === null) born.current = s.clock.elapsedTime;
    const age = born.current === null ? 0 : s.clock.elapsedTime - born.current - i * 0.15;
    const p = Math.min(Math.max(age / 0.9, 0), 1);
    const e = 1 - Math.pow(1 - p, 3);
    const slot = SLOTS[i];
    ref.current.position.set(slot.x, slot.y - 1.7 + (1 - e) * -2.5 + (hovered ? 0.12 : 0), slot.z);
    ref.current.rotation.y += (0.5 - i * 0.25 + (hovered ? 0.5 : 0) - ref.current.rotation.y) * (1 - Math.exp(-4 * d));
    ref.current.visible = p > 0;
  });
  return (
    <group ref={ref}>
      <BottleMesh body={v.body} cap={v.cap} />
      <ContactShadows position={[0, 0.001, 0]} scale={2.6} blur={2.6} opacity={0.32} far={1.2} color="#38253F" />
    </group>
  );
}

export function Collection() {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hover, setHover] = useState(-1);
  const active = useAura((s) => s.variant);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.35 });
    if (host.current) io.observe(host.current);
    return () => io.disconnect();
  }, []);

  const pick = (id: (typeof VARIANTS)[number]["id"]) => {
    auraStore.set({ variant: id, detail: "full", dragX: 0, dragY: 0 });
    scrollToId("bottle");
  };

  return (
    <div ref={host} className="relative mx-auto w-full max-w-6xl">
      <div className="h-[46vh] min-h-[320px] w-full md:h-[56vh]">
        <Canvas dpr={[1, 2]} camera={{ position: [0, 0.6, 11], fov: 32 }} gl={{ alpha: true }}>
          <Studio />
          {VARIANTS.map((v, i) => (
            <Item key={v.id} i={i} visible={visible} hovered={hover === i} />
          ))}
        </Canvas>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {VARIANTS.map((v, i) => (
          <button
            key={v.id}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(-1)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(-1)}
            onClick={() => pick(v.id)}
            aria-label={`Open ${v.name} in the bottle viewer`}
            className="group flex flex-col items-center gap-1 rounded-full py-2 text-center transition-colors focus-visible:outline-2 focus-visible:outline-ring"
          >
            <span className="flex items-center gap-2 text-sm font-medium tracking-[0.2em] text-foreground uppercase">
              <span className="size-2.5 rounded-full border border-foreground/30" style={{ background: v.swatch }} />
              {v.name}
            </span>
            <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              {active === v.id ? "Currently selected" : "View this color →"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
