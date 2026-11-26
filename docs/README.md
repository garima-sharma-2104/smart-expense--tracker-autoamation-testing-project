# Smart Expense Tracker

Full-stack MERN application (React + Express + MongoDB) with an automated test suite and system-design documentation.

## Features
* Register / login with JWT; protected pages
* Expenses: add, list, edit, delete, filter (category, dates, amount range, search), recurring expenses, CSV export
* Income: add, list, delete
* Monthly budget with progress on the dashboard
* Dashboard (totals, savings rate, bar and pie charts, recent activity) and Analytics (month-over-month, top category)
* SplitSphere: groups, members by e-mail, equal-split shared expenses, who-owes-whom summary
* Light / dark theme

## Prerequisites
Node.js 20 LTS+ · MongoDB 6/7 · (for UI tests) JDK 17+, Maven 3.9+, Chrome/Firefox/Edge

## Installation and configuration (PowerShell, from the project root)
```powershell
cd server; npm install; Copy-Item .env.example .env; cd ..
cd client; npm install; Copy-Item .env.example .env; cd ..
```
Edit `server\.env` and set a long random `JWT_SECRET`, e.g. `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
Environment variables:

| File | Variable | Example | Meaning |
|------|----------|---------|---------|
| server/.env | `PORT` | `5000` | API port |
| | `MONGO_URI` | `mongodb://127.0.0.1:27017/smart-expense-tracker` | database |
| | `JWT_SECRET` | *(random)* | signing key – required |
| | `JWT_EXPIRE` | `30d` | token lifetime |
| | `CORS_ORIGIN` | `http://localhost:5173` | allowed frontend origin(s), comma-separated |
| client/.env | `VITE_API_URL` | `http://localhost:5000/api` | API base URL |

## Run the application
```powershell
# terminal 1 (MongoDB must be running)
cd server; npm run dev        # or: npm start
# terminal 2
cd client; npm run dev        # http://localhost:5173
```
## Run the tests
```powershell
# backend unit + API tests (no database needed for most)
cd server; npm test
# backend integration tests (needs MongoDB; uses a TEST database)
$env:MONGO_URI_TEST="mongodb://127.0.0.1:27017/smart-expense-tracker-test"; npm test
# Selenium UI suite: start backend (test DB) + frontend, then run
cd ..; .\scripts\start-test-env.ps1
.\scripts\run-ui-tests.ps1
```
Reports: `automation-tests\target\surefire-reports\index.html` · Screenshots: `automation-tests\target\screenshots\`.

## Troubleshooting
| Problem | Fix |
|---------|-----|
| `JWT_SECRET is not set` on server start | create `server\.env` from `.env.example` |
| `MongoDB Connection Error` | start MongoDB; check `MONGO_URI` |
| Browser shows CORS error | `CORS_ORIGIN` must equal the exact frontend origin (scheme + host + port) |
| Frontend cannot reach API | check `client\.env` `VITE_API_URL` (must end with `/api`); restart `npm run dev` after changing it |
| `npm run build` fails | run `npm install` in `client` (React is now an explicit dependency) |
| Maven cannot download dependencies | check internet/proxy; Selenium Manager also needs internet on first run |

## Project structure
```
.
├─ client/               React + Vite SPA (src/pages, components, context, utils/api.js)
├─ server/               Express API (app.js, server.js, routes, controllers, models, middleware, utils, tests, scripts)
├─ automation-tests/     Selenium + TestNG + Maven UI automation (Page Objects)
├─ scripts/              PowerShell helpers: start-test-env.ps1, run-ui-tests.ps1
└─ docs/                 SYSTEM_DESIGN.md, TEST_PLAN.md, TEST_CASES.md, diagrams/*.mmd
```
Design documents: `SYSTEM_DESIGN.md`, `TEST_PLAN.md`, `TEST_CASES.md`, `diagrams/` (Mermaid).
