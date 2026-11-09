import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottleMesh } from "./Bottle";
import { scrollToId, useAura, variantById } from "@/lib/aura-store";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Procedurally generates a high-resolution (1024x1024) realistic botanical leaf texture:
 * - Natural organic eucalyptus/olive leaf silhouette
 * - Chlorophyll radial gradient (sage highlights to deep forest margins)
 * - Distinct central midrib and natural pinnate lateral veins
 * - Subtle surface sheen for professional studio photography realism
 */
function makeRealisticLeafTexture() {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 1024;
  const g = c.getContext("2d");
  if (!g) return null;

  g.clearRect(0, 0, c.width, c.height);

  const cx = c.width / 2;
  const cy = c.height / 2;

  // Draw organic tapered leaf contour
  g.save();
  g.beginPath();
  g.moveTo(cx, 950);
  g.bezierCurveTo(cx - 270, 720, cx - 360, 410, cx, 65);
  g.bezierCurveTo(cx + 360, 410, cx + 270, 720, cx, 950);
  g.closePath();

  // Natural chlorophyll gradient with soft core highlight
  const grad = g.createRadialGradient(cx - 50, cy - 90, 40, cx, cy, 470);
  grad.addColorStop(0, "#6E9D78");
  grad.addColorStop(0.35, "#527E5D");
  grad.addColorStop(0.75, "#3A6044");
  grad.addColorStop(1, "#26442E");
  g.fillStyle = grad;
  g.fill();

  // Natural leaf margin definition
  g.lineWidth = 4;
  g.strokeStyle = "rgba(30, 52, 36, 0.5)";
  g.stroke();

  // Secondary fine organic surface texture & veins
  g.save();
  g.clip();

  // Lateral pinnate veins
  g.strokeStyle = "rgba(195, 228, 205, 0.32)";
  g.lineWidth = 3;
  g.lineCap = "round";

  // Central midrib
  g.beginPath();
  g.moveTo(cx, 950);
  g.quadraticCurveTo(cx - 12, cy, cx, 70);
  g.stroke();

  // Natural pinnate secondary veins
  const veinCount = 10;
  for (let i = 1; i <= veinCount; i++) {
    const t = i / (veinCount + 1);
    const vy = 890 - t * 780;
    const vx = cx - 8 * Math.sin(t * Math.PI);
    const span = (1 - Math.pow((t - 0.5) * 1.85, 2)) * 195;

    // Left lateral vein
    g.beginPath();
    g.moveTo(vx, vy);
    g.quadraticCurveTo(vx - span * 0.45, vy - 26, vx - span, vy - 46);
    g.stroke();

    // Right lateral vein
    g.beginPath();
    g.moveTo(vx, vy);
    g.quadraticCurveTo(vx + span * 0.45, vy - 26, vx + span, vy - 46);
    g.stroke();
  }

  // Soft directional studio light sheen
  const sheen = g.createLinearGradient(cx - 160, 0, cx + 160, 0);
  sheen.addColorStop(0, "rgba(255, 255, 255, 0)");
  sheen.addColorStop(0.48, "rgba(255, 255, 255, 0.12)");
  sheen.addColorStop(0.55, "rgba(255, 255, 255, 0.18)");
  sheen.addColorStop(1, "rgba(255, 255, 255, 0)");
  g.fillStyle = sheen;
  g.fillRect(0, 0, c.width, c.height);

  g.restore();
  g.restore();

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/**
 * A curved 3D leaf plane with natural parabolic camber along the midrib.
 */
function createCurvedLeafGeometry(width = 0.85, height = 1.9, segX = 14, segY = 24) {
  const geo = new THREE.PlaneGeometry(width, height, segX, segY);
  const pos = geo.attributes.position;
  if (!pos) return geo;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    // Natural curl along midrib and slight tip taper
    const nx = x / (width / 2);
    const curlX = (1 - nx * nx) * 0.085;
    const curlY = (y / (height / 2)) * 0.04;
    pos.setZ(i, curlX + curlY);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Realistic botanical eucalyptus branch styled in 3D around and behind the AURA bottle.
 */
function RealisticBotanicalBranch({ leafTexture }: { leafTexture: THREE.CanvasTexture | null }) {
  const branchRef = useRef<THREE.Group>(null);
  const reduced = useReducedMotion();

  // Natural organic curved stem path
  const stemGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.55, -2.1, -0.35),
      new THREE.Vector3(1.15, -1.1, -0.25),
      new THREE.Vector3(1.65, 0.1, -0.18),
      new THREE.Vector3(1.95, 1.3, -0.12),
      new THREE.Vector3(1.5, 2.4, 0.05),
    ]);
    return new THREE.TubeGeometry(curve, 32, 0.038, 10, false);
  }, []);

  const leafGeo = useMemo(() => createCurvedLeafGeometry(0.82, 1.8), []);

  const leafMat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      map: leafTexture ?? undefined,
      color: "#527E5D",
      roughness: 0.38,
      metalness: 0.0,
      clearcoat: 0.28,
      clearcoatRoughness: 0.35,
      sheen: 0.35,
      sheenColor: new THREE.Color("#8AB895"),
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.08,
      depthWrite: true,
    });
  }, [leafTexture]);

  // Leaf layout: gracefully arranged around and behind the bottle
  const leafNodes = useMemo(
    () => [
      { pos: [0.75, -1.75, -0.3], rot: [0.35, 0.15, -1.1], scale: 0.82 },
      { pos: [1.1, -1.25, -0.22], rot: [0.22, 0.28, -0.82], scale: 0.95 },
      { pos: [1.5, -0.55, -0.18], rot: [-0.12, 0.18, -0.52], scale: 1.15 },
      { pos: [-0.95, 1.05, -0.38], rot: [-0.22, 0.38, 0.72], scale: 1.05 },
      { pos: [1.8, 0.25, -0.15], rot: [0.28, -0.18, -0.32], scale: 1.25 },
      { pos: [1.88, 1.15, -0.1], rot: [0.12, -0.28, -0.2], scale: 1.1 },
      { pos: [2.05, 1.75, -0.06], rot: [-0.18, 0.12, -0.55], scale: 0.98 },
      { pos: [1.55, 2.35, 0.06], rot: [0.12, 0.22, -0.35], scale: 0.8 },
    ],
    [],
  );

  useFrame((state) => {
    if (!branchRef.current) return;
    const t = state.clock.elapsedTime;
    const idle = reduced ? 0 : 1;
    // Very subtle, natural botanical breathing sway
    branchRef.current.rotation.z = Math.sin(t * 0.75) * 0.012 * idle;
    branchRef.current.rotation.y = Math.cos(t * 0.6) * 0.015 * idle;
  });

  return (
    <group ref={branchRef}>
      {/* Woody stem */}
      <mesh geometry={stemGeo} castShadow receiveShadow>
        <meshStandardMaterial color="#4A3D30" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Realistic leaves */}
      {leafNodes.map((n, i) => (
        <mesh
          key={i}
          geometry={leafGeo}
          material={leafMat}
          position={n.pos as [number, number, number]}
          rotation={n.rot as [number, number, number]}
          scale={n.scale}
          castShadow
          receiveShadow
        />
      ))}
    </group>
  );
}

/**
 * Hero Composition Stage:
 * Houses the prominent 3D AURA bottle and realistic botanical branch with studio lighting.
 */
function HeroProductComposition({
  variant,
  leafTexture,
}: {
  variant: ReturnType<typeof variantById>;
  leafTexture: THREE.CanvasTexture | null;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const reduced = useReducedMotion();
  const { size } = useThree();

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const idle = reduced ? 0 : 1;

    // Subtle, physically believable floating motion
    const floatY = Math.sin(t * 0.9) * 0.06 * idle;
    const floatRz = Math.sin(t * 0.65) * 0.018 * idle - 0.06;
    const floatRy = Math.cos(t * 0.5) * 0.08 * idle + 0.12;

    groupRef.current.position.y = -1.65 + floatY;
    groupRef.current.rotation.z = floatRz;
    groupRef.current.rotation.y = floatRy;

    // Substantial hero scale: commanding presence on desktop, balanced on mobile
    const scale = size.width < 640 ? 0.92 : size.width < 1024 ? 1.05 : 1.18;
    groupRef.current.scale.setScalar(scale);
  });

  return (
    <>
      {/* Studio Lighting tailored for hero presentation */}
      <ambientLight intensity={0.62} />
      <directionalLight
        position={[4.5, 7.5, 5]}
        intensity={1.85}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-4, 3, -3.5]} intensity={0.75} color="#FFE6D6" />
      <directionalLight position={[1, -2.5, 3]} intensity={0.35} color="#DCEBFA" />

      {/* Main product group */}
      <group ref={groupRef} position={[0, -1.65, 0]}>
        {/* Realistic botanical branch behind the bottle */}
        <RealisticBotanicalBranch leafTexture={leafTexture} />

        {/* Authentic AURA Bottle Mesh */}
        <BottleMesh body={variant.body} cap={variant.cap} />

        {/* Grounding physical studio contact shadow */}
        <ContactShadows
          position={[0, -0.04, 0]}
          scale={3.6}
          blur={2.4}
          opacity={0.34}
          far={1.8}
          color="#1A2938"
        />
      </group>
    </>
  );
}

/** Smooth, organic wave-shaped divider connecting the powder-blue CTA with the warm ivory footer */
function WaveTransition() {
  return (
    <div className="relative z-10 -mb-[1px] w-full overflow-hidden leading-none">
      <svg
        className="relative block h-[52px] w-full sm:h-[72px] md:h-[96px]"
        viewBox="0 0 1440 96"
        fill="none"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M0,32 C260,76 480,10 740,44 C1000,78 1220,20 1440,50 L1440,96 L0,96 Z"
          fill="color-mix(in oklab, var(--ivory) 40%, transparent)"
        />
        <path
          d="M0,48 C320,14 540,78 840,38 C1140,-2 1290,58 1440,36 L1440,96 L0,96 Z"
          fill="var(--ivory)"
        />
      </svg>
    </div>
  );
}

export function CtaSection({ webgl }: { webgl: boolean }) {
  const variant = useAura((s) => variantById(s.variant));
  const [isInView, setIsInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const leafTexture = useMemo(() => makeRealisticLeafTexture(), []);

  useEffect(() => {
    return () => leafTexture?.dispose();
  }, [leafTexture]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setIsInView(!!entry?.isIntersecting), {
      threshold: 0.15,
    });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      data-scene="cta"
      id="cta"
      className="relative flex min-h-[90svh] flex-col justify-between overflow-hidden"
      style={{
        background: "radial-gradient(110% 85% at 72% 45%, #D6E8F7 0%, #C3DCF2 48%, #AFCDE8 100%)",
      }}
    >
      {/* Studio cyclorama lighting depth — clean and without floating geometric shapes */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(circle at 70% 48%, rgba(255, 255, 255, 0.42) 0%, rgba(212, 231, 247, 0.1) 50%, transparent 75%)",
        }}
        aria-hidden="true"
      />

      <div className="container-aura relative z-10 grid flex-1 grid-cols-1 items-center gap-10 pt-20 pb-10 md:grid-cols-[1fr_1.15fr] lg:grid-cols-[0.95fr_1.25fr] md:gap-12 md:pt-28 md:pb-14 lg:gap-16">
        {/* Left Column: Headlines & Action */}
        <div
          className={`flex flex-col items-start transition-all duration-1000 ease-out ${
            isInView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <span className="eyebrow text-xs font-semibold tracking-[0.22em] uppercase text-plum/60">
            A CONSIDERED CHOICE
          </span>

          <h2 className="display-lg mt-5 font-normal text-plum leading-[1.03] tracking-tight">
            Ready to <strong>bottle up?</strong>
          </h2>

          <p className="mt-5 max-w-md font-sans text-xl font-light text-plum/80 sm:text-2xl leading-relaxed">
            Mother Nature will thank you.
          </p>

          <div className="mt-9 sm:mt-11">
            <Button
              variant="aura"
              size="aura"
              onClick={() => scrollToId("bottle")}
              className="btn-pill btn-pill-lg group inline-flex cursor-pointer items-center gap-3 bg-plum text-ivory hover:bg-plum/90 hover:-translate-y-0.5 transition-all shadow-soft"
              aria-label="Explore AURA bottle"
            >
              <span>Explore AURA</span>
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 text-coral" />
            </Button>
          </div>
        </div>

        {/* Right Column: Hero AURA Bottle & Realistic Botanical Branch */}
        <div
          className={`relative flex items-center justify-center transition-all duration-1000 delay-150 ease-out ${
            isInView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          {/* Substantial, hero-scaled product stage */}
          <div className="relative z-10 h-[480px] w-full max-w-[560px] sm:h-[540px] md:h-[620px] lg:h-[680px]">
            {webgl ? (
              <Canvas
                dpr={[1, 2]}
                camera={{ position: [0.1, 0.15, 7.2], fov: 27 }}
                gl={{ alpha: true, antialias: true }}
              >
                <HeroProductComposition variant={variant} leafTexture={leafTexture} />
              </Canvas>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="fallback-bottle scale-125">
                  <span>AURA</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Seamless Wave Transition into Footer */}
      <WaveTransition />
    </section>
  );
}
