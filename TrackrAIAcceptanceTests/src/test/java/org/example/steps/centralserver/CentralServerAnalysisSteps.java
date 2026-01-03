package org.example.steps.centralserver;

import io.cucumber.java.en.*;
import static org.junit.jupiter.api.Assertions.*;

public class CentralServerAnalysisSteps {

    @When("une analyse valide est envoyée")
    public void envoyer_analyse() {
        CentralServerHooks.ctx.out.println(
                "STOREANALYSIS SPORT 2026-01-02T23:13:40 a_test|{\"score\":72}"
        );
    }

    @Then("l'analyse est acceptée")
    public void verifier_acceptation() throws Exception {
        String resp = CentralServerHooks.ctx.in.readLine();
        assertTrue(resp.startsWith("OK"));
    }
}
