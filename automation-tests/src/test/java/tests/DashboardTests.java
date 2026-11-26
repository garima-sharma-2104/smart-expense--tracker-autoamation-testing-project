package tests;

import base.BaseTest;
import org.testng.Assert;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.DataProvider;
import org.testng.annotations.Test;
import pages.AnalyticsPage;
import pages.DashboardPage;
import pages.SidebarComponent;
import utils.ApiClient;
import utils.MoneyUtil;
import utils.SessionUtil;
import utils.TestData;

/** Dashboard totals, charts, recent activity, analytics and navigation. */
public class DashboardTests extends BaseTest {
    private ApiClient.Session user;

    @BeforeMethod(alwaysRun = true)
    public void seedUser() {
        user = ApiClient.registerUser("DashUser");
    }

    @AfterMethod(alwaysRun = true)
    public void cleanup() {
        if (user != null) {
            ApiClient.cleanupUserData(user);
        }
    }

    /** Known data set: income 50000; expenses 1200 (Food) + 800 (Transport) = 2000. */
    private void seedKnownData() {
        ApiClient.createIncome(user, "Monthly Salary", 50000, "Salary", TestData.midMonthDate());
        ApiClient.createExpense(user, "Groceries", 1200, "Food", TestData.midMonthDate());
        ApiClient.createExpense(user, "Bus pass", 800, "Transport", TestData.midMonthDate());
    }

    @Test(description = "TC-DASH-01 Dashboard elements load")
    public void dashboardElementsLoad() {
        seedKnownData();
        SessionUtil.loginAs(driver, user, "/dashboard");
        DashboardPage dashboard = new DashboardPage(driver).waitLoaded();
        Assert.assertTrue(new SidebarComponent(driver).isDisplayed());
        Assert.assertTrue(dashboard.areChartsDisplayed(), "monthly bar chart canvas should render");
        Assert.assertTrue(dashboard.isRecentTableShown());
    }

    @Test(description = "TC-DASH-02 Totals agree with the known data set")
    public void totalsMatchKnownData() {
        seedKnownData();
        SessionUtil.loginAs(driver, user, "/dashboard");
        DashboardPage dashboard = new DashboardPage(driver).waitLoaded();
        Assert.assertTrue(MoneyUtil.equal(dashboard.totalIncome(), 50000));
        Assert.assertTrue(MoneyUtil.equal(dashboard.totalExpenses(), 2000));
        Assert.assertTrue(MoneyUtil.equal(dashboard.netBalance(), 48000));
        Assert.assertTrue(MoneyUtil.equal(dashboard.heroIncome(), 50000));
        Assert.assertTrue(MoneyUtil.equal(dashboard.heroExpenses(), 2000));
        Assert.assertEquals(dashboard.transactionCount(), 3);
    }

    @Test(description = "TC-DASH-03 Savings rate = (income - expenses) / income")
    public void savingsRate() {
        seedKnownData();
        SessionUtil.loginAs(driver, user, "/dashboard");
        DashboardPage dashboard = new DashboardPage(driver).waitLoaded();
        Assert.assertEquals(dashboard.savingsRateText(), "96.0%");
    }

    @Test(description = "TC-DASH-04 Recent activity lists the seeded transactions")
    public void recentActivityListsTransactions() {
        seedKnownData();
        SessionUtil.loginAs(driver, user, "/dashboard");
        DashboardPage dashboard = new DashboardPage(driver).waitLoaded();
        String table = dashboard.recentTableText();
        Assert.assertTrue(table.contains("Monthly Salary"), table);
        Assert.assertTrue(table.contains("Groceries"), table);
        Assert.assertTrue(table.contains("Bus pass"), table);
    }

    @Test(description = "TC-DASH-05 A new user sees zero totals and no savings rate")
    public void emptyDashboard() {
        SessionUtil.loginAs(driver, user, "/dashboard");
        DashboardPage dashboard = new DashboardPage(driver).waitLoaded();
        Assert.assertTrue(MoneyUtil.equal(dashboard.totalIncome(), 0));
        Assert.assertTrue(MoneyUtil.equal(dashboard.totalExpenses(), 0));
        Assert.assertEquals(dashboard.transactionCount(), 0);
        Assert.assertFalse(dashboard.savingsRateText().contains("%"), "no income -> no savings percentage");
    }

    @Test(description = "TC-DASH-06 Analytics page shows current/previous month totals and top category")
    public void analyticsMatchKnownData() {
        seedKnownData();
        ApiClient.createExpense(user, "Last month item", 300, "Bills", TestData.previousMonthDate());
        SessionUtil.loginAs(driver, user, "/analytics");
        AnalyticsPage analytics = new AnalyticsPage(driver).open();
        Assert.assertTrue(MoneyUtil.equal(analytics.currentMonthTotal(), 2000));
        Assert.assertTrue(MoneyUtil.equal(analytics.previousMonthTotal(), 300));
        Assert.assertEquals(analytics.topCategory(), "Food");
        Assert.assertTrue(MoneyUtil.equal(analytics.topCategoryAmount(), 1200));
    }

    @DataProvider(name = "navTargets")
    public Object[][] navTargets() {
        return new Object[][] {
            {"expenses", "/expenses"}, {"income", "/income"}, {"analytics", "/analytics"},
            {"groups", "/groups"}, {"settings", "/settings"}, {"dashboard", "/dashboard"}
        };
    }

    @Test(dataProvider = "navTargets", description = "TC-DASH-07 Sidebar navigation reaches every section")
    public void sidebarNavigation(String key, String expectedPath) {
        SessionUtil.loginAs(driver, user, key.equals("dashboard") ? "/settings" : "/dashboard");
        SidebarComponent sidebar = new SidebarComponent(driver);
        Assert.assertTrue(sidebar.isDisplayed());
        sidebar.navigateTo(key);
        sidebar.waitForExactPath(expectedPath);
    }
}
