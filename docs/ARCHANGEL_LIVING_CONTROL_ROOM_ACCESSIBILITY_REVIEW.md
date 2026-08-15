# ARCHANGEL Living Control Room Accessibility Review

## Scope

This review covers the compound-upgrade controls added to the authenticated console: the Fleet Overview **Truth Lenses**, the **Ecosystem Graph** perspective controls and node links, the **Aether Aperture**, and the visual-energy system that supports the upgraded Command Center and Evidence Observatory.

| Surface | Keyboard and semantic treatment | Validation result |
|---|---|---|
| Truth Lenses | Native `button` elements with an explicit `type="button"`; selected state is exposed through a `data-active` presentation attribute while the lens explanation remains in normal text. | Covered by targeted Vitest source-contract check. |
| Ecosystem Graph lenses | Native named buttons activate role, evidence, and placement perspectives. Node cards remain standard links to the protected node-detail route. | Covered by targeted Vitest source-contract check. |
| Aether Aperture | The decorative rings are hidden from assistive technology. The containing graphic supplies a concise label stating ARCHANGEL’s current mode plus verified and pending receipt totals. | Covered by targeted Vitest source-contract check. |
| Motion system | All animation declarations sit inside `prefers-reduced-motion: no-preference`; the full layout remains available with motion disabled. | Covered by targeted Vitest source-contract check and visual review. |
| Focus treatment | The global `:focus-visible` rule maintains a high-contrast cyan outline and offset around keyboard-reachable controls. | Existing keyboard-control regression retained and rerun. |

## Result

The new living-control-room interactions preserve the existing keyboard-first rule: native controls stay in the normal Tab and Shift+Tab sequence, are visually focusable, and have text labels or accessible names. The visual aperture and energy effects are supplemental; they do not carry unique operational meaning without a text counterpart.

## Verification Record

The full ARCHANGEL suite was rerun after these focused checks. The verified result is **5 test files and 26 tests passing**, together with a TypeScript check with no errors. Desktop and 390-pixel mobile screenshots were reviewed for the Fleet Overview, Mesh Topology, Ecosystem Graph, and Evidence Observatory.
