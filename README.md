# ATIERA HR3 — Portfolio Demo

A standalone, interactive administration demo of the **Atiera Hotel & Restaurant HR3 Management System**, by **Charles Pura**. It retains the original branding, dark sidebar, module navigation, and workflows using fictional employee and transaction records.

The login, app landing page, standalone face clock, dashboard, user summary cards, header controls, notification dropdown, and floating assistant follow the supplied screenshots of the original system. Counts and names continue to come from fictional local demo records.

**Login:** `admin` / `admin`  
**Administrator:** Charles Pura

This folder is the entire application. You can move or rename it, remove it from the PHP project, and put its contents in a separate repository. It does not read or change the original system.

## Run locally

With XAMPP running, open:

```text
http://localhost/public_html/portfolio-demo/
```

Or open a terminal inside this folder and run:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:4173/`.

The public app landing page is at `#/mobile`, and the standalone face clock is at `#/face`. Both can be opened from the login screen before signing in.

Use an HTTP server instead of double-clicking `index.html`; browser JavaScript modules require HTTP/HTTPS. No `npm install`, build, PHP, Composer, SQLite, MySQL, API key, Firebase account, or paid service is needed.

## Publish to GitHub Pages

1. Create a new GitHub repository for the demo.
2. Copy **the contents of this folder** into the repository root, including `.nojekyll`. `index.html`, `assets/`, and `src/` should be at the root of that repository.
3. Commit and push to `main`.
4. Open **Settings → Pages → Build and deployment**.
5. Choose **Deploy from a branch**, select **main** and **/(root)**, then save.
6. Open the URL shown by GitHub after deployment completes.

For a project repository, the address is usually `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`. For a repository named `YOUR-USERNAME.github.io`, it is `https://YOUR-USERNAME.github.io/`.

All application assets use relative paths, and screens use hash routes such as `#/leaves`. Refreshing or sharing a module URL therefore works under a GitHub Pages repository path without server rewrite rules. The root deployment approach is documented in [GitHub's Pages publishing guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

Publish only this demo folder's contents. No files from the parent PHP project, SQL dumps, configuration directories, personal uploads, or service credentials belong in the demo repository.

## What works

| Module | Demo behavior |
| --- | --- |
| Dashboard | Live totals, attendance and claims trends, monthly leave trend, department distribution bars and status charts, activity, upcoming leave, recent hires, quick actions |
| Employees | Search, filter, pagination, add/edit/view/delete, bulk delete, profile photo, NFC assignment, new hires, departments, positions, simulated sync |
| Attendance | Manual attendance, face/NFC clock in/out, breaks, overnight shifts, attendance logs, calculated anomalies and resolution, absence remarks, simulated CCTV, allowed locations |
| Shift & Schedule | Weekly assignment grid, monthly calendar, date navigation, shift notes, shift templates, holidays, unassigned employees, auto balance, add/change/remove/swap requests and approvals |
| Timesheet | Attendance-derived work/break hours, overtime and undertime, individual/bulk approval or rejection, employee report, 15-day report, demo sync |
| Leave | Assign/edit pending requests, attachments, approve/reject/cancel, annual allowance and used/remaining balances, employee allowances, leave types |
| Claims | Itemized expenses, live totals, receipt attachment, drafts, submission, approval/rejection/cancellation/payment, password/NFC amount reveal, summaries, event budgets, expense/event types |
| Users | Fictional accounts, roles, account edits/deletion, simulated verification emails, verification controls, login activity, profile settings |
| Settings | Theme, accessibility, fullscreen/focus controls, demo 2FA/recovery codes, password-change simulation, PDF password settings, notification preferences, email/Discord configuration, health, module inventory |
| Integrations | Local email/Discord outboxes and simulated delivery; Firestore collection explorer; validated local GET/POST API explorer; upload/download of a local cloud snapshot |
| Reports & tools | CSV and actual PDF downloads, JSON backup/restore, reset, audit logs, global search, floating HR assistant with help/expand/example voice input, public mobile app landing page and interactive phone previews, privacy/terms/help |

See [SCREENS.md](SCREENS.md) for the 60 screens and their corresponding original PHP paths.

## Try these workflows

1. **Face/NFC attendance:** Sign in, open Time and Attendance → Face Recognition, leave Charles Pura selected, and click **Simulate face recognition**. Open Attendance Log or Timesheet to see the new entry. In NFC Clock In / Out, the admin's example tag is `DEMO-NFC-001`. Choose start break, end break, or clock out to continue. Duplicate clock-ins are blocked. For sample completed work hours, edit the attendance times manually.
2. **Leave:** Assign a short fictional leave, approve it, and check Leave Balance. Cancel the approval to restore the balance. Overlapping requests and approvals exceeding the balance are blocked.
3. **Claims:** Assign a claim, add multiple expenses and an optional sample receipt, submit it, approve it, and mark it paid. Approval checks the event budget. Use `admin` or simulated NFC to reveal amounts.
4. **Scheduling:** Click an empty cell to assign a shift. Click an assigned shift to edit its type or note. Review a shift request to change the actual schedule, or run Auto Balance to fill a week without replacing existing assignments or approved leave.
5. **Connected services:** Submit a request, open Notification Management, and process the demo queue. Inspect the resulting fictional messages. Firestore and API Explorer read the same current records.
6. **Backup/reset:** Open Settings → Monitoring & Maintenance. Export a JSON backup, reset the sample records, and restore the backup to bring your changes back.

## Storage and simulation boundaries

- Data is stored in **IndexedDB in the visitor's browser**, separately from your original application and other visitors. Changes survive refresh. They are not shared between visitors or devices. Clearing site storage removes them. If browser storage is unavailable, the demo announces temporary memory mode.
- Fictional records are seeded relative to the initialization date in **Asia/Manila**. Reset Demo Data refreshes that sample period. Leave allowances are annual; the default balance view shows the current year. Leave duration uses inclusive calendar days.
- `admin` / `admin` is a public demonstration login. Additional accounts are editable sample records; they do not create working employee/manager sessions. The requested scope is the **admin side**.
- The login CAPTCHA is a visual local simulation. It does not contact Google or enforce real bot verification. Cookie preferences describe local demo storage; the demo does not run advertising or analytics trackers.
- Face recognition, NFC and CCTV are simulations. They do not request camera access, read hardware, identify real people or record video. Attendance actions still update the same local business records.
- Email, Discord, Firebase/Firestore, API keys, SSO-like quick approval, authenticator checks, verification and password changes are local demonstrations. No connected-service calls or messages are sent. Do not enter real credentials. Demo 2FA accepts `123456` or the displayed recovery codes. The public admin password remains `admin`.
- The Firestore explorer is an IndexedDB-backed collection view. Cloud sync uses a second snapshot inside the same browser; downloading it replaces the covered business collections after confirmation. JSON backup is the portable copy.
- CSV files can be opened in Excel. PDF downloads are generated entirely in JavaScript. **PDF password settings demonstrate the original settings screen; exported demo PDFs are not encrypted.** Production mPDF/password protection and native Excel generation are not run on GitHub Pages.
- Attachments accept PNG/JPG/WebP, PDF and text up to 2 MB per file, stored locally. Profile photos accept images. Use fictional samples only.
- Existing configuration names propagate to related records when renamed. Referenced records are protected from deletion. The built-in approval statuses and Charles Pura administrator are retained so demo workflows remain usable. New request types can select one of four scheduling behaviors.
- The app-store buttons open an interactive phone preview, not an APK download. Its menus, tabs, notifications, profile and sample records work locally. The assistant provides local topic-based answers about the current demo data; its microphone button inserts an example command without requesting microphone access.

## Source and tests

```text
index.html          Static entry point
assets/             Original Atiera logos
src/data.js         Fictional seed data and date helpers
src/model.js        Cross-module validation and workflows
src/storage.js      IndexedDB persistence
src/routes.js       Original screen mappings and form definitions
src/ui.js           Shared UI and local CSV/PDF export
src/views.js        Screen content
src/presentation.js Screenshot-based public pages, phone previews and floating panels
src/app.js          Login, routing, dialogs and interactions
src/styles.css      Original-style responsive UI and themes
src/reference.css   Layout and color refinements from the supplied screenshots
tests/              Workflow checks
```

With Node.js installed:

```sh
npm test
```

The tests check business behavior such as duplicate clock-in protection, overnight hours, approval/balance updates, claim budgets, schedule changes, configuration references, and simulated delivery. Browser QA details are in [VALIDATION.md](VALIDATION.md).
