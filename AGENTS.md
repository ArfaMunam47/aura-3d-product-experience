<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- The AURA page uses one fixed 3D canvas whose bottle pose is driven by scroll position across `[data-scene]` sections (poses in Stage.tsx); add a pose when adding a scene, so the bottle never jumps.
- Each visible product scene supplies a `[data-product-slot]` layout anchor; Stage derives framing from its bounds so desktop and mobile share the same scroll timeline without bottle/content collisions.
- AURA motion uses the shared reduced-motion hook and frame-rate-independent damping; preserve immediate selection feedback and reversible scroll transitions.
