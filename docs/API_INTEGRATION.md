# API integration — 2026-10-25

## Evidence levels

- CONFIRMED / Verified: hành vi frontend được unit/browser fixture/build xác minh; không đồng nghĩa API Django thật đạt.
- ASSUMED / Implemented, not verified: contract từ mega prompt trước, chưa đối chiếu serializer hoặc live response.
- PENDING_VERIFICATION / Pending/Blocked: chưa có schema/credentials/kết nối.

Backend source, docs/API_CONTRACT.md, openapi.json và tài liệu audit Backend không có trong checkout. Không lấy số 43 tests của Backend làm kết quả kiểm thử của frontend.

## Mapping hiện dùng (prefix /api/v1 có trong base URL)

| Feature | Method / relative path | Request | Response adapter | Evidence |
|---|---|---|---|---|
| Login | POST /auth/login/ | email, password JSON | user, access, refresh | ASSUMED user-provided contract; local fixture Verified |
| Register | POST /auth/register/ | email, password, optional first_name/last_name, role CANDIDATE hoặc EMPLOYER | user, access, refresh (201 expected by user contract) | ASSUMED; local fixture Verified |
| Me | GET /auth/me/ | Bearer access | direct User with id/email/role; names optional | ASSUMED; local fixture Verified |
| Refresh | POST /auth/refresh/ | refresh JSON, no Bearer | access + rotated refresh | ASSUMED; single-flight unit tests Verified |
| Logout | POST /auth/logout/ | Bearer access + refresh JSON | 204, clear local even on failure | ASSUMED; local fixture Verified |
| Jobs | GET /jobs/ | search, location, page, page_size currently exposed | count/next/previous/results | ASSUMED; strict parser and fixture Verified |
| Detail | GET /jobs/{id}/ | encoded id | Job object; HTTP 404 -> Next notFound | ASSUMED; fixture Verified |
| Health | GET /health/ | none | not parsed by production UI | prior user-provided path; LAN not verified |
| Candidate/Employer/Admin/Companies | — | — | — | PENDING_VERIFICATION, no invented paths |

Jobs mapping is explicitly provisional in src/api/jobs.ts: id/title required; optional company_name or company string/object.name, location, employment_type, experience_level, salary string, description, tags string[], created_at, requirements, benefits. Unsupported structures fail or omit absent optional fields, not fabricate production data. Pure list arrays are rejected. Unknown fields/enums for jobs must be reconciled with Django OpenAPI; no employment enum guesses sent by filters.

## Fetch architecture

Public read: Next server -> config(server env) -> send(no token/no-store) -> runtime parser -> Job components. Auth: browser -> AuthProvider -> auth service/client -> transport. Browser config uses NEXT_PUBLIC_DJANGO_API_BASE_URL, server uses DJANGO_API_BASE_URL. No proxy/parallel Backend. Timeout 8s, cancellation supported, no cross-origin path injection, no credentials/cookies. Errors distinguish configuration/network/timeout/http/contract; raw HTML/server trace hidden; field validation maps into forms.

## Session policy

sessionStorage token bundle scoped to tab; refresh promise single-flight within tab, late 401 reuses rotated token. Local logout increments revision before request, preventing late refresh/login resurrecting session. Network failure never means expired token. Old localStorage tokens removed requiring re-login. XSS remains a risk; no token/password/user PII logging. Sensitive pages client-guarded and private data fetched with Bearer; backend permission enforcement remains mandatory.
