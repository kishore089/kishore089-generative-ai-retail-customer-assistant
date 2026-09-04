# Implementation Plan: Phase 2 — Auth, RBAC & Customer Context

## Overview

This plan extends the existing, compiling Phase 1 React 19 + TypeScript application (Vite, HeroUI v3, Tailwind v4, React Router v7, TanStack Query v5) with role-based authentication, a users domain, a global customer context, admin customer management, role-aware dashboards, role-based access control, and AI payload preparation — all mock-only (no Cognito, no API Gateway, no AWS SDK).

The tasks are ordered so the application compiles at every stage: types first, then interface-first mock services, then pure decision logic, then contexts, then routing, then layout, then pages, then provider wiring, and finally tests. Every task honors the Phase 1 conventions: TypeScript strict + `verbatimModuleSyntax` (use `import type` for type-only imports), the `@/` path alias, no `React.JSX.Element` return annotations, HeroUI v3 (no provider), Tailwind v4 tokens, React Router v7, and TanStack Query v5 object form.

Language: TypeScript (matches the existing Phase 1 codebase; no language selection required). Property-based tests use `fast-check` + Vitest, minimum 100 iterations each, tagged `// Feature: phase2-auth-rbac-customer-context, Property {n}: {text}`.

## Tasks

- [ ] 1. Define Phase 2 type foundations
  - [ ] 1.1 Create `src/types/user.ts`
    - Define `Role = "Customer" | "Admin"`, `UserStatus = "active" | "inactive" | "suspended"`, `User` (`UserID`, `CustomerID: string | null`, `Name`, `Email`, `Role`, `Status`), and `Credentials` (`email`, `password`)
    - Document the invariant `CustomerID === null` iff `Role === "Admin"` in a comment
    - _Requirements: 1.1, 2.1, 2.2_

  - [ ] 1.2 Create `src/types/customer.ts`
    - Define `Customer` (`CustomerID`, `Name`, `Email`, `Phone`) and `CustomerSearchQuery` (optional `customerId`, `email`, `phone`)
    - _Requirements: 5.1, 6.2_

  - [ ] 1.3 Extend `src/types/auth.ts`
    - Add `role: Role` and `customerId: string | null` to `AuthUser`; add `Credentials` re-export or import via `import type` from `@/types/user`
    - Extend `AuthContextValue` with `role: Role | null` accessor and change `signIn` to `(credentials: Credentials) => Promise<AuthUser>`
    - Evolve the `AuthClient` interface into `AuthService` (`getSession`, `signIn(credentials)`, `signOut`, `getToken`)
    - Use `import type` for all type-only imports; keep `AuthStatus` as-is
    - _Requirements: 1.2, 1.3, 1.4, 3.3, 4.4_

  - [ ] 1.4 Extend `src/types/chat.ts`
    - Add `ChatPayload` (`role: Role`, `customerId: string | null`, `message: string`) using `import type { Role } from "@/types/user"`
    - Reconcile `SendMessageRequest`/response inputs with the payload shape
    - _Requirements: 10.1_

  - [ ] 1.5 Update `src/types/index.ts` barrel
    - Re-export the new `user` and `customer` type modules; keep existing exports intact
    - _Requirements: 2.1, 5.1_

- [ ] 2. Implement interface-first mock services
  - [ ] 2.1 Create `src/services/users/userService.ts`
    - Define `UserService` interface (`findByEmail`, `getById`, `validateCredentials`) and `FindResult` union
    - Implement `MockUserService` with an in-memory `User[]` including at least one `Customer` (with non-null `CustomerID`) and at least one `Admin` (with `CustomerID: null`), and a per-user mock password map (never persisted)
    - `findByEmail` returns a match regardless of Status/Role; export singleton `userService: UserService`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 4.1, 11.2_

  - [ ]* 2.2 Write property test for User CustomerID/Role invariant
    - **Property 4: User CustomerID/Role invariant** — for any User from the service, `CustomerID` is `null` iff `Role` is `Admin`
    - **Validates: Requirements 1.1, 2.1, 2.2**

  - [ ]* 2.3 Write property test for findByEmail correctness
    - **Property 5: findByEmail correctness** — existing email returns `found=true` regardless of Status/Role; missing email returns `found=false`
    - **Validates: Requirements 2.5, 2.6**

  - [ ]* 2.4 Write property test for credential validation
    - **Property 6: Credential validation correctness** — `validateCredentials` returns `found=true` iff the email/password matches a stored user
    - **Validates: Requirements 3.1, 4.1**

  - [ ] 2.5 Create `src/services/users/index.ts` barrel
    - Export `UserService`, `MockUserService`, and `userService`
    - _Requirements: 11.2, 11.4_

  - [ ] 2.6 Create `src/services/customers/customerService.ts`
    - Define `CustomerService` interface (`getById`, `search`) and implement `MockCustomerService` with in-memory `Customer[]` (aligned to the mock users' `CustomerID`s)
    - `search` matches any provided field (`customerId`/`phone` exact, `email` case-insensitive); absent fields ignored; all-empty query returns `[]`; export singleton `customerService`
    - _Requirements: 6.2, 11.3_

  - [ ]* 2.7 Write property test for customer search matching
    - **Property 9: Customer search matching** — every returned record matches all provided query fields, and every matching stored record is returned
    - **Validates: Requirements 6.2**

  - [ ] 2.8 Create `src/services/customers/index.ts` barrel
    - Export `CustomerService`, `MockCustomerService`, and `customerService`
    - _Requirements: 11.3, 11.4_

  - [ ] 2.9 Create `src/services/auth/session.ts`
    - Define `PersistedSession` (`status`, `role`, `userId`, `customerId`) and pure helpers: `serialize`, `parse`, `readSession`, `writeSession`, `clearSession` over the Session_Store (localStorage)
    - `readSession` wraps parse + structural validation in a total function returning `null` on any failure (never throws)
    - _Requirements: 13.1, 13.2, 13.4_

  - [ ]* 2.10 Write property test for session persistence round-trip
    - **Property 14: Session persistence round-trip** — writing a valid `PersistedSession` then reading it yields an equivalent session
    - **Validates: Requirements 13.1, 13.2**

  - [ ]* 2.11 Write property test for session malformed-input robustness
    - **Property 15: Session malformed-input robustness** — for any arbitrary/malformed stored string, `readSession` returns `null` and never throws
    - **Validates: Requirements 13.4**

  - [ ] 2.12 Create `src/services/auth/authService.ts`
    - Define `AuthError` and `MockAuthService implements AuthService`, constructed with `UserService`; `signIn` validates credentials, throws `AuthError` on failure, maps `User -> AuthUser` (role, customerId) via a `toAuthUser` helper
    - Implement `getSession`/`getToken`/`signOut` backing the mock session via `session.ts`; export singleton `authService`
    - _Requirements: 1.4, 3.1, 3.2, 4.1, 4.2, 11.1, 11.4_

  - [ ] 2.13 Create `src/services/auth/index.ts` barrel
    - Export `AuthService`, `MockAuthService`, `AuthError`, `authService`
    - _Requirements: 11.1, 11.4_

  - [ ] 2.14 Update `src/services/index.ts` barrel
    - Re-export `users`, `customers`, and `auth` service modules alongside existing domains
    - _Requirements: 11.4_

- [ ] 3. Checkpoint - types and services compile
  - Ensure `tsc --noEmit` passes and all tests pass, ask the user if questions arise.

- [ ] 4. Implement pure decision logic
  - [ ] 4.1 Create `src/routes/redirect.ts`
    - Define `RouteKind`, `AccessInput`, `AccessDecision`; implement total `resolveRouteAccess(input): AccessDecision` covering loading, unauthenticated→login, Customer→admin-only redirect, Admin-no-customer→search, Admin+customer→Admin-Dashboard conflict redirect, and allow cases
    - Implement `resolvePostLoginPath(role)` → Customer Dashboard for `Customer`, Admin Dashboard for `Admin`
    - _Requirements: 6.1, 7.3, 7.4, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

  - [ ]* 4.2 Write property test for the RBAC access decision matrix
    - **Property 1: RBAC access decision matrix** — `resolveRouteAccess` returns exactly one correct decision for every status/role/active-customer/route-kind combination
    - **Validates: Requirements 6.1, 7.3, 7.4, 9.1, 9.2, 9.5, 9.6, 9.7, 9.8**

  - [ ]* 4.3 Write property test for redirect-by-role after login
    - **Property 2: Redirect-by-role after login** — `resolvePostLoginPath` maps Customer→Customer Dashboard, Admin→Admin Dashboard
    - **Validates: Requirements 3.4, 4.6, 9.3, 9.4**

  - [ ] 4.4 Extend `src/routes/paths.ts`
    - Add `adminDashboard` and `customerSearch` path constants
    - _Requirements: 6.1, 9.4_

  - [ ] 4.5 Rework `src/routes/navItems.ts` into role-aware `getNavItems`
    - Export `getNavItems(role: Role | null, hasActiveCustomer: boolean): NavItem[]`: Customer set (no admin items); Admin no-customer → `[Admin Dashboard, Customer Search]`; Admin+customer → admin items plus customer-scoped items
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 4.6 Write property test for navigation derivation
    - **Property 3: Navigation derivation from role and active customer** — `getNavItems` output is consistent with role + active-customer rules and never leaks admin-only paths to Customers
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

  - [ ] 4.7 Create `buildChatPayload` helper in `src/services/ai/`
    - Pure `buildChatPayload(role, customerId, message)` returning a valid `ChatPayload` or a typed rejection: Customer→own non-null CustomerID; Admin+customer→active CustomerID; Admin no-customer→`null`; Customer with no active customer→rejection
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [ ]* 4.8 Write property test for chat payload assembly
    - **Property 12: Chat payload assembly** — `buildChatPayload` produces correct `role`/`customerId` per role and active-customer, and rejects Customer-with-no-customer
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6**

- [ ] 5. Implement contexts
  - [ ] 5.1 Rewrite/extend `src/contexts/AuthContext.tsx`
    - Store `user`, `role`, `customerId`; implement `signIn(credentials)` via `authService` returning `AuthUser`; add `role` accessor; persist session on auth and clear on sign-out via `session.ts`; restore from Session_Store on startup
    - `useAuth` throws a descriptive error when used outside the provider (retain Phase 1 pattern); preserve `authBridge`/lifecycle
    - _Requirements: 1.2, 1.3, 1.5, 3.3, 4.3, 4.4, 12.1, 12.3, 13.1, 13.2, 13.4_

  - [ ]* 5.2 Write unit tests for AuthContext state transitions and guard
    - Sign-in stores user/role/customerId; sign-out clears state and Session_Store; `useAuth` outside provider throws; malformed persisted session initializes unauthenticated
    - _Requirements: 1.2, 1.3, 1.5, 12.1, 12.3, 13.4_

  - [ ] 5.3 Create `src/contexts/CustomerContext.tsx`
    - Implement `CustomerProvider`, `useCustomer`, `CustomerContextValue` state (`customerId`, `name`, `email`, `phone`, `selectedOrder`, `selectedSupportTicket`) and ops `setActiveCustomer`, `clearActiveCustomer`, `setSelectedOrder`, `setSelectedSupportTicket`
    - Add clear-on-signout effect (subscribes to `useAuth` status → `unauthenticated`) and restore-on-startup via `customerService.getById`; `useCustomer` throws outside provider
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 12.2, 13.3_

  - [ ]* 5.4 Write property test for setActiveCustomer round-trip
    - **Property 7: setActiveCustomer round-trip** — after `setActiveCustomer`, context reports the record's fields with non-null `customerId`
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.5, 5.6**

  - [ ]* 5.5 Write property test for clearActiveCustomer reset and idempotence
    - **Property 8: clearActiveCustomer reset and idempotence** — after clear, `customerId`/`selectedOrder`/`selectedSupportTicket` are `null`; a second clear yields the same state
    - **Validates: Requirements 5.4, 12.2**

  - [ ]* 5.6 Write unit tests for CustomerContext startup restore and provider guard
    - Restore via `getById` on startup with persisted CustomerID; `useCustomer` outside provider throws
    - _Requirements: 5.7, 13.3_

  - [ ] 5.7 Update `src/contexts/index.ts` barrel
    - Export `CustomerProvider`, `useCustomer`, `CustomerContextValue`
    - _Requirements: 5.2_

- [ ] 6. Update AI chat service with guards
  - [ ] 6.1 Update `src/services/ai/aiChatService.ts`
    - Change `sendMessage` to accept a `ChatPayload`; enforce role/customer invariants (reject when payload `role` disagrees with active role) as defense-in-depth; remain mock (no Bedrock/Lex)
    - _Requirements: 10.1, 10.7, 10.8_

  - [ ]* 6.2 Write property test for chat role-mismatch rejection
    - **Property 13: Chat role-mismatch rejection** — a payload whose `role` differs from the active role is rejected and no request is sent
    - **Validates: Requirements 10.7**

- [ ] 7. Checkpoint - contexts and services integrate
  - Ensure `tsc --noEmit` passes and all tests pass, ask the user if questions arise.

- [ ] 8. Implement routing guard and route tree
  - [ ] 8.1 Create `src/routes/RoleRoute.tsx`
    - Props `{ children, adminOnly?, customerScoped? }`; read `useAuth` (`status`, `role`) + `useCustomer` (`customerId`); delegate to `resolveRouteAccess`; render `Loading`, `<Navigate>` (preserving requested path on unauthenticated redirect), or children
    - _Requirements: 9.1, 9.2, 9.5, 9.6, 9.7, 9.8_

  - [ ] 8.2 Update `src/routes/router.tsx`
    - Add admin subtree (Admin Dashboard, Customer Search via `adminOnly`) and customer-scoped subtree (Dashboard, Orders, Returns, Payments, Support, Profile, AI Assistant via `customerScoped`) under the single `AppLayout`; apply redirect-by-role at index
    - _Requirements: 6.1, 7.3, 9.1, 9.2, 9.4, 9.5, 9.8_

  - [ ] 8.3 Update `src/routes/index.ts` barrel
    - Export `RoleRoute`, `resolveRouteAccess`, `resolvePostLoginPath`
    - _Requirements: 9.1_

- [ ] 9. Update layout for role-aware navigation and sign-out
  - [ ] 9.1 Update `src/components/layout/Sidebar.tsx`
    - Derive items via `getNavItems(role, hasActiveCustomer)` using `useAuth` + `useCustomer` instead of static `NAV_ITEMS`
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 9.2 Update `src/components/layout/TopNavbar.tsx` sign-out handler
    - Call `signOut()` (which clears auth + Session_Store and triggers CustomerContext clear), then navigate to the login route
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [ ]* 9.3 Write unit test for sign-out coordination
    - Sign-out clears both contexts, clears Session_Store, and navigates to login
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 10. Implement and update pages
  - [ ] 10.1 Update `src/pages/Login/LoginPage.tsx`
    - Validate credentials via `signIn(credentials)`; on failure show inline `AuthError` message and stay on `/login`; clear message on success; redirect by role using `resolvePostLoginPath`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 10.2 Write unit tests for login flows
    - Invalid-credential error display + retention; error clearing on success; role-specific state storage and redirect
    - _Requirements: 3.2, 3.3, 3.4, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ] 10.3 Update `src/pages/Dashboard/DashboardPage.tsx` (Customer Dashboard)
    - Read Active_Customer from `CustomerContext`: welcome message, profile summary, recent orders, recent returns, AI Assistant quick-access; render `ErrorState` when customer hydration fails or no active customer is resolvable
    - _Requirements: 3.5, 3.6, 7.1, 7.5_

  - [ ]* 10.4 Write unit tests for Customer Dashboard sections and error state
    - Section presence for Customer; error state on hydration failure with session retained
    - _Requirements: 3.6, 7.1, 7.5_

  - [ ] 10.5 Create `src/pages/AdminDashboard/AdminDashboardPage.tsx`
    - Admin dashboard with customer-search entry point, customer statistics, recent-customers list, and quick navigation
    - _Requirements: 7.2_

  - [ ]* 10.6 Write unit test for Admin Dashboard sections
    - Section presence when Admin has no active customer
    - _Requirements: 7.2_

  - [ ] 10.7 Create `src/pages/CustomerSearch/CustomerSearchPage.tsx`
    - Search by CustomerID/Email/Phone via `customerService.search`; render one card per match (Name, CustomerID, Email, Phone); no-results message when empty (mutually exclusive with cards); on card select call `setActiveCustomer` and navigate to Customer Dashboard
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [ ]* 10.8 Write property test for search result render completeness
    - **Property 10: Search result render completeness** — exactly one card per record; each card shows Name, CustomerID, Email, Phone
    - **Validates: Requirements 6.3**

  - [ ]* 10.9 Write property test for results/no-results mutual exclusivity
    - **Property 11: Results/no-results mutual exclusivity** — cards shown iff list non-empty; no-results shown iff empty; never both
    - **Validates: Requirements 6.4, 6.5, 6.8**

  - [ ]* 10.10 Write unit test for card selection side effects
    - Selecting a card sets the active customer and navigates to Customer Dashboard
    - _Requirements: 6.6, 6.7_

  - [ ] 10.11 Update `src/pages/AIAssistant/AIAssistantPage.tsx`
    - Assemble `ChatPayload` via `buildChatPayload` from `useAuth` (role) + `useCustomer` (customerId); surface rejection as a mutation error without sending; keep TanStack Query v5 object form
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [ ] 11. Wire providers
  - [ ] 11.1 Update `src/App.tsx`
    - Insert `CustomerProvider` inside `AuthProvider` and outside `AppStateProvider`: ThemeProvider → QueryClientProvider → AuthProvider → CustomerProvider → AppStateProvider → RouterProvider
    - _Requirements: 5.2, 12.2, 13.3_

- [ ] 12. Checkpoint - full app compiles and runs
  - Ensure `tsc --noEmit` passes and all tests pass, ask the user if questions arise.

- [ ] 13. Test tooling setup and cross-cutting tests
  - [ ]* 13.1 Set up Vitest + Testing Library + fast-check
    - Add `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, and `fast-check` as dev dependencies; add a `test` script; configure Vitest (jsdom environment, `@/` alias, setup file); ensure property tests run minimum 100 iterations
    - _Requirements: 11.7_

  - [ ]* 13.2 Write mock-data and interface-swappability smoke tests
    - Assert at least one Customer and one Admin exist in mock data; assert consumers depend only on `AuthService`/`UserService`/`CustomerService` interfaces
    - _Requirements: 1.4, 2.3, 2.4, 11.1, 11.2, 11.3, 11.4_

  - [ ]* 13.3 Write no-AWS architectural smoke test
    - Assert `package.json` declares no AWS SDK dependency and no AWS network endpoints are referenced in source
    - _Requirements: 11.5, 11.6_

- [ ] 14. Final checkpoint - build and lint clean
  - Ensure `npm run build` (`tsc -b && vite build`) succeeds and `npm run lint` is clean; ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test sub-tasks and can be skipped for a faster MVP; core implementation tasks are never optional.
- Each task references specific requirement sub-clauses for traceability.
- The order preserves compilation at every step: types → services → pure logic → contexts → AI guards → routing → layout → pages → provider wiring → tests.
- Property tests implement the 15 Correctness Properties from the design; unit/example tests cover concrete UI flows and error branches; smoke tests cover architectural/no-AWS constraints.
- All code follows Phase 1 conventions: `verbatimModuleSyntax` (`import type`), `@/` alias, no `React.JSX.Element` return annotations, HeroUI v3 (no provider), Tailwind v4 tokens, React Router v7, TanStack Query v5 object form, mock-only.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4", "1.5"] },
    { "id": 2, "tasks": ["2.1", "2.6", "2.9"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.4", "2.5", "2.7", "2.8", "2.10", "2.11"] },
    { "id": 4, "tasks": ["2.12"] },
    { "id": 5, "tasks": ["2.13", "2.14", "4.1", "4.4", "4.5", "4.7"] },
    { "id": 6, "tasks": ["4.2", "4.3", "4.6", "4.8"] },
    { "id": 7, "tasks": ["5.1", "5.3"] },
    { "id": 8, "tasks": ["5.2", "5.4", "5.5", "5.6", "5.7", "6.1"] },
    { "id": 9, "tasks": ["6.2", "8.1"] },
    { "id": 10, "tasks": ["8.2", "8.3", "9.1", "9.2"] },
    { "id": 11, "tasks": ["9.3", "10.1", "10.3", "10.5", "10.7", "10.11"] },
    { "id": 12, "tasks": ["10.2", "10.4", "10.6", "10.8", "10.9", "10.10", "11.1"] },
    { "id": 13, "tasks": ["13.1"] },
    { "id": 14, "tasks": ["13.2", "13.3"] }
  ]
}
```
