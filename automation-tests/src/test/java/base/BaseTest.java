package base;

import org.openqa.selenium.WebDriver;
import org.testng.ITestResult;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import utils.ScreenshotUtil;

/** Starts a fresh browser per test and captures diagnostics when a test fails. */
public abstract class BaseTest {
    protected WebDriver driver;

    @BeforeMethod(alwaysRun = true)
    public void setUp() {
        driver = DriverFactory.create();
    }

    @AfterMethod(alwaysRun = true)
    public void tearDown(ITestResult result) {
        try {
            if (driver != null && result.getStatus() == ITestResult.FAILURE) {
                String name = result.getTestClass().getRealClass().getSimpleName() + "_" + result.getMethod().getMethodName();
                ScreenshotUtil.captureFailure(driver, name);
            }
        } finally {
            if (driver != null) {
                driver.quit();
                driver = null;
            }
        }
    }
}
