import { createFileRoute } from "@tanstack/react-router";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, RotateCcw, ArrowDown, ArrowUp } from "lucide-react";
import { Stage } from "@/components/aura/Stage";
import { Collection } from "@/components/aura/Collection";
import { VARIANTS, auraStore, scrollToId, useAura, variantById, type DetailView } from "@/lib/aura-store";
import worldImg from "@/assets/aura-world.jpg";
import stillImg from "@/assets/aura-still.jpg";
import rippleImg from "@/assets/aura-ripple.jpg";
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
    <div className={`aura-root ${gl === false ? "no-webgl" : ""}`}>
      <div className="aura-bg" aria-hidden />
      <div className="aura-grain" aria-hidden />
      {gl && <ProductBoundary onFailure={() => setGl(false)}><Stage /></ProductBoundary>}
      <Loader done={ready || gl === false} />
      <Nav />
      <main className="relative z-20">
        <Hero />
        <Viewer webgl={gl !== false} />
        <Reveal />
        <Details />
        <section data-scene="collection" id="colors" className="scene flex-col justify-center gap-10 py-24">
          <div className="text-center">
            <p className="eyebrow">05 — The collection</p>
            <h2 className="display-lg mt-4">four moods, <strong>one form</strong></h2>
          </div>
          {gl && <ProductBoundary onFailure={() => setGl(false)}><Collection /></ProductBoundary>}
          {gl === false && <div className="fallback-collection">{VARIANTS.map(v => <Button variant="aura" size="aura" key={v.id} onClick={() => { auraStore.set({ variant: v.id }); scrollToId("bottle"); }} className={`variant-${v.id}`}><span className="fallback-bottle"><span>AURA</span></span><span>{v.name}</span></Button>)}</div>}
        </section>
        <World />
        <Final />
      </main>

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

class ProductBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override componentDidCatch() { this.props.onFailure(); }
  override render() { return this.state.failed ? null : this.props.children; }
}

function Nav() {
  const links: [string, string][] = [["Discover", "discover"], ["The Bottle", "bottle"], ["Colors", "colors"]];
  return (
    <header className="aura-nav fixed inset-x-0 top-0 z-40">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
        <Button variant="aura" size="aura" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })} className="wordmark text-lg text-foreground" aria-label="AURA, back to top">
          AURA
        </Button>
        <ul className="hidden gap-9 text-[0.95rem] font-medium text-foreground/80 md:flex">
          {links.map(([l, id]) => (
            <li key={id}>
              <Button variant="aura" size="aura" className="nav-link" onClick={() => scrollToId(id)}>{l}</Button>
            </li>
          ))}
        </ul>
        <Button variant="aura" size="aura" className="btn-pill btn-pill-sm" onClick={() => scrollToId("bottle")}>Explore</Button>
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
    <section data-scene="hero" className="scene on-blue campaign-scene">
      <Wave />
      <div className="container-aura campaign-grid">
        <div className="pt-24 md:pt-0">
          <p className="eyebrow rise" style={{ animationDelay: "0.2s" }}>AURA — Everyday objects, reimagined</p>
          <h1 className="display-xl mt-6 rise" style={{ animationDelay: "0.35s" }}>
            carry a<br /><strong>little calm</strong>
          </h1>
          <p className="lede mt-6 max-w-sm rise" style={{ animationDelay: "0.5s" }}>
            Meet AURA. Everyday hydration, thoughtfully reimagined.
          </p>
          <div className="mt-10 flex flex-wrap gap-3 rise" style={{ animationDelay: "0.65s" }}>
            <Button variant="aura" size="aura" className="btn-pill" onClick={() => scrollToId("discover")}>Discover AURA</Button>
            <Button variant="aura" size="aura" className="btn-ghost text-primary-foreground" style={{ borderColor: "color-mix(in oklab, var(--ivory) 60%, transparent)" }} onClick={() => scrollToId("bottle")}>Explore the bottle</Button>
          </div>
        </div>
        <div data-product-slot className="campaign-product" aria-hidden />
      </div>
      <Button variant="aura" size="aura" onClick={() => scrollToId("discover")} className="scroll-cue" aria-label="Scroll to the story">
        <ArrowDown size={16} />
        <span className="scroll-cue-line" />
      </Button>
    </section>
  );
}

const RITUALS: [string, string, string][] = [
  ["01", "morning", "the first pour"],
  ["02", "midday", "a quiet desk-side refill"],
  ["03", "evening", "rinse, rest, repeat"],
];

function Reveal() {
  return (
    <section data-scene="reveal" id="discover" className="scene tone-forest reveal-scene">
      <div className="container-aura relative reveal-grid">
        <InView className="reveal-copy">
          <p className="eyebrow">03 — Everyday refresh</p>
          <h2 className="display-lg mt-5">less noise,<br /><em>more refresh,</em><br />every day.</h2>
          <p className="lede mt-6 max-w-md">
            A reusable bottle made for the little rituals that make every day feel better — at your desk, on the trail, and everywhere in between.
          </p>
          <div className="reveal-rituals mt-10">
            {RITUALS.map(([n, t, d]) => (
              <div className="reveal-ritual" key={n}>
                <span className="reveal-ritual-n">{n}</span>
                <span className="reveal-ritual-t">{t}</span>
                <span className="reveal-ritual-d">{d}</span>
              </div>
            ))}
          </div>
        </InView>
        <InView className="reveal-collage">
          <span className="reveal-num" aria-hidden>03</span>
          <figure className="reveal-main">
            <img src={stillImg} alt="Morning light on a sunlit ledge with a ceramic cup, an open notebook and eucalyptus" loading="lazy" width={1024} height={1280} />
            <span className="reveal-tape">morning light, kept close</span>
            <span className="reveal-side" aria-hidden>everyday refresh</span>
          </figure>
          <figure className="reveal-inset">
            <img src={rippleImg} alt="Rippling water catching the warm light of a pastel sky" loading="lazy" width={1024} height={1024} />
          </figure>
          <div className="reveal-badge" aria-hidden>
            <svg viewBox="0 0 100 100">
              <defs>
                <path id="badge-arc" d="M50,50 m-35,0 a35,35 0 1,1 70,0 a35,35 0 1,1 -70,0" />
              </defs>
              <text className="reveal-badge-text">
                <textPath href="#badge-arc">more color in every day · </textPath>
              </text>
            </svg>
            <span className="reveal-badge-core">✺</span>
          </div>
        </InView>
      </div>
      <div className="reveal-marquee" aria-hidden>
        <div className="reveal-marquee-track">
          {["less noise", "more refresh", "every day", "carry a little calm"].map((w) => (
            <span key={w}>{w} <i>·</i></span>
          ))}
          {["less noise", "more refresh", "every day", "carry a little calm"].map((w) => (
            <span key={`${w}-2`} aria-hidden>{w} <i>·</i></span>
          ))}
        </div>
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
    if (!webgl || e.button !== 0) return;
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
    <section data-scene="viewer" id="bottle" className={`scene viewer-scene variant-${variantId}`}>
      <div className="viewer-ribbon" aria-hidden />
      <div
        className={`drag-surface ${dragging ? "is-dragging" : ""}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onLostPointerCapture={onUp}
        aria-label="Drag horizontally to rotate the bottle"
        role="application"
      />
      <div className="container-aura pointer-events-none relative viewer-grid">
        <div className="viewer-copy pointer-events-auto">
          <p className="eyebrow">02 — Find your AURA</p>
          <h2 className="display-lg mt-5">your color,<br /><em>your rhythm</em></h2>
          <p className="lede mt-5 max-w-xs">One considered design. Four different moods.</p>
          <p className="mt-8 text-xs tracking-[0.25em] text-muted-foreground uppercase">
            {webgl ? (dragging ? "Rotating…" : "Drag to rotate · ↔") : "3D unavailable on this device"}
          </p>
        </div>
        <div data-product-slot className="viewer-product" aria-hidden />
        <div className="viewer-controls pointer-events-auto">
          <p className="eyebrow">Color</p>
          <p className="mt-2 font-display text-3xl text-foreground" aria-live="polite">{v.name}</p>
          <p className="text-sm text-muted-foreground">{v.mood}</p>
          <div className="mt-5 flex gap-3" role="radiogroup" aria-label="Bottle color">
            {VARIANTS.map((x) => (
              <Button variant="aura" size="aura"
                key={x.id}
                role="radio"
                aria-checked={x.id === variantId}
                aria-label={x.name}
                onClick={() => auraStore.set({ variant: x.id })}
                className={`swatch variant-${x.id}`}
              />
            ))}
          </div>
          <p className="eyebrow mt-7">Inspect</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {details.map(([id, label]) => (
              <Button variant="aura" size="aura" key={id} aria-pressed={detail === id} onClick={() => auraStore.set({ detail: id })} className="chip">
                {label}
              </Button>
            ))}
          </div>
          <Button variant="aura" size="aura" className="btn-ghost mt-5 w-full justify-center" onClick={() => auraStore.set({ dragX: 0, dragY: 0, detail: "full" })}>
            <RotateCcw size={14} /> Reset view
          </Button>
        </div>
      </div>
    </section>
  );
}

const DETAIL_COPY = [
  { scene: "form", n: "01", t: <>considered <strong>form</strong></>, d: "Clean lines. Balanced proportions. A shape designed to feel natural in your hand.", tag: "Silhouette" },
  { scene: "cap", n: "02", t: <>the little <strong>details</strong></>, d: "From the cap to the finish, every element deserves attention.", tag: "Cap & carry loop" },
  { scene: "ritual", n: "03", t: <>made for <strong>everyday rituals</strong></>, d: "A considered companion for work, study, travel, and everyday moments.", tag: "Base & balance" },
];

function Details() {
  return (
    <>
      {DETAIL_COPY.map((c, i) => (
        <section key={c.scene} data-scene={c.scene} className="scene tone-forest detail-scene">
          <div className="container-aura detail-grid">
            <InView className="detail-product">
              <div data-product-slot className="detail-slot" aria-hidden />
              <div className="leader">
                <span className="leader-dot" />
                <span className="leader-line" />
                <span className="leader-label">{c.tag}</span>
              </div>
            </InView>
            <InView className="detail-copy">
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
    <section data-scene="final" className="scene closing-scene">
      <div className="closing-ribbon" aria-hidden />
      <div className="container-aura closing-grid">
        <InView className="closing-copy">
          <p className="eyebrow">A little more color. A little more you.</p>
          <h2 className="display-lg mt-5">Make room for your<br /><strong>everyday <span className="normal-case">AURA.</span></strong></h2>
          <p className="lede mt-5 max-w-sm">Thoughtful design. A little more color in every day.</p>
          <Button variant="aura" size="aura" className="btn-pill btn-pill-lg mt-8" onClick={() => scrollToId("bottle")}>Find your AURA <ArrowUpRight /></Button>
        </InView>
        <div data-product-slot className="closing-product" aria-hidden />
      </div>
      <Footer />
    </section>
  );
}

function Footer() {
  const backToTop = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "instant" : "smooth" });
  };
  return (
    <footer className="closing-footer relative z-40 overflow-hidden">
      <div className="container-aura footer-grid">
        <div className="footer-brand">
          <span className="wordmark text-2xl text-foreground">AURA</span>
          <p className="footer-tagline">Carry a little calm, wherever the day takes you.</p>
        </div>
        <nav className="footer-col" aria-label="Explore AURA">
          <p className="eyebrow">explore</p>
          <ul>
            <li><Button variant="aura" size="aura" className="footer-link" onClick={() => scrollToId("discover")}>Discover</Button></li>
            <li><Button variant="aura" size="aura" className="footer-link" onClick={() => scrollToId("bottle")}>The Bottle</Button></li>
            <li><Button variant="aura" size="aura" className="footer-link" onClick={() => scrollToId("colors")}>Colors</Button></li>
            <li><Button variant="aura" size="aura" className="footer-link" onClick={backToTop}>Back to top <ArrowUp size={14} /></Button></li>
          </ul>
        </nav>
        <div className="footer-col">
          <p className="eyebrow">the colors</p>
          <ul>
            {VARIANTS.map((v) => (
              <li key={v.id}>
                <Button variant="aura" size="aura" className={`footer-color-btn variant-${v.id}`} onClick={() => { auraStore.set({ variant: v.id }); scrollToId("bottle"); }}>
                  <span className="swatch" aria-hidden />
                  <span>{v.name}</span>
                  <span className="footer-mood">{v.mood}</span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="container-aura footer-bar">
        <span>© 2026 AURA — a product design study</span>
        <span>thoughtful design, in four colors</span>
      </div>
      <div className="footer-giant" aria-hidden>AURA</div>
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
