package pages;

import org.openqa.selenium.WebDriver;

public class EditExpensePage extends BasePage {
    public EditExpensePage(WebDriver driver) {
        super(driver);
    }

    /** Waits until the form is shown and pre-filled with the existing expense. */
    public EditExpensePage waitLoaded() {
        visible(tid("edit-expense-form"));
        wait.until(d -> !d.findElement(tid("edit-expense-title")).getAttribute("value").isEmpty());
        return this;
    }

    public String title() {
        return visible(tid("edit-expense-title")).getAttribute("value");
    }

    public String amount() {
        return visible(tid("edit-expense-amount")).getAttribute("value");
    }

    public void setTitle(String title) {
        type(tid("edit-expense-title"), title);
    }

    public void setAmount(String amount) {
        type(tid("edit-expense-amount"), amount);
    }

    public void setCategory(String category) {
        selectByText(tid("edit-expense-category"), category);
    }

    public void save() {
        click(tid("edit-expense-submit"));
    }
}
