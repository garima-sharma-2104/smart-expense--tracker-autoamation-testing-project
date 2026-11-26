# Test Plan – Smart Expense Tracker

## 1. Scope and objectives
**Objectives:** verify that authentication, expenses, income, budget, dashboard/analytics and SplitSphere behave
correctly through the real browser UI and through the REST API; verify input validation and access control;
demonstrate a maintainable automation framework.

**In scope:** features listed in `SYSTEM_DESIGN.md` §1. **Out of scope:** performance/load, accessibility, security
penetration testing, e-mail flows (none exist), cross-device testing, CSV download content.

## 2. Strategy
| Level | Tool | What is covered |
|-------|------|-----------------|
| Unit | Node `node:test` | validators, settlement calculation (`tests/validators.test.js`, `tests/groupAnalytics.test.js`) |
| API (no DB) | `node:test` + `fetch` against `app.js` | auth guard 401, input validation 400, JSON 404/400 handling (`tests/api.noDb.test.js`) |
| API integration | `node:test` + real MongoDB **test** DB | CRUD, validation, ownership isolation, group membership, recurring logic (`tests/api.integration.test.js`) |
| UI end-to-end | Java 17, Selenium WebDriver, TestNG, Maven | 59 test methods (70 executions with data providers) in `automation-tests/` |

Techniques: equivalence partitioning and boundary values for amounts (empty, negative, 0, valid), negative testing for
every form, state-based tests (empty / populated), and authorization tests (other user, non-member).

## 3. Environment and prerequisites
Windows 10/11, Node.js 20 LTS or newer (tested here with 22), JDK 17+, Maven 3.9+, MongoDB 6/7 on `localhost:27017`,
Chrome (or Firefox/Edge). Frontend `http://localhost:5173`, API `http://localhost:5000/api`.
Exact commands: root `README.md` / `automation-tests/README.md`.

## 4. Test data strategy
* Dedicated database **`smart-expense-tracker-test`** (`server/.env.test`); never the development/production DB.
* Each test registers its own throw-away user (`<prefix>_<random>@selenium.test`) through the real API; the password is
  the documented test-only value `TEST_PASSWORD` (default `Test@12345`), configurable by environment variable.
* Data is seeded through the real REST API (`utils/ApiClient`) with fixed, predictable values (e.g. income 50 000,
  expenses 1 200 + 800) and dated the 15th of the current/previous month to be time-zone and month-boundary safe.
* Cleanup: expenses and income created by a test are deleted afterwards (own data only). Users/groups remain; reset the whole
  test DB with `npm run test:clean-db` (refuses unless the database name ends with `-test`).
* Authentication is never bypassed: tests obtain a real JWT from the backend; UI login is tested separately.

## 5. Test cases
See `TEST_CASES.md` (functional and negative cases for each feature, with IDs `TC-AUTH-*`, `TC-EXP-*`, `TC-INC-*`,
`TC-BUD-*`, `TC-DASH-*`, `TC-SPL-*`, and backend `BE-*`).

## 6. Automation framework architecture
```
BaseTest (driver per test, screenshot on failure)  ─ DriverFactory (Selenium Manager, chrome/firefox/edge)
   └─ tests/*Tests  ──uses──►  pages/*Page (Page Object Model, BasePage with explicit waits)
                      └─────►  utils/ApiClient (seed data), SessionUtil, MoneyUtil, TestData
config/TestConfig  (env var → -D property → test.properties)
```
* Locators: `[data-testid='…']` added to the React components; no absolute XPath; no `Thread.sleep`.
* Synchronisation: `WebDriverWait` + `ExpectedConditions` and polling predicates (e.g. wait for card count).
* Native `confirm()` dialogs handled with `Alert`; date inputs set via the native value setter + `input` event.
* Reports: TestNG/Surefire HTML (`target/surefire-reports`), console listener, screenshots and page source on failure.

## 7. Entry and exit criteria
**Entry:** MongoDB test DB running; backend and frontend start without errors; `/api/health` returns 200; browser available.
**Exit:** all planned automated tests executed; no failed test left unexplained (each failure is either fixed or logged as a defect);
no open high-severity defect in authentication, authorization or data integrity; results recorded in `TEST_CASES.md`.

## 8. Known limitations
* **At authoring time the Selenium suite had not been executed** (no Maven, browser, MongoDB or internet in that environment);
  only a parse-level check was done. Backend unit/no-DB tests were executed (26 passed).
* The client was not built or linted in the authoring environment (the supplied `node_modules` are Windows binaries).
* A browser is started per test (isolated but slower). Tests are sequential; parallel execution is not configured.
* Chart contents (Chart.js canvas) cannot be asserted pixel-wise; only presence is checked.
* Settlement "mark as paid" does not exist in the app, so it is not tested.
* Time-dependent features (recurring expenses, analytics averages) are only partly covered.
