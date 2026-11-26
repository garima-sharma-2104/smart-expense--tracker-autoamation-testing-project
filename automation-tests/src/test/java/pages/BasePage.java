
package pages;

import config.TestConfig;
import java.time.Duration;
import java.util.List;
import org.openqa.selenium.Alert;
import org.openqa.selenium.By;
import org.openqa.selenium.ElementClickInterceptedException;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.Keys;
import org.openqa.selenium.StaleElementReferenceException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

/**
 * Base class of all page objects.
 * Uses explicit waits and stable data-testid locators.
 */
public abstract class BasePage {

    protected final WebDriver driver;
    protected final WebDriverWait wait;

    protected BasePage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(
            driver,
            Duration.ofSeconds(TestConfig.waitSeconds())
        );
    }

    /** Locator for [data-testid='id']. */
    protected static By tid(String id) {
        return By.cssSelector("[data-testid='" + id + "']");
    }

    protected void open(String path) {
        driver.get(TestConfig.baseUrl() + path);
    }

    protected WebElement visible(By by) {
        return wait.until(
            ExpectedConditions.visibilityOfElementLocated(by)
        );
    }

    /**
     * Scrolls the element into the viewport, waits until it is visible
     * and enabled, then performs a real Selenium click.
     * Retries transient stale-element and intercepted-click failures.
     */
    protected void click(By by) {
        for (int attempt = 0; attempt < 3; attempt++) {
            WebElement element = wait.until(
                ExpectedConditions.presenceOfElementLocated(by)
            );

            try {
                ((JavascriptExecutor) driver).executeScript(
                    "arguments[0].scrollIntoView({" +
                    "behavior:'instant'," +
                    "block:'center'," +
                    "inline:'center'" +
                    "});",
                    element
                );

                wait.until(d -> {
                    try {
                        WebElement current = d.findElement(by);

                        if (!current.isDisplayed() ||
                            !current.isEnabled()) {
                            return false;
                        }

                        return Boolean.TRUE.equals(
                            ((JavascriptExecutor) d).executeScript(
                                "const r = arguments[0].getBoundingClientRect();" +
                                "return r.width > 0 && r.height > 0 &&" +
                                "r.top >= 0 && r.bottom <= window.innerHeight &&" +
                                "r.left >= 0 && r.right <= window.innerWidth;",
                                current
                            )
                        );
                    } catch (StaleElementReferenceException e) {
                        return false;
                    }
                });

                element = wait.until(
                    ExpectedConditions.elementToBeClickable(by)
                );

                new Actions(driver)
                    .moveToElement(element)
                    .click()
                    .perform();

                return;

            } catch (StaleElementReferenceException |
                     ElementClickInterceptedException e) {
                if (attempt == 2) {
                    throw e;
                }
            }
        }
    }

    /** Clears a React-controlled input and types the supplied text. */
    protected void type(By by, String text) {
        WebElement element = visible(by);
        element.click();

        CharSequence modifier =
            System.getProperty("os.name", "")
                .toLowerCase()
                .contains("mac")
                ? Keys.COMMAND
                : Keys.CONTROL;

        element.sendKeys(Keys.chord(modifier, "a"));
        element.sendKeys(Keys.BACK_SPACE);

        if (text != null && !text.isEmpty()) {
            element.sendKeys(text);
        }
    }

    /**
     * Sets a value with the native setter and dispatches input/change
     * events so React receives the update.
     */
    protected void setValueByScript(By by, String value) {
        WebElement element = visible(by);

        ((JavascriptExecutor) driver).executeScript(
            "var el = arguments[0];" +
            "var proto = el.tagName === 'SELECT' " +
            "? HTMLSelectElement.prototype " +
            ": el.tagName === 'TEXTAREA' " +
            "? HTMLTextAreaElement.prototype " +
            ": HTMLInputElement.prototype;" +
            "Object.getOwnPropertyDescriptor(proto, 'value')" +
            ".set.call(el, arguments[1]);" +
            "el.dispatchEvent(new Event('input', {bubbles:true}));" +
            "el.dispatchEvent(new Event('change', {bubbles:true}));",
            element,
            value
        );
    }

    protected void selectByText(By by, String visibleText) {
        new Select(visible(by)).selectByVisibleText(visibleText);
    }

    protected String text(By by) {
        return visible(by).getText().trim();
    }

    protected boolean isPresent(By by) {
        return !driver.findElements(by).isEmpty();
    }

    /** Waits until the element disappears, or returns if absent. */
    protected void waitUntilAbsent(By by) {
        wait.until(d -> d.findElements(by).isEmpty());
    }

    public String currentPath() {
        return java.net.URI.create(driver.getCurrentUrl()).getPath();
    }

    public void waitForPath(String pathPart) {
        wait.until(ExpectedConditions.urlContains(pathPart));
    }

    /** Waits until the URL path exactly matches the given path. */
    public void waitForExactPath(String path) {
        wait.until(d ->
            java.net.URI.create(d.getCurrentUrl()).getPath().equals(path)
        );
    }

    /** HTML5 constraint validation: is the field currently valid? */
    protected boolean isFieldValid(By by) {
        return Boolean.TRUE.equals(
            ((JavascriptExecutor) driver).executeScript(
                "return arguments[0].checkValidity();",
                visible(by)
            )
        );
    }

    protected String validationMessage(By by) {
        Object msg = ((JavascriptExecutor) driver).executeScript(
            "return arguments[0].validationMessage;",
            visible(by)
        );

        return msg == null ? "" : msg.toString();
    }

    /** Waits for a toast of the given type containing the specified text. */
    public void waitForToast(String type, String containsText) {
        By toasts = By.cssSelector(".Toastify__toast--" + type);

        wait.until(d -> {
            try {
                List<WebElement> found = d.findElements(toasts);

                for (WebElement toast : found) {
                    if (toast.getText().contains(containsText)) {
                        return true;
                    }
                }

                return false;
            } catch (StaleElementReferenceException e) {
                return false;
            }
        });
    }

    /** Accepts or dismisses a native JavaScript confirmation dialog. */
    protected void answerConfirm(boolean accept) {
        Alert alert = wait.until(
            ExpectedConditions.alertIsPresent()
        );

        if (accept) {
            alert.accept();
        } else {
            alert.dismiss();
        }
    }
}
