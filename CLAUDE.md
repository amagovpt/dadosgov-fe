# Frontend - dados.gov.pt

## Stack
- Next.js 16 (App Router), React 19.2, TypeScript 5 (strict mode)
- UI: @ama-pt/agora-design-system 3.6.1 (Portuguese government "Agora" design system)
- Styling: Tailwind CSS 3.4 (`corePlugins.preflight: false` — Agora handles resets)
- i18n: next-i18n-router 5.5.8 + i18next / react-i18next (locales `pt`, `en`)
- Data: Apollo Client 4 (Squidex GraphQL) + REST; date-fns 4 / dayjs

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

# Unit tests (Vitest)
npm test

# E2E tests (Playwright)
npm run test:e2e            # public frontend
npm run test:e2e:backoffice # admin/backoffice
```

## Code Style

- **Prettier**: double quotes, semicolons, trailing commas (ES5), 100 char width, 2-space indent
- **ESLint**: Next.js core-web-vitals + TypeScript rules, max line length 100 (warning)
- **EditorConfig**: 2 spaces, LF line endings, UTF-8, trim trailing whitespace

## Architecture

- **App Router (localized)**: routes live under `src/app/[locale]/<route-group>/<feature>/page.tsx`.
  - `[locale]` is the dynamic locale segment (`pt` | `en`); route groups carry no URL segment.
  - Two route groups under `[locale]`:
    - `(pages)` — public + authentication feature pages (datasets, organizations, reuses, login, register, reset-password, …).
    - `(admin)` — admin/backoffice pages (`(admin)/admin`).
  - Root layout: `src/app/[locale]/layout.tsx`; homepage: `src/app/[locale]/page.tsx`.
- **Route handlers (outside `[locale]`)**: `src/app/auth/*` (session/CSRF/login/logout/me/change-email/reset-password), `src/app/internal-api/*` (CSV/spreadsheet proxies + `_lib`), and `src/app/assets/[...path]` are Next.js `route.ts` handlers, not localized pages. Shared server fetch helper: `src/app/backend-fetch.ts`.
- **Routing/proxy**: `src/proxy.ts` (Next proxy, replaces `middleware.ts`) handles locale routing via `i18nRouter` and mints the per-request CSP nonce. There is **no `middleware.ts`**.
- **Components**: `src/components/` organized by feature (datasets/, reuses/, organizations/, admin/, etc.); design-system wrappers in `Primitives/` and `Shared/`.
- **REST API layer**: `src/service/api/<domain>/index.ts` - backend API calls grouped per domain; shared fetch helpers (`authFetch`, env-aware base URLs) in `src/service/utils/API.ts`; relay client IP with `serverForwardedHeaders()` (`src/service/utils/serverForwardedHeaders.ts`) in Server Components.
- **GraphQL (Squidex)**: queries in `src/service/queries/<domain>/`, Apollo Client in `src/service/utils/apollo-client.ts`.
- **Types**: `src/service/types/<domain>/` - TypeScript interfaces (barrel `index.ts` per domain).
- **Utilities, helpers & hooks**: shared logic lives in `src/utils/` (generic helpers: `formatDate`, `formatNumber`, `slugify`, `filterUtils`, listing-query builders, label maps, …), `src/lib/` (`markdown/`, `security/`, `imageProbe`, reuse helpers, …), `src/service/utils/` (`API.ts`, `apollo-client.ts`, `serverForwardedHeaders.ts`), and reusable React hooks in `src/hooks/` (`useCurrentUser`, `useDatasetsListing`, `useListingUrlState`, …).
  - **Reuse before creating — do NOT add a new util/helper/hook when a compatible one already exists.** Search `src/utils/`, `src/lib/`, `src/service/utils/`, and `src/hooks/` first and reuse or extend the existing implementation. Create a new one **only** when nothing compatible exists (same principle as the Design System component rule).
- **Path alias**: `@/*` maps to `./src/*`

## Component Conventions

- `'use client'` directive required for interactive components and design system usage
- PascalCase for component names
- Suffix `Client` for components managing full page state (e.g., `DatasetsClient.tsx`)
- Named exports for components
- Props interfaces defined at component level
- Tailwind utility classes for styling (use design tokens: `primary-*`, `neutral-*`, `brand-*`)

## Design System (Agora)

`@ama-pt/agora-design-system` (3.6.1) is the source of truth for UI. Follow these rules:

- **Reuse before creating — do NOT add a new component when a compatible one already exists.** Always use the design-system component (or an existing project wrapper in `Primitives/` / `Shared/`). Create a custom component **only** when nothing compatible exists in `@ama-pt/agora-design-system`, `src/components/Primitives/`, or `src/components/Shared/`.
- **Isolate design-system usage in a Client component/instance** (`'use client'`). The DS is interactive, so it must render in a client leaf.
- **Server-Side First**: keep pages and data fetching as Server Components by default; push only the interactive design-system UI into Client components. The page stays server-side, the DS lives in a client leaf — this reconciles "DS must be client" with "server-first".
- **Import as named exports**: `import { Button, Icon } from "@ama-pt/agora-design-system"`. Rename on conflict with local components: `import { Button as ButtonADS } from "@ama-pt/agora-design-system"`.
- **`'use client'` required** for any component that imports the design system (it is interactive and uses hooks like `usePopupContext`).
- **Setup is already wired — do not re-add it**:
  - CSS imports at the top of `src/app/[locale]/globals.css`: `artifacts/dist/tailwind.css` then `artifacts/dist/style.css`, **before** the `@tailwind` directives.
  - `tailwind.config.ts` spreads `AgoraTailwindConfig` (theme, plugins, safelist) and sets `corePlugins.preflight: false`.
  - `PopupProviderWrapper` is mounted in the root layout (enables dialogs/popups app-wide).
- **Wrapper pattern**: prefer the project's thin wrappers over importing raw ADS components ad hoc.
  - `src/components/Primitives/` — Button, Icon, Cards, Dropdown, Inputs.
  - `src/components/Shared/` — Table, Accordion, Hero, Anchor.
- **Design tokens**: use ADS color tokens (`primary-*`, `secondary-*`, `neutral-*`, `informative-*`, `success-*`, `warning-*`, `danger-*`, shades 50–900) and ADS text utilities. Project brand overrides (`brand-blue-*`, `accent-light`, `gray-medium`) live in `tailwind.config.ts` and `src/app/[locale]/globals.css`. **Avoid hardcoded hex.**
- **Icons**: naming convention `agora-line-{name}` (outline) / `agora-solid-{name}` (filled); pass via `leadingIcon` / `leadingIconHover` props.
- **Button props**: `appearance` (`solid` | `outline` | `icon`), `variant` (`primary` | `neutral` | `danger` | …), `hasIcon`, etc.

## Internationalization (i18n)

- **Stack**: `next-i18n-router` + `i18next` + `react-i18next`.
- **Config**: `src/config/i18nConfig.ts` — locales `["pt", "en"]`, `defaultLocale: "pt"`, `prefixDefault: true`, `localeDetection: true`.
- **Translations**: `src/locales/<locale>/<namespace>.json` (e.g. `src/locales/pt/common.json`).
- **Init helper**: `initTranslations()` in `src/app/i18n.ts` (loads namespace JSON via `i18next-resources-to-backend`).
- **Routing**: handled in `src/proxy.ts` via `i18nRouter(request, i18nConfig)`.
- **Current state**: migration in progress — `en` translations are not yet populated; UI strings are being moved into namespaces.

## API Integration

- **Base URLs**: env-aware, configured in `src/service/utils/API.ts`. Server-side resolves to `${BACKEND_URL}/api/1` (and `/api/2`); client-side uses relative `/api/1` (and `/api/2`) through the Next.js proxy. Authenticated calls use `authFetch` (`credentials: "include"`).
- **Squidex GraphQL**: Apollo Client in `src/service/utils/apollo-client.ts` (`API_URL_INTERNAL` server-side, `NEXT_PUBLIC_API_URL` in the browser).
- Error handling: graceful fallbacks returning empty states.

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

- `src/app/[locale]/page.tsx` - Homepage
- `src/app/[locale]/layout.tsx` - Root layout (Header + Footer + providers)
- `src/app/[locale]/(pages)/` - Route group with public + auth feature pages
- `src/app/[locale]/(admin)/` - Route group with admin/backoffice pages
- `src/app/auth/`, `src/app/internal-api/`, `src/app/assets/[...path]/` - Next.js `route.ts` handlers (session/CSRF, CSV/spreadsheet proxies, asset proxy)
- `src/app/backend-fetch.ts` - Shared server-side fetch helper
- `src/app/[locale]/globals.css` - Global styles, design-system CSS imports & tokens
- `src/proxy.ts` - Next proxy: locale routing (i18nRouter) + CSP nonce (no `middleware.ts`)
- `src/config/i18nConfig.ts` - i18n config (locales, default, prefix)
- `src/locales/<locale>/<namespace>.json` - Translation messages
- `src/service/api/` - REST API integration layer (per-domain `index.ts`)
- `src/service/utils/API.ts` - shared fetch helpers & env-aware base URLs
- `src/service/queries/` + `src/service/utils/apollo-client.ts` - Squidex (GraphQL) layer
- `src/service/types/` - TypeScript type definitions (barrel `index.ts` per domain)
- `src/utils/` - Generic helpers (formatting, slugify, filters, listing-query builders, label maps)
- `src/lib/` - Standalone libs/helpers (markdown, security, image probing, reuse helpers)
- `src/hooks/` - Reusable React hooks (current user, listing state, URL sync)
- `src/components/Header.tsx` / `Footer.tsx` - Layout components
- `src/components/Primitives/` & `src/components/Shared/` - Agora design-system wrappers
- `tailwind.config.ts` - Theme config extending `AgoraTailwindConfig`

## Branch & Commit Conventions

All contributors must follow these conventions. References:
[Conventional Branch](https://conventionalbranch.org/) and [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/).

- **Never add `Co-Authored-By`** or any AI attribution to commit messages. Commits must appear as made solely by the developer working on the branch.
- **Never create commits.** Claude must NEVER run `git commit` (or `git push`). Only make changes in the working tree and leave the developer to review and commit **manually**. This applies even when changes look complete — committing is always the developer's action.
- **Protected branches — never commit or work directly on them.** Do not commit, push, or make changes directly on `main`, `develop`, `tst`, or `ppr` (environment branches: production, integration, test, pre-production). Always work on a dedicated `feature/` / `bugfix/` / `chore/` / `hotfix/` branch created from the appropriate base branch. If the current branch is one of these protected branches, stop and ask the developer to switch to (or create) a working branch before proceeding.

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
chore: bump @ama-pt/agora-design-system to 3.6.1
refactor(home): pass aggregated data as props to HomeClient
```
