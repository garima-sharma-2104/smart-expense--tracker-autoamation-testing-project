package utils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.testng.Reporter;

/** Saves a screenshot, the page source and the URL for a failed test under target/. */
public final class ScreenshotUtil {
    private static final Path SHOT_DIR = Paths.get("target", "screenshots");
    private static final Path DIAG_DIR = Paths.get("target", "diagnostics");

    private ScreenshotUtil() { }

    public static void captureFailure(WebDriver driver, String testName) {
        String stamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String base = testName.replaceAll("[^A-Za-z0-9_.-]", "_") + "_" + stamp;
        try {
            Files.createDirectories(SHOT_DIR);
            Files.createDirectories(DIAG_DIR);

            byte[] png = ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES);
            Path shot = SHOT_DIR.resolve(base + ".png");
            Files.write(shot, png);

            String diagnostics = "URL: " + driver.getCurrentUrl() + System.lineSeparator()
                    + "Title: " + driver.getTitle() + System.lineSeparator() + System.lineSeparator()
                    + driver.getPageSource();
            Files.write(DIAG_DIR.resolve(base + ".html.txt"), diagnostics.getBytes(StandardCharsets.UTF_8));

            Reporter.log("Failure screenshot: " + shot.toAbsolutePath(), true);
        } catch (IOException | RuntimeException e) {
            Reporter.log("Could not capture failure diagnostics: " + e.getMessage(), true);
        }
    }
}
