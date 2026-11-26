package base;

import config.TestConfig;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.edge.EdgeDriver;
import org.openqa.selenium.edge.EdgeOptions;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;

/** Creates a WebDriver. Selenium Manager (built into Selenium 4.6+) resolves the driver binary. */
public final class DriverFactory {
    private DriverFactory() { }

    public static WebDriver create() {
        boolean headless = TestConfig.headless();
        switch (TestConfig.browser()) {
            case "firefox": {
                FirefoxOptions options = new FirefoxOptions();
                if (headless) {
                    options.addArguments("-headless");
                }
                options.addArguments("--width=1440", "--height=900");
                return new FirefoxDriver(options);
            }
            case "edge": {
                EdgeOptions options = new EdgeOptions();
                if (headless) {
                    options.addArguments("--headless=new");
                }
                options.addArguments("--window-size=1440,900");
                return new EdgeDriver(options);
            }
            case "chrome":
            default: {
                ChromeOptions options = new ChromeOptions();
                if (headless) {
                    options.addArguments("--headless=new");
                }
                options.addArguments("--window-size=1440,900", "--disable-gpu");
                return new ChromeDriver(options);
            }
        }
    }
}
