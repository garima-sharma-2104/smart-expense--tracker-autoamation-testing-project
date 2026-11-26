package config;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

/**
 * Central configuration. Lookup order: environment variable, JVM system property
 * (-DNAME=value), then src/test/resources/test.properties.
 */
public final class TestConfig {
    private static final Properties FILE = load();

    private TestConfig() { }

    private static Properties load() {
        Properties p = new Properties();
        try (InputStream in = TestConfig.class.getClassLoader().getResourceAsStream("test.properties")) {
            if (in != null) {
                p.load(in);
            }
        } catch (IOException ignored) {
            // fall back to hard-coded defaults below
        }
        return p;
    }

    private static String get(String key, String fallback) {
        String env = System.getenv(key);
        if (env != null && !env.isBlank()) {
            return env.trim();
        }
        String sys = System.getProperty(key);
        if (sys != null && !sys.isBlank()) {
            return sys.trim();
        }
        return FILE.getProperty(key, fallback).trim();
    }

    private static String stripTrailingSlash(String url) {
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    /** Base URL of the React frontend, e.g. http://localhost:5173 */
    public static String baseUrl() {
        return stripTrailingSlash(get("BASE_URL", "http://localhost:5173"));
    }

    /** Base URL of the REST API including /api, e.g. http://localhost:5000/api */
    public static String apiUrl() {
        return stripTrailingSlash(get("API_URL", "http://localhost:5000/api"));
    }

    public static String browser() {
        return get("BROWSER", "chrome").toLowerCase();
    }

    public static boolean headless() {
        return Boolean.parseBoolean(get("HEADLESS", "true"));
    }

    public static int waitSeconds() {
        return Integer.parseInt(get("WAIT_SECONDS", "15"));
    }

    /** Password for throw-away test users (never a real account password). */
    public static String testPassword() {
        return get("TEST_PASSWORD", "Test@12345");
    }
}
