# ARCHANGEL Topology Readability Review

## Scope

This review records the visual verification of the logical relationship topology. It is intentionally distinct from the geographic map: the diagram communicates **trust-role geometry**, not physical distance or traffic routing.

| Review item | Desktop check | Mobile check | Result |
|---|---|---|---|
| Viewport | 1280 × 1000 | 375 × 812 | Captured and reviewed |
| Alpha triangle | XinUS-Clarity at the upper apex, Root-Gate at lower left, Tesseract-Terminus at lower right | The same named vertex order remains visible | Readable |
| Beta triangle | Kether-Gate at upper left, Tesseract-A at upper right, KEIRA at the lower apex | The same named vertex order remains visible | Readable |
| ARCHANGEL | Centered crosshair and London logical-center label visible | Centered crosshair and label remain visible | Readable |
| Project Reclaim | Dedicated grounded-bridge card visibly below KEIRA | Dedicated grounded-bridge card remains below KEIRA | Readable |

## Observations and Resolution

The initial explicit layout placed the KEIRA and Project Reclaim cards too close together near the lower part of the canvas. The canvas was increased to **900 px minimum height on narrow screens** and **940 px on desktop**, KEIRA was placed at 76% of the canvas height, and Project Reclaim was anchored at 1% above the bottom edge. A follow-up desktop capture confirmed the two cards are now distinct, with the dashed bridge line continuing from the central coordination layer to Project Reclaim.

The finalized relationship diagram preserves the required vertex order and uses actual polygon edges: one **upright Alpha triangle** and one **inverted Beta triangle**. The shared center is marked as ARCHANGEL rather than treated as another physical node. The geographic map immediately following the diagram remains the reference for actual regional positions.

## Testable Contract

`shared/archangel.ts` exports `TOPOLOGY_LAYOUT_CONTRACT`. It establishes the exact seven-vertex render order and the vertical-spacing values that keep KEIRA and Project Reclaim separated. `server/archangel.test.ts` verifies this contract so future layout refactors cannot silently reorder the triangles or collapse the bridge into the inverted-triangle apex.
