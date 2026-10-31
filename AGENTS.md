# AGENTS.md - egg-web

Web client of EGG, a marketplace of creative people: Next.js 16 (App Router), React 19, TypeScript 5.7, Tailwind 4, pnpm 10.
The backend, the API contract and the plan live in the repository `egg-backend` (`docs/`, `contract/`).

## Work from a path without non-ASCII characters (Windows)
On Windows pnpm links packages with junctions. When the project path contains non-ASCII characters or spaces
(for example `C:\Users\<name>\Desktop\My projects\...`) TypeScript resolves the types of Radix packages from the link
location instead of the real one, cannot find their dependencies and reports **hundreds of phantom errors** such as
"Property 'className' does not exist on type ..." (287 in this project; 0 in the same commit under `C:\dev\web` and in Linux CI).
That is probably why `typescript.ignoreBuildErrors` used to be on. Use a checkout under an ASCII path, for example
`git worktree add C:\dev\web <branch>`.

## Commands
- `pnpm install --frozen-lockfile`
- `pnpm typecheck` (`tsc --noEmit`), `pnpm lint` (ESLint, no warnings allowed), `pnpm test` (Vitest), `pnpm build`
- `pnpm check:no-mocks`: lists what the v1 UI must lose (old mock data, out-of-scope features; AC-30, AC-31). It only warns until
  P5.5; `--strict` or `EGG_NO_MOCKS_STRICT=1` makes findings fail.
- Gates run in CI in this order: install, api:check, typecheck, lint, test, build, check:no-mocks.

## The API contract
The source of truth is `egg-backend` (`contract/openapi/egg-v1.yaml`). This repository holds a pinned copy in `contract/`
(`egg-v1.yaml`, `VERSION`, `acceptance-criteria.md`), the backend commit it came from (`contract/BACKEND_REF`) and the hashes of the
copy (`contract/SHA256SUMS`). `lib/api/schema.d.ts` is generated from the copy and committed. Never edit these files by hand.
- Update: change the contract in `egg-backend` and merge it there; then, with a local checkout of `egg-backend` next to this one
  (or `EGG_BACKEND_DIR`), run `pnpm api:sync` (HEAD of that checkout) or `pnpm api:sync --ref contract-v0.2.0` (a tag), and commit
  `contract/` and `lib/api/schema.d.ts`. It copies the committed content from git, so uncommitted changes are never synced.
- `pnpm api:gen` only regenerates the types; `pnpm api:check` fails when the copy was edited by hand or the types are stale. Types are
  generated with `--default-non-nullable false` (optional request fields with defaults stay optional) and TypeScript 5.x.
- The repository is public, so the contract is public too. There is no image pinning and no bot PR yet (they come with the staging
  deploy, P9.1).
- Use the generated types with `openapi-fetch`: `createClient<paths>(...)` (see `docs/spikes/s2-client-check.ts` in `egg-backend` for
  the shapes that matter: optional values are omitted, never `null`; `nextCursor` is the only nullable value).

## Branches, CI and merging
- Work in a branch `feat/<phase>-<slug>`; changes reach `main` only through a pull request. Do not push, open or merge a PR without the user's approval for that action.
- The repository is public. CI (`.github/workflows/ci.yml`) runs on every PR and on `main` with a read-only token and no secrets; never add a secret to a workflow that runs on pull requests.
- Merge with `scripts/merge-pr.sh <pr>`: it checks that the PR is open and not a draft, all checks succeeded and the branch contains the current `main`, then rebases the commits onto `main`. Branch protection is not used (same rule as in `egg-backend`).
- Third-party GitHub Actions are pinned by commit hash with the version in a comment; take releases that are at least two weeks old.

## Rules
- `next.config.mjs` takes the build number `N` for `X-EGG-Client: web/<N>` from `scripts/build-version.mjs` (commit time of HEAD).
  A build without git history fails on purpose; pass `EGG_WEB_VERSION=<N>` when there is none.
- `scripts/compute-min-supported.mjs` decides `EGG_CLIENTS_WEB_MIN_SUPPORTED` for a deploy of the pair (used by the deploy step, P9.1).
- No `.only` in tests (Vitest runs with `allowOnly: false`), no committed `eslint-disable` without a reason after `--`.
- Keep TypeScript on 5.x: `openapi-typescript` 7 crashes on TypeScript 7.
- ESLint is on 9.39 because the plugins behind `eslint-config-next` (react, import, jsx-a11y) do not support ESLint 10 yet; ESLint 9 is
  out of upstream support, so move to 10 as soon as those plugins allow it.
- Pin new dependencies exactly; take releases that are at least two weeks old.

## Not here yet
Publishing the backend image to ghcr.io and the bot PR `api:sync` (with the staging deploy, P9.1); Prism and `dev:mock` (P5.1);
Playwright and e2e (P5.3a); Testing Library (P5); `Dockerfile` and deploy workflows (P9.1).
