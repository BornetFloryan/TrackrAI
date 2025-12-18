package org.example.steps.api;

import org.example.world.WorldContext;
import io.cucumber.java.en.*;

import static org.junit.jupiter.api.Assertions.*;

public class ApiCommonSteps {

    @Given("l'API Trackr est disponible")
    public void api_disponible() {
        assertNotNull(WorldContext.api.baseUrl);
    }

    @Then("le code HTTP est {int}")
    public void code_http_est(int code) {
        assertEquals(code, WorldContext.api.lastStatusCode);
    }

    @Then("une erreur d'authentification est retournée")
    public void erreur_authentification_retournee() {
        assertTrue(
                WorldContext.api.lastResponseBody.contains("\"error\":622")
                        || WorldContext.api.lastResponseBody.contains("ERR_AUTH"),
                "Aucune erreur d'authentification détectée"
        );
    }

    @Then("une liste de mesures est retournée")
    @Then("une liste de modules est retournée")
    @Then("une liste d'utilisateurs est retournée")
    public void liste_retournee() {
        assertTrue(
                WorldContext.api.lastResponseBody.contains("["),
                "La réponse ne contient pas de liste"
        );
    }
}
