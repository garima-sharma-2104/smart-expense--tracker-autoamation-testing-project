package tests;

import base.BaseTest;
import config.TestConfig;
import org.openqa.selenium.JavascriptExecutor;
import org.testng.Assert;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.DataProvider;
import org.testng.annotations.Test;
import pages.LoginPage;
import pages.SidebarComponent;
import pages.SignupPage;
import utils.ApiClient;
import utils.SessionUtil;
import utils.TestData;

/** Registration, login, logout and protected-route behaviour. */
public class AuthTests extends BaseTest {
    private ApiClient.Session user;

    @BeforeMethod(alwaysRun = true)
    public void seedUser() {
        user = ApiClient.registerUser("AuthUser");
    }

    @AfterMethod(alwaysRun = true)
    public void cleanup() {
        if (user != null) {
            ApiClient.cleanupUserData(user);
        }
    }

    @Test(description = "TC-AUTH-01 Login with valid credentials")
    public void validLoginRedirectsToExpenses() {
        LoginPage login = new LoginPage(driver).open();
        login.loginAs(user.email, TestConfig.testPassword());
        login.waitForExactPath("/expenses");
        SidebarComponent sidebar = new SidebarComponent(driver);
        Assert.assertEquals(sidebar.userName(), user.name);
        Assert.assertEquals(sidebar.userEmail(), user.email);
    }

    @Test(description = "TC-AUTH-02 Login with wrong password shows an error")
    public void wrongPasswordShowsError() {
        LoginPage login = new LoginPage(driver).open();
        login.loginAs(user.email, "Wrong-Password-1");
        Assert.assertEquals(login.errorMessage(), "Invalid email or password");
        Assert.assertEquals(login.currentPath(), "/login");
    }

    @Test(description = "TC-AUTH-03 Login with unknown e-mail shows the same generic error")
    public void unknownEmailShowsError() {
        LoginPage login = new LoginPage(driver).open();
        login.loginAs(TestData.uniqueEmail("nobody"), TestConfig.testPassword());
        Assert.assertEquals(login.errorMessage(), "Invalid email or password");
        Assert.assertEquals(login.currentPath(), "/login");
    }

    @Test(description = "TC-AUTH-04 Empty login form is blocked by required-field validation")
    public void emptyLoginFormIsBlocked() {
        LoginPage login = new LoginPage(driver).open();
        login.submit();
        Assert.assertFalse(login.isEmailValid(), "empty e-mail should be invalid");
        Assert.assertFalse(login.isPasswordValid(), "empty password should be invalid");
        Assert.assertEquals(login.currentPath(), "/login");
    }

    @Test(description = "TC-AUTH-05 Malformed e-mail is rejected by the form")
    public void malformedEmailIsRejected() {
        LoginPage login = new LoginPage(driver).open();
        login.enterCredentials("not-an-email", "whatever1");
        login.submit();
        Assert.assertFalse(login.isEmailValid(), "'not-an-email' should be invalid for type=email");
        Assert.assertEquals(login.currentPath(), "/login");
    }

    @Test(description = "TC-AUTH-06 Register a new account through the UI")
    public void registerNewAccount() {
        String name = TestData.uniqueName("NewUser");
        String email = TestData.uniqueEmail("newuser");
        SignupPage signup = new SignupPage(driver).open();
        signup.register(name, email, TestConfig.testPassword());
        signup.waitForExactPath("/expenses");
        Assert.assertEquals(new SidebarComponent(driver).userName(), name);
    }

    @Test(description = "TC-AUTH-07 Registering an e-mail that already exists is rejected")
    public void duplicateRegistrationIsRejected() {
        SignupPage signup = new SignupPage(driver).open();
        signup.register("Duplicate Person", user.email, TestConfig.testPassword());
        Assert.assertEquals(signup.errorMessage(), "User already exists with this email");
        Assert.assertEquals(signup.currentPath(), "/signup");
    }

    @Test(description = "TC-AUTH-08 Password confirmation mismatch is reported")
    public void passwordMismatchIsReported() {
        SignupPage signup = new SignupPage(driver).open();
        signup.fill("Mismatch User", TestData.uniqueEmail("mismatch"), "Password-1", "Password-2");
        signup.submit();
        Assert.assertEquals(signup.errorMessage(), "Passwords do not match");
    }

    @Test(description = "TC-AUTH-09 Password shorter than 6 characters is rejected")
    public void shortPasswordIsRejected() {
        SignupPage signup = new SignupPage(driver).open();
        signup.fill("Short Pw", TestData.uniqueEmail("shortpw"), "123", "123");
        signup.submit();
        Assert.assertFalse(signup.isPasswordValid(), "3-character password should violate minLength");
        Assert.assertEquals(signup.currentPath(), "/signup");
    }

    @Test(description = "TC-AUTH-10 Logout clears the session and redirects to login")
    public void logoutClearsSession() {
        SessionUtil.loginAs(driver, user, "/expenses");
        SidebarComponent sidebar = new SidebarComponent(driver);
        Assert.assertTrue(sidebar.isDisplayed());
        sidebar.logout();
        sidebar.waitForExactPath("/login");
        Object stored = ((JavascriptExecutor) driver).executeScript("return window.localStorage.getItem('userInfo');");
        Assert.assertNull(stored, "userInfo must be removed from localStorage on logout");
    }

    @DataProvider(name = "protectedPaths")
    public Object[][] protectedPaths() {
        return new Object[][] {
            {"/dashboard"}, {"/expenses"}, {"/add"}, {"/income"}, {"/analytics"}, {"/groups"}, {"/settings"}
        };
    }

    @Test(dataProvider = "protectedPaths", description = "TC-AUTH-11 Protected pages redirect anonymous visitors to login")
    public void protectedPagesRedirectToLogin(String path) {
        driver.get(TestConfig.baseUrl() + path);
        new LoginPage(driver).waitForExactPath("/login");
    }

    @Test(description = "TC-AUTH-12 Session survives a page refresh")
    public void sessionSurvivesRefresh() {
        LoginPage login = new LoginPage(driver).open();
        login.loginAs(user.email, TestConfig.testPassword());
        login.waitForExactPath("/expenses");
        driver.navigate().refresh();
        SidebarComponent sidebar = new SidebarComponent(driver);
        Assert.assertEquals(sidebar.userName(), user.name);
        Assert.assertEquals(login.currentPath(), "/expenses");
    }

    @Test(description = "TC-AUTH-13 An invalid/expired token is rejected by the API and the user is sent to login")
    public void invalidTokenForcesLogin() {
        driver.get(TestConfig.baseUrl() + "/login");
        ((JavascriptExecutor) driver).executeScript(
                "window.localStorage.setItem('userInfo', JSON.stringify({_id:'x', name:'Fake', email:'fake@selenium.test', token:'not.a.valid.jwt'}));");
        driver.get(TestConfig.baseUrl() + "/expenses");
        new LoginPage(driver).waitForExactPath("/login");
    }
}
