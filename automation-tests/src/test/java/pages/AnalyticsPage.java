package pages;

import java.math.BigDecimal;
import org.openqa.selenium.WebDriver;
import utils.MoneyUtil;

public class AnalyticsPage extends BasePage {
    public AnalyticsPage(WebDriver driver) {
        super(driver);
    }

    public AnalyticsPage open() {
        open("/analytics");
        visible(tid("analytics-current-month"));
        return this;
    }

    public BigDecimal currentMonthTotal() {
        return MoneyUtil.parse(text(tid("analytics-current-month")));
    }

    public BigDecimal previousMonthTotal() {
        return MoneyUtil.parse(text(tid("analytics-prev-month")));
    }

    public String topCategory() {
        return text(tid("analytics-top-category"));
    }

    public BigDecimal topCategoryAmount() {
        return MoneyUtil.parse(text(tid("analytics-top-category-amount")));
    }
}
