# Frontend status — 2026-10-25

## Dark Mode update

Light/Dark Mode implemented through shared CSS tokens, a root client theme provider and a pre-paint head script. Header toggle stays visible on mobile; preference persists in localStorage and across App Router navigation, follows system preference by default, and synchronizes between tabs. No dependency, Backend or API contract changes. No commit/push performed.

Current verification: 59 unit tests, strict typecheck, formatting and production build PASS. Chrome production fixture suite: 14 check groups PASS, including theme persistence/system default/blocked storage/pre-paint/keyboard/validation and both themes at 320–1440px. No captured hydration warnings or uncaught browser errors. ESLint remains unconfigured. Earlier migration results below are historical; see [THEME.md](THEME.md) for current theme files, behavior, coverage and limits.

## Summary

In-place migration React/Vite -> Next.js 16.4.3 App Router implemented. Existing CSS/branding and public paths preserved. Django remains external Backend. No deployment or GitHub push performed in this migration.

## Audit table

| Area | Before | Issue | Result |
|---|---|---|---|
| Stack/routing | Vite + React Router, monolithic App.tsx | All UI/API lifecycle in one file | Next server layout/pages; feature/navigation/feedback modules |
| Env | VITE_API_BASE_URL | Browser/server env mismatch on Next | DJANGO_API_BASE_URL server + NEXT_PUBLIC_DJANGO_API_BASE_URL browser; strict prefix validation |
| Register | User prompt payload partly implemented | name/role inconsistencies in history | first_name,last_name,role CANDIDATE/EMPLOYER; no ADMIN |
| User state | Provider only restores once | Login not reflected in shared state | Provider owns login/register/me/logout states |
| Storage | localStorage | XSS/persistence and cross-tab rotation risk | sessionStorage single token bundle, explicit XSS warning, re-login required |
| Refresh | Single promise, clears on all failures | Network interpreted as invalid token; late 401 race | Single-flight + late token reuse + revision cancellation, no write retry |
| Logout | Clears tokens | No UI server-failure distinction | Clears local, warns if server blacklist unverified |
| Public UI | Local jobs, fabricated detail copy/stats | Could present made-up business info | No sample data imports, no fake apply success, only mapped API content |
| Jobs | Array fallback and filtered page | Malformed response silently accepted, no real pagination | Strict envelope parser, URL-preserving search/location/page |
| Guards | None | Private route protection absent | /account guard + role checks, pending state hidden |
| Tests | No scripts | Only build evidence | Vitest unit tests + Chrome fixture smoke + formatting + typecheck |

## Verified (local)

- npm install completed with version compatibility checked (Node 22.14 supports Next >=20.9 and test stack >=22.12).
- `npm test`: 47 tests PASS, 2 files.
- `npm run typecheck`: PASS.
- `npm run format:check`: PASS (formatting, not ESLint).
- `npm run build`: PASS after migration (Next production webpack build).
- Browser smoke against isolated production Next + test fixture: 10 checks PASS, 0 uncaught page errors. Login/validation/register Employer/me reload/network recovery/logout/private redirect, search/pagination/detail refresh, HTTP 404/500, mobile navigation.
- Responsive overflow checks: widths 360, 390, 768, 1280, 1440 on home/jobs/detail/register. Reviewed jobs screenshots at 390/1440. Fixture screenshots are QA artifacts, not real employer data.
- Role guard render tests cover anonymous/loading/error, CANDIDATE/EMPLOYER/ADMIN allow/deny; actual role portal business E2E not implemented.

## Implemented, not verified against Django

User-supplied auth paths/fields/roles and provisional jobs mapping. Session initialization and refresh rotation verified locally with test responses only. Health/jobs LAN probes outside sandbox timeout after 6s each (HTTP 000).

## Pending / Blocked

- Django source/OpenAPI/contracts and safe test accounts absent.
- LAN login/me/refresh/logout/CORS/blacklist/ownership enforcement: BLOCKED / NOT VERIFIED.
- Candidate profile, CV, applications; Employer company/jobs/applicants; Admin moderation; companies pages: Pending contract, no placeholder dashboards created.
- ESLint absent; no lint PASS claim.

## Architecture audit

Root layout is a Server Component composing providers and navigation. All route pages are thin compositions. AuthForm/Header/AuthProvider/AccountView/ProtectedRoute are client components for events/browser state; public jobs/detail fetch on server. API logic centralized in transport/services/parsers. Every new component used by a route/feature. No production fixtures/sampleJobs. Original Vite files removed after replacement; recoverable in Git history. No Backend modifications.

For LAN acceptance steps see API_GAPS.md; endpoint/request mapping see API_INTEGRATION.md. Skill used: Postman api-engineer and api-testing; no Postman workspace was created or published. CLI was not discoverable in this shell, so one-off live probes used curl and local regression checks used Vitest/Chrome.
