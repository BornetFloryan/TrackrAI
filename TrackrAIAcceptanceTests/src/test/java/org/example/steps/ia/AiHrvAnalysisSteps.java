package org.example.steps.ia;

import io.cucumber.java.en.*;

import java.net.URI;
import java.net.http.*;

import static org.junit.jupiter.api.Assertions.*;

public class AiHrvAnalysisSteps {

    private final HttpClient client = HttpClient.newHttpClient();
    private HttpResponse<String> response;
    private String sessionId;

    private final String BASE_URL =
            System.getenv().getOrDefault("API_BASE_URL", "http://localhost:4567");

    @Given("a session with heart rate data exists with id {string}")
    public void a_session_with_heart_rate_data_exists_with_id(String id) {
        // Séance contenant des données cardiaques
        this.sessionId = id;
    }

    @When("the AI engine performs HRV analysis")
    public void the_ai_engine_performs_hrv_analysis() throws Exception {

        String json = """
                {
                  "sessionId": "%s"
                }
                """.formatted(sessionId);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/api/ai/hrv"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        response = client.send(request, HttpResponse.BodyHandlers.ofString());
    }

    @Then("an HRV indicator is returned")
    public void an_hrv_indicator_is_returned() {
        assertEquals(200, response.statusCode());
        assertTrue(
                response.body().contains("hrv")
                        || response.body().contains("indicator"),
                "No HRV indicator returned"
        );
    }
}
