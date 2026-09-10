# Branch constitution

## Default branch

`main` is the production-true trunk. It is the only standing branch currently
supported by repository policy. Work merges to `main` through pull requests; direct
pushes and history rewrites are not part of the workflow.

## Runtime baseline

The supported application runtime is Node `24.19.0` with npm `11.9.0`, recorded in
`.nvmrc`, `package.json`, the active GitHub workflows, and the production Docker
image. The Cloudflare workspace follows the same baseline. Historical documentation
may mention older examples, but active build and deployment surfaces must use this
baseline.

## Working branches

All other branches are temporary worktrees or automation branches. Use one intention
per branch and cut from the current `main` before starting work:

| Pattern                                                 | Purpose                                                          | Merge target           | Green means                                                                                  |
| ------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------- |
| `feature/*`, `feat/*`                                   | Product capability or stated scope expansion                     | `main`                 | Feature tests and the CI Gate pass                                                           |
| `fix/*`, `hotfix/*`, `security/*`                       | Correctness, security, or production repair                      | `main`                 | Regression proof exists and the CI Gate passes                                               |
| `docs/*`, `test/*`, `chore/*`, `refactor/*`             | Documentation, verification, maintenance, or bounded refactoring | `main`                 | The relevant existing checks pass and no unrelated behavior changes                          |
| `dependabot/*`                                          | Automated dependency update                                      | `main`                 | Dependency declarations remain locked and the CI Gate passes                                 |
| `copilot/*`, `claude/*`, `limen/*`, `codex/*`, `work/*` | Agent-directed implementation or recovery work                   | `main`                 | The branch has a recoverable intention, an explicit verification record, and a reviewable PR |
| `capture/*`                                             | Historical/snapshot evidence                                     | Never merge by default | The snapshot remains immutable evidence; it is not treated as product work                   |

The prefixes above reflect branches present in the remote inventory. New naming should
prefer `feat/`, `fix/`, `chore/`, `docs/`, `test/`, or `security/`; legacy automation
prefixes remain classified rather than silently renamed.

## Lifecycle rules

1. Start from an up-to-date `main`; use a dedicated worktree for active work.
2. Keep commits focused and preserve the recovered intention in the PR description.
3. Run the smallest relevant local checks, then the repository CI Gate.
4. Merge only through a PR after review and required checks are confirmed.
5. Delete a working branch only after its intention is present on `main` or a linked
   successor preserves all unique work. Do not delete branches to hide unfinished work.

## Standing lanes

No additional standing program lane is established by this pass. The repository has
many active automation and dependency branches, but the evidence does not yet show
that long-lived `lane/verify`, `lane/heal`, or `lane/expand` branches are maintained
as integration targets. If recurring work requires one, add it through a focused PR
that documents its purpose and green criteria.

## Hotfixes and releases

`hotfix/*` branches cut from `main` and merge back to `main`. `release/*` is reserved
for an actual versioned release freeze; no standing release branch is required by the
current checkout.

## Explicitly forbidden

- No direct work commits to `main`.
- No force-push or history rewrite on `main`.
- No branch closure, deletion, or PR closure as a substitute for recovering intent.
- No merge of `capture/*` snapshots as if they were current implementation.
- No claim that CI is merge-enforcing until the GitHub branch-protection setting is
  confirmed by an administrator; local checkout evidence cannot prove enforcement.
