package pages;

import java.math.BigDecimal;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.openqa.selenium.By;
import org.openqa.selenium.StaleElementReferenceException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import utils.MoneyUtil;

public class ExpensesPage extends BasePage {
    private static final Pattern COUNT = Pattern.compile("(\\d+) expenses?");
    private static final Pattern TOTAL = Pattern.compile("Total: (₹[0-9.,]+)");

    public ExpensesPage(WebDriver driver) {
        super(driver);
    }

    public ExpensesPage open() {
        open("/expenses");
        return waitLoaded();
    }

    /** Waits until the list has finished loading (summary no longer says "Loading"). */
    public ExpensesPage waitLoaded() {
        wait.until(d -> {
            List<WebElement> s = d.findElements(tid("expenses-summary"));
            return !s.isEmpty() && !s.get(0).getText().contains("Loading");
        });
        return this;
    }

    public String summaryText() {
        return text(tid("expenses-summary"));
    }

    public int summaryCount() {
        Matcher m = COUNT.matcher(summaryText());
        if (!m.find()) {
            throw new IllegalStateException("No expense count in summary: " + summaryText());
        }
        return Integer.parseInt(m.group(1));
    }

    public BigDecimal summaryTotal() {
        Matcher m = TOTAL.matcher(summaryText());
        if (!m.find()) {
            throw new IllegalStateException("No total in summary: " + summaryText());
        }
        return MoneyUtil.parse(m.group(1));
    }

    public List<WebElement> cards() {
        return driver.findElements(tid("expense-card"));
    }

    public int cardCount() {
        return cards().size();
    }

    public List<String> titles() {
        return cards().stream()
                .map(c -> c.findElement(tid("expense-card-title")).getText())
                .collect(Collectors.toList());
    }

    public boolean hasExpenseTitled(String title) {
        try {
            return titles().stream().anyMatch(t -> t.contains(title));
        } catch (StaleElementReferenceException e) {
            return false;
        }
    }

    /** Polls until the list shows exactly n cards and has finished loading. */
    public void waitForCardCount(int n) {
        wait.until(d -> {
            try {
                return !summaryText().contains("Loading") && cardCount() == n;
            } catch (RuntimeException e) {
                return false;
            }
        });
    }

    public void waitForExpenseTitled(String title) {
        wait.until(d -> hasExpenseTitled(title));
    }

    public void waitForNoExpenseTitled(String title) {
        wait.until(d -> !hasExpenseTitled(title));
    }

    private WebElement cardFor(String title) {
        return cards().stream()
                .filter(c -> c.findElement(tid("expense-card-title")).getText().contains(title))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No expense card titled '" + title + "'"));
    }

    public BigDecimal amountOf(String title) {
        return MoneyUtil.parse(cardFor(title).findElement(tid("expense-card-amount")).getText());
    }

    public String categoryOf(String title) {
        return cardFor(title).findElement(tid("expense-card-category")).getText();
    }

    public void clickAddExpense() {
        click(tid("add-expense-link"));
    }

    public void clickEdit(String title) {
        cardFor(title).findElement(tid("expense-edit-link")).click();
    }

    /** Clicks Delete and answers the native confirm dialog. */
    public void delete(String title, boolean confirm) {
        cardFor(title).findElement(tid("expense-delete-button")).click();
        answerConfirm(confirm);
    }

    public boolean isEmptyStateShown() {
        return isPresent(tid("expenses-empty"));
    }

    // ---- filters ----
    public void openFilters() {
        if (!isPresent(tid("filter-category"))) {
            click(tid("filter-toggle"));
            visible(tid("filter-category"));
        }
    }

    public void filterByCategory(String category) {
        openFilters();
        selectByText(tid("filter-category"), category);
    }

    public void filterFromDate(String isoDate) {
        openFilters();
        setValueByScript(tid("filter-start-date"), isoDate);
    }

    public void filterToDate(String isoDate) {
        openFilters();
        setValueByScript(tid("filter-end-date"), isoDate);
    }

    public void filterMinAmount(String value) {
        openFilters();
        type(tid("filter-min-amount"), value);
    }

    public void filterMaxAmount(String value) {
        openFilters();
        type(tid("filter-max-amount"), value);
    }

    public void search(String text) {
        type(tid("expense-search"), text);
    }

    public void clearFilters() {
        openFilters();
        click(tid("clear-filters"));
    }
}
