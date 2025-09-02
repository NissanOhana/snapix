# Repository Guidelines

## Package Manager
**IMPORTANT: Always use Yarn as the package manager. Do NOT use npm.**
- Install dependencies: `yarn add <package>`
- Install dev dependencies: `yarn add -D <package>`
- Install workspace dependencies: `yarn workspace <workspace-name> add <package>`
- Install all dependencies: `yarn` or `yarn install`

## Project Structure & Modules
- Root: Yarn workspaces monorepo (`packages/*`).
- Client: `packages/snapix-app` (Vite + React + TS). Routes live in `src/routes`, client setup in `src/lib`.
- Server: `packages/snapix-server` (Express + tRPC + MongoDB). Routers in `src/trpc/routers`, services in `src/services`, config in `src/config`.
- Env: Server loads `packages/snapix-server/.env` via `src/env.ts` and validates required variables.

## Build, Test, and Dev Commands
- `yarn setup`: Install all workspace dependencies.
- `yarn dev`: Run server and client concurrently.
- `yarn build`: Build client and server artifacts.
- `yarn start`: Start built server (`/api/trpc` and static SPA in production).
- Per-package:
  - App: `yarn workspace snapix-app dev|build|lint|type-check`
  - Server: `yarn workspace snapix-server dev|build|start|lint|type-check`

## Coding Style & Naming
- TypeScript strict mode across app and server.
- Indentation: 2 spaces; semicolons required; prefer named exports.
- React: PascalCase components, hooks start with `use*`, colocate feature code.
- File names:
  - Server routers: `*.router.ts` (e.g., `agents.router.ts`), services: `*.service.ts`.
  - Client routes: lower-kebab or dotted (e.g., `auth.callback.tsx`).
- Linting: `eslint` via package scripts; fix warnings before PR.

## Testing Guidelines
- No formal test suite yet. Use `type-check` and `lint` as gates.
- If adding tests, prefer `__tests__` with `*.test.ts(x)` near sources.
- Aim for unit tests on routers/services; keep network and DB mocked.

## Commit & PR Guidelines
- Commits: Present tense, concise scope. Conventional Commits welcome (e.g., `feat: add agents router`).
- PRs: Include description, linked issues, screenshots for UI changes, test plan, and any env/config notes.
- Keep changes scoped; update docs when adding routes/services.

## Security & Configuration
- Required env (server): `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_SECRET`.
- Local example: create `packages/snapix-server/.env`; client default dev at `http://localhost:5173`, server at `http://localhost:5000`.
- CORS, sessions, and Helmet are configured; review CSP before production.

## Agent-Specific Notes
- Add new agent endpoints under `src/trpc/routers` and register in `src/trpc/router.ts`.
- Put integrations in `src/services` (e.g., `n8n.service.ts`), keep routers thin and validated.
- Client consumes tRPC via `src/lib/trpc.ts`; expose new procedures there as needed.
