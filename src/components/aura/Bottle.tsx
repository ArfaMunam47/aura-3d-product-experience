import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Procedural AURA bottle. Origin at the base centre; total height ≈ 3.6. */
export const BOTTLE_HEIGHT = 3.6;
const R = 0.56; // body radius
const LABEL_Y0 = 0.3;
const LABEL_H = 2.0;

function makeLabelTexture() {
  const c = document.createElement("canvas");
  c.width = 2048;
  c.height = 1024;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, c.width, c.height);
  g.save();
  // u≈0.25 of the wrap faces the camera; text runs top→bottom like an embossed wordmark
  g.translate(c.width * 0.25, c.height / 2);
  g.rotate(Math.PI / 2);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = "600 330px 'Outfit', sans-serif";
  (g as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "40px";
  g.fillStyle = "rgba(255,255,255,0.55)";
  g.fillText("AURA", 0, 0);
  g.restore();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function lathe(points: [number, number][], seg = 96) {
  return new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), seg);
}

export function BottleMesh({ body, cap }: { body: string; cap: string }) {
  const bodyMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const capMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const target = useMemo(() => ({ body: new THREE.Color(body), cap: new THREE.Color(cap) }), [body, cap]);

  const bodyGeo = useMemo(() => {
    const p: [number, number][] = [[0, 0.02], [R - 0.12, 0.0], [R - 0.04, 0.02], [R - 0.005, 0.07], [R, 0.14]];
    // straight wall
    for (let i = 0; i <= 12; i++) p.push([R, 0.14 + (i / 12) * 2.36]);
    // soft shoulder to neck (cosine ease)
    const neck = 0.27;
    for (let i = 1; i <= 24; i++) {
      const t = i / 24;
      const e = (1 - Math.cos(t * Math.PI)) / 2;
      p.push([R - (R - neck) * e, 2.5 + t * 0.48]);
    }
    p.push([neck, 3.06], [neck - 0.01, 3.08]);
    return lathe(p);
  }, []);

  // Cap: rounded top edge, slight taper, fine grip ridges
  const capGeo = useMemo(() => {
    const p: [number, number][] = [[0.29, 0]];
    const h = 0.5;
    const rTop = 0.3;
    for (let i = 0; i <= 40; i++) {
      const y = (i / 40) * (h - 0.06);
      const ridge = y > 0.06 && y < h - 0.14 ? Math.max(0, Math.sin(y * 260)) * 0.006 : 0;
      p.push([0.31 - (y / h) * 0.012 + ridge, y]);
    }
    for (let i = 1; i <= 10; i++) {
      const a = (i / 10) * (Math.PI / 2);
      p.push([rTop - 0.06 + Math.cos(a) * 0.06 - 0.002, h - 0.06 + Math.sin(a) * 0.06]);
    }
    p.push([0, h]);
    return lathe(p, 128);
  }, []);

  const label = useMemo(() => (typeof document !== "undefined" ? makeLabelTexture() : null), []);
  useEffect(() => () => label?.dispose(), [label]);
  // Redraw once the web font has loaded so the wordmark uses Outfit
  useEffect(() => {
    if (!label || typeof document === "undefined" || !document.fonts) return;
    document.fonts.load("600 330px 'Outfit'").then(() => {
      const fresh = makeLabelTexture();
      label.image = fresh.image;
      label.needsUpdate = true;
    });
  }, [label]);

  useFrame((_, d) => {
    const k = 1 - Math.exp(-6 * Math.min(d, 0.05));
    bodyMat.current?.color.lerp(target.body, k);
    capMat.current?.color.lerp(target.cap, k);
  });

  return (
    <group>
      <mesh geometry={bodyGeo} castShadow receiveShadow>
        <meshPhysicalMaterial ref={bodyMat} color={body} roughness={0.38} metalness={0} clearcoat={0.35} clearcoatRoughness={0.45} />
      </mesh>
      {label && (
        <mesh position={[0, LABEL_Y0 + LABEL_H / 2, 0]} rotation-y={-Math.PI / 2}>
          <cylinderGeometry args={[R + 0.003, R + 0.003, LABEL_H, 96, 1, true]} />
          <meshStandardMaterial map={label} transparent roughness={0.5} depthWrite={false} />
        </mesh>
      )}
      {/* Satin steel collar */}
      <mesh position={[0, 3.1, 0]}>
        <cylinderGeometry args={[0.285, 0.285, 0.06, 64]} />
        <meshStandardMaterial color="#d8d3cc" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Cap */}
      <group position={[0, 3.12, 0]}>
        <mesh geometry={capGeo} castShadow>
          <meshPhysicalMaterial ref={capMat} color={cap} roughness={0.5} clearcoat={0.2} />
        </mesh>
        {/* Carry loop */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <torusGeometry args={[0.15, 0.035, 20, 48, Math.PI]} />
          <meshPhysicalMaterial color={cap} roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}
