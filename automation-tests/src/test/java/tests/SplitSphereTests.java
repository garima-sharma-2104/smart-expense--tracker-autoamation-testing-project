package tests;

import base.BaseTest;
import org.testng.Assert;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;
import pages.GroupDetailPage;
import pages.GroupsPage;
import utils.ApiClient;
import utils.MoneyUtil;
import utils.SessionUtil;
import utils.TestData;

/**
 * SplitSphere (group expenses). The app supports group creation, adding members by e-mail,
 * equal splitting of shared expenses and a computed "who owes whom" summary.
 * There is no separate "settle up / mark as paid" action in the application, so none is tested.
 */
public class SplitSphereTests extends BaseTest {
    private ApiClient.Session owner;
    private ApiClient.Session friend;

    @BeforeMethod(alwaysRun = true)
    public void seedUsers() {
        owner = ApiClient.registerUser("Owner");
        friend = ApiClient.registerUser("Friend");
    }

    @Test(description = "TC-SPL-01 Create a group")
    public void createGroup() {
        SessionUtil.loginAs(driver, owner, "/groups");
        GroupsPage groups = new GroupsPage(driver).open();
        Assert.assertTrue(groups.isEmptyStateShown(), "new user has no groups");
        groups.createGroup("Goa Trip");
        groups.waitForToast("success", "Group created successfully");
        groups.waitForGroup("Goa Trip");
        Assert.assertEquals(groups.memberBadgeOf("Goa Trip"), "1 Members");
    }

    @Test(description = "TC-SPL-02 Opening a group shows its dashboard")
    public void openGroupDashboard() {
        ApiClient.createGroup(owner, "Flat Mates");
        SessionUtil.loginAs(driver, owner, "/groups");
        GroupsPage groups = new GroupsPage(driver).open();
        groups.waitForGroup("Flat Mates");
        groups.openGroup("Flat Mates");
        GroupDetailPage detail = new GroupDetailPage(driver).waitLoaded();
        Assert.assertEquals(detail.title(), "Flat Mates");
        Assert.assertTrue(detail.isAllSettledShown(), "no expenses -> all debts settled");
        Assert.assertTrue(MoneyUtil.equal(detail.totalGroupSpend(), 0));
    }

    @Test(description = "TC-SPL-03 Add a member by e-mail")
    public void addMember() {
        String groupId = ApiClient.createGroup(owner, "Team");
        SessionUtil.loginAs(driver, owner, "/groups/" + groupId);
        GroupDetailPage detail = new GroupDetailPage(driver).waitLoaded();
        detail.addMember(friend.email);
        detail.waitForToast("success", "Member added successfully!");
        detail.waitForMemberCount(2);
        Assert.assertTrue(detail.memberNames().contains(friend.name));
    }

    @Test(description = "TC-SPL-04 Adding an unregistered e-mail is rejected")
    public void addUnknownMember() {
        String groupId = ApiClient.createGroup(owner, "Team");
        SessionUtil.loginAs(driver, owner, "/groups/" + groupId);
        GroupDetailPage detail = new GroupDetailPage(driver).waitLoaded();
        detail.addMember(TestData.uniqueEmail("ghost"));
        detail.waitForToast("error", "User with this email not found.");
        Assert.assertEquals(detail.memberNames().size(), 1);
    }

    @Test(description = "TC-SPL-05 Adding the same member twice is rejected")
    public void addDuplicateMember() {
        String groupId = ApiClient.createGroup(owner, "Team");
        ApiClient.addGroupMember(owner, groupId, friend.email);
        SessionUtil.loginAs(driver, owner, "/groups/" + groupId);
        GroupDetailPage detail = new GroupDetailPage(driver).waitLoaded();
        detail.addMember(friend.email);
        detail.waitForToast("error", "User is already a member.");
        Assert.assertEquals(detail.memberNames().size(), 2);
    }

    @Test(description = "TC-SPL-06 Shared expense is split equally and the settlement is calculated")
    public void sharedExpenseSplitAndSettlement() {
        String groupId = ApiClient.createGroup(owner, "Hotel Booking");
        ApiClient.addGroupMember(owner, groupId, friend.email);
        SessionUtil.loginAs(driver, owner, "/groups/" + groupId);
        GroupDetailPage detail = new GroupDetailPage(driver).waitLoaded();
        detail.addSharedExpense("Hotel", "300");
        detail.waitForToast("success", "Group expense recorded!");
        detail.waitForTotalGroupSpend(300);
        detail.waitForSharedExpense("Hotel");
        detail.waitForSettlementCount(1);
        String settlement = detail.settlementTexts().get(0);
        Assert.assertTrue(settlement.contains(friend.name), settlement);
        Assert.assertTrue(settlement.contains("You (Receive)"), settlement);
        Assert.assertTrue(settlement.contains("150.00"), settlement);
    }

    @Test(description = "TC-SPL-07 The member who owes sees the correct 'You (Owe)' settlement")
    public void debtorSeesTheirDebt() {
        String groupId = ApiClient.createGroup(owner, "Dinner");
        ApiClient.addGroupMember(owner, groupId, friend.email);
        ApiClient.addGroupExpense(owner, groupId, "Dinner bill", 200);
        SessionUtil.loginAs(driver, friend, "/groups/" + groupId);
        GroupDetailPage detail = new GroupDetailPage(driver).waitLoaded();
        detail.waitForSettlementCount(1);
        String settlement = detail.settlementTexts().get(0);
        Assert.assertTrue(settlement.contains("You (Owe)"), settlement);
        Assert.assertTrue(settlement.contains(owner.name), settlement);
        Assert.assertTrue(settlement.contains("100.00"), settlement);
    }

    @Test(description = "TC-SPL-08 A non-member cannot open the group")
    public void nonMemberCannotOpenGroup() {
        String groupId = ApiClient.createGroup(owner, "Private Group");
        SessionUtil.loginAs(driver, friend, "/groups/" + groupId);
        GroupDetailPage detail = new GroupDetailPage(driver);
        Assert.assertTrue(detail.isNotFoundShown(), "non-member must not see the group dashboard");
        detail.waitForToast("error", "Failed to load group dashboard.");
    }

    @Test(description = "TC-SPL-09 A group is only listed for its members")
    public void groupListIsolation() {
        ApiClient.createGroup(owner, "Owner Only");
        SessionUtil.loginAs(driver, friend, "/groups");
        GroupsPage groups = new GroupsPage(driver).open();
        Assert.assertTrue(groups.isEmptyStateShown());
    }

    @Test(description = "TC-SPL-10 Zero shared-expense amount is rejected with the server message")
    public void zeroSharedExpenseIsRejected() {
        String groupId = ApiClient.createGroup(owner, "Validation");
        SessionUtil.loginAs(driver, owner, "/groups/" + groupId);
        GroupDetailPage detail = new GroupDetailPage(driver).waitLoaded();
        detail.addSharedExpense("Free lunch", "0");
        detail.waitForToast("error", "greater than 0");
        Assert.assertTrue(detail.sharedExpenseTitles().isEmpty());
    }
}
