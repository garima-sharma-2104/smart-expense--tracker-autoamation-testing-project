package tests;

import base.BaseTest;
import org.testng.Assert;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;
import pages.DashboardPage;
import pages.SettingsPage;
import pages.SidebarComponent;
import utils.ApiClient;
import utils.MoneyUtil;
import utils.SessionUtil;
import utils.TestData;

/** Monthly budget (spending limit): setting it, validation and the progress shown on the dashboard. */
public class BudgetTests extends BaseTest {
    private ApiClient.Session user;

    @BeforeMethod(alwaysRun = true)
    public void seedUser() {
        user = ApiClient.registerUser("BudgetUser");
    }

    @AfterMethod(alwaysRun = true)
    public void cleanup() {
        if (user != null) {
            ApiClient.cleanupUserData(user);
        }
    }

    @Test(description = "TC-BUD-01 Set a monthly budget and see it on the dashboard")
    public void setBudgetShowsOnDashboard() {
        SessionUtil.loginAs(driver, user, "/settings");
        SettingsPage settings = new SettingsPage(driver);
        settings.setBudget("5000");
        settings.waitForToast("success", "Budget updated successfully!");
        new SidebarComponent(driver).navigateTo("dashboard");
        DashboardPage dashboard = new DashboardPage(driver).waitLoaded();
        Assert.assertTrue(dashboard.isBudgetCardShown());
        Assert.assertTrue(MoneyUtil.equal(dashboard.budgetAmount(), 5000));
    }

    @Test(description = "TC-BUD-02 Budget progress equals current-month spending / budget")
    public void budgetProgressMatchesSpending() {
        ApiClient.setBudget(user, 5000);
        ApiClient.createExpense(user, "Groceries", 1000, "Food", TestData.midMonthDate());
        SessionUtil.loginAs(driver, user, "/dashboard");
        DashboardPage dashboard = new DashboardPage(driver).waitLoaded();
        Assert.assertTrue(dashboard.isBudgetCardShown());
        Assert.assertEquals(dashboard.budgetPercentUsed(), 20.0, 0.1);
    }

    @Test(description = "TC-BUD-03 Progress is capped at 100% when spending exceeds the budget")
    public void budgetProgressIsCapped() {
        ApiClient.setBudget(user, 1000);
        ApiClient.createExpense(user, "Big purchase", 1500, "Shopping", TestData.midMonthDate());
        SessionUtil.loginAs(driver, user, "/dashboard");
        DashboardPage dashboard = new DashboardPage(driver).waitLoaded();
        Assert.assertEquals(dashboard.budgetPercentUsed(), 100.0, 0.1);
    }

    @Test(description = "TC-BUD-04 Negative budget is rejected by the form")
    public void negativeBudgetIsRejected() {
        SessionUtil.loginAs(driver, user, "/settings");
        SettingsPage settings = new SettingsPage(driver).open();
        settings.setBudget("-100");
        Assert.assertFalse(settings.isBudgetInputValid(), "negative budget must violate min=0");
        Assert.assertEquals(settings.currentPath(), "/settings");
    }

    @Test(description = "TC-BUD-05 Budget of 0 disables the budget card")
    public void zeroBudgetHidesBudgetCard() {
        ApiClient.setBudget(user, 3000);
        SessionUtil.loginAs(driver, user, "/settings");
        SettingsPage settings = new SettingsPage(driver);
        settings.setBudget("0");
        settings.waitForToast("success", "Budget updated successfully!");
        new SidebarComponent(driver).navigateTo("dashboard");
        DashboardPage dashboard = new DashboardPage(driver).waitLoaded();
        Assert.assertFalse(dashboard.isBudgetCardShown());
    }

    @Test(description = "TC-BUD-06 Saved budget persists after refresh")
    public void budgetPersistsAfterRefresh() {
        SessionUtil.loginAs(driver, user, "/settings");
        SettingsPage settings = new SettingsPage(driver);
        settings.setBudget("7500");
        settings.waitForToast("success", "Budget updated successfully!");
        driver.navigate().refresh();
        settings.open();
        Assert.assertEquals(settings.budgetValue(), "7500");
    }
}
