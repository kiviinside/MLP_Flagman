# MLP_Flagman — PostgreSQL users integration

## What changed
- Added `app_users` PostgreSQL migration managed by Flyway in both included Maven backend folders.
- Added JPA entity/repository, database-backed `UserDetailsService`, staff creation service, DTOs and `/api/admin/users` controller.
- Removed in-memory users and hardcoded `app.users.*` password properties.
- Added a production profile using PostgreSQL environment variables, BCrypt cost 12 and CORS configuration.
- Disabled the browser Basic Auth challenge while retaining Basic Auth as a temporary API migration/testing mechanism.

## Render environment
Set these variables on the backend service:
- `SPRING_PROFILES_ACTIVE=prod`
- `SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:5432/<database>?sslmode=require`
- `SPRING_DATASOURCE_USERNAME=<database user>`
- `SPRING_DATASOURCE_PASSWORD=<database password>`
- `CORS_ALLOWED_ORIGINS=https://<your-frontend-domain>`

Use the actual database connection values from Render. Keep secrets out of Git. Flyway is enabled in `prod`; `application.yml` keeps it disabled for local H2 development because this migration is PostgreSQL-specific.

## Initial administrator
- Login: `admin`
- Initial password: `AdminSecure2024!`

The migration contains a BCrypt hash for this password. Change it immediately after first login; do not keep the example credential in a public deployment. Since a password-change endpoint is not included in this patch, change it using an approved admin/password-reset workflow before relying on this account long-term.

## API
- `GET /api/admin/users` — ADMIN only.
- `POST /api/admin/users` — ADMIN only, creates a STAFF account. Body: `{"login":"employee01","password":"a-unique-password-of-12-chars-or-more"}`.

For a temporary smoke test, HTTP Basic remains enabled but no `WWW-Authenticate` challenge is emitted, avoiding the browser modal. For a complete production login experience, replace it with a reviewed JWT or secure session-cookie flow. If using cookies, re-enable CSRF protection and configure credentials/CORS appropriately.

## Migration notes
- Confirm `V2` is the next unused Flyway version before deployment.
- If the Render database already contains tables created outside Flyway, inspect its schema and configure a Flyway baseline/initial migration strategy before enabling Flyway. Do not blindly baseline or modify an existing production database.
- `ddl-auto=validate` intentionally prevents Hibernate from modifying the schema.
- This archive excludes `node_modules`, Maven `target`, and `.git` folders; these are generated or local artifacts and should be recreated by build/deploy tools.
