import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { BottleMesh } from "./Bottle";
import { Studio } from "./Stage";
import { VARIANTS, auraStore, scrollToId, useAura } from "@/lib/aura-store";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const SLOTS = [
  { x: -4.6, z: -0.6, y: 0.15 },
  { x: -1.55, z: 0.2, y: 0 },
  { x: 1.55, z: -0.4, y: 0.25 },
  { x: 4.6, z: 0.3, y: -0.05 },
];

function Item({ i, visible, hovered }: { i: number; visible: boolean; hovered: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const v = VARIANTS[i];
  const slot = SLOTS[i];
  const reduced = useReducedMotion();
  const born = useRef<number | null>(null);
  const { size } = useThree();
  useFrame((s, d) => {
    if (!ref.current || !slot) return;
    const m = size.width < 640 ? 0.42 : 1;
    ref.current.scale.setScalar(size.width < 640 ? 0.55 : 1);
    if (visible && born.current === null) born.current = s.clock.elapsedTime;
    const age = born.current === null ? 0 : s.clock.elapsedTime - born.current - i * 0.15;
    const p = reduced ? 1 : Math.min(Math.max(age / 0.9, 0), 1);
    const e = 1 - Math.pow(1 - p, 3);
    ref.current.position.set(slot.x * m, -1.8 * (size.width < 640 ? 0.55 : 1) + (1 - e) * -2.5 + (hovered ? 0.12 : 0), slot.z);
    ref.current.rotation.y += (0.12 - i * 0.08 + (hovered ? 0.08 : 0) - ref.current.rotation.y) * (reduced ? 1 : 1 - Math.exp(-4 * Math.min(d, .05)));
    ref.current.visible = p > 0;
  });
  if (!v || !slot) return null;
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
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && setVisible(true), { threshold: 0.35 });
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
          <Button variant="aura" size="aura"
            key={v.id}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(-1)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(-1)}
            onClick={() => pick(v.id)}
            aria-label={`Open ${v.name} in the bottle viewer`}
            className="group flex flex-col items-center gap-1 rounded-full py-2 text-center transition-colors focus-visible:outline-2 focus-visible:outline-ring"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-foreground uppercase">
              <span className={`collection-swatch variant-${v.id}`} />
              {v.name}
            </span>
            <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              {active === v.id ? "Currently selected" : "View this color →"}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
