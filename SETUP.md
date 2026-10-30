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
