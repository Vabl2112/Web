# End-to-end specs (Playwright)

The specs in `e2e/` run the web client against a real backend: `auth`, `unsubscribe`, `catalog`, `cabinet`, `admin` (moderation, suspension,
metrics, 403 for a buyer) and `messaging` (two browsers, polling; a conversation with a deleted counterpart). CI of this repository does not run them: it has no backend image yet
(P9.1). Run them on a machine that has the stack.

## The stack
1. PostgreSQL 16 and Mailpit: `docker compose up -d` in `egg-backend`. Without Docker, `node e2e/dev/mailpit-lite.mjs --media <EGG_MEDIA_DIR>`
   stands in for Mailpit (SMTP 1025, the two calls of its API on 8025) and for the `/media/` of nginx (8090), and the PostgreSQL of the
   backend tests can be started from their jars on port 5433.
2. The backend: `SPRING_PROFILES_ACTIVE=local`, `EGG_BOOTSTRAP_ADMIN_EMAIL=admin@example.org`, `EGG_FEATURES_MESSAGING=true`,
   `EGG_MAIL_SEND_INTERVAL=PT1S` (the default sends one mail every 10 s and the specs wait for many), `EGG_MEDIA_BASE_URL`, `EGG_MEDIA_DIR`.
3. The web client built with `EGG_API_ORIGIN=http://localhost:8080` and `EGG_MEDIA_ORIGIN` (the media address), started with
   `EGG_API_INTERNAL_URL=http://localhost:8080`.

   Add `EGG_NETWORK_TRUSTED_CIDRS=127.0.0.0/8,::1/128` to the backend: registration is limited to 10 per hour per address, and the specs make
   about thirty people from one machine; the trusted networks are not limited.

## Run
`pnpm e2e` (that is `playwright test`). `E2E_CHANNEL=chrome pnpm e2e` uses the installed Chrome (`msedge` works the same); without
`E2E_CHANNEL` run `pnpm exec playwright install chromium` once. All 18 specs pass against the real backend (about 1 minute). `E2E_BASE_URL`, `E2E_MAIL_URL`, `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD`
change the defaults. The specs make their own people with unique addresses; the administrator is registered on the first run.
