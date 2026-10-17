# Validation

Verified on October 17, 2026 (Asia/Manila).

## Automated business checks

`npm test` passes **30 tests** for date boundaries, fictional data, route definitions, cross-module attendance, breaks, overnight hours, timesheet review, leave balances, claim transitions and budgets, schedule conflicts, request approval and swaps, auto balance, configuration references, administrator protection, attachments, simulated delivery, account creation dates and timesheet notifications.

## Browser checks

Headless Google Chrome passed checks against a separate copy of this folder served under `/repository-name/`, without access to the parent PHP project.

- All **60 screens** rendered at **1440 px, 390 px and 320 px** with no page-level horizontal overflow.
- No JavaScript page errors, failed asset requests or external service requests were observed.
- Admin login, failed-login history, logout, simulated 2FA and re-login worked.
- The screenshot-based login, public mobile app landing page and public face kiosk rendered correctly. App navigation, store-button previews and cookie preferences worked before signing in.
- The dashboard used four summary columns at the reference desktop width. Header clock, fullscreen, focus mode, notification dropdown and mark-read actions worked.
- Employee creation, dependent position choices, sample user creation and welcome-email queuing worked.
- Monthly schedule navigation, daily schedule dialogs, shift assignment, approved shift changes and auto balance worked.
- Timesheet selection and bulk approval worked.
- Simulated face clock-in, persistence after refresh and NFC clock-out updated attendance records.
- Configuration creation, editing, deletion, filtering and confirmation dialogs worked.
- Leave attachment upload, approval and cancellation worked.
- Multi-item claims calculated their totals, submitted, approved and moved to paid status.
- Local message composition and simulated email/Discord delivery worked.
- API GET, demo cloud snapshot, JSON backup and restore worked.
- CSV and PDF downloads contained the expected records. A generated PDF was also opened and rasterized with the host PDF renderer.
- Global search, floating assistant messaging/help/expand/example voice input, mobile sidebar navigation and dark theme worked.

The original PHP application was left unchanged. No original employee database, user uploads, API credentials or SQL dump is included.

## Re-run browser checks (optional)

Runtime has no npm dependencies. The optional browser test uses Playwright Core and an installed Chromium-based browser. Start the demo HTTP server first, then run, for example on macOS:

```sh
npm install --no-save --package-lock=false playwright-core
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run test:browser
```

`HR3_DEMO_BASE` overrides the default `http://127.0.0.1:4173/`. `HR3_QA_OUTPUT` chooses an artifact folder; the default is a temporary directory outside the repository. `PLAYWRIGHT_MODULE` can point to an existing Playwright Core installation. These tests use a fresh browser context and fictional records.

This validation covers the demo implementation. It does not verify live SMTP, Discord, Firebase, biometric hardware or the original PHP application's runtime; those services are intentionally simulated here.
