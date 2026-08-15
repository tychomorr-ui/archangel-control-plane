# ARCHANGEL Private Mesh Material Validation

## Scope

This record covers the **local, non-production validation** of the terminal materials for the all-node private mesh. No Lightsail firewall was changed, no WireGuard interface was activated on a fleet node, no live node was enrolled, and ARCHANGEL’s London baseline remained observe-only.

| Check | Result | Evidence |
|---|---|---|
| Hub, node, Root-Gate, and activation shell syntax | Passed | `bash -n` completed successfully for all five shell materials. |
| Receipt, admission creation, node acceptance, and hub-install Python syntax | Passed | `python3 -m py_compile` completed successfully. |
| Existing console contracts | Passed | TypeScript validation completed with zero errors. |
| Mesh material regression tests | Passed | 5 test files, 19 tests passed. |
| Root-Gate admission signature | Passed | Isolated Ed25519 signing and verification test completed. |
| Node proof of possession | Passed | Isolated node acknowledgement verified the same admission ID and challenge ID. |
| Private-only status boundary | Passed by code contract | Status agent binds to the assigned overlay address and exposes only `GET /v1/status`; no command handler exists. |
| Activation gating | Passed by code contract | Hub requires `--activate`; node activation verifies Root-Gate admission and has a single `AllowedIPs = 10.42.0.1/32` route. |

## Result

The materials are ready for a **controlled live rollout** through the existing Lightsail administrative terminals. The next step is operational rather than speculative: run the reviewed preparation scripts on London, Root-Gate, and every declared node; collect public manifests; install signed admission packages; then activate the private transport deliberately. Live enrollment remains pending because it requires console access to the fleet and current public endpoint data for the Lightsail firewall restriction.

## Preserved Safety Conditions

The completed package does not create a public enrollment API, a public status API, remote shell access, command execution, browser-held administrator keys, or a central store of node private keys. It keeps node transport and receipt-signing private keys on their owning host and admits only public material to the London registry.
