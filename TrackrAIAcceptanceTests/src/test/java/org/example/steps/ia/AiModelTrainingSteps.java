package org.example.steps.ia;

import io.cucumber.java.en.*;

import java.net.URI;
import java.net.http.*;

import static org.junit.jupiter.api.Assertions.*;

public class AiModelTrainingSteps {

    private final HttpClient client = HttpClient.newHttpClient();
    private HttpResponse<String> response;

    private final String BASE_URL =
            System.getenv().getOrDefault("API_BASE_URL", "http://localhost:4567");

    @Given("training data for the AI model is available")
    public void training_data_for_the_ai_model_is_available() {
        // Les données sont supposées déjà présentes côté backend
    }

    @When("the AI model training is started")
    public void the_ai_model_training_is_started() throws Exception {

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/api/ai/train"))
                .POST(HttpRequest.BodyPublishers.noBody())
                .build();

        response = client.send(request, HttpResponse.BodyHandlers.ofString());
    }

    @Then("the AI model is successfully trained")
    public void the_ai_model_is_successfully_trained() {
        assertEquals(200, response.statusCode());
        assertTrue(
                response.body().contains("trained")
                        || response.body().contains("success"),
                "AI model training failed"
        );
    }
}
