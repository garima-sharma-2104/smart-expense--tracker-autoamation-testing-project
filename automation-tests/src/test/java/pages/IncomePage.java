package pages;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import utils.MoneyUtil;
import org.openqa.selenium.StaleElementReferenceException;

public class IncomePage extends BasePage {
    public IncomePage(WebDriver driver) {
        super(driver);
    }

    public IncomePage open() {
        open("/income");
        visible(tid("income-toggle-form")); // page header is rendered after loading finishes
        return this;
    }

    public void openForm() {
        if (!isPresent(tid("income-form"))) {
            click(tid("income-toggle-form"));
            visible(tid("income-form"));
        }
    }

    public void fill(String source, String amount, String category, String isoDate) {
        openForm();
        type(tid("income-source"), source);
        type(tid("income-amount"), amount);
        if (category != null) {
            selectByText(tid("income-category"), category);
        }
        if (isoDate != null) {
            setValueByScript(tid("income-date"), isoDate);
        }
    }

    public void submit() {
        click(tid("income-submit"));
    }

    public String errorMessage() {

        return text(tid("income-error"));
    }

    public boolean isAmountValid() {
        return isFieldValid(tid("income-amount"));
    }

    public boolean isFormOpen() {
        return isPresent(tid("income-form"));
    }

    private List<WebElement> cards() {
        return driver.findElements(tid("income-card"));
    }

    public int cardCount() {
        return cards().size();
    }

    public List<String> sources() {
    List<String> result = new java.util.ArrayList<>();

    try {
        // Always fetch fresh card elements
        List<WebElement> freshCards = driver.findElements(tid("income-card"));

        for (WebElement card : freshCards) {
            result.add(
                card.findElement(tid("income-card-source")).getText()
            );
        }

    } catch (StaleElementReferenceException e) {
        // UI refreshed while reading. Let the next wait poll retry.
        throw e;
    }

    return result;
}

public void waitForSource(String source) {
    wait.until(d -> {
        try {
            return sources().stream().anyMatch(s -> s.contains(source));
        } catch (StaleElementReferenceException e) {
            return false;
        }
    });
}

public void waitForNoSource(String source) {
    wait.until(d -> {
        try {
            return sources().stream().noneMatch(s -> s.contains(source));
        } catch (StaleElementReferenceException e) {
            return false;
        }
    });
}

    public BigDecimal amountOf(String source) {
        WebElement card = cards().stream()
                .filter(c -> c.findElement(tid("income-card-source")).getText().contains(source))
                .findFirst().orElseThrow(() -> new IllegalStateException("No income '" + source + "'"));
        return MoneyUtil.parse(card.findElement(tid("income-card-amount")).getText());
    }

    public String summaryText() {
        return text(tid("income-summary"));
    }

    public void delete(String source, boolean confirm) {
    wait.until(d -> {
        for (WebElement card : d.findElements(tid("income-card"))) {
            try {
                String cardSource =
                        card.findElement(tid("income-card-source")).getText();

                if (cardSource.contains(source)) {
                    WebElement deleteButton =
                            card.findElement(tid("income-delete-button"));

                    if (deleteButton.isDisplayed() && deleteButton.isEnabled()) {
                        deleteButton.click();
                        return true;
                    }
                }
            } catch (StaleElementReferenceException e) {
                // The page changed; retry with fresh elements.
            }
        }

        return false;
    });

    answerConfirm(confirm);
}

    public boolean isEmptyStateShown() {
        return isPresent(tid("income-empty"));
    }
}
