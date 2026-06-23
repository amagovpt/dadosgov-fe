# Frontend - dados.gov.pt

## Stack
- Next.js 16 (App Router), React 19, TypeScript 5 (strict mode)
- UI: @ama-pt/agora-design-system 3.4.2 (Portuguese government design system)
- Styling: Tailwind CSS 4
- Date utils: date-fns 4

## Commands

```bash
# Install dependencies
npm install

# Dev server (port 3000)
npm run dev

# Production build & start
npm run build
npm run start

# Lint
npm run lint
```

## Code Style

- **Prettier**: double quotes, semicolons, trailing commas (ES5), 100 char width, 2-space indent
- **ESLint**: Next.js core-web-vitals + TypeScript rules, max line length 100 (warning)
- **EditorConfig**: 2 spaces, LF line endings, UTF-8, trim trailing whitespace

## Architecture

- **App Router**: routes in `src/app/pages/`
- **Components**: `src/components/` organized by feature (datasets/, reuses/, organizations/, etc.)
- **API layer**: `src/service/api/<domain>/index.ts` - backend API calls grouped per domain; shared fetch helpers in `src/service/utils/API.ts`
- **Types**: `src/service/types/<domain>/` - TypeScript interfaces for API responses
- **Path alias**: `@/*` maps to `./src/*`

## Component Conventions

- `'use client'` directive required for interactive components and design system usage
- PascalCase for component names
- Suffix `Client` for components managing full page state (e.g., `DatasetsClient.tsx`)
- Named exports for components
- Props interfaces defined at component level
- Tailwind utility classes for styling (use design tokens: `primary-*`, `neutral-*`, `brand-*`)

## API Integration

- Base URL: `https://dados.gov.pt/api/1` (configured in `src/service/utils/API.ts`)
- Error handling: graceful fallbacks returning empty states

### Data Fetching — Server Components (preferred for public pages)

For public-facing pages, prefer async Server Components with ISR caching:

1. Make `page.tsx` an async Server Component (no `"use client"`).
2. Fetch data directly in the component body using functions from `src/service/api/<domain>`.
3. Use `next: { revalidate: N }` on `fetch()` calls for ISR caching (homepage: 60s, posts: 120s, site metadata: 300s).
4. Pass fetched data as props to a child `*Client.tsx` component for interactivity.
5. Provide typed empty-state fallbacks in the catch block so the page still renders on error.
6. When a page needs multiple data sources, prefer a single aggregated backend endpoint over multiple `Promise.all` calls.

### Data Fetching — Client Components (for authenticated/dynamic pages)

When fetching dynamic data in a client component (e.g., admin pages), use `useEffect` and `useState` with functions from `src/service/api/<domain>`:

1. Define state for the data array/object and a loading boolean (`isLoading`).
2. Inside `useEffect()`, wrap the API call in an `async function`.
3. Use a `try/catch/finally` block:
   - `try`: `const response = await fetchDatasets(...)` and `setData(response.data)`.
   - `catch`: Log the error `console.error(...)`.
   - `finally`: `setIsLoading(false)`.
4. Render conditionally based on `isLoading` (show loading state vs mapped data).
5. Provide a fallback empty state if no data is returned.

## Key Paths

- `src/app/page.tsx` - Homepage
- `src/app/layout.tsx` - Root layout (Header + Footer)
- `src/app/globals.css` - Global styles & design tokens
- `src/service/api/` - API integration layer (per-domain `index.ts`)
- `src/service/utils/API.ts` - shared fetch helpers & base URLs
- `src/service/queries/` - Squidex (GraphQL) integration layer
- `src/service/types/` - TypeScript type definitions
- `src/components/Header.tsx` / `Footer.tsx` - Layout components
- `tailwind.config.ts` - Theme config with Agora design system

## Branch & Commit Conventions

All contributors must follow these conventions. References:
[Conventional Branch](https://conventionalbranch.org/) and [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/).

- **Never add `Co-Authored-By`** or any AI attribution to commit messages. Commits must appear as made solely by the developer working on the branch.

### Branches — Conventional Branch

Format: `<type>/<description>`

- **Description** in `kebab-case`, lowercase, alphanumerics and hyphens only (no spaces, `_`, uppercase, or special chars).
- Optionally include the issue/ticket number: `feature/issue-123-datasets-filters`.

| Prefix     | Use                                                       |
| ---------- | --------------------------------------------------------- |
| `main`     | Main production branch (no prefix).                       |
| `feature/` | New feature.                                              |
| `bugfix/`  | Bug fix.                                                  |
| `hotfix/`  | Urgent fix (typically against production).                |
| `release/` | Release preparation.                                      |
| `chore/`   | Tasks with no production-code impact (deps, config).      |

Examples: `feature/datasets-server-component`, `bugfix/csrf-session-overwrite`, `chore/bump-design-system`, `hotfix/home-revalidate`.

### Environment Promotion Flow

This frontend repo (`github.com/amagovpt/dadosgov-fe`) has long-lived environment branches `develop`, `tst`, `ppr`, `main`. Promote changes upwards through PRs, one environment at a time:

1. Branch **from `develop`** (using the Conventional Branch naming above).
2. When ready, open a PR back **into `develop`**; integrate and test there.
3. Then a PR **into `tst`**; test in tst.
4. Then a PR **into `ppr`**; test in ppr.
5. Then a PR **into `main`** (production).

> The PR base is always the **next environment up**, not always `main`. Apply this flow only when the change touches this repo. GitHub CLI (`gh`) is not installed here — open PRs via the compare URL `https://github.com/amagovpt/dadosgov-fe/compare/<base>...<head>?expand=1`. See the monorepo `CLAUDE.md` for the cross-repo rule.

### Commits — Conventional Commits 1.0.0

Format:

```
<type>[optional scope][!]: <description>

[optional body]

[optional footer(s)]
```

- **type** (required): `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- **scope** (optional): affected area, e.g. `feat(datasets):`, `fix(api):`.
- **description**: imperative, lowercase, in English, no trailing period.
- **`feat`** → _MINOR_ bump; **`fix`** → _PATCH_ bump.
- **Breaking changes**: `!` after type/scope (e.g. `feat(api)!:`) and/or a `BREAKING CHANGE: <description>` footer.
- Reference issues in the footer or description: `(fix #XXX)`.

Examples:

```
feat(datasets): move datasets list fetch to async Server Component
fix(auth): mint CSRF server-side on authenticated POSTs (fix #42)
chore: bump @ama-pt/agora-design-system to 3.4.2
refactor(home): pass aggregated data as props to HomeClient
```
