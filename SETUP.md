# Daybook setup

Install Node.js 20.9 or newer, then run:

```sh
npm install
npm run seed
npm run dev
```

Open http://localhost:3000 and register using a passkey. The app stores data in `todos.db`; keep a backup of that file (and its WAL files while the server is running). SQLite is local to the server and needs persistent storage in a deployed environment.

Create `.env.local` before starting the server, using a unique random `SESSION_SECRET` of at least 32 characters:

```env
SESSION_SECRET=replace-with-a-long-random-secret
WEBAUTHN_ORIGIN=http://localhost:3000
WEBAUTHN_RP_ID=localhost
```

For deployment, set the origin and relying-party ID to the actual HTTPS origin and hostname. Never commit the secret. Passkeys require a secure browser context (HTTPS or localhost). Changing the secret invalidates existing sessions. The holiday seed currently includes gazetted dates for 2026 and 2027; refresh it when later dates are published by Singapore's Ministry of Manpower.

Run `npm run build`, `npm run lint`, and `npx playwright test` to verify the project. Tests use installed Google Chrome and a separate `test-todos.db` database. Notifications require browser permission and an open app tab.

## Deployment with persistent SQLite

For Railway, provision a persistent volume and set `DATABASE_PATH` to a file on the mounted volume (for example `/data/todos.db`). Set `SESSION_SECRET`, `WEBAUTHN_RP_ID` to your production hostname, and `WEBAUTHN_ORIGIN` to its full HTTPS origin. Run the holiday seed once against the same persistent database. The included `railway.json` builds and starts the application. Test registration, login, persistence across restarts and deployments, notifications, and HTTPS on the actual deployment before calling it production ready.

Vercel serverless filesystems are ephemeral; this SQLite application needs a persistent database service or a hosting environment with a persistent volume. Do not deploy it to Vercel expecting a local SQLite file to persist.

## Verification

`npm run test:unit` checks date arithmetic, filtering, progress and database behavior. `npx playwright test` uses an isolated development server and test database on port 3217; set `PLAYWRIGHT_PORT` if needed. The browser suite uses Google Chrome by default; set `PLAYWRIGHT_BROWSER_CHANNEL=msedge` to run it with Microsoft Edge. Automated tests simulate notification delivery; a real browser/OS permission and notification still needs manual verification. Production deployment, Lighthouse accessibility and cross-browser testing are separate checks.
