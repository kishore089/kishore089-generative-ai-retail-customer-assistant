# Implementation Plan: Generative AI Retail Customer Support Center (Frontend)

## Overview

This plan scaffolds an enterprise-grade React 19 + TypeScript SPA per `design.md`. The implementation language is **TypeScript** (React 19, Vite), matching the fixed stack in the design.

The plan is incremental and dependency-ordered: it starts by cleaning the Vite template and establishing the exact folder structure with barrel files, then verifies build/tooling and styling, then builds infrastructure (types, HTTP client, contexts, providers), routing, the component library, page placeholders, and the services layer. Every stage compiles — each page renders a professional placeholder from the first routing task onward. Testing tasks (Vitest + RTL + fast-check) cover the 7 correctness properties plus example/integration/snapshot tests. Final tasks enforce strict `tsc`, a clean `vite build`, and clean lint.

The stack is already installed (HeroUI v3, Tailwind CSS v4, TanStack Query, Axios, Framer Motion, React Router v7); tasks verify/adjust config rather than re-initializing.

## Tasks

- [x] 1. Clean template and establish enterprise folder structure
  - [x] 1.1 Remove default Vite template artifacts
    - Delete `src/App.css`, `src/assets/react.svg`, `public/vite.svg`
    - Clear boilerplate content from `src/index.css` (theme moves to `styles/theme.css`)
    - Reset `src/App.tsx` and `src/main.tsx` to minimal stubs that compile (full composition added later)
    - Retain the `#root` element in `index.html`
    - _Requirements: 1.4; Design: Folder and File Layout_

  - [x] 1.2 Create the full `src/` directory tree with placeholder barrel files
    - Create directories: `components/{common,layout,cards,chat,forms,tables,ui}`, `pages/{Dashboard,AIAssistant,Orders,Returns,Payments,Support,Profile,Settings,Login,NotFound}`, `layouts`, `routes`, `services/{ai,orders,returns,payments,support,profile}`, `contexts`, `hooks`, `types`, `utils/{http,theme}`, `config`, `styles`, `assets`
    - Add an `index.ts` barrel file in each directory (empty or `export {}` initially) so imports resolve
    - _Requirements: 1.1, 1.2, 1.3, 1.5; Design: Folder and File Layout, Design Principle "Barrel exports"_

- [x] 2. Verify build, tooling, and TypeScript strict configuration
  - [x] 2.1 Verify/adjust TypeScript strict config
    - Ensure `tsconfig.json` (and `tsconfig.app.json`) enable `strict: true` plus `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
    - Confirm path resolution and React 19 JSX settings compile
    - _Requirements: 2.1, 2.4, 2.5_

  - [x] 2.2 Verify Vite + Tailwind v4 CSS-first pipeline and lint command
    - Confirm `vite.config.ts` wires the Tailwind v4 plugin (CSS-first, no `tailwind.config.js`)
    - Confirm dev server (HMR) and production build scripts exist in `package.json`
    - Confirm a `lint` script exists and reports violations
    - _Requirements: 2.2, 2.3, 2.6, 2.7_

  - [x] 2.3 Create `styles/theme.css` with blue-and-white tokens and dark variants
    - Author Tailwind v4 CSS-first `@theme` + HeroUI v3 tokens: primary blue scale, neutral gray scale, light/dark surface colors, semantic colors, typography (Inter/system-ui), radius, spacing
    - Define dark-mode variant tokens
    - Import `theme.css` from the entry so styles apply
    - _Requirements: 3.2, 3.3, 3.4, 3.5; Design: Design tokens (theme)_

- [x] 3. Define shared types
  - [x] 3.1 Implement all type modules and barrel
    - Create `types/theme.ts` (`ThemeMode`, `ThemeContextValue`), `types/auth.ts` (`AuthStatus`, `AuthUser`, `AuthSession`, `AuthContextValue`, `AuthClient`), `types/chat.ts` (`ChatRole`, `ChatMessage`, `SendMessageRequest`, `SendMessageResponse`), `types/api.ts` (`ApiError`, `Paginated`), `types/nav.ts` (`NavItem`)
    - Export all through `types/index.ts`
    - _Requirements: 6.1, 6.2, 10.5, 12.4; Design: Data Models, Components and Interfaces_

- [ ] 4. Implement environment and query configuration
  - [x] 4.1 Implement `config/env.ts` with typed config, defaults, and startup validation
    - Read `import.meta.env` (`VITE_API_BASE_URL`, `VITE_AUTH_BYPASS`); apply local-dev defaults
    - Export `validateEnv` that throws a descriptive error when a required value has no default, otherwise returns a fully populated `EnvConfig`
    - Add `vite-env.d.ts` typed `import.meta.env` declarations
    - _Requirements: 11.1, 11.2, 11.3, 11.4; Design: Environment Config (Property 7)_

  - [ ]* 4.2 Write property test for environment validation completeness
    - **Property 7: Environment validation completeness**
    - **Validates: Requirements 11.3**

  - [x] 4.3 Implement `config/queryClient.ts`
    - Configure `QueryClient` defaults (cache time, retry, stale-time); export singleton
    - Export config through `config/index.ts`
    - _Requirements: 9.1, 9.2_

- [x] 5. Implement HTTP client and error normalization
  - [x] 5.1 Implement `utils/http/normalizeError.ts`
    - Normalize any thrown value (Axios error with/without response, arbitrary value) into `ApiError` with numeric `status` (0 when no response) and non-empty `message`
    - _Requirements: 10.5; Design: HTTP Client (Property 6)_

  - [ ]* 5.2 Write property test for error normalization totality
    - **Property 6: Error normalization totality**
    - **Validates: Requirements 10.5**

  - [x] 5.3 Implement `utils/http/client.ts` Axios singleton with interceptors
    - Factory creating an Axios instance: base URL from `config/env.ts`, JSON headers, timeout
    - Request interceptor attaches `Authorization: Bearer <token>` only when a token is available
    - Response success interceptor returns `response.data`; error interceptor routes 401/403 to `authClient.signOut()` (fallback: clear local auth + reload to `/login`) and rejects with `normalizeError` output
    - Export shared singleton and barrel via `utils/http/index.ts`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.6, 10.7; Design: HTTP Client (Properties 5, 6)_

  - [ ]* 5.4 Write property test for conditional authentication header attachment
    - **Property 5: Conditional authentication header attachment**
    - **Validates: Requirements 10.2**

  - [ ]* 5.5 Write unit test for 401/403 interceptor behavior
    - Assert 401/403 invokes sign-out; sign-out failure clears state and forces reload (mocked)
    - _Requirements: 10.3, 10.4_

- [x] 6. Implement theme resolution utility and Theme context
  - [x] 6.1 Implement `utils/theme/resolveTheme.ts`
    - Resolve stored preference vs OS color-scheme preference: stored wins when present, otherwise OS preference
    - _Requirements: 4.3; Design: Correctness Properties (Property 2)_

  - [ ]* 6.2 Write property test for theme resolution precedence
    - **Property 2: Theme resolution precedence**
    - **Validates: Requirements 4.3**

  - [x] 6.3 Implement `contexts/ThemeContext.tsx` (ThemeProvider + useTheme)
    - Provide `mode`, `setMode`, `toggle`; apply DOM class/attribute; persist to localStorage key `app.theme`; initialize via `resolveTheme`
    - _Requirements: 4.1, 4.2, 4.4, 4.5; Design: Contexts (Properties 1, 2)_

  - [ ]* 6.4 Write property test for theme persistence round-trip
    - **Property 1: Theme persistence round-trip**
    - **Validates: Requirements 4.4, 4.5**

  - [ ]* 6.5 Write unit test for theme DOM application
    - Assert light/dark applies expected DOM class/attribute; OS preference applied when unset
    - _Requirements: 4.2, 4.3_

- [x] 7. Implement Auth and AppState contexts
  - [x] 7.1 Implement `contexts/AuthContext.tsx` with `AuthClient` interface and `PlaceholderAuthClient`
    - `PlaceholderAuthClient` reports `unauthenticated` by default; `authenticated` with mock user when `VITE_AUTH_BYPASS=true`
    - `AuthProvider` exposes `status`, `user`, `getToken`, `signIn`, `signOut`, `refreshSession`; sign-out clears session
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6; Design: Contexts (Auth interface isolation)_

  - [ ]* 7.2 Write unit tests for AuthProvider placeholder behavior
    - Default `unauthenticated`; `authenticated` under `VITE_AUTH_BYPASS`; sign-out clears session
    - _Requirements: 6.4, 6.5, 6.6_

  - [x] 7.3 Implement `contexts/AppStateContext.tsx` (AppStateProvider + useAppState)
    - Typed accessors for `sidebarCollapsed` (`setSidebarCollapsed`); server data stays in React Query
    - Export contexts through `contexts/index.ts`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 7.4 Write unit test for AppStateProvider accessors
    - Assert typed accessors read/update `sidebarCollapsed`
    - _Requirements: 8.2, 8.4_

- [x] 8. Implement cross-cutting hooks
  - [x] 8.1 Implement `hooks/useMediaQuery.ts` and `hooks/useLocalStorage.ts`
    - Responsive helper for sidebar collapse; typed localStorage persistence helper
    - Export through `hooks/index.ts`
    - _Requirements: 4.4, 12.1; Design: hooks_

- [x] 9. Implement common/feedback components and error boundary
  - [x] 9.1 Implement `components/common/` (Loading, ErrorState, EmptyState, PageHeader)
    - Typed props per design; `ErrorState` includes a return-to-stable-route control
    - Export through `components/common/index.ts`
    - _Requirements: 12.1, 12.3, 12.4, 16.1, 16.3_

  - [x] 9.2 Implement `components/common/ErrorBoundary.tsx`
    - Class component catching render/chunk-load errors; renders `ErrorState` fallback with return-to-stable-route control
    - _Requirements: 16.2, 16.3_

  - [ ]* 9.3 Write unit tests for feedback components
    - `Loading`, `ErrorState` (renders return-home control), `EmptyState`
    - _Requirements: 12.3, 16.1, 16.3_

- [ ] 10. Implement UI wrappers, cards, tables, chat, and forms contracts
  - [x] 10.1 Implement `components/ui/` HeroUI v3 wrappers
    - Typed re-exports/wrappers: `Button`, `Input`, `Modal`, `Card`, `Skeleton`, `Badge`; export via barrel
    - _Requirements: 3.1, 12.2, 12.4, 12.5_

  - [x] 10.2 Implement `components/cards/` (StatCard, InfoCard, SectionCard)
    - Typed props per design; consume `ui` wrappers and tokens
    - _Requirements: 12.2, 12.4_

  - [x] 10.3 Implement `components/tables/` (DataTable, TableSkeleton)
    - Generic `DataTable<T>` with loading skeleton and empty message via `EmptyState`
    - _Requirements: 12.2, 12.3, 12.4_

  - [ ]* 10.4 Write unit tests for DataTable and StatCard
    - DataTable renders skeleton while loading and empty message with no rows; StatCard renders label/value
    - _Requirements: 12.2, 12.3_

  - [x] 10.5 Implement `components/chat/` (ChatWindow, MessageList, MessageBubble, MessageInput)
    - Scrollable `MessageList` + pinned `MessageInput`; typed props per design; `onSend` callback contract
    - _Requirements: 15.1, 12.4_

  - [x] 10.6 Implement `components/forms/` RHF-ready contracts (not integrated)
    - `FormField`, `FormSection` typed contracts only; no React Hook Form wiring this iteration
    - _Requirements: 13.1, 13.3, 13.4 (structural); Design: Forms (RHF deferred)_

  - [x] 10.7 Implement Framer Motion transition wrappers
    - Reusable animated view/component entry-exit wrappers; export via `components` barrels
    - _Requirements: 12.6_

- [x] 11. Implement services layer with typed interfaces (mock data)
  - [x] 11.1 Implement `services/ai/aiChatService.ts`
    - `AiChatService.sendMessage(req)` returning a mocked assistant `SendMessageResponse` (no live call)
    - _Requirements: 15.2, 15.3, 15.4, 10.7_

  - [x] 11.2 Implement remaining service scaffolds and barrel
    - `services/{orders,returns,payments,support,profile}` typed endpoint stubs returning placeholder data; export via `services/index.ts`
    - _Requirements: 10.7, 14.7_

- [x] 12. Implement routing configuration and app shell
  - [x] 12.1 Implement `routes/paths.ts` and `routes/navItems.ts`
    - `PATHS` constants per design; `NAV_ITEMS` with the exact 8 items in order (Dashboard, AI Assistant, My Orders, Returns & Refunds, Payments, Support Tickets, Profile, Settings)
    - _Requirements: 5.1, 5.2_

  - [x] 12.2 Implement `routes/ProtectedRoute.tsx`
    - `loading` → `<Loading fullscreen/>`; `unauthenticated` → `<Navigate to={login} state={{ from }} replace/>` (no protected content); `authenticated` → render children
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5; Design: Correctness Properties (Properties 3, 4)_

  - [ ]* 12.3 Write property test for route guard decision by authentication status
    - **Property 3: Route guard decision by authentication status**
    - **Validates: Requirements 7.2, 7.3, 7.5**

  - [ ]* 12.4 Write property test for requested-path retention on redirect
    - **Property 4: Requested-path retention on redirect**
    - **Validates: Requirements 7.4**

  - [x] 12.5 Implement `layouts/AppLayout.tsx` shell
    - Responsive grid: `Sidebar` + `TopNavbar` + `<Outlet/>` wrapped in Suspense (Loading fallback) and `ErrorBoundary`
    - _Requirements: 5.3, 12.1, 16.1, 16.2_

  - [x] 12.6 Implement `components/layout/` (Sidebar, TopNavbar, ThemeToggle)
    - Sidebar renders `NAV_ITEMS` in order, marks active via `NavLink`, collapses below `md` via `useMediaQuery`; TopNavbar hosts brand, toggle, ThemeToggle, user menu wired to `signOut`
    - _Requirements: 5.2, 5.5, 12.1, 4.1_

  - [x] 12.7 Implement `routes/router.tsx` with lazy pages and barrel
    - `createBrowserRouter` tree: protected pages behind `ProtectedRoute` inside `AppLayout`, public `/login` and `*` NotFound; `React.lazy` + Suspense for page modules; `/` redirects to `/dashboard`
    - Export via `routes/index.ts`
    - _Requirements: 5.1, 5.3, 5.4, 5.6, 7.1, 14.4, 14.5_

- [x] 13. Implement page placeholders
  - [x] 13.1 Implement public pages: Login and NotFound
    - `LoginPage` (public) with `PageHeader` and sign-in control wired to `useAuth().signIn`; `NotFoundPage` (public) with return-to-stable-route control
    - _Requirements: 5.4, 14.1, 14.2, 14.5, 16.3_

  - [x] 13.2 Implement protected placeholder pages: Dashboard, Orders, Returns, Payments, Support, Profile, Settings
    - Each renders a professional placeholder built from `PageHeader` + cards/tables (no business logic); each has a barrel `index.ts`
    - _Requirements: 14.1, 14.2, 14.3, 14.6_

  - [x] 13.3 Implement AIAssistant page (chat shell wired to mocked service)
    - Compose chat components; `useSendMessage` mutation calls `aiChatService.sendMessage`; append mocked assistant response with optimistic pending bubble
    - _Requirements: 14.1, 14.2, 15.1, 15.2, 15.4, 9.3, 9.4_

- [x] 14. Compose providers and wire the application together
  - [x] 14.1 Implement `App.tsx` provider composition
    - Compose `ThemeProvider → HeroUIProvider → QueryClientProvider → AuthProvider → AppStateProvider → RouterProvider`; render React Query Devtools in DEV
    - _Requirements: 3.1, 6.1, 8.1, 9.1, 9.5_

  - [x] 14.2 Finalize `main.tsx` entry
    - Import `styles/theme.css`, mount `<App/>` into `#root`, call `validateEnv` at startup
    - _Requirements: 1.4, 11.3_

- [~] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Set up test tooling and write integration/snapshot tests
  - [~] 16.1 Configure Vitest + RTL + fast-check
    - Add Vitest config (jsdom env), `@testing-library/jest-dom` setup, and fast-check; add a `test` script (single-run)
    - _Requirements: 2.7; Design: Testing Strategy (Tooling)_

  - [ ]* 16.2 Write integration tests for routing and guard
    - Protected pages render inside `AppLayout` when authenticated; redirect to `/login` when unauthenticated; unknown path renders `NotFound`
    - _Requirements: 5.3, 5.4, 7.2, 7.3, 14.4, 14.5_

  - [ ]* 16.3 Write integration test for sidebar navigation
    - Sidebar renders exactly the 8 nav items in order and marks the active item
    - _Requirements: 5.2, 5.5_

  - [ ]* 16.4 Write integration test for AI Assistant shell
    - Submitting a message triggers `useSendMessage` and appends the mocked assistant response to `MessageList`
    - _Requirements: 15.1, 15.2, 15.4_

  - [ ]* 16.5 Write integration test for error boundary
    - A page that throws during render shows the fallback with a working return-to-stable-route control
    - _Requirements: 16.2, 16.3_

  - [ ]* 16.6 Write snapshot/structural tests for page placeholders
    - Dashboard, Orders, Returns, Payments, Support, Profile, Settings, Login, NotFound render headings via `PageHeader` and compile
    - _Requirements: 14.2, 14.3_

- [x] 17. Final checkpoint - Verify build, types, and lint
  - [x] 17.1 Verify strict type-check, production build, and lint
    - Run `tsc --noEmit` (strict) with zero errors; `vite build` produces a bundle; `lint` reports cleanly
    - Fix any issues found so all three pass
    - _Requirements: 2.3, 2.4, 2.5, 2.7_

## Notes

- Tasks marked with `*` are optional test sub-tasks and can be skipped for a faster MVP; core implementation tasks are never optional.
- Each task references specific requirements (and design sections) for traceability.
- Checkpoints ensure incremental validation; every stage from Task 12 onward keeps the app compiling with rendered placeholders.
- Property tests validate the 7 universal correctness properties from `design.md` (minimum 100 iterations each, tagged `// Feature: retail-customer-assistant-frontend, Property {n}: {text}`).
- Unit, integration, and snapshot tests cover UI rendering, provider wiring, and configuration where PBT does not apply.
- The services layer returns mock/placeholder data only — no live backend calls this iteration.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "3.1"] },
    { "id": 2, "tasks": ["4.1", "4.3", "5.1", "6.1", "8.1"] },
    { "id": 3, "tasks": ["4.2", "5.2", "5.3", "6.2", "6.3", "7.1", "7.3"] },
    { "id": 4, "tasks": ["5.4", "5.5", "6.4", "6.5", "7.2", "7.4", "9.1", "9.2", "11.1", "11.2"] },
    { "id": 5, "tasks": ["9.3", "10.1", "10.5", "10.6", "10.7", "12.1", "12.2"] },
    { "id": 6, "tasks": ["10.2", "10.3", "12.3", "12.4", "12.6"] },
    { "id": 7, "tasks": ["10.4", "12.5", "13.1", "13.2", "13.3"] },
    { "id": 8, "tasks": ["12.7", "14.1", "14.2"] },
    { "id": 9, "tasks": ["16.1"] },
    { "id": 10, "tasks": ["16.2", "16.3", "16.4", "16.5", "16.6"] },
    { "id": 11, "tasks": ["17.1"] }
  ]
}
```
