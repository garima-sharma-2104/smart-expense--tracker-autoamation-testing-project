package tests;

import base.BaseTest;
import org.testng.Assert;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;
import pages.IncomePage;
import utils.ApiClient;
import utils.MoneyUtil;
import utils.SessionUtil;
import utils.TestData;

/** Income creation, validation and deletion. */
public class IncomeTests extends BaseTest {
    private ApiClient.Session user;

    @BeforeMethod(alwaysRun = true)
    public void seedUser() {
        user = ApiClient.registerUser("IncUser");
    }

    @AfterMethod(alwaysRun = true)
    public void cleanup() {
        if (user != null) {
            ApiClient.cleanupUserData(user);
        }
    }

    private IncomePage openIncome() {
        SessionUtil.loginAs(driver, user, "/income");
        return new IncomePage(driver).open();
    }

    @Test(description = "TC-INC-01 Add an income entry")
    public void addIncome() {
        IncomePage income = openIncome();
        income.fill("Freelance gig", "2500.50", "Freelance", TestData.midMonthDate());
        income.submit();
        income.waitForSource("Freelance gig");
        Assert.assertTrue(MoneyUtil.equal(income.amountOf("Freelance gig"), 2500.50));
        Assert.assertTrue(income.summaryText().contains("1 source"), income.summaryText());
        Assert.assertFalse(income.isFormOpen(), "form closes after a successful save");
    }

    @Test(description = "TC-INC-02 Missing amount is blocked by the form")
    public void missingAmountIsBlocked() {
        IncomePage income = openIncome();
        income.fill("No amount", "", "Salary", null);
        income.submit();
        Assert.assertFalse(income.isAmountValid());
        Assert.assertEquals(income.cardCount(), 0);
        Assert.assertTrue(income.isFormOpen());
    }

    @Test(description = "TC-INC-03 Negative amount is blocked by the form")
    public void negativeAmountIsBlocked() {
        IncomePage income = openIncome();
        income.fill("Negative", "-10", "Salary", null);
        income.submit();
        Assert.assertFalse(income.isAmountValid());
        Assert.assertEquals(income.cardCount(), 0);
    }

    @Test(description = "TC-INC-04 Zero amount is rejected by the server and the message is shown")
    public void zeroAmountIsRejectedByServer() {
        IncomePage income = openIncome();
        income.fill("Zero income", "0", "Salary", null);
        income.submit();
        Assert.assertTrue(income.errorMessage().contains("greater than 0"), income.errorMessage());
        Assert.assertEquals(income.cardCount(), 0);
    }

    @Test(description = "TC-INC-05 Delete an income entry after confirming")
    public void deleteIncome() {
        ApiClient.createIncome(user, "Bonus", 1000, "Salary", TestData.midMonthDate());
        ApiClient.createIncome(user, "Gift", 500, "Gift", TestData.midMonthDate());
        IncomePage income = openIncome();
        income.waitForSource("Bonus");
        income.delete("Bonus", true);
        income.waitForNoSource("Bonus");
        Assert.assertEquals(income.cardCount(), 1);
        Assert.assertTrue(income.sources().get(0).contains("Gift"));
    }

    @Test(description = "TC-INC-06 Empty state for a new user")
    public void emptyState() {
        IncomePage income = openIncome();
        Assert.assertTrue(income.isEmptyStateShown());
    }

    @Test(description = "TC-INC-07 Income total matches the seeded entries")
    public void incomeTotal() {
        ApiClient.createIncome(user, "Salary", 1000, "Salary", TestData.midMonthDate());
        ApiClient.createIncome(user, "Side job", 2000.25, "Freelance", TestData.midMonthDate());
        IncomePage income = openIncome();
        income.waitForSource("Side job");
        Assert.assertTrue(income.summaryText().contains("2 sources"), income.summaryText());
        Assert.assertTrue(income.summaryText().contains("3000.25"), income.summaryText());
    }
}
