

### Blocking-policy validation — 2026-09-29

A second legitimate protected scenario, `scn_RxYEiAB8P8e8` (**Exitus Lens host placement review**), was created through Scenario Studio using the real authenticated operator session. Its affected application was the declared but physically unplaced Exitus Lens application. The server-evaluated preview rendered **1 blocking** result (`policy.host-evidence`: Exitus Lens remains physically unplaced), a **review** result (`policy.rollback`: recovery hypothesis present), and a **pass** result (`policy.no-execution`: no host connection, enrollment, firewall, mesh, or command-dispatch path). The UI correctly kept the scenario in `draft` and did not offer a review-ready transition while the blocker remained.

Together with `scn_AL4PY0nMXxHc` (**KEIRA evidence boundary review**), the authenticated evidence set covers all policy result classes: blocking, review, advisory (`policy.evidence`), and boundary-pass (`policy.no-execution`). The existing 1280×720 and 375×812 responsive captures cover the relevant Atlas, Scenario Studio, Control Briefing, and Evidence Observatory layouts; the authenticated blocking preview was additionally inspected in the live operator viewport. No execution, host contact, enrollment, or external integration was enabled.
