# AURA Project Guidelines

- The AURA page uses one fixed 3D canvas whose bottle pose is driven by scroll position across `[data-scene]` sections (poses in Stage.tsx); add a pose when adding a scene, so the bottle never jumps.
- Each visible product scene supplies a `[data-product-slot]` layout anchor; Stage derives framing from its bounds so desktop and mobile share the same scroll timeline without bottle/content collisions.
- AURA motion uses the shared reduced-motion hook and frame-rate-independent damping; preserve immediate selection feedback and reversible scroll transitions.
- The closing scene is typography-led: no product slot, bottle pose stays offstage (`show: 0`), and the interactive AURA wordmark cycles variants via `nextVariant`; the Everyday Refresh visual is a single arched focal frame with a depth wash — never reintroduce multi-photo collages in these sections (each section keeps its own visual identity).
