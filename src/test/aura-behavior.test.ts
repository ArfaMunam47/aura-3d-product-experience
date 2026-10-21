import { describe, expect, it, vi } from "vitest";
import { auraStore, scrollToId, VARIANTS, variantById } from "@/lib/aura-store";

describe("AURA product rules", () => {
  it("preserves the four required color variants", () => {
    expect(VARIANTS.map(v => v.name)).toEqual(["Cloud", "Petal", "Sage", "Tide"]);
    for (const variant of VARIANTS) {
      auraStore.set({ variant: variant.id });
      expect(variantById(auraStore.get().variant).name).toBe(variant.name);
    }
    auraStore.set({ variant: "petal" });
  });

  it("does not animate section navigation under reduced motion", () => {
    const element = document.createElement("section");
    element.id = "bottle";
    const scroll = vi.fn();
    element.scrollIntoView = scroll;
    document.body.appendChild(element);
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    scrollToId("bottle");
    expect(scroll).toHaveBeenCalledWith({ behavior: "instant", block: "start" });
    element.remove();
    vi.unstubAllGlobals();
  });
});