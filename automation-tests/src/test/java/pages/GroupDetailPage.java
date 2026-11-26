package pages;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;

import utils.MoneyUtil;

/** SplitSphere group dashboard (/groups/:id). */
public class GroupDetailPage extends BasePage {

    public GroupDetailPage(WebDriver driver) {
        super(driver);
    }

    public GroupDetailPage openById(String groupId) {
        open("/groups/" + groupId);
        return this;
    }

    public GroupDetailPage waitLoaded() {
        visible(tid("group-title"));
        return this;
    }

    public String title() {
        return text(tid("group-title"));
    }

    public boolean isNotFoundShown() {
        wait.until(d ->
                isPresent(tid("group-not-found")) ||
                isPresent(tid("group-title"))
        );

        return isPresent(tid("group-not-found"));
    }

    /**
     * Adds a member to the current group.
     * Uses explicit waits and scrolling to avoid click interception.
     */
    public void addMember(String email) {

        // Wait until the email input is visible.
        WebElement emailInput = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        tid("member-email-input")
                )
        );

        // Scroll the input into the center of the viewport.
        ((JavascriptExecutor) driver).executeScript(
                "arguments[0].scrollIntoView({block: 'center', inline: 'nearest'});",
                emailInput
        );

        // Re-fetch the element after scrolling in case the page re-rendered.
        emailInput = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        tid("member-email-input")
                )
        );

        // Type directly instead of calling BasePage.type(),
        // which previously caused ElementClickInterceptedException.
        emailInput.clear();
        emailInput.sendKeys(email);

        // Wait until the Add Member button is clickable.
        WebElement addButton = wait.until(
                ExpectedConditions.elementToBeClickable(
                        tid("add-member-button")
                )
        );

        // Scroll the button into view before clicking.
        ((JavascriptExecutor) driver).executeScript(
                "arguments[0].scrollIntoView({block: 'center', inline: 'nearest'});",
                addButton
        );

        // Re-fetch and click after the scroll.
        addButton = wait.until(
                ExpectedConditions.elementToBeClickable(
                        tid("add-member-button")
                )
        );

        addButton.click();
    }

    public List<String> memberNames() {
        return driver.findElements(tid("member-badge"))
                .stream()
                .map(WebElement::getText)
                .collect(Collectors.toList());
    }

    public void waitForMemberCount(int n) {
        wait.until(d -> memberNames().size() == n);
    }

    public void addSharedExpense(String title, String amount) {
        type(tid("group-expense-title"), title);
        type(tid("group-expense-amount"), amount);
        click(tid("group-expense-submit"));
    }

    public BigDecimal totalGroupSpend() {
        return MoneyUtil.parse(text(tid("group-total-spend")));
    }

    public void waitForTotalGroupSpend(double expected) {
        wait.until(d -> {
            try {
                return MoneyUtil.equal(totalGroupSpend(), expected);
            } catch (RuntimeException e) {
                return false;
            }
        });
    }

    public boolean isAllSettledShown() {
        return isPresent(tid("settlement-empty"));
    }

    public List<String> settlementTexts() {
        return driver.findElements(tid("settlement-item"))
                .stream()
                .map(WebElement::getText)
                .collect(Collectors.toList());
    }

    public void waitForSettlementCount(int n) {
        wait.until(d -> settlementTexts().size() == n);
    }

    public List<String> sharedExpenseTitles() {
        return driver.findElements(tid("group-expense-item-title"))
                .stream()
                .map(WebElement::getText)
                .collect(Collectors.toList());
    }

    public void waitForSharedExpense(String title) {
        wait.until(d -> sharedExpenseTitles().contains(title));
    }
}