package org.example.steps.ia;

import io.cucumber.java.en.*;

import java.net.URI;
import java.net.http.*;

import static org.junit.jupiter.api.Assertions.*;

public class AiAdviceGenerationSteps {

    // Client HTTP pour appeler l’API
    private final HttpClient client = HttpClient.newHttpClient();
    private HttpResponse<String> response;
    private String sessionId;

    // URL de base de l’API
    private final String BASE_URL =
            System.getenv().getOrDefault("API_BASE_URL", "http://localhost:4567");

    @Given("a completed AI analysis exists for session {string}")
    public void a_completed_ai_analysis_exists_for_session(String id) {
        // On mémorise l’identifiant de séance
        this.sessionId = id;
    }

    @When("the AI engine generates training advice")
    public void the_ai_engine_generates_training_advice() throws Exception {

        String json = """
                {
                  "sessionId": "%s"
                }
                """.formatted(sessionId);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/api/ai/advice"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        response = client.send(request, HttpResponse.BodyHandlers.ofString());
    }

    @Then("personalized training advice is returned")
    public void personalized_training_advice_is_returned() {
        assertEquals(200, response.statusCode());
        assertTrue(
                response.body().contains("advice")
                        || response.body().contains("recommendation"),
                "No training advice returned by AI"
        );
    }
}
