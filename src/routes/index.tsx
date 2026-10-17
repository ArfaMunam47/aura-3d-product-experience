import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Stage } from "@/components/aura/Stage";
import { Collection } from "@/components/aura/Collection";
import { VARIANTS, auraStore, scrollToId, useAura, variantById, type DetailView } from "@/lib/aura-store";
import worldImg from "@/assets/aura-world.jpg";

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
            <h2 className="display-lg mt-4">Four moods, one form.</h2>
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
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="wordmark text-lg" aria-label="AURA, back to top">
          AURA
        </button>
        <ul className="hidden gap-9 text-sm text-foreground/75 md:flex">
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

function Hero() {
  return (
    <section data-scene="hero" className="scene">
      <div className="container-aura grid md:grid-cols-2">
        <div className="pt-24 md:pt-0">
          <p className="eyebrow rise" style={{ animationDelay: "0.2s" }}>Introducing AURA</p>
          <h1 className="display-xl mt-6 rise" style={{ animationDelay: "0.35s" }}>
            Carry a<br /><em>little calm.</em>
          </h1>
          <p className="lede mt-6 max-w-sm rise" style={{ animationDelay: "0.5s" }}>
            Meet AURA. Everyday hydration, thoughtfully reimagined.
          </p>
          <div className="mt-10 flex flex-wrap gap-3 rise" style={{ animationDelay: "0.65s" }}>
            <button className="btn-pill" onClick={() => scrollToId("discover")}>Discover AURA</button>
            <button className="btn-ghost" onClick={() => scrollToId("bottle")}>Explore the bottle</button>
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
    <section data-scene="reveal" id="discover" className="scene">
      <div className="container-aura grid md:grid-cols-2">
        <div className="hidden md:block" />
        <InView className="md:pl-10">
          <p className="eyebrow">02 — The reveal</p>
          <h2 className="display-lg mt-5">Less noise.<br /><em>More refresh.</em></h2>
          <p className="lede mt-6 max-w-sm">Thoughtfully designed for the little rituals that make every day feel better.</p>
        </InView>
      </div>
      <span className="ghost-word" aria-hidden>refresh</span>
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
          <h2 className="display-lg mt-5">Your color.<br /><em>Your rhythm.</em></h2>
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
  { scene: "form", n: "01", t: "Considered form", d: "Clean lines. Balanced proportions. A shape designed to feel natural in your hand.", tag: "Silhouette" },
  { scene: "cap", n: "02", t: "The little details", d: "From the cap to the finish, every element deserves attention.", tag: "Cap & carry loop" },
  { scene: "ritual", n: "03", t: "Made for everyday rituals", d: "A considered companion for work, study, travel, and everyday moments.", tag: "Weighted base" },
];

function Details() {
  return (
    <>
      {DETAIL_COPY.map((c, i) => (
        <section key={c.scene} data-scene={c.scene} className="scene">
          <div className="container-aura grid md:grid-cols-2">
            <InView>
              {i === 0 && <p className="eyebrow mb-8">04 — Details worth noticing</p>}
              <span className="font-display text-7xl text-primary/80">{c.n}</span>
              <h3 className="display-md mt-3">{c.t}</h3>
              <p className="lede mt-4 max-w-sm">{c.d}</p>
            </InView>
            <InView className="relative hidden md:block">
              <div className="leader">
                <span className="leader-label">{c.tag}</span>
                <span className="leader-line" />
                <span className="leader-dot" />
              </div>
            </InView>
          </div>
        </section>
      ))}
    </>
  );
}

function World() {
  return (
    <section data-scene="world" className="scene">
      <div className="container-aura grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
        <InView className="world-frame">
          <img src={worldImg} alt="A sunlit desk with a notebook, ceramic cup and eucalyptus" loading="lazy" width={1600} height={1008} className="h-full w-full object-cover" />
        </InView>
        <InView className="md:pl-4">
          <p className="eyebrow">06 — In your world</p>
          <h2 className="display-lg mt-5">Small rituals.<br /><em>Better moments.</em></h2>
          <p className="lede mt-5 max-w-xs">Designed to fit naturally into the rhythm of your day.</p>
        </InView>
      </div>
    </section>
  );
}

function Final() {
  return (
    <section data-scene="final" className="scene flex-col justify-between py-28">
      <InView className="text-center">
        <h2 className="display-lg mx-auto max-w-2xl">Make room for your<br /><em>everyday AURA.</em></h2>
        <p className="lede mx-auto mt-4 max-w-sm">A thoughtful design for a ritual worth keeping.</p>
      </InView>
      <div className="text-center">
        <button className="btn-pill btn-pill-lg" onClick={() => scrollToId("bottle")}>Explore AURA</button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative z-20 border-t border-foreground/10 bg-background">
      <div className="container-aura flex flex-col items-center justify-between gap-6 py-10 md:flex-row">
        <span className="wordmark text-base">AURA</span>
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
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { threshold: 0.25 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`inview ${on ? "is-in" : ""} ${className}`}>{children}</div>;
}
