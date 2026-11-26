package utils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import config.TestConfig;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Minimal REST client used ONLY to seed predictable data (users, expenses, income, groups)
 * for UI tests, so each UI test does not have to click through setup screens.
 * It talks to the real backend; nothing is mocked.
 */
public final class ApiClient {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final HttpClient HTTP = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    /** A registered user and its JWT. {@code userInfoJson} is what the frontend keeps in localStorage. */
    public static final class Session {
        public final String id;
        public final String name;
        public final String email;
        public final String token;
        public String userInfoJson;

        Session(JsonNode data) {
            this.id = data.get("_id").asText();
            this.name = data.get("name").asText();
            this.email = data.get("email").asText();
            this.token = data.get("token").asText();
            this.userInfoJson = data.toString();
        }
    }

    private ApiClient() { }

    private static JsonNode send(String method, String path, String token, ObjectNode body) {
        try {
            HttpRequest.Builder rb = HttpRequest.newBuilder(URI.create(TestConfig.apiUrl() + path))
                    .timeout(Duration.ofSeconds(20))
                    .header("Content-Type", "application/json");
            if (token != null) {
                rb.header("Authorization", "Bearer " + token);
            }
            HttpRequest.BodyPublisher publisher = body == null
                    ? HttpRequest.BodyPublishers.noBody()
                    : HttpRequest.BodyPublishers.ofString(body.toString());
            HttpResponse<String> res = HTTP.send(rb.method(method, publisher).build(), HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() >= 400) {
                throw new IllegalStateException("API " + method + " " + path + " failed: HTTP " + res.statusCode() + " " + res.body());
            }
            return MAPPER.readTree(res.body());
        } catch (IOException e) {
            throw new IllegalStateException("API call failed: " + method + " " + path + " - is the backend running at " + TestConfig.apiUrl() + "?", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(e);
        }
    }

    /** Registers a brand-new user (unique e-mail) and returns its session. */
    public static Session registerUser(String namePrefix) {
        ObjectNode body = MAPPER.createObjectNode();
        body.put("name", TestData.uniqueName(namePrefix));
        body.put("email", TestData.uniqueEmail(namePrefix.toLowerCase().replace(" ", "")));
        body.put("password", TestConfig.testPassword());
        return new Session(send("POST", "/auth/register", null, body).get("data"));
    }

    public static void setBudget(Session s, double budget) {
        ObjectNode body = MAPPER.createObjectNode();
        body.put("budget", budget);
        JsonNode data = send("PUT", "/auth/budget", s.token, body).get("data");
        try {
            // keep the localStorage payload (used by SessionUtil) in sync with the server
            ObjectNode info = (ObjectNode) MAPPER.readTree(s.userInfoJson);
            info.put("monthlyBudget", data.get("monthlyBudget").asDouble());
            s.userInfoJson = info.toString();
        } catch (IOException e) {
            throw new IllegalStateException("Could not update session payload", e);
        }
    }

    public static String createExpense(Session s, String title, double amount, String category, String date) {
        ObjectNode body = MAPPER.createObjectNode();
        body.put("title", title);
        body.put("amount", amount);
        body.put("category", category);
        body.put("date", date);
        return send("POST", "/expenses", s.token, body).get("data").get("_id").asText();
    }

    public static String createIncome(Session s, String source, double amount, String category, String date) {
        ObjectNode body = MAPPER.createObjectNode();
        body.put("source", source);
        body.put("amount", amount);
        body.put("category", category);
        body.put("date", date);
        return send("POST", "/income", s.token, body).get("data").get("_id").asText();
    }

    public static String createGroup(Session s, String name) {
        ObjectNode body = MAPPER.createObjectNode();
        body.put("name", name);
        return send("POST", "/groups", s.token, body).get("data").get("_id").asText();
    }

    public static void addGroupMember(Session s, String groupId, String memberEmail) {
        ObjectNode body = MAPPER.createObjectNode();
        body.put("email", memberEmail);
        send("POST", "/groups/" + groupId + "/members", s.token, body);
    }

    public static void addGroupExpense(Session s, String groupId, String title, double amount) {
        ObjectNode body = MAPPER.createObjectNode();
        body.put("title", title);
        body.put("amount", amount);
        send("POST", "/groups/" + groupId + "/expenses", s.token, body);
    }

    /** Deletes every expense and income entry owned by this throw-away user (own data only). */
    public static void cleanupUserData(Session s) {
        try {
            for (JsonNode e : send("GET", "/expenses", s.token, null).get("data")) {
                send("DELETE", "/expenses/" + e.get("_id").asText(), s.token, null);
            }
            for (JsonNode i : send("GET", "/income", s.token, null).get("data")) {
                send("DELETE", "/income/" + i.get("_id").asText(), s.token, null);
            }
        } catch (RuntimeException ignored) {
            // best-effort cleanup; the test database is disposable (see docs/TEST_PLAN.md)
        }
    }
}
