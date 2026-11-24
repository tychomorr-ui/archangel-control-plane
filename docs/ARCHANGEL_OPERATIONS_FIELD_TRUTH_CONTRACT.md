> **Historical planning record — superseded for active deployment.** This document contains earlier provider or placement assumptions. The current canonical deployment is UpCloud; use `docs/ARCHANGEL_UPCLOUD_CANONICALIZATION.md` and the active source declarations for present operations. Historical text is retained unchanged for auditability.

# ARCHANGEL Operations Field Truth Contract

## Purpose

The operations field is a cinematic interface for **known truth**, not a decorative simulation of a live network. Every point, pulse, arc, color, and alert treatment must answer one question: *what evidence permits this visual claim?*

## Canonical Visual States

| State | Evidence required | Beacon treatment | What the interface may say | What it must not say |
|---|---|---|---|---|
| **Declared** | Owner-supplied host and regional inventory. | Stable cool-white core with a low cyan perimeter. | “Declared host” or “declared application.” | “Online,” “connected,” or “healthy.” |
| **Pending evidence** | Declared host exists but has no signed current status receipt. | Amber perimeter with a slow, restrained inquiry pulse. | “Awaiting signed evidence.” | “Offline” or “unreachable.” |
| **Verified** | Current signature, registered identity, freshness, and accepted receipt. | Cyan/emerald pulse that resolves into a stable core. | “Verified” with receipt timestamp. | “Healthy forever” or any unbounded availability claim. |
| **Stale** | A previously accepted signed receipt has exceeded its defined freshness window. | Amber ring with a fractured/decaying dash pattern. | “Evidence stale” with last accepted timestamp. | “Offline” unless a separate offline rule succeeds. |
| **Offline** | Future only: a signed, policy-defined agent signal confirms no current availability under a configured threshold. | Rose core that ceases signal emission; last-known trail stays visible. | “Offline evidence recorded.” | A generic browser fetch failure or missing receipt presented as offline. |
| **Policy-blocked** | A deterministic policy evaluation rejects a scenario or bounded intent. | Violet/rose containment ring with a stationary lock glyph. | “Policy blocked” with the relevant policy. | “Failed host” or “security incident” without evidence. |
| **Unplaced** | An application role is declared but has no supplied physical host and region. | Dashed constellation mark outside the physical map layer. | “Unplaced application.” | A geographic location, traffic path, or host health claim. |

## Geographic Rendering Contract

The physical map is an **equirectangular regional-city proxy projection** of owner-supplied AWS region inventory. It is not a map of AWS facilities or an assertion of exact server coordinates. Regional city proxies are intentionally separated from the logical topology and use no connectivity arcs unless the future system holds signed, policy-approved link evidence.

| Map layer | Contents | Interaction |
|---|---|---|
| **Geography** | Low-contrast latitude/longitude grid, regional-city proxy coordinates, and global landmass contour approximation. | Can be dimmed for focus, but does not create new facts. |
| **Declared hosts** | Only hosts with a supplied region and a declared inventory record. | Selecting a beacon opens its name, role, truth state, and evidence note. |
| **Evidence field** | Beacon halos, receipt trails, and freshness labels derived from the canonical states. | Selecting a state filter isolates nodes without implying that filtered nodes vanish from the fleet. |
| **Future applications** | Unplaced applications in a separate ledger, deliberately outside the geographic layer. | Selection opens planning posture; it never pans to a fabricated location. |

## Logical Field Contract

The logical topology expresses role and authority relationships. It may show Alpha, Beta, bridge, outer-circle dependency, policy, and application layers, but it must label these as **logical relationships**. Geometry cannot imply latency, cable route, private mesh activation, or current traffic.

## Motion Contract

All nonessential animation is limited to `transform` and `opacity`, runs only under `prefers-reduced-motion: no-preference`, and is accompanied by text labels. Motion conveys evidence state: pending evidence inquires, verified evidence resolves, stale evidence decays, offline evidence extinguishes, and policy-blocked state contains. With reduced motion, the state remains fully legible through color, icon, copy, and border pattern.
