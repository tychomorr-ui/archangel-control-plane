# ARCHANGEL Verification Notes

The authenticated desktop preview renders the ARCHANGEL fleet overview with an accessible dark console layout, readable node cards, protected operator navigation, and a distinct constellation visual. The fleet remains explicitly receipt-pending until a future authenticated node agent writes signed status reports; no generated health, audit, or alert records are presented as live data.

The current console is intentionally a control-plane interface and data model. It does not connect to Lightsail instances, SSH, WireGuard, or a node agent yet, and it exposes no command-execution mechanism.

The desktop review confirmed the topology, node detail, intent workflow, audit ledger, alert feed, and registry render with visible state boundaries. The mobile review confirmed that the constellation, node cards, intent form, workflow stages, and review queue remain legible and vertically navigable at a 390 px viewport.

The keyboard-accessibility pass verifies that custom sidebar navigation, the mobile navigation toggle, refresh and retry actions, and the intent-submit action use semantic buttons. A global high-contrast `:focus-visible` rule supplies a cyan outline and halo for Tab/Shift+Tab navigation without relying on pointer hover.

Keyboard traversal record: on a desktop console, Tab proceeds through the six sidebar destinations, the operator sign-out control, the page-level refresh or retry control, and the current page’s form actions; Shift+Tab returns through that same native sequence. On a narrow viewport, Tab reaches the mobile navigation toggle before the active page controls; opening that navigation inserts its semantic destination buttons into the same sequence. On the sign-in gate, Tab reaches the Manus sign-in action. In the intent workspace, Tab reaches target node, operation type, scope, risk, expiry, rollback method, and Submit for review in visual order. The control-level test asserts native button usage, no `tabIndex={-1}` exclusion, and the global focus-visible treatment.
