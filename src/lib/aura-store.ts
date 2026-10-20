import { useSyncExternalStore } from "react";

export type VariantId = "cloud" | "petal" | "sage" | "tide";
export type DetailView = "full" | "cap" | "finish" | "base";

export const VARIANTS: { id: VariantId; name: string; mood: string; body: string; cap: string; swatch: string }[] = [
  { id: "cloud", name: "Cloud", mood: "Warm ivory", body: "#F4EBDD", cap: "#38253F", swatch: "#FFF8EF" },
  { id: "petal", name: "Petal", mood: "Soft peach", body: "#F2BBA1", cap: "#F07868", swatch: "#F6C7AE" },
  { id: "sage", name: "Sage", mood: "Muted green", body: "#A9C79F", cap: "#4E6B4A", swatch: "#B9D4B0" },
  { id: "tide", name: "Tide", mood: "Soft sky blue", body: "#B4D3EC", cap: "#38253F", swatch: "#C5DFF2" },
];

type State = {
  variant: VariantId;
  detail: DetailView;
  dragX: number; // yaw offset (radians) from user drag
  dragY: number; // pitch offset
  ready: boolean;
};

let state: State = { variant: "petal", detail: "full", dragX: 0, dragY: 0, ready: false };
const listeners = new Set<() => void>();

export const auraStore = {
  get: () => state,
  set(patch: Partial<State>) {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useAura<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(auraStore.subscribe, () => sel(state), () => sel(state));
}

export const variantById = (id: VariantId) => {
  const variant = VARIANTS.find((v) => v.id === id);
  if (variant) return variant;
  return { id: "petal" as const, name: "Petal", mood: "Soft peach", body: "#F2BBA1", cap: "#F07868", swatch: "#F6C7AE" };
};

export function scrollToId(id: string) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "start" });
}
