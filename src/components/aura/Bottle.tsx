import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Procedural AURA bottle. Origin at the base centre; total height ≈ 3.25. */
function makeLabelTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, c.width, c.height);
  g.save();
  // Text placed at the front of the cylinder (u≈0.25 faces +Z after rotation offset)
  g.translate(c.width * 0.25, c.height / 2);
  g.rotate(-Math.PI / 2);
  g.fillStyle = "rgba(56,37,63,0.82)";
  g.font = "500 118px 'Manrope', sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  const word = "A U R A";
  g.fillText(word, 0, 0);
  g.font = "500 22px 'Manrope', sans-serif";
  g.fillText("CARRY A LITTLE CALM", 0, 88);
  g.restore();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function BottleMesh({ body, cap }: { body: string; cap: string }) {
  const bodyMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const capMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const target = useMemo(() => ({ body: new THREE.Color(body), cap: new THREE.Color(cap) }), [body, cap]);

  const bodyGeo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    pts.push(new THREE.Vector2(0, 0));
    pts.push(new THREE.Vector2(0.5, 0));
    pts.push(new THREE.Vector2(0.56, 0.04));
    pts.push(new THREE.Vector2(0.6, 0.14));
    for (let i = 0; i <= 10; i++) pts.push(new THREE.Vector2(0.6, 0.2 + i * 0.2)); // straight wall to 2.2
    // shoulder
    for (let i = 1; i <= 14; i++) {
      const t = i / 14;
      const r = 0.6 - (0.6 - 0.34) * (1 - Math.cos((t * Math.PI) / 2)) ** 0.9;
      const y = 2.2 + Math.sin((t * Math.PI) / 2) * 0.42;
      pts.push(new THREE.Vector2(r, y));
    }
    pts.push(new THREE.Vector2(0.34, 2.72));
    pts.push(new THREE.Vector2(0.3, 2.74)); // lip / opening
    pts.push(new THREE.Vector2(0.28, 2.7));
    return new THREE.LatheGeometry(pts, 96);
  }, []);

  const label = useMemo(() => (typeof document !== "undefined" ? makeLabelTexture() : null), []);
  useEffect(() => () => label?.dispose(), [label]);

  useFrame((_, d) => {
    const k = 1 - Math.exp(-6 * Math.min(d, 0.05));
    bodyMat.current?.color.lerp(target.body, k);
    capMat.current?.color.lerp(target.cap, k);
  });

  return (
    <group>
      <mesh geometry={bodyGeo} castShadow receiveShadow>
        <meshPhysicalMaterial ref={bodyMat} color={body} roughness={0.42} metalness={0.05} clearcoat={0.55} clearcoatRoughness={0.35} sheen={0.4} sheenColor="#ffffff" />
      </mesh>
      {label && (
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.603, 0.603, 1.6, 96, 1, true]} />
          <meshStandardMaterial map={label} transparent roughness={0.6} depthWrite={false} />
        </mesh>
      )}
      {/* Threaded collar */}
      <mesh position={[0, 2.78, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.1, 64]} />
        <meshStandardMaterial color="#d9d2c9" metalness={0.6} roughness={0.25} />
      </mesh>
      {/* Cap */}
      <group position={[0, 2.82, 0]}>
        <mesh position={[0, 0.22, 0]} castShadow>
          <cylinderGeometry args={[0.37, 0.38, 0.44, 64]} />
          <meshPhysicalMaterial ref={capMat} color={cap} roughness={0.55} clearcoat={0.3} />
        </mesh>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.33, 0.37, 0.04, 64]} />
          <meshStandardMaterial color="#e9e1d6" metalness={0.7} roughness={0.2} />
        </mesh>
        {/* Carry loop */}
        <mesh position={[0, 0.58, 0]} castShadow>
          <torusGeometry args={[0.18, 0.045, 20, 48, Math.PI]} />
          <meshStandardMaterial color="#e9e1d6" metalness={0.7} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}
