package pages;

import java.util.List;
import java.util.stream.Collectors;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class GroupsPage extends BasePage {
    public GroupsPage(WebDriver driver) {
        super(driver);
    }

    public GroupsPage open() {
        open("/groups");
        visible(tid("new-group-button")); // header is rendered once loading has finished
        return this;
    }

    public void createGroup(String name) {
        if (!isPresent(tid("group-form"))) {
            click(tid("new-group-button"));
            visible(tid("group-form"));
        }
        type(tid("group-name-input"), name);
        click(tid("group-create-submit"));
    }

    public boolean isEmptyStateShown() {
        return isPresent(tid("groups-empty"));
    }

    private List<WebElement> cards() {
        return driver.findElements(tid("group-card"));
    }

    public List<String> groupNames() {
        return cards().stream().map(c -> c.findElement(tid("group-card-name")).getText()).collect(Collectors.toList());
    }

    public void waitForGroup(String name) {
        wait.until(d -> groupNames().stream().anyMatch(n -> n.equals(name)));
    }

    public String memberBadgeOf(String name) {
        return cards().stream()
                .filter(c -> c.findElement(tid("group-card-name")).getText().equals(name))
                .findFirst().orElseThrow(() -> new IllegalStateException("No group " + name))
                .findElement(tid("group-card-members")).getText();
    }

    public void openGroup(String name) {
        cards().stream()
                .filter(c -> c.findElement(tid("group-card-name")).getText().equals(name))
                .findFirst().orElseThrow(() -> new IllegalStateException("No group " + name))
                .findElement(tid("group-card-link")).click();
    }
}
