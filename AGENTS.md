# Repository Guidelines

## Project Structure & Module Organization
- Source: `src/` (feature folders like `components/`, `pages/`, `services/`, `features/`, `hooks/`, `shared/`, `types/`).
- API client: `src/api/` generated via OpenAPI (`core/`, `models/`, `services/`).
- Desktop: `electron/` (`main.ts`, `preload.ts`), output to `dist-electron/`.
- Assets and entry: `public/`, `index.html`, `src/main.tsx`, `src/App.tsx`.
- Aliases: import with `@/...` (see `vite.config.ts`).

## Build, Test, and Development Commands
- `npm run dev`: Start Vite dev server with Electron (renderer + main/preload watch).
- `npm run build`: Type-check, build renderer, and package Electron via `electron-builder`.
- `npm run preview`: Serve built renderer for web-only preview.
- `npm run lint`: ESLint over TS/TSX.
- `npm run generate-api` / `watch-api`: Generate client from `http://localhost:8000/openapi.json` into `src/api`.

## Coding Style & Naming Conventions
- Language: TypeScript (strict) + React 18, Tailwind CSS.
- Linting: ESLint (`.eslintrc.cjs`); fix issues before commit.
- Components: PascalCase files for feature components (e.g., `DashboardPage.tsx`); shadcn/ui primitives are lowercase (e.g., `components/ui/button.tsx`).
- Variables/functions: `camelCase`; types/interfaces: `PascalCase`; constants: `UPPER_SNAKE_CASE`.
- Imports: prefer `@/` alias; avoid deep relative chains.

## Testing Guidelines
- Framework not yet configured. Prefer Vitest + React Testing Library when adding tests.
- Location: colocate as `*.test.ts(x)` next to source (e.g., `Button.test.tsx`).
- Scope: unit tests for hooks/utils; component tests for UI; add Playwright for e2e as needed.

## Commit & Pull Request Guidelines
- Commits: Conventional style (`feat:`, `fix:`, `chore:`, `refactor:`, `style:`). Use imperative mood and clear scope. Example: `feat(auth): add token refresh queue`.
- Branches: `feature/<slug>`, `fix/<slug>`, `chore/<slug>`.
- PRs: include summary, linked issues (`Closes #123`), screenshots/GIFs for UI, test/QA steps, and notes on breaking changes. Ensure `npm run lint` and build pass.

## Security & Configuration Tips
- Env: define vars in `.env` (e.g., `VITE_API_BASE_URL`); never commit secrets.
- Electron: keep `contextIsolation: true`, `nodeIntegration: false`; communicate via `preload` APIs (`window.electronAPI`).
- API client: regenerate when backend OpenAPI changes (`npm run generate-api`).
