# ARCHANGEL Operations Field Visual Review

## Scope

The rebuilt physical Operations Field and logical topology were reviewed at **1440 × 960** and **390 × 844** viewports. The review covered geographic truth boundaries, state-filter controls, keyboard-selectable SVG beacons, logical-role selection, motion fallback, label readability, and separation of unplaced applications from physical coordinates.

| Criterion | Result |
|---|---|
| Geographic truth | The field draws only the nine declared regional hosts plus London as ARCHANGEL’s dedicated host. Resonate Earth and Exitus Lens remain in the unplaced ledger, not on the map. |
| State semantics | Declared/pending, verified, stale, offline, policy-blocked, and unplaced have separate color, ring, and copy contracts. In the present fleet, declared hosts visibly show **pending evidence**, not fictitious online/offline status. |
| Motion safety | Pending, verified, stale, offline, and policy-contained pulses are gated behind `prefers-reduced-motion: no-preference`; static labels, color, and border pattern retain all meaning without motion. |
| Interaction | Operations-field filters use native buttons. SVG beacons are keyboard-selectable with Enter and Space, expose accessible names, and open a text inspector. Logical topology vertices are native buttons with selected state. |
| Desktop review | The topology remains the ceremonial role field; the Operations Field becomes a distinct strategic evidence map with readable beacon labels and no fabricated link arcs. |
| Mobile review | The topology remains vertically readable. The map uses a horizontal inspection canvas with an explicit swipe instruction so its cartography and beacon labels are preserved instead of being compressed into an unreadable miniature. |

## Result

The operations field now behaves as a control-room instrument rather than a decorative scatter plot. Its visual energy is deliberately constrained by evidence: the amber inquiry pulse means a declared host awaits signed proof, not that the host is down. Red offline beacons remain a reserved future state until a signed policy-defined offline signal exists.

## Validation Record

The implementation passed TypeScript validation and the full Vitest suite: **5 test files and 28 tests passing**. The targeted accessibility contract confirms native state filters, keyboard-operable beacons, truthful offline language, selected topology vertices, visible focus rules, and reduced-motion containment.
