## 2024-02-14 - Information Leakage in Health Check
**Vulnerability:** The `/api/health` and `/api/health/detailed` endpoints exposed sensitive environment details and internal service status to unauthenticated users.
**Learning:** Health checks are often overlooked as public endpoints. They should only return simple status (up/down) publicly, and detailed diagnostics only to authenticated admins or internal networks.
**Prevention:** Ensure health check endpoints filter sensitive data based on environment or authentication. Use separate endpoints for liveness (public) and detailed diagnostics (private).
