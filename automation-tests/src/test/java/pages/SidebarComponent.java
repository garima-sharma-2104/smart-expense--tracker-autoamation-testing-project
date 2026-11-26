package pages;

import org.openqa.selenium.WebDriver;

/** Left navigation shown on every authenticated page. */
public class SidebarComponent extends BasePage {
    public SidebarComponent(WebDriver driver) {
        super(driver);
    }

    public boolean isDisplayed() {
        return visible(tid("sidebar")).isDisplayed();
    }

    public String userName() {
        return text(tid("sidebar-user-name"));
    }

    public String userEmail() {
        return text(tid("sidebar-user-email"));
    }

    /** key: dashboard, groups, analytics, expenses, income, settings */
    public void navigateTo(String key) {
        click(tid("nav-" + key));
    }

    public void logout() {
        click(tid("logout-button"));
    }
}
