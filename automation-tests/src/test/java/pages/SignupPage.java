package pages;

import org.openqa.selenium.WebDriver;

public class SignupPage extends BasePage {
    public SignupPage(WebDriver driver) {
        super(driver);
    }

    public SignupPage open() {
        open("/signup");
        visible(tid("signup-form"));
        return this;
    }

    public void fill(String name, String email, String password, String confirmPassword) {
        type(tid("signup-name"), name);
        type(tid("signup-email"), email);
        type(tid("signup-password"), password);
        type(tid("signup-confirm-password"), confirmPassword);
    }

    public void submit() {
        click(tid("signup-submit"));
    }

    public void register(String name, String email, String password) {
        fill(name, email, password, password);
        submit();
    }

    public String errorMessage() {
        return text(tid("signup-error"));
    }

    public boolean isPasswordValid() {
        return isFieldValid(tid("signup-password"));
    }
}
