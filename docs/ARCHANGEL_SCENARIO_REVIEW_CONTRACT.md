# ARCHANGEL Scenario Review Contract

## Purpose

Scenario review is an application-only planning gate. It gives an operator a reproducible answer to a limited question: **is this scenario complete enough to be presented for human planning review?** It does not approve deployment, create a host, alter a dependency, or contact a node.

## Evaluation Rules

| Rule | Result | Reason |
|---|---|---|
| Affected application is physically unplaced and the scenario is about host placement | **Blocking** | The scenario must preserve the application’s unplaced posture until a future host declaration is separately recorded. |
| Objective, assumptions, and rollback hypothesis meet schema requirements | **Pass** | These fields establish an explicit planning basis and return path. |
| An affected application has `evidence-needed` posture | **Advisory** | The scenario can be reviewed, but the evidence gap remains visible. |
| Scenario attempts to cross the application-only boundary | **Blocking by product design** | There is no infrastructure action field or dispatch procedure in the scenario contract. |

## Transition

Only a draft with **zero blocking results** can move to `review-ready`. The server re-evaluates the stored planning record at transition time; the client’s visual preview is not trusted as an authority. A successful transition appends an audit event of type `planning.scenario.review-ready` and still does not create executable work.

## Traceability

Application detail pages link affected planning records. Scenario Studio links review results and transition outcomes. Control Briefing reports review-ready scenario count and lists each record as planning material. The Evidence Observatory captures the associated append-only audit event.
