package utils;

import java.math.BigDecimal;

/** Parses amounts shown in the UI (for example "₹1200.50" or "+₹48000.00") into numbers. */
public final class MoneyUtil {
    private MoneyUtil() { }

    public static BigDecimal parse(String text) {
        if (text == null) {
            throw new IllegalArgumentException("text is null");
        }
        String cleaned = text.replaceAll("[^0-9.\\-]", "");
        if (cleaned.isEmpty() || cleaned.equals("-") || cleaned.equals(".")) {
            throw new IllegalArgumentException("No amount found in: '" + text + "'");
        }
        return new BigDecimal(cleaned);
    }

    /** Compare numerically (ignores scale: 100 equals 100.00). */
    public static boolean equal(BigDecimal actual, double expected) {
        return actual.compareTo(BigDecimal.valueOf(expected)) == 0;
    }
}
