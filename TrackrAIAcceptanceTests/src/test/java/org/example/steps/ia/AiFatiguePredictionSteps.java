package org.example.steps.ia;

import io.cucumber.java.en.*;

import java.net.URI;
import java.net.http.*;

import static org.junit.jupiter.api.Assertions.*;

public class AiFatiguePredictionSteps {

    private final HttpClient client = HttpClient.newHttpClient();
    private HttpResponse<String> response;
    private String sessionId;

    private final String BASE_URL =
            System.getenv().getOrDefault("API_BASE_URL", "http://localhost:4567");

    @Given("an existing cycling session with id {string}")
    public void an_existing_cycling_session_with_id(String id) {
        // Séance existante utilisée pour la prédiction
        this.sessionId = id;
    }

    @When("the AI engine estimates fatigue level")
    public void the_ai_engine_estimates_fatigue_level() throws Exception {

        String json = """
                {
                  "sessionId": "%s"
                }
                """.formatted(sessionId);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/api/ai/fatigue"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        response = client.send(request, HttpResponse.BodyHandlers.ofString());
    }

    @Then("a fatigue score is returned")
    public void a_fatigue_score_is_returned() {
        assertEquals(200, response.statusCode());
        assertTrue(
                response.body().contains("fatigue")
                        || response.body().contains("score"),
                "No fatigue score returned"
        );
    }
}
