import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottleMesh } from "./Bottle";
import {
  VARIANTS,
  auraStore,
  nextVariant,
  scrollToId,
  useAura,
  variantById,
} from "@/lib/aura-store";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Builds a continuous, folded 3D ribbon sculpture in Three.js:
 * - Swept 3D ribbon geometry along an organic Catmull-Rom spline
 * - Swelling width and physical thickness with smooth bevel edges
 * - Continuous axial twist creating architectural folds in 3D space
 * - Computed vertex normals for realistic specular studio highlights
 */
function buildSculpturalRibbonGeometry() {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.8, 1.7, -0.7),
    new THREE.Vector3(-1.3, 1.25, 0.3),
    new THREE.Vector3(0.3, 0.65, 0.75),
    new THREE.Vector3(1.7, -0.05, 0.35),
    new THREE.Vector3(2.1, -1.05, -0.45),
    new THREE.Vector3(1.1, -1.8, -0.15),
    new THREE.Vector3(-0.5, -1.95, 0.55),
    new THREE.Vector3(-2.2, -2.15, 0.05),
  ]);

  const segments = 140;
  const points = curve.getPoints(segments);
  const frames = curve.computeFrenetFrames(segments, false);

  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const pt = points[i];
    const N = frames.normals[i];
    const B = frames.binormals[i];

    const u = i / segments;
    // Continuous 270-degree axial twist creating dynamic ribbon drape & fold
    const angle = u * Math.PI * 1.5;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const rB = new THREE.Vector3().copy(B).multiplyScalar(cosA).addScaledVector(N, sinA);
    const rN = new THREE.Vector3().copy(N).multiplyScalar(cosA).addScaledVector(B, -sinA);

    // Sculptural width swelling toward the focal turns, tapering at endpoints
    const halfW = 0.34 + 0.22 * Math.sin(u * Math.PI);
    const halfH = 0.024; // Physical thickness

    const vTL = new THREE.Vector3().copy(pt).addScaledVector(rB, -halfW).addScaledVector(rN, halfH);
    const vTR = new THREE.Vector3().copy(pt).addScaledVector(rB, halfW).addScaledVector(rN, halfH);
    const vBR = new THREE.Vector3().copy(pt).addScaledVector(rB, halfW).addScaledVector(rN, -halfH);
    const vBL = new THREE.Vector3()
      .copy(pt)
      .addScaledVector(rB, -halfW)
      .addScaledVector(rN, -halfH);

    positions.push(
      vTL.x,
      vTL.y,
      vTL.z,
      vTR.x,
      vTR.y,
      vTR.z,
      vBR.x,
      vBR.y,
      vBR.z,
      vBL.x,
      vBL.y,
      vBL.z,
    );

    if (i < segments) {
      const b0 = i * 4;
      const b1 = (i + 1) * 4;

      // Top face
      indices.push(b0 + 0, b1 + 0, b1 + 1);
      indices.push(b0 + 0, b1 + 1, b0 + 1);

      // Bottom face
      indices.push(b0 + 3, b1 + 2, b1 + 3);
      indices.push(b0 + 3, b0 + 2, b1 + 2);

      // Right edge
      indices.push(b0 + 1, b1 + 1, b1 + 2);
      indices.push(b0 + 1, b1 + 2, b0 + 2);

      // Left edge
      indices.push(b0 + 0, b1 + 3, b1 + 0);
      indices.push(b0 + 0, b0 + 3, b1 + 3);
    }
  }

  // End caps
  indices.push(0, 1, 2);
  indices.push(0, 2, 3);
  const last = segments * 4;
  indices.push(last + 0, last + 2, last + 1);
  indices.push(last + 0, last + 3, last + 2);

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}

/**
 * 3D Sculpture & Product Stage:
 * Integrates the continuous flowing 3D ribbon sculpture with a moderately-sized AURA bottle.
 */
function KineticSculptureScene({
  body,
  cap,
  pointer,
}: {
  body: string;
  cap: string;
  pointer: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const ribbonGeo = useMemo(() => buildSculpturalRibbonGeometry(), []);
  const ribbonRef = useRef<THREE.Group>(null);
  const bottleRef = useRef<THREE.Group>(null);
  const reduced = useReducedMotion();

  const curRibbonRotY = useRef(0);
  const curRibbonRotX = useRef(0);
  const curBottleRotY = useRef(0.2);

  useEffect(() => {
    return () => ribbonGeo.dispose();
  }, [ribbonGeo]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    if (reduced) {
      if (ribbonRef.current) {
        ribbonRef.current.rotation.set(0.05, 0.1, 0);
        ribbonRef.current.position.set(0, 0, 0);
      }
      if (bottleRef.current) {
        bottleRef.current.rotation.set(0, 0.22, 0);
      }
      return;
    }

    const dt = Math.min(delta, 0.05);
    const k = 1 - Math.exp(-3.5 * dt);

    // Subtle breathing motion for the sculptural ribbon
    const targetRibbonY = Math.sin(t * 0.6) * 0.05;
    const targetRibbonRotY = Math.sin(t * 0.4) * 0.08 + pointer.current.x * 0.18;
    const targetRibbonRotX = -pointer.current.y * 0.12;

    curRibbonRotY.current += (targetRibbonRotY - curRibbonRotY.current) * k;
    curRibbonRotX.current += (targetRibbonRotX - curRibbonRotX.current) * k;

    if (ribbonRef.current) {
      ribbonRef.current.position.y = targetRibbonY;
      ribbonRef.current.rotation.y = curRibbonRotY.current;
      ribbonRef.current.rotation.x = curRibbonRotX.current;
    }

    // Coordinated natural micro-movement for the moderate-sized bottle
    const targetBottleRotY = 0.22 + Math.sin(t * 0.55) * 0.07 + pointer.current.x * 0.15;
    curBottleRotY.current += (targetBottleRotY - curBottleRotY.current) * k;

    if (bottleRef.current) {
      bottleRef.current.position.y = -0.42 + Math.sin(t * 0.75 + 1.2) * 0.03;
      bottleRef.current.rotation.y = curBottleRotY.current;
    }
  });

  return (
    <group>
      {/* Sculptural Ribbon — Alabaster Porcelain Finish with Warm Sheen */}
      <group ref={ribbonRef}>
        <mesh geometry={ribbonGeo} castShadow receiveShadow>
          <meshPhysicalMaterial
            color="#FAF7F2"
            roughness={0.24}
            metalness={0.04}
            clearcoat={0.92}
            clearcoatRoughness={0.16}
            reflectivity={0.65}
            sheen={0.7}
            sheenColor="#FFE9DC"
          />
        </mesh>
      </group>

      {/* AURA Bottle — Moderate, carefully considered scale (~20% visual weight) */}
      <group ref={bottleRef} position={[1.25, -0.42, 0.2]} scale={[0.62, 0.62, 0.62]}>
        <BottleMesh body={body} cap={cap} />
        {/* Soft, grounded contact shadow on the peach floor */}
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.42}
          scale={3.6}
          blur={2.4}
          far={2.6}
          color="#422533"
        />
      </group>
    </group>
  );
}

function KineticEditorialCanvas({
  body,
  cap,
  webgl,
}: {
  body: string;
  cap: string;
  webgl: boolean;
}) {
  const pointer = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
    pointer.current.x = Math.max(-1, Math.min(1, nx));
    pointer.current.y = Math.max(-1, Math.min(1, ny));
  };

  const handlePointerLeave = () => {
    pointer.current.x = 0;
    pointer.current.y = 0;
  };

  if (!webgl) {
    return (
      <div className="relative flex h-full w-full items-center justify-center p-8">
        <div
          className="relative h-64 w-24 rounded-full shadow-xl transition-all duration-700"
          style={{
            background: `linear-gradient(135deg, ${body} 0%, color-mix(in oklab, ${body} 80%, black) 100%)`,
          }}
        >
          <div
            className="absolute -top-5 left-1/2 h-7 w-12 -translate-x-1/2 rounded-t-lg"
            style={{ backgroundColor: cap }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative h-full w-full select-none cursor-grab active:cursor-grabbing"
    >
      <Canvas
        camera={{ position: [0, 0, 5.8], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        className="touch-none"
      >
        <ambientLight intensity={1.15} />
        {/* Warm key studio light */}
        <directionalLight position={[4.5, 5.2, 4]} intensity={2.5} color="#FFF5EB" castShadow />
        {/* Soft cool rim light sculpting edges of the ribbon and bottle collar */}
        <directionalLight position={[-4, 3.2, -2.5]} intensity={1.3} color="#DCEAF8" />
        {/* Peach upward bounce fill */}
        <pointLight position={[0, -2, 2.5]} intensity={0.75} color="#F7CEBC" />

        <KineticSculptureScene body={body} cap={cap} pointer={pointer} />
      </Canvas>
    </div>
  );
}

export function EverydayAura({ webgl = true }: { webgl?: boolean }) {
  const variant = useAura((s) => variantById(s.variant));
  const [isInView, setIsInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.12 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const cycle = () => auraStore.set({ variant: nextVariant(auraStore.get().variant) });
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      cycle();
    }
  };

  const tint = `color-mix(in oklab, ${variant.body} 65%, var(--plum))`;

  return (
    <section
      ref={sectionRef}
      data-scene="final"
      id="everyday-aura"
      className="relative z-20 w-full overflow-hidden text-forest"
      style={{ backgroundColor: "#F7CEBC" }}
    >
      {/* Studio Lighting Vignette across Peach Background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 65% 40%, rgba(255, 255, 255, 0.4) 0%, rgba(247, 206, 188, 0) 70%)",
        }}
        aria-hidden="true"
      />

      {/* Main Kinetic Editorial Container */}
      <div className="container-aura relative z-10 pt-20 pb-16 sm:pt-28 sm:pb-20 md:pt-32 md:pb-24 lg:pt-36 lg:pb-28">
        {/* Editorial Top Coordinate Line */}
        <div
          className={`flex items-center justify-between border-b border-forest/15 pb-4 transition-all duration-1000 ease-out ${
            isInView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-coral animate-ping" />
            <span className="font-mono text-[10px] sm:text-[11px] font-medium tracking-[0.28em] uppercase text-forest/75">
              KINETIC EDITORIAL // A DAILY RITUAL IN MOTION
            </span>
          </div>
          <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.24em] uppercase text-forest/50 hidden sm:inline-block">
            VOL. 01 — SENSORY HYDRATION
          </span>
        </div>

        {/* Asymmetrical Grid: Expressive Typography & Sculptural 3D Stage */}
        <div className="mt-8 grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* ========================================================
              LEFT COLUMN: Expressive Asymmetric Typography (Cols 1-7)
             ======================================================== */}
          <div
            className={`flex flex-col items-start lg:col-span-7 transition-all duration-1000 delay-100 ease-out ${
              isInView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            {/* Expressive Editorial Headline */}
            <div className="w-full">
              {/* Line 1: Fluid, delicate serif italic */}
              <span className="block font-serif italic text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extralight tracking-tight text-forest/90 leading-[0.95]">
                make room
              </span>

              {/* Line 2: Offset architectural connector */}
              <div className="my-2.5 sm:my-4 flex items-center gap-3.5 pl-3 sm:pl-8">
                <span className="h-px w-8 sm:w-16 bg-forest/35" aria-hidden="true" />
                <span className="font-sans text-[11px] sm:text-xs font-semibold tracking-[0.36em] uppercase text-forest/65">
                  for your
                </span>
              </div>

              {/* Line 3: Bold contemporary display with interactive brandmark */}
              <div className="flex flex-wrap items-baseline gap-x-3 sm:gap-x-4">
                <span className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-light tracking-tight text-forest leading-[0.95]">
                  everyday
                </span>

                <button
                  type="button"
                  onClick={cycle}
                  onKeyDown={onKey}
                  title="Shift AURA mood"
                  aria-label={`AURA — showing ${variant.name}. Click to shift mood.`}
                  className="group relative inline-flex cursor-pointer items-baseline font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight leading-[0.95] text-forest transition-transform hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-coral rounded-md"
                >
                  {"AURA".split("").map((ch, i) => (
                    <span
                      key={i}
                      className="inline-block transition-colors duration-500 ease-out"
                      style={{ color: tint }}
                    >
                      {ch}
                    </span>
                  ))}
                  <span className="ml-3 hidden sm:inline-flex self-center items-center gap-1.5 rounded-full border border-forest/20 bg-white/45 px-2.5 py-0.5 text-[10px] font-sans font-medium uppercase tracking-wider text-forest/70 shadow-2xs transition-colors group-hover:bg-coral group-hover:text-white">
                    shift mood
                  </span>
                </button>
              </div>
            </div>

            {/* Editorial Narrative */}
            <p className="mt-8 max-w-lg text-base sm:text-lg font-light leading-relaxed text-forest/80">
              A daily ritual sculpted for modern movement. Pro-grade stainless steel insulated for
              24 hours of cold calm, enveloped in a tactile ceramic coat designed to harmonize with
              your space, your desk, and your journey.
            </p>

            {/* Minimalist Editorial Spec Index */}
            <div className="mt-6 flex flex-wrap items-center gap-y-2 gap-x-4 font-mono text-xs tracking-wider uppercase text-forest/70 border-l border-forest/25 pl-4">
              <span>24h Cold • 12h Warm</span>
              <span className="text-forest/35">/</span>
              <span>90% Recycled Steel</span>
              <span className="text-forest/35">/</span>
              <span>Integrated Loop Cap</span>
            </div>

            {/* Action Button & Minimal Color Palette Dots */}
            <div className="mt-9 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-8">
              <Button
                variant="aura"
                size="aura"
                className="group inline-flex items-center gap-3 rounded-full bg-forest px-8 py-4 text-sm font-medium text-ivory shadow-lg shadow-forest/15 transition-all duration-300 hover:bg-forest/90 hover:shadow-xl sm:text-base"
                onClick={() => scrollToId("bottle")}
              >
                Find your AURA
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Button>

              {/* Minimalist Color Mood Dots */}
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono uppercase tracking-wider text-forest/60 mr-1">
                  Mood:
                </span>
                {VARIANTS.map((v) => {
                  const isActive = variant.id === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => auraStore.set({ variant: v.id })}
                      className={`group flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all duration-300 ${
                        isActive
                          ? "border-forest/40 bg-white/60 font-semibold shadow-2xs"
                          : "border-transparent bg-white/20 text-forest/70 hover:bg-white/40"
                      }`}
                      aria-label={`Select ${v.name} mood`}
                      aria-pressed={isActive}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-black/10 shadow-2xs"
                        style={{ backgroundColor: v.swatch }}
                        aria-hidden="true"
                      />
                      <span>{v.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ========================================================
              RIGHT COLUMN: Sculptural 3D Stage (Cols 8-12)
              Continuous Folded Ribbon with Moderate-Sized AURA Bottle
             ======================================================== */}
          <div
            className={`relative flex items-center justify-center lg:col-span-5 transition-all duration-1000 delay-200 ease-out ${
              isInView ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            {/* The 3D Viewport — Sculptural Ribbon & Integrated Moderate Bottle */}
            <div className="relative h-[440px] sm:h-[500px] md:h-[540px] lg:h-[580px] w-full">
              <KineticEditorialCanvas body={variant.body} cap={variant.cap} webgl={webgl} />

              {/* Subtle architectural frame annotation */}
              <div className="pointer-events-none absolute bottom-2 right-2 text-[10px] font-mono tracking-widest uppercase text-forest/45">
                FIG. 01 — KINETIC RIBBON & 0.6L BOTTLE
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Organic Wave Seam Transition into Powder-Blue CTA Section */}
      <div className="pointer-events-none relative z-10 w-full overflow-hidden leading-none">
        <svg
          viewBox="0 0 1440 64"
          fill="none"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          className="block h-8 w-full sm:h-12 md:h-16"
          aria-hidden="true"
        >
          {/* Subtle translucent wave depth */}
          <path
            d="M0,28 C340,60 620,6 940,38 C1160,58 1320,24 1440,32 L1440,64 L0,64 Z"
            fill="color-mix(in oklab, #D6E8F7 50%, transparent)"
          />
          {/* Solid transition into powder blue CTA background */}
          <path
            d="M0,38 C280,12 560,56 860,26 C1160,-4 1300,44 1440,32 L1440,64 L0,64 Z"
            fill="#D6E8F7"
          />
        </svg>
      </div>
    </section>
  );
}
