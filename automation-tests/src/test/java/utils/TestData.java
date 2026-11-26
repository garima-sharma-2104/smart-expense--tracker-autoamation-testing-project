package utils;

import java.time.LocalDate;
import java.util.UUID;

/** Unique, predictable data for throw-away test users and records. */
public final class TestData {
    private TestData() { }

    /** Unique e-mail on the reserved .test TLD so it can never reach a real mailbox. */
    public static String uniqueEmail(String prefix) {
        return prefix + "_" + UUID.randomUUID().toString().substring(0, 8) + "@selenium.test";
    }

    public static String uniqueName(String prefix) {
        return prefix + " " + UUID.randomUUID().toString().substring(0, 6);
    }

    /** 15th of the current month: safely inside the month in any time zone. */
    public static String midMonthDate() {
        return LocalDate.now().withDayOfMonth(15).toString();
    }

    /** 15th of the previous month. */
    public static String previousMonthDate() {
        return LocalDate.now().minusMonths(1).withDayOfMonth(15).toString();
    }
}
