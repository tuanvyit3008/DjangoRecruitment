# Implementation plan — Next.js migration

Audit 2026-10-25: working tree clean on main. Frontend at repository root is React/Vite with npm lockfile, plain CSS and Lucide. No Django source, OpenAPI, API_CONTRACT or test accounts exist locally. Backend files must not be changed or invented.

## Migration decision and sequence

Migrate in place to Next.js App Router, preserving CSS, existing public routes and JWT endpoint paths supplied earlier. Git history retains the original Vite app. Keep npm and lockfile. Do not build a second unused app.

1. Replace Vite entry/router with server root layout and thin route compositions.
2. Extract Header/Footer, JobCard/Search/Filters/Pagination, AuthForm and feedback components from App.tsx. Server components render public job reads; small client components handle forms, navigation and auth state.
3. Central HTTP transport validates base URL, JSON and errors, sets timeout and allows cancellation. Public server requests never access browser tokens. Private client requests use Bearer JWT and one single-flight refresh; mutations never replay automatically.
4. AuthProvider restores /auth/me/, handles login/register/logout, preserves credentials on network failure and exposes a real account page protected by role-aware guard. Role values remain uppercase from the supplied auth contract. No fabricated dashboards.
5. Public jobs: strict pagination parser and explicit provisional mapping, URL search/location/page. Unknown employment enums are not sent. No production mock data, fabricated statistics, companies or successful application actions.
6. Add focused unit tests for auth, rotation, network/HTTP errors, parser and pagination. Build/typecheck and HTTP route smoke checks; browser/LAN checks separately recorded.

## Route/data flow

- /: server Home composition, newest jobs from Django; error/empty explicit.
- /jobs: server query parsing -> jobs service -> JobList/Pagination; GET forms keep URL state.
- /jobs/[jobId]: server detail fetch, Next 404 on confirmed HTTP 404.
- /login, /register: client AuthForm -> provider -> auth service -> session tokens.
- /account: authenticated current-user information from /auth/me/; no invented business data.
- unknown route: Next not-found. loading and error boundaries included.

Server env DJANGO_API_BASE_URL; browser env NEXT_PUBLIC_DJANGO_API_BASE_URL. Each includes /api/v1 once. Optional legacy VITE value read only by configuration during transition. No API proxy or Django replacement.

## State and security

Public data fetched with no-store until backend caching policy is known. Auth context owns user state. sessionStorage token bundle preserves reload in the same tab and reduces persistence/cross-tab rotation races relative to old localStorage; XSS can still read it. Old localStorage tokens removed, requiring re-login. Session generations prevent late refresh/login results resurrecting a signed-out account. No token/password logging.

## API mapping and blockers

Auth paths/payloads and uppercase roles are supplied by user contract, not verified against live Backend. Jobs fields are provisional; validate mandatory shape and fail explicitly. Candidate, Employer, Admin, companies/CV endpoints cannot be derived without URLs/serializers and remain Pending. Do not create placeholder pages/services for unverified modules.

## Risks

Framework/runtime/env/port changes require reinstall, restart and CORS origin review. No Backend repository or LAN credentials; E2E flows B/C blocked until provided. Existing deployment must switch from Vite static hosting to Next Node server. No automatic push/deployment in this migration.
