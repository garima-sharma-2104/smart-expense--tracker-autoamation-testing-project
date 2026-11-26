package pages;

import org.openqa.selenium.WebDriver;

public class SettingsPage extends BasePage {
    public SettingsPage(WebDriver driver) {
        super(driver);
    }

    public SettingsPage open() {
        open("/settings");
        visible(tid("budget-form"));
        return this;
    }

    public void setBudget(String amount) {
        type(tid("budget-input"), amount);
        click(tid("budget-submit"));
    }

    public void enterBudgetWithoutSaving(String amount) {
        type(tid("budget-input"), amount);
    }

    public boolean isBudgetInputValid() {
        return isFieldValid(tid("budget-input"));
    }

    public String budgetValue() {
        return visible(tid("budget-input")).getAttribute("value");
    }
}
