
package tests;

import base.BaseTest;
import java.math.BigDecimal;
import org.testng.Assert;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;
import pages.AddExpensePage;
import pages.EditExpensePage;
import pages.ExpensesPage;
import utils.ApiClient;
import utils.MoneyUtil;
import utils.SessionUtil;
import utils.TestData;

/** Expense CRUD, validation, totals, filters and persistence. */
public class ExpenseTests extends BaseTest {

    private ApiClient.Session user;

    @BeforeMethod(alwaysRun = true)
    public void seedUser() {
        user = ApiClient.registerUser("ExpUser");
    }

    @AfterMethod(alwaysRun = true)
    public void cleanup() {
        if (user != null) {
            ApiClient.cleanupUserData(user);
        }
    }

    private ExpensesPage openExpenses() {
        SessionUtil.loginAs(driver, user, "/expenses");
        return new ExpensesPage(driver).waitLoaded();
    }

    @Test(description = "TC-EXP-01 Add an expense and see it in the list with the right amount")
    public void addExpenseAppearsInList() {
        ExpensesPage expenses = openExpenses();
        Assert.assertTrue(
            expenses.isEmptyStateShown(),
            "new user starts with no expenses"
        );

        expenses.clickAddExpense();

        AddExpensePage add = new AddExpensePage(driver);
        add.fill("Team Lunch", "450.75", "Food", TestData.midMonthDate());
        add.submit();

        add.waitForToast("success", "Expense added successfully!");
        expenses.waitForExactPath("/expenses");
        expenses.waitLoaded();
        expenses.waitForExpenseTitled("Team Lunch");

        Assert.assertEquals(expenses.cardCount(), 1);
        Assert.assertTrue(
            MoneyUtil.equal(expenses.amountOf("Team Lunch"), 450.75)
        );
        Assert.assertEquals(
            expenses.categoryOf("Team Lunch")
                .trim()
                .toUpperCase(java.util.Locale.ROOT),
            "FOOD",
            "category should be Food regardless of letter casing"
        );
        Assert.assertEquals(expenses.summaryCount(), 1);
        Assert.assertTrue(
            MoneyUtil.equal(expenses.summaryTotal(), 450.75)
        );
    }

    @Test(description = "TC-EXP-02 Missing amount is blocked by the form")
    public void missingAmountIsBlocked() {
        SessionUtil.loginAs(driver, user, "/add");
        AddExpensePage add = new AddExpensePage(driver);
        add.fill("No amount", "", "Food", null);
        add.submit();

        Assert.assertFalse(
            add.isAmountValid(),
            "empty amount must be invalid"
        );
        Assert.assertEquals(add.currentPath(), "/add");
    }

    @Test(description = "TC-EXP-03 Negative amount is blocked by the form")
    public void negativeAmountIsBlocked() {
        SessionUtil.loginAs(driver, user, "/add");
        AddExpensePage add = new AddExpensePage(driver);
        add.fill("Negative", "-50", "Food", null);
        add.submit();

        Assert.assertFalse(
            add.isAmountValid(),
            "negative amount must violate min=0"
        );
        Assert.assertEquals(add.currentPath(), "/add");
    }

    @Test(description = "TC-EXP-04 Zero amount passes the browser check but is rejected by the server")
    public void zeroAmountIsRejectedByServer() {
        SessionUtil.loginAs(driver, user, "/add");
        AddExpensePage add = new AddExpensePage(driver);
        add.fill("Zero amount", "0", "Food", null);
        add.submit();

        add.waitForToast("error", "greater than 0");
        Assert.assertEquals(add.currentPath(), "/add");
    }

    @Test(description = "TC-EXP-05 Edit an expense")
    public void editExpense() {
        ApiClient.createExpense(
            user, "Old Title", 100, "Food", TestData.midMonthDate()
        );

        ExpensesPage expenses = openExpenses();
        expenses.waitForExpenseTitled("Old Title");
        expenses.clickEdit("Old Title");

        EditExpensePage edit = new EditExpensePage(driver).waitLoaded();
        Assert.assertEquals(edit.title(), "Old Title");

        edit.setTitle("New Title");
        edit.setAmount("175.25");
        edit.setCategory("Transport");
        edit.save();

        expenses.waitForExactPath("/expenses");
        expenses.waitLoaded();
        expenses.waitForExpenseTitled("New Title");

        Assert.assertFalse(expenses.hasExpenseTitled("Old Title"));
        Assert.assertTrue(
            MoneyUtil.equal(expenses.amountOf("New Title"), 175.25)
        );
        Assert.assertEquals(
            expenses.categoryOf("New Title")
                .trim()
                .toLowerCase(java.util.Locale.ROOT),
            "transport"
        );
    }

    @Test(description = "TC-EXP-06 Delete an expense after confirming")
    public void deleteExpenseWithConfirm() {
        ApiClient.createExpense(
            user, "Keep me", 40, "Food", TestData.midMonthDate()
        );
        ApiClient.createExpense(
            user, "Delete me", 60, "Food", TestData.midMonthDate()
        );

        ExpensesPage expenses = openExpenses();
        expenses.waitForCardCount(2);
        expenses.delete("Delete me", true);
        expenses.waitForToast("success", "Expense deleted");
        expenses.waitForNoExpenseTitled("Delete me");

        Assert.assertEquals(expenses.cardCount(), 1);
        Assert.assertTrue(MoneyUtil.equal(expenses.summaryTotal(), 40));
    }

    @Test(description = "TC-EXP-07 Cancelling the delete confirmation keeps the expense")
    public void cancelDeleteKeepsExpense() {
        ApiClient.createExpense(
            user, "Still here", 25, "Food", TestData.midMonthDate()
        );

        ExpensesPage expenses = openExpenses();
        expenses.waitForCardCount(1);
        expenses.delete("Still here", false);

        Assert.assertEquals(expenses.cardCount(), 1);
        Assert.assertTrue(expenses.hasExpenseTitled("Still here"));
    }

    @Test(description = "TC-EXP-08 Count and total agree with the individual expenses")
    public void totalsMatchSeededData() {
        ApiClient.createExpense(
            user, "A", 100.50, "Food", TestData.midMonthDate()
        );
        ApiClient.createExpense(
            user, "B", 200.25, "Bills", TestData.midMonthDate()
        );
        ApiClient.createExpense(
            user, "C", 50, "Other", TestData.midMonthDate()
        );

        ExpensesPage expenses = openExpenses();
        expenses.waitForCardCount(3);

        Assert.assertEquals(expenses.summaryCount(), 3);
        Assert.assertTrue(MoneyUtil.equal(expenses.summaryTotal(), 350.75));

        BigDecimal sum = expenses.amountOf("A")
            .add(expenses.amountOf("B"))
            .add(expenses.amountOf("C"));

        Assert.assertEquals(
            sum.compareTo(expenses.summaryTotal()),
            0,
            "sum of cards must equal the shown total"
        );
    }

    @Test(description = "TC-EXP-09 Category filter shows only matching expenses and their total")
    public void categoryFilter() {
        ApiClient.createExpense(
            user, "Pizza", 100, "Food", TestData.midMonthDate()
        );
        ApiClient.createExpense(
            user, "Taxi", 200, "Transport", TestData.midMonthDate()
        );
        ApiClient.createExpense(
            user, "Burger", 50, "Food", TestData.midMonthDate()
        );

        ExpensesPage expenses = openExpenses();
        expenses.waitForCardCount(3);
        expenses.filterByCategory("Food");
        expenses.waitForCardCount(2);

        Assert.assertTrue(expenses.hasExpenseTitled("Pizza"));
        Assert.assertTrue(expenses.hasExpenseTitled("Burger"));
        Assert.assertFalse(expenses.hasExpenseTitled("Taxi"));
        Assert.assertTrue(MoneyUtil.equal(expenses.summaryTotal(), 150));
        Assert.assertTrue(expenses.summaryText().contains("(filtered)"));
    }

    @Test(description = "TC-EXP-10 Search filters by title")
    public void searchByTitle() {
        ApiClient.createExpense(
            user, "Coffee beans", 30, "Food", TestData.midMonthDate()
        );
        ApiClient.createExpense(
            user, "Monthly rent", 5000, "Bills", TestData.midMonthDate()
        );

        ExpensesPage expenses = openExpenses();
        expenses.waitForCardCount(2);
        expenses.search("coffee");
        expenses.waitForCardCount(1);

        Assert.assertTrue(expenses.hasExpenseTitled("Coffee beans"));
    }

    @Test(description = "TC-EXP-11 Search text with regex characters does not break the list")
    public void searchWithSpecialCharacters() {
        ApiClient.createExpense(
            user, "Lunch (office)", 80, "Food", TestData.midMonthDate()
        );

        ExpensesPage expenses = openExpenses();
        expenses.waitForCardCount(1);
        expenses.search("(office");
        expenses.waitForCardCount(1);

        Assert.assertTrue(expenses.hasExpenseTitled("Lunch (office)"));

        expenses.search("((((");
        expenses.waitForCardCount(0);

        Assert.assertTrue(expenses.isEmptyStateShown());
    }

    @Test(description = "TC-EXP-12 Amount range filter")
    public void amountRangeFilter() {
        ApiClient.createExpense(
            user, "Small", 50, "Other", TestData.midMonthDate()
        );
        ApiClient.createExpense(
            user, "Medium", 150, "Other", TestData.midMonthDate()
        );
        ApiClient.createExpense(
            user, "Large", 500, "Other", TestData.midMonthDate()
        );

        ExpensesPage expenses = openExpenses();
        expenses.waitForCardCount(3);
        expenses.filterMinAmount("100");
        expenses.filterMaxAmount("200");
        expenses.waitForCardCount(1);

        Assert.assertTrue(expenses.hasExpenseTitled("Medium"));
        Assert.assertTrue(MoneyUtil.equal(expenses.summaryTotal(), 150));
    }

    @Test(description = "TC-EXP-13 Date range filter and clear filters")
    public void dateRangeFilterAndClear() {
        ApiClient.createExpense(
            user, "January item", 10, "Other", "2026-01-10"
        );
        ApiClient.createExpense(
            user, "February item", 20, "Other", "2026-02-20"
        );

        ExpensesPage expenses = openExpenses();
        expenses.waitForCardCount(2);
        expenses.filterFromDate("2026-02-01");
        expenses.waitForCardCount(1);

        Assert.assertTrue(expenses.hasExpenseTitled("February item"));

        expenses.filterToDate("2026-01-31");
        expenses.waitForCardCount(0);
        expenses.clearFilters();
        expenses.waitForCardCount(2);
    }

    @Test(description = "TC-EXP-14 An added expense persists after a page refresh")
    public void expensePersistsAfterRefresh() {
        SessionUtil.loginAs(driver, user, "/add");

        AddExpensePage add = new AddExpensePage(driver);
        add.fill(
            "Persistent item", "99.99", "Shopping", TestData.midMonthDate()
        );
        add.submit();

        ExpensesPage expenses = new ExpensesPage(driver);
        expenses.waitForExactPath("/expenses");
        expenses.waitForExpenseTitled("Persistent item");

        driver.navigate().refresh();
        expenses.waitLoaded();
        expenses.waitForExpenseTitled("Persistent item");

        Assert.assertTrue(
            MoneyUtil.equal(expenses.amountOf("Persistent item"), 99.99)
        );
    }

    @Test(description = "TC-EXP-15 A new user sees the empty state")
    public void emptyStateForNewUser() {
        ExpensesPage expenses = openExpenses();

        Assert.assertTrue(expenses.isEmptyStateShown());
        Assert.assertEquals(expenses.cardCount(), 0);
        Assert.assertEquals(expenses.summaryCount(), 0);
    }

    @Test(description = "TC-EXP-16 A user never sees another user's expenses")
    public void expensesAreIsolatedPerUser() {
        ApiClient.createExpense(
            user, "Private expense", 777, "Other", TestData.midMonthDate()
        );

        ApiClient.Session other = ApiClient.registerUser("OtherUser");

        try {
            SessionUtil.loginAs(driver, other, "/expenses");

            ExpensesPage expenses = new ExpensesPage(driver).waitLoaded();

            Assert.assertEquals(expenses.cardCount(), 0);
            Assert.assertFalse(
                expenses.hasExpenseTitled("Private expense")
            );
        } finally {
            ApiClient.cleanupUserData(other);
        }
    }
}
