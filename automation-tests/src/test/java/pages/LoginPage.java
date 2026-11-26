package pages;

import org.openqa.selenium.WebDriver;

public class LoginPage extends BasePage {
    public LoginPage(WebDriver driver) {
        super(driver);
    }

    public LoginPage open() {
        open("/login");
        visible(tid("login-form"));
        return this;
    }

    public void enterCredentials(String email, String password) {
        type(tid("login-email"), email);
        type(tid("login-password"), password);
    }

    public void submit() {
        click(tid("login-submit"));
    }

    public void loginAs(String email, String password) {
        enterCredentials(email, password);
        submit();
    }

    public String errorMessage() {
        return text(tid("login-error"));
    }

    public boolean isEmailValid() {
        return isFieldValid(tid("login-email"));
    }

    public boolean isPasswordValid() {
        return isFieldValid(tid("login-password"));
    }

    public String emailValidationMessage() {
        return validationMessage(tid("login-email"));
    }

    public void goToSignup() {
        click(tid("login-signup-link"));
    }
}
