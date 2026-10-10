# Enterprise architecture audit — 2026-10-10 (`aeb88ba`, `rpg-character`)

Read in this order:

1. `CLIENT-ENTERPRISE-AUDIT.md` — the report (executive summary, revision, maturity, AS-IS, spec vs reality, HIGH findings with
   false-positive review, per-area sections, verdict, ultimate test, enterprise scorecard, completeness matrix).
2. `CLIENT-ROADMAP.md` — P0–P5 with acceptance criteria, the migration DAG, and the DO NOT REFACTOR list.
3. `CLIENT-EXTENSION-POINTS.md` — every central edit a new feature makes today, the N+1 simulations, collision behaviour, fitness functions.
4. `CLIENT-TARGET-ARCHITECTURE.md` — the TO-BE, derived from the code; target dependency graph; API tiers; tool seams.
5. `CLIENT-MODULARITY-MATRIX.md` — measured import graph, forbidden-dependency matrix with enforcement status, package responsibilities, modularity scorecard.
6. `CLIENT-STATE-OWNERSHIP.md` — state classes, AS-IS and target ownership tables, reconciliation, client-authority audit.
7. `CLIENT-RENDERING-ARCHITECTURE.md` — the two renderers, texture lifetimes, hot-path table, budget, target.
8. `CLIENT-PERFORMANCE-PLAN.md` — what was measured, what could not be, risks ranked, instrumentation to add, optimisation order.

`appendix/` holds the nine specialist reports (file:line evidence for every finding) and the sort benchmark; `shots/` the
screenshots cited in the report. Every finding in the companions carries its ID (KG, NP, IR, AV, UI, AC, MT, ME, RT) so it can be
traced back to its appendix entry.

Status: written by the audit session, **not committed** (the audit was asked not to modify or commit anything in the repository;
this folder is new and untracked). Everything was verified against the stated revision; items that could not be verified without
the emulator, the asset host or a GPU browser say so in place.
