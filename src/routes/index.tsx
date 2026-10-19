import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Stage } from "@/components/aura/Stage";
import { Collection } from "@/components/aura/Collection";
import { VARIANTS, auraStore, scrollToId, useAura, variantById, type DetailView } from "@/lib/aura-store";
import worldImg from "@/assets/aura-world.jpg";
import landscapeImg from "@/assets/aura-landscape.jpg";
import fieldImg from "@/assets/aura-field.jpg";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "AURA — Carry a little calm" },
      { name: "description", content: "Meet AURA. An immersive 3D look at a reusable bottle, thoughtfully reimagined for everyday hydration." },
      { property: "og:title", content: "AURA — Carry a little calm" },
      { property: "og:description", content: "Explore the AURA bottle in 3D: four colors, considered details, everyday rituals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuraPage,
});

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function AuraPage() {
  const [gl, setGl] = useState<boolean | null>(null);
  const ready = useAura((s) => s.ready);
  useEffect(() => setGl(hasWebGL()), []);

  return (
    <div className="aura-root">
      <div className="aura-bg" aria-hidden />
      <div className="aura-grain" aria-hidden />
      {gl && <Stage />}
      {gl === false && <FallbackBottle />}
      <Loader done={ready || gl === false} />
      <Nav />
      <main className="relative z-20">
        <Hero />
        <Reveal />
        <Viewer webgl={gl !== false} />
        <Details />
        <section data-scene="collection" id="colors" className="scene flex-col justify-center gap-10 py-24">
          <div className="text-center">
            <p className="eyebrow">05 — The collection</p>
            <h2 className="display-lg mt-4">four moods, <strong>one form</strong></h2>
          </div>
          <Collection />
        </section>
        <World />
        <Final />
      </main>
      <Footer />
    </div>
  );
}

function Loader({ done }: { done: boolean }) {
  return (
    <div role="status" aria-live="polite" className={`aura-loader ${done ? "is-done" : ""}`}>
      <span className="wordmark text-2xl">AURA</span>
      <span className="mt-4 h-px w-24 overflow-hidden bg-foreground/15">
        <span className="aura-loader-bar block h-full w-1/2 bg-foreground" />
      </span>
      <span className="sr-only">{done ? "Experience ready" : "Preparing the 3D bottle"}</span>
    </div>
  );
}

function FallbackBottle() {
  const v = useAura((s) => variantById(s.variant));
  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-end pr-[12vw]" aria-hidden>
      <div className="fallback-bottle" style={{ background: v.body }} />
    </div>
  );
}

function Nav() {
  const links: [string, string][] = [["Discover", "discover"], ["The Bottle", "bottle"], ["Colors", "colors"]];
  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="wordmark text-lg text-foreground" aria-label="AURA, back to top">
          AURA
        </button>
        <ul className="hidden gap-9 text-[0.95rem] font-medium text-foreground/80 md:flex">
          {links.map(([l, id]) => (
            <li key={id}>
              <button className="nav-link" onClick={() => scrollToId(id)}>{l}</button>
            </li>
          ))}
        </ul>
        <button className="btn-pill btn-pill-sm" onClick={() => scrollToId("bottle")}>Explore</button>
      </nav>
    </header>
  );
}

function Wave({ color = "var(--coral)" }: { color?: string }) {
  return (
    <svg className="hero-wave hidden md:block" viewBox="0 0 400 1000" preserveAspectRatio="none" aria-hidden>
      <path d="M140 0 C 60 160, 220 300, 120 470 C 30 620, 180 780, 90 1000 L 400 1000 L 400 0 Z" fill={color} opacity="0.85" />
    </svg>
  );
}

function Hero() {
  return (
    <section data-scene="hero" className="scene on-blue">
      <Wave />
      <div className="container-aura grid md:grid-cols-2">
        <div className="pt-24 md:pt-0">
          <p className="eyebrow rise" style={{ animationDelay: "0.2s" }}>Introducing AURA</p>
          <h1 className="display-xl mt-6 rise" style={{ animationDelay: "0.35s" }}>
            carry a<br /><strong>little calm</strong>
          </h1>
          <p className="lede mt-6 max-w-sm rise" style={{ animationDelay: "0.5s" }}>
            Meet AURA. Everyday hydration, thoughtfully reimagined.
          </p>
          <div className="mt-10 flex flex-wrap gap-3 rise" style={{ animationDelay: "0.65s" }}>
            <button className="btn-pill" onClick={() => scrollToId("discover")}>Discover AURA</button>
            <button className="btn-ghost text-primary-foreground" style={{ borderColor: "color-mix(in oklab, var(--ivory) 60%, transparent)" }} onClick={() => scrollToId("bottle")}>Explore the bottle</button>
          </div>
        </div>
      </div>
      <button onClick={() => scrollToId("discover")} className="scroll-cue" aria-label="Scroll to the story">
        <span>Scroll</span>
        <span className="scroll-cue-line" />
      </button>
    </section>
  );
}

function Reveal() {
  return (
    <section data-scene="reveal" id="discover" className="scene tone-forest py-28">
      <div className="container-aura grid items-center gap-12 md:grid-cols-12 md:gap-8">
        <InView className="md:col-span-5 md:pr-6">
          <p className="eyebrow">02 — Everyday refresh</p>
          <h2 className="display-lg mt-5">less noise,<br /><em>more refresh,</em><br />every day.</h2>
          <p className="lede mt-6 max-w-md">
            A reusable bottle made for the little rituals that make every day feel better — at your desk, on the trail, and everywhere in between.
          </p>
          <div className="reveal-meta mt-10">
            <div><span className="reveal-meta-k">Reusable</span><span className="reveal-meta-v">every day</span></div>
            <div><span className="reveal-meta-k">Four</span><span className="reveal-meta-v">calm colors</span></div>
            <div><span className="reveal-meta-k">One</span><span className="reveal-meta-v">considered form</span></div>
          </div>
        </InView>
        <InView className="relative md:col-span-7">
          <div className="reveal-frame">
            <img src={landscapeImg} alt="Misty green mountain valley at sunrise" loading="lazy" width={1024} height={1280} />
            <div className="reveal-ground" aria-hidden />
            <span className="reveal-caption">Fresh air, carried with you</span>
          </div>
        </InView>
      </div>
    </section>
  );
}
function Viewer({ webgl }: { webgl: boolean }) {
  const variantId = useAura((s) => s.variant);
  const detail = useAura((s) => s.detail);
  const v = variantById(variantId);
  const drag = useRef<{ x: number; y: number; bx: number; by: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const onDown = (e: React.PointerEvent) => {
    const s = auraStore.get();
    drag.current = { x: e.clientX, y: e.clientY, bx: s.dragX, by: s.dragY };
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = (e.clientX - drag.current.x) / 140;
    const dy = (e.clientY - drag.current.y) / 400;
    auraStore.set({ dragX: drag.current.bx + dx, dragY: Math.max(-0.35, Math.min(0.35, drag.current.by + dy)) });
  };
  const onUp = () => {
    drag.current = null;
    setDragging(false);
  };
  const details: [DetailView, string][] = [["full", "Full view"], ["cap", "Cap"], ["finish", "Finish"], ["base", "Base"]];

  return (
    <section data-scene="viewer" id="bottle" className="scene">
      <div
        className={`drag-surface ${dragging ? "is-dragging" : ""}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        aria-label="Drag horizontally to rotate the bottle"
        role="application"
      />
      <div className="container-aura pointer-events-none relative grid h-full gap-10 md:grid-cols-[1fr_1fr_18rem]">
        <div className="pointer-events-auto self-start pt-28 md:self-center md:pt-0">
          <p className="eyebrow">03 — Interactive</p>
          <h2 className="display-lg mt-5">your color,<br /><em>your rhythm</em></h2>
          <p className="lede mt-5 max-w-xs">One considered design. Four different moods.</p>
          <p className="mt-8 text-xs tracking-[0.25em] text-muted-foreground uppercase">
            {webgl ? (dragging ? "Rotating…" : "Drag to rotate · ↔") : "3D unavailable on this device"}
          </p>
        </div>
        <div className="hidden md:block" />
        <div className="glass-panel pointer-events-auto self-end mb-10 md:self-center md:mb-0">
          <p className="eyebrow">Color</p>
          <p className="mt-2 font-display text-3xl text-foreground" aria-live="polite">{v.name}</p>
          <p className="text-sm text-muted-foreground">{v.mood}</p>
          <div className="mt-5 flex gap-3" role="radiogroup" aria-label="Bottle color">
            {VARIANTS.map((x) => (
              <button
                key={x.id}
                role="radio"
                aria-checked={x.id === variantId}
                aria-label={x.name}
                onClick={() => auraStore.set({ variant: x.id })}
                className="swatch"
                style={{ background: x.swatch }}
              />
            ))}
          </div>
          <p className="eyebrow mt-7">Inspect</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {details.map(([id, label]) => (
              <button key={id} aria-pressed={detail === id} onClick={() => auraStore.set({ detail: id })} className="chip">
                {label}
              </button>
            ))}
          </div>
          <button className="btn-ghost mt-5 w-full justify-center" onClick={() => auraStore.set({ dragX: 0, dragY: 0, detail: "full" })}>
            Reset view
          </button>
        </div>
      </div>
    </section>
  );
}

const DETAIL_COPY = [
  { scene: "form", n: "01", t: <>considered <strong>form</strong></>, d: "Clean lines. Balanced proportions. A shape designed to feel natural in your hand.", tag: "Silhouette" },
  { scene: "cap", n: "02", t: <>the little <strong>details</strong></>, d: "From the cap to the finish, every element deserves attention.", tag: "Cap & carry loop" },
  { scene: "ritual", n: "03", t: <>made for <strong>everyday rituals</strong></>, d: "A considered companion for work, study, travel, and everyday moments.", tag: "Weighted base" },
];

function Details() {
  return (
    <>
      {DETAIL_COPY.map((c, i) => (
        <section key={c.scene} data-scene={c.scene} className="scene tone-forest">
          <div className="container-aura grid md:grid-cols-2">
            <InView className="relative hidden md:block">
              <div className="leader">
                <span className="leader-dot" />
                <span className="leader-line" />
                <span className="leader-label">{c.tag}</span>
              </div>
            </InView>
            <InView className="pt-24 md:pt-0 md:pl-10">
              {i === 0 && <p className="eyebrow mb-8">04 — Details worth noticing</p>}
              <span className="font-display text-6xl font-extralight text-primary">{c.n}</span>
              <h3 className="display-md mt-3">{c.t}</h3>
              <p className="lede mt-4 max-w-sm">{c.d}</p>
            </InView>
          </div>
        </section>
      ))}
    </>
  );
}

function World() {
  return (
    <section data-scene="world" className="scene tone-forest">
      <div className="container-aura grid items-center gap-10 md:grid-cols-[1.15fr_1fr]">
        <InView className="relative h-[70vh] min-h-[420px]">
          <div className="photo absolute left-0 top-0 h-[72%] w-[58%]">
            <img src={fieldImg} alt="A woman holding a sage AURA bottle in a sunlit field" loading="lazy" width={1024} height={1280} />
          </div>
          <div className="photo absolute bottom-0 right-0 h-[56%] w-[52%]">
            <img src={worldImg} alt="A sunlit desk with a notebook, ceramic cup and eucalyptus" loading="lazy" width={1600} height={1008} />
          </div>
        </InView>
        <InView className="md:pl-4">
          <p className="eyebrow">06 — In your world</p>
          <h2 className="display-lg mt-5">small rituals,<br /><em>better moments</em></h2>
          <p className="lede mt-5 max-w-xs">Designed to fit naturally into the rhythm of your day.</p>
        </InView>
      </div>
    </section>
  );
}

function Final() {
  return (
    <section data-scene="final" className="scene on-blue">
      <Wave />
      <div className="container-aura grid md:grid-cols-2">
        <InView className="pt-24 md:pt-0">
          <h2 className="display-lg max-w-xl">make room for your<br /><strong>everyday <span className="normal-case">AURA</span></strong></h2>
          <p className="lede mt-5 max-w-sm">A thoughtful design for a ritual worth keeping.</p>
          <button className="btn-pill btn-pill-lg mt-10" onClick={() => scrollToId("bottle")}>Explore AURA</button>
        </InView>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative z-40 bg-background">
      <div className="container-aura flex flex-col items-center justify-between gap-6 py-10 md:flex-row">
        <span className="wordmark text-base text-foreground">AURA</span>
        <ul className="flex gap-8 text-sm text-muted-foreground">
          {([["Discover", "discover"], ["The Bottle", "bottle"], ["Colors", "colors"]] as const).map(([l, id]) => (
            <li key={id}><button className="nav-link" onClick={() => scrollToId(id)}>{l}</button></li>
          ))}
        </ul>
        <span className="text-xs text-muted-foreground">A concept product experience.</span>
      </div>
    </footer>
  );
}

function InView({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setOn(!!e?.isIntersecting), { threshold: 0.25 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`inview ${on ? "is-in" : ""} ${className}`}>{children}</div>;
}
