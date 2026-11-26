package pages;

import java.math.BigDecimal;
import org.openqa.selenium.WebDriver;
import utils.MoneyUtil;

public class DashboardPage extends BasePage {
    public DashboardPage(WebDriver driver) {
        super(driver);
    }

    public DashboardPage open() {
        open("/dashboard");
        return waitLoaded();
    }

    /** Dashboard shows skeletons until data arrives; the balance card appears when loaded. */
    public DashboardPage waitLoaded() {
        visible(tid("balance-net"));
        return this;
    }

    public BigDecimal netBalance() {
        return MoneyUtil.parse(text(tid("balance-net")));
    }

    public BigDecimal heroIncome() {
        return MoneyUtil.parse(text(tid("balance-income")));
    }

    public BigDecimal heroExpenses() {
        return MoneyUtil.parse(text(tid("balance-expenses")));
    }

    public BigDecimal totalIncome() {
        return MoneyUtil.parse(text(tid("stat-total-income")));
    }

    public BigDecimal totalExpenses() {
        return MoneyUtil.parse(text(tid("stat-total-expenses")));
    }

    public int transactionCount() {
        return Integer.parseInt(text(tid("stat-transactions")));
    }

    public String savingsRateText() {
        return text(tid("stat-savings-rate"));
    }

    public boolean isBudgetCardShown() {
        return isPresent(tid("budget-card"));
    }

    public BigDecimal budgetAmount() {
        return MoneyUtil.parse(text(tid("budget-amount")));
    }

    /** Percentage used (0-100) exposed by the progress bar via data-percent. */
    public double budgetPercentUsed() {
        return Double.parseDouble(visible(tid("budget-progress-bar")).getAttribute("data-percent"));
    }

    public boolean areChartsDisplayed() {
        return visible(tid("monthly-bar-chart")).isDisplayed()
                && !driver.findElements(org.openqa.selenium.By.cssSelector("[data-testid='monthly-bar-chart'] canvas")).isEmpty();
    }

    public boolean isRecentTableShown() {
        return isPresent(tid("recent-transactions-table"));
    }

    public String recentTableText() {
        return text(tid("recent-transactions-table"));
    }
}
