# Test Cases

This file separates **implemented and executed**, **implemented but not executed**, and **planned (not implemented)** tests.

## 1. Backend automated tests (Node built-in test runner, `cd server; npm test`)

Executed on Linux, Node v22: **26 passed, 0 failed, 1 skipped** (the skipped one is the MongoDB integration suite, which needs `MONGO_URI_TEST`).

| ID | Test | File | Status |
|----|------|------|--------|
| BE-01 | GET /api/health returns ok | `tests/api.noDb.test.js` | Implemented, executed – PASS |
| BE-02 | GET /api/expenses without token -> 401 | `tests/api.noDb.test.js` | Implemented, executed – PASS |
| BE-03 | GET /api/income without token -> 401 | `tests/api.noDb.test.js` | Implemented, executed – PASS |
| BE-04 | GET /api/groups without token -> 401 | `tests/api.noDb.test.js` | Implemented, executed – PASS |
| BE-05 | GET /api/auth/me without token -> 401 | `tests/api.noDb.test.js` | Implemented, executed – PASS |
| BE-06 | GET /api/expenses/analytics/summary without token -> 401 | `tests/api.noDb.test.js` | Implemented, executed – PASS |
| BE-07 | protected route with a garbage token -> 401 | `tests/api.noDb.test.js` | Implemented, executed – PASS |
| BE-08 | register: missing fields -> 400 | `tests/api.noDb.test.js` | Implemented, executed – PASS |
| BE-09 | register: invalid email / short password -> 400 | `tests/api.noDb.test.js` | Implemented, executed – PASS |
| BE-10 | register/login: non-string values (NoSQL operator injection) -> 400 | `tests/api.noDb.test.js` | Implemented, executed – PASS |
| BE-11 | login: missing password -> 400 | `tests/api.noDb.test.js` | Implemented, executed – PASS |
| BE-12 | malformed JSON body -> 400 JSON error | `tests/api.noDb.test.js` | Implemented, executed – PASS |
| BE-13 | unknown API route -> 404 JSON | `tests/api.noDb.test.js` | Implemented, executed – PASS |
| BE-14 | equal split: payer is owed by the other two | `tests/groupAnalytics.test.js` | Implemented, executed – PASS |
| BE-15 | balanced expenses produce no settlements | `tests/groupAnalytics.test.js` | Implemented, executed – PASS |
| BE-16 | settlement amounts net to zero across members | `tests/groupAnalytics.test.js` | Implemented, executed – PASS |
| BE-17 | no expenses -> empty summary and zero total | `tests/groupAnalytics.test.js` | Implemented, executed – PASS |
| BE-18 | isValidId accepts 24-hex strings only | `tests/validators.test.js` | Implemented, executed – PASS |
| BE-19 | toNumber / isValidAmount | `tests/validators.test.js` | Implemented, executed – PASS |
| BE-20 | isValidEmail / normalizeEmail | `tests/validators.test.js` | Implemented, executed – PASS |
| BE-21 | escapeRegex neutralises regex metacharacters | `tests/validators.test.js` | Implemented, executed – PASS |
| BE-22 | advanceDate steps by interval | `tests/validators.test.js` | Implemented, executed – PASS |
| BE-23 | validateEntry: valid expense is whitelisted and typed | `tests/validators.test.js` | Implemented, executed – PASS |
| BE-24 | validateEntry: rejects missing / invalid fields | `tests/validators.test.js` | Implemented, executed – PASS |
| BE-25 | validateEntry: partial mode only checks supplied fields | `tests/validators.test.js` | Implemented, executed – PASS |
| BE-26 | validateEntry: income uses source and income categories | `tests/validators.test.js` | Implemented, executed – PASS |
| BE-INT | API integration suite against a real MongoDB test DB (≈20 sub-tests: duplicate registration 409, hashed passwords, expense CRUD, validation 400s, invalid id 400/404, **ownership isolation 404**, mass-assignment ignored, filters + regex-safe search, recurring-edit does not reset schedule, income, budget, analytics, SplitSphere access/membership/split/settlement) | `tests/api.integration.test.js` | Implemented – **not executed** (no MongoDB available while authoring) |

## 2. Selenium UI test cases (TestNG)

Status of all rows below: Implemented – **not executed** (see §3). IDs and titles are taken from the `@Test(description=…)` annotations in the Java sources.

| ID | Feature | Class | Title | Preconditions | Steps | Test data | Expected result | Actual result / status |
|----|---------|-------|-------|---------------|-------|-----------|-----------------|------------------------|
| TC-AUTH-01 | Authentication | AuthTests | Login with valid credentials | Registered user exists | Open /login; enter credentials; submit | Seeded user, test password | Redirected to /expenses; sidebar shows the user name and e-mail | Not executed yet |
| TC-AUTH-02 | Authentication | AuthTests | Login with wrong password shows an error | Registered user exists | Open /login; enter correct e-mail, wrong password; submit | Password "Wrong-Password-1" | Alert "Invalid email or password"; stays on /login | Not executed yet |
| TC-AUTH-03 | Authentication | AuthTests | Login with unknown e-mail shows the same generic error | None | Open /login; enter unregistered e-mail; submit | Unique @selenium.test e-mail | Same generic alert; stays on /login | Not executed yet |
| TC-AUTH-04 | Authentication | AuthTests | Empty login form is blocked by required-field validation | None | Open /login; click submit with empty fields | Empty | E-mail and password fields report invalid (required); no navigation | Not executed yet |
| TC-AUTH-05 | Authentication | AuthTests | Malformed e-mail is rejected by the form | None | Enter "not-an-email" and a password; submit | not-an-email | E-mail field invalid (type=email); stays on /login | Not executed yet |
| TC-AUTH-06 | Authentication | AuthTests | Register a new account through the UI | None | Open /signup; fill name, e-mail, password, confirmation; submit | Unique name/e-mail | Redirected to /expenses; sidebar shows the new name | Not executed yet |
| TC-AUTH-07 | Authentication | AuthTests | Registering an e-mail that already exists is rejected | Registered user exists | Register again with the same e-mail | Existing e-mail | Alert "User already exists with this email"; stays on /signup | Not executed yet |
| TC-AUTH-08 | Authentication | AuthTests | Password confirmation mismatch is reported | None | Fill signup with different password and confirmation; submit | Password-1 / Password-2 | Alert "Passwords do not match" | Not executed yet |
| TC-AUTH-09 | Authentication | AuthTests | Password shorter than 6 characters is rejected | None | Fill signup with a 3-character password; submit | "123" | Password field invalid (minLength 6); stays on /signup | Not executed yet |
| TC-AUTH-10 | Authentication | AuthTests | Logout clears the session and redirects to login | Logged-in session | Click Logout in the sidebar | – | Redirected to /login; userInfo removed from localStorage | Not executed yet |
| TC-AUTH-11 | Authentication | AuthTests | Protected pages redirect anonymous visitors to login | No session | Open each protected URL directly (/dashboard, /expenses, /add, /income, /analytics, /groups, /settings) | 7 paths (data provider) | Each redirects to /login | Not executed yet |
| TC-AUTH-12 | Authentication | AuthTests | Session survives a page refresh | Registered user exists | Log in via UI; refresh the page | – | Still on /expenses with the same user in the sidebar | Not executed yet |
| TC-AUTH-13 | Authentication | AuthTests | An invalid/expired token is rejected by the API and the user is sent to login | Fake token in localStorage | Open /expenses | Token "not.a.valid.jwt" | API returns 401; app clears session and shows /login | Not executed yet |
| TC-EXP-01 | Expenses | ExpenseTests | Add an expense and see it in the list with the right amount | New user, logged in | Open Add Expense; fill form; submit | Team Lunch, 450.75, Food | Success toast; list shows the expense with ₹450.75 / Food; count 1; total 450.75 | Not executed yet |
| TC-EXP-02 | Expenses | ExpenseTests | Missing amount is blocked by the form | Logged in | Fill title only, leave amount empty; submit | Amount "" | Amount field invalid; stays on /add | Not executed yet |
| TC-EXP-03 | Expenses | ExpenseTests | Negative amount is blocked by the form | Logged in | Enter amount -50; submit | -50 | Amount violates min=0; stays on /add | Not executed yet |
| TC-EXP-04 | Expenses | ExpenseTests | Zero amount passes the browser check but is rejected by the server | Logged in | Enter amount 0; submit | 0 | Server rejects: error toast containing "greater than 0"; stays on /add | Not executed yet |
| TC-EXP-05 | Expenses | ExpenseTests | Edit an expense | One expense "Old Title" 100 Food | Click Edit; change title, amount, category; save | New Title, 175.25, Transport | List shows the updated values; old title gone | Not executed yet |
| TC-EXP-06 | Expenses | ExpenseTests | Delete an expense after confirming | Two expenses | Click Delete on one; accept confirm dialog | Keep me 40 / Delete me 60 | Toast "Expense deleted"; one card left; total 40 | Not executed yet |
| TC-EXP-07 | Expenses | ExpenseTests | Cancelling the delete confirmation keeps the expense | One expense | Click Delete; dismiss confirm dialog | Still here 25 | Expense remains | Not executed yet |
| TC-EXP-08 | Expenses | ExpenseTests | Count and total agree with the individual expenses | Three expenses | Open /expenses | 100.50 + 200.25 + 50 | Count 3; total 350.75; sum of cards equals total | Not executed yet |
| TC-EXP-09 | Expenses | ExpenseTests | Category filter shows only matching expenses and their total | Food 100, Transport 200, Food 50 | Open filters; choose category Food | Food | 2 cards (Pizza, Burger); total 150; "(filtered)" shown | Not executed yet |
| TC-EXP-10 | Expenses | ExpenseTests | Search filters by title | Two expenses | Type "coffee" in search | "coffee" | Only "Coffee beans" is listed | Not executed yet |
| TC-EXP-11 | Expenses | ExpenseTests | Search text with regex characters does not break the list | Expense "Lunch (office)" | Search "(office", then "((((" | Regex characters | First search finds it; second shows empty state; no error (regression for unescaped regex) | Not executed yet |
| TC-EXP-12 | Expenses | ExpenseTests | Amount range filter | Expenses 50 / 150 / 500 | Set min 100 and max 200 | min 100, max 200 | Only the 150 expense; total 150 | Not executed yet |
| TC-EXP-13 | Expenses | ExpenseTests | Date range filter and clear filters | Expenses 2026-01-10 and 2026-02-20 | Set From 2026-02-01; then To 2026-01-31; then Clear Filters | Date range | 1 result; then 0 results; then 2 after clearing | Not executed yet |
| TC-EXP-14 | Expenses | ExpenseTests | An added expense persists after a page refresh | Logged in | Add an expense via the form; refresh | Persistent item 99.99 | Expense still listed with the same amount | Not executed yet |
| TC-EXP-15 | Expenses | ExpenseTests | A new user sees the empty state | New user | Open /expenses | – | Empty state shown; 0 expenses | Not executed yet |
| TC-EXP-16 | Expenses | ExpenseTests | A user never sees another user's expenses | User A has an expense; user B exists | Log in as B; open /expenses | A's "Private expense" | B sees none of A's data | Not executed yet |
| TC-INC-01 | Income | IncomeTests | Add an income entry | New user | Open /income; Add Income; fill; submit | Freelance gig 2500.50 Freelance | Entry listed with 2500.50; summary "1 source"; form closes | Not executed yet |
| TC-INC-02 | Income | IncomeTests | Missing amount is blocked by the form | Logged in | Leave amount empty; submit | Amount "" | Amount invalid; no entry created; form stays open | Not executed yet |
| TC-INC-03 | Income | IncomeTests | Negative amount is blocked by the form | Logged in | Enter amount -10; submit | -10 | Amount violates min=0; no entry | Not executed yet |
| TC-INC-04 | Income | IncomeTests | Zero amount is rejected by the server and the message is shown | Logged in | Enter amount 0; submit | 0 | Server error shown in the form ("greater than 0"); no entry | Not executed yet |
| TC-INC-05 | Income | IncomeTests | Delete an income entry after confirming | Incomes Bonus and Gift | Delete Bonus and confirm | Bonus 1000 / Gift 500 | Only Gift remains | Not executed yet |
| TC-INC-06 | Income | IncomeTests | Empty state for a new user | New user | Open /income | – | Empty state shown | Not executed yet |
| TC-INC-07 | Income | IncomeTests | Income total matches the seeded entries | Incomes 1000 and 2000.25 | Open /income | – | Summary shows "2 sources" and total 3000.25 | Not executed yet |
| TC-BUD-01 | Budget | BudgetTests | Set a monthly budget and see it on the dashboard | Logged in | Settings: enter 5000, save; go to Dashboard | 5000 | Success toast; dashboard budget card shows 5000 | Not executed yet |
| TC-BUD-02 | Budget | BudgetTests | Budget progress equals current-month spending / budget | Budget 5000; expense 1000 this month | Open dashboard | 1000 / 5000 | Budget progress = 20.0% | Not executed yet |
| TC-BUD-03 | Budget | BudgetTests | Progress is capped at 100% when spending exceeds the budget | Budget 1000; expense 1500 | Open dashboard | 1500 / 1000 | Progress capped at 100% | Not executed yet |
| TC-BUD-04 | Budget | BudgetTests | Negative budget is rejected by the form | Logged in | Settings: enter -100; save | -100 | Input invalid (min=0); stays on /settings | Not executed yet |
| TC-BUD-05 | Budget | BudgetTests | Budget of 0 disables the budget card | Budget 3000 | Settings: save 0; open dashboard | 0 | Budget card is not displayed | Not executed yet |
| TC-BUD-06 | Budget | BudgetTests | Saved budget persists after refresh | Logged in | Save 7500; refresh; reopen settings | 7500 | Field still shows 7500 | Not executed yet |
| TC-DASH-01 | Dashboard & analytics | DashboardTests | Dashboard elements load | Known data seeded | Open /dashboard | – | Sidebar, balance, bar chart canvas and recent table are shown | Not executed yet |
| TC-DASH-02 | Dashboard & analytics | DashboardTests | Totals agree with the known data set | Income 50000; expenses 1200 + 800 | Open /dashboard | Known data set | Income 50000; expenses 2000; net 48000; 3 transactions | Not executed yet |
| TC-DASH-03 | Dashboard & analytics | DashboardTests | Savings rate = (income - expenses) / income | Known data set | Open /dashboard | – | Savings rate "96.0%" | Not executed yet |
| TC-DASH-04 | Dashboard & analytics | DashboardTests | Recent activity lists the seeded transactions | Known data set | Open /dashboard | Monthly Salary, Groceries, Bus pass | Recent table lists all three | Not executed yet |
| TC-DASH-05 | Dashboard & analytics | DashboardTests | A new user sees zero totals and no savings rate | New user | Open /dashboard | – | Zero totals; no savings percentage | Not executed yet |
| TC-DASH-06 | Dashboard & analytics | DashboardTests | Analytics page shows current/previous month totals and top category | Known data + 300 expense last month | Open /analytics | Food 1200 top category | Current 2000; previous 300; top category Food 1200 | Not executed yet |
| TC-DASH-07 | Dashboard & analytics | DashboardTests | Sidebar navigation reaches every section | Logged in | Click each sidebar link | 6 links (data provider) | URL path matches the target section | Not executed yet |
| TC-SPL-01 | SplitSphere | SplitSphereTests | Create a group | New user | Groups → New Group; enter name; create | Goa Trip | Success toast; group card shows with "1 Members" | Not executed yet |
| TC-SPL-02 | SplitSphere | SplitSphereTests | Opening a group shows its dashboard | Group exists | Open group from the list | Flat Mates | Group dashboard with title, "all settled", total 0 | Not executed yet |
| TC-SPL-03 | SplitSphere | SplitSphereTests | Add a member by e-mail | Group + registered second user | Enter the user's e-mail; Add | Friend e-mail | Toast "Member added successfully!"; 2 member badges | Not executed yet |
| TC-SPL-04 | SplitSphere | SplitSphereTests | Adding an unregistered e-mail is rejected | Group exists | Add an unregistered e-mail | ghost@selenium.test | Error toast "User with this email not found." | Not executed yet |
| TC-SPL-05 | SplitSphere | SplitSphereTests | Adding the same member twice is rejected | Group with 2 members | Add the same member again | Friend e-mail | Error toast "User is already a member." | Not executed yet |
| TC-SPL-06 | SplitSphere | SplitSphereTests | Shared expense is split equally and the settlement is calculated | Group with 2 members, owner logged in | Add shared expense 300 | Hotel 300 | Total ₹300; settlement: friend owes "You (Receive)" 150.00 | Not executed yet |
| TC-SPL-07 | SplitSphere | SplitSphereTests | The member who owes sees the correct 'You (Owe)' settlement | Owner paid 200 for 2 members; friend logged in | Open the group | Dinner bill 200 | Friend sees "You (Owe)" 100.00 to the owner | Not executed yet |
| TC-SPL-08 | SplitSphere | SplitSphereTests | A non-member cannot open the group | Group owned by A; B not a member | B opens /groups/<id> | – | "Group not found" and error toast; no group data | Not executed yet |
| TC-SPL-09 | SplitSphere | SplitSphereTests | A group is only listed for its members | A has a group | B opens /groups | – | B sees the empty state | Not executed yet |
| TC-SPL-10 | SplitSphere | SplitSphereTests | Zero shared-expense amount is rejected with the server message | Group exists | Add shared expense with amount 0 | 0 | Error toast with server message "greater than 0"; no expense listed | Not executed yet |

## 3. Why the UI tests are "not executed"

The authoring environment had no Maven, no browser and no MongoDB and no internet access, so the Selenium project could only be **syntax-checked** (every unresolved symbol belonged to the external Selenium/TestNG/Jackson libraries). Run the suite on your Windows machine (README) and replace "Not executed yet" with the observed result.

## 4. Planned / not implemented

| ID | Idea | Reason not implemented |
|----|------|------------------------|
| PL-01 | Settle-up / "mark as paid" in SplitSphere | feature does not exist in the application |
| PL-02 | Edit income in the UI | UI has no edit screen (API supports `PUT /income/:id`) |
| PL-03 | Recurring-expense checkbox + process-recurring through the UI | needs time-travel test data; covered at API level in BE-INT |
| PL-04 | CSV export content check | requires file-download handling in the browser profile |
| PL-05 | Light/dark theme toggle persistence | low priority |
| PL-06 | Cross-browser run (Firefox, Edge) | supported by `-DBROWSER`, not yet run |
| PL-07 | Performance / load tests | out of scope; no measurements exist |
| PL-08 | Accessibility checks | out of scope |
