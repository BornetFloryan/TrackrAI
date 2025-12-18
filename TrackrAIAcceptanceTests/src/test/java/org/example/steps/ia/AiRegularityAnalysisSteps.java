package org.example.steps.ia;

import io.cucumber.java.en.*;

import java.net.URI;
import java.net.http.*;

import static org.junit.jupiter.api.Assertions.*;

public class AiRegularityAnalysisSteps {

    private final HttpClient client = HttpClient.newHttpClient();
    private HttpResponse<String> response;
    private String sessionId;

    private final String BASE_URL =
            System.getenv().getOrDefault("API_BASE_URL", "http://localhost:4567");

    @Given("speed data is available for session {string}")
    public void speed_data_is_available_for_session(String id) {
        // Séance avec données de vitesse
        this.sessionId = id;
    }

    @When("the AI engine analyzes effort regularity")
    public void the_ai_engine_analyzes_effort_regularity() throws Exception {

        String json = """
                {
                  "sessionId": "%s"
                }
                """.formatted(sessionId);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/api/ai/regularity"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        response = client.send(request, HttpResponse.BodyHandlers.ofString());
    }

    @Then("a regularity indicator is returned")
    public void a_regularity_indicator_is_returned() {
        assertEquals(200, response.statusCode());
        assertTrue(
                response.body().contains("regularity")
                        || response.body().contains("variance"),
                "No regularity indicator returned"
        );
    }
}
