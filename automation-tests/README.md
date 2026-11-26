# Selenium UI Automation – Smart Expense Tracker

Java 17 · Selenium WebDriver 4.27 · TestNG 7.10 · Maven · Page Object Model.
This project is **separate** from the React (`client/`) and Node.js (`server/`) packages.

## Prerequisites
| Tool | Version | Notes |
|------|---------|-------|
| JDK | 17 or newer | `java -version` |
| Maven | 3.9+ | `mvn -version` |
| Chrome (or Firefox / Edge) | current | Selenium Manager downloads the matching driver automatically |
| Node.js | 20 LTS or newer | to run the app under test |
| MongoDB | 6.x or 7.x (local) | tests use the **`smart-expense-tracker-test`** database |

## Run (Windows PowerShell)
```powershell
# 1. one-time installs
cd client;  npm install; cd ..
cd server;  npm install; cd ..

# 2. start MongoDB (service or mongod), then start backend (test DB) + frontend in two windows
.\scripts\start-test-env.ps1

# 3. run the suite (checks both servers first)
.\scripts\run-ui-tests.ps1                 # headless Chrome
.\scripts\run-ui-tests.ps1 -Headless $false # watch the browser
```
Or manually:
```powershell
cd automation-tests
mvn test -DBASE_URL=http://localhost:5173 -DAPI_URL=http://localhost:5000/api
mvn test -DBROWSER=firefox -DHEADLESS=false
mvn test "-Dtest=AuthTests"                # a single class
```

## Configuration
Lookup order: environment variable → `-D` system property → `src/test/resources/test.properties`.

| Name | Default | Meaning |
|------|---------|---------|
| `BASE_URL` | `http://localhost:5173` | React app URL |
| `API_URL` | `http://localhost:5000/api` | Express API (used only to seed data) |
| `BROWSER` | `chrome` | `chrome`, `firefox` or `edge` |
| `HEADLESS` | `true` | run without a visible window |
| `WAIT_SECONDS` | `15` | explicit-wait timeout |
| `TEST_PASSWORD` | `Test@12345` | password of the throw-away users the tests create (not a real credential) |

## Test data and safety
* Every test registers its **own unique user** (`…@selenium.test`) through the real API, so no real
  credentials are used or stored. Authentication is never disabled; the JWT comes from the real backend.
* Created expenses/income are deleted after each test. Users and groups remain, so run against the
  disposable **test database** and reset it when you like:
  ```powershell
  cd server; npm run test:clean-db      # refuses to run unless the DB name ends with "-test"
  ```

## Reports and diagnostics
* TestNG HTML report: `target/surefire-reports/index.html` and `emailable-report.html` (passed / failed / skipped)
* Failure screenshots: `target/screenshots/`
* Page source + URL of failed tests: `target/diagnostics/`

## Structure
```
automation-tests/
├─ pom.xml  testng.xml
└─ src/test
   ├─ resources/test.properties
   └─ java
      ├─ config/TestConfig.java      configuration lookup
      ├─ base/                       BaseTest (driver lifecycle, failure capture), DriverFactory
      ├─ pages/                      Page Objects (BasePage + one class per screen)
      ├─ tests/                      AuthTests, ExpenseTests, IncomeTests, BudgetTests, DashboardTests, SplitSphereTests
      └─ utils/                      ApiClient (data seeding), SessionUtil, ScreenshotUtil, TestListener, MoneyUtil, TestData
```
Locators use `data-testid` attributes added to the React components. Synchronisation uses `WebDriverWait`
(no fixed sleeps).

## Troubleshooting
* **`Backend is not reachable`** – start MongoDB and the backend; check `http://localhost:5000/api/health`.
* **`API call failed … is the backend running`** – `API_URL` must include `/api`.
* **Port 5173 in use** – stop the other Vite instance (`--strictPort` is used) or pass `-BaseUrl`; also set
  `CORS_ORIGIN` in `server/.env.test` to the same origin.
* **CORS errors in the browser** – `CORS_ORIGIN` must equal the exact frontend origin.
* **Driver download blocked** – Selenium Manager needs internet on first run; otherwise put a matching driver on `PATH`.
