# Branch constitution

Default branch: `main`
Policy: trunk-first on top of a very small set of standing program lanes.
Worktrees: one worktree per active working branch. Captures are archival, not active lanes.

## Standing branches (always exist)

| Branch                      | Purpose                                                                                                                 | Merge into      | Green means                                                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------ |
| `main`                      | Production-true trunk. README claims, current 4-state support, and release docs must be true here.                      | tags / releases | `CI Gate` passes, `validate-dependencies` passes, `Secret Scan` passes, and accepted deploy paths are honest |
| `lane/verify`               | Proof work: CI, typecheck, dependency evidence, reproducibility, and docs that establish what the repo actually proves. | `main`          | proof is stricter or clearer than `main`, never looser                                                       |
| `lane/heal`                 | Repairs to broken behavior, blocked PRs, stranded hardening work, and release/deploy correctness gaps.                  | `main`          | previously failing paths or blocked merges are actually healed                                               |
| `lane/expand-jurisdictions` | Complete already-stated product scope for additional jurisdictions and collectors without changing product identity.    | `main`          | each new jurisdiction is implemented, gated, tested, and disclosed honestly                                  |
| `lane/evolve-platform`      | Deployment, release, and platform changes already implied by open epic work.                                            | `main`          | platform changes preserve truth and release discipline                                                       |

Dormant lanes stay listed until explicitly retired by PR.

## Working branches (temporary)

Pattern: `work/<lane>/<short-intent>`

Also allowed: `feat/<intent>`, `fix/<intent>`, `docs/<intent>`, `test/<intent>`, `hotfix/<intent>`

Rules:

- Cut from the lane you are advancing, or from `main` if the change is trunk-ready.
- One intention per branch.
- Open a PR early; do not accumulate unrelated work.
- Merge by PR; delete after merge.
- If blocked, comment the verdict and keep the branch.
- `capture/*` and `wip/preserve-*` are archival snapshots, never merge queues.

## Hotfix

`hotfix/<intent>` from `main` → PR to `main` → back-port into living lanes if needed.

## Release branches

No standing `release/*` branch today.

Reason: the repo ships tagged artifacts and workflow-based promotions; current evidence does not show an active freeze-branch practice.
If that changes, add `release/*` by PR to this file.

## What must never live on standing branches

- unrelated WIP
- raw worktree preservation dumps
- duplicate retry branches
- experimental work without a finish line
- scope-mixed “fix everything” batches
