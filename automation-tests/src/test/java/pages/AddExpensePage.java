package pages;

import org.openqa.selenium.WebDriver;

public class AddExpensePage extends BasePage {
    public AddExpensePage(WebDriver driver) {
        super(driver);
    }

    public AddExpensePage open() {
        open("/add");
        visible(tid("expense-form"));
        return this;
    }

    public void fill(String title, String amount, String category, String isoDate) {
        type(tid("expense-title"), title);
        type(tid("expense-amount"), amount);
        if (category != null) {
            selectByText(tid("expense-category"), category);
        }
        if (isoDate != null) {
            setValueByScript(tid("expense-date"), isoDate);
        }
    }

    public void submit() {
        click(tid("expense-submit"));
    }

    public boolean isTitleValid() {
        return isFieldValid(tid("expense-title"));
    }

    public boolean isAmountValid() {
        return isFieldValid(tid("expense-amount"));
    }

    public String amountValidationMessage() {
        return validationMessage(tid("expense-amount"));
    }
}
