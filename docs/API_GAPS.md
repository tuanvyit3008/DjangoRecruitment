# API gaps — 2026-10-25

1. PENDING_VERIFICATION: no Django source, API_CONTRACT/OpenAPI/serializers, permissions or test accounts locally. Do not invent Candidate/Employer/Admin/companies/CV paths or schema.
2. LAN health/jobs/schema probes cannot obtain HTTP response from 192.168.1.93:8000. Live auth, CORS, database, JWT signing, blacklist and permission behavior: BLOCKED / NOT VERIFIED.
3. Auth fields/uppercase roles are now implemented exactly from the user-provided previous mega prompt, not from Backend source. Token aliases removed. Live confirmation still needed.
4. Jobs view model mapping remains provisional. Strict count/next/previous/results and mandatory job id/title validation fail explicitly. Require actual employment/category/status enums, salary representation, filters, pagination settings before adding further job controls.
5. Candidate/Employer/Admin and public companies dashboards not implemented. /account displays real current-user information rather than fabricated role dashboards. Frontend role guard foundation exists; no claim of role-specific E2E without real portal routes.
6. CV constraints and application fields were described earlier but exact URLs/responses/transitions absent; no write/download buttons pretend success.
7. Browser fixture tests validate frontend behavior against a deliberately separate test-only server. They do not verify Django integration, LAN CORS, owner permissions or production deployment.
8. No ESLint existing config/script. Unit tests, typecheck, Prettier format check, Next build and browser smoke are the configured gates. No claim that formatting is lint.

## LAN acceptance checklist

- Backend team supplies OpenAPI/contract and starts Django on 0.0.0.0:8000; verify actual LAN IP/firewall.
- Configure server DJANGO_API_BASE_URL and browser NEXT_PUBLIC_DJANGO_API_BASE_URL including /api/v1 once; rebuild/restart.
- Open frontend using actual allowed origin (port 5173). Verify CORS preflight with Content-Type and Authorization, without cookies/no-cors.
- Check jobs list/detail/404 and compare response types; verify role enums and registration request with safe test account.
- Login -> me -> /account -> reload -> controlled expired-access test -> one refresh -> replace both tokens -> logout 204 -> private route redirects.
- Confirm network outage retains credentials and shows recoverable error; 403 must not trigger refresh; invalid refresh expires session.
- Run Candidate/Employer/Admin flows only after implementing schema-confirmed modules. Do not share real JWT/password in reports.
