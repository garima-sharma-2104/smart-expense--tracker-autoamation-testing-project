package utils;

import config.TestConfig;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;

/**
 * Starts an authenticated browser session the same way the app does after a real login:
 * by storing the user info (incl. JWT from the real backend) in localStorage under "userInfo".
 * Authentication is NOT bypassed: the token is issued by the backend and verified on every API call.
 * Login through the UI itself is covered separately in AuthTests.
 */
public final class SessionUtil {
    private SessionUtil() { }

    public static void loginAs(WebDriver driver, ApiClient.Session session, String pathAfterLogin) {
        driver.get(TestConfig.baseUrl() + "/login"); // public page, establishes the origin
        ((JavascriptExecutor) driver).executeScript(
                "window.localStorage.setItem('userInfo', arguments[0]);", session.userInfoJson);
        driver.get(TestConfig.baseUrl() + pathAfterLogin);
    }

    public static void clearSession(WebDriver driver) {
        ((JavascriptExecutor) driver).executeScript("window.localStorage.clear();");
    }
}
