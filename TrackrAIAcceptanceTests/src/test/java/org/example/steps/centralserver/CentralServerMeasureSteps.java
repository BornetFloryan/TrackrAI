package org.example.steps.centralserver;

import io.cucumber.java.en.*;
import static org.junit.jupiter.api.Assertions.*;

public class CentralServerMeasureSteps {

    @When("le client envoie une mesure valide")
    public void envoyer_mesure() {
        CentralServerHooks.ctx.out.println(
                "STOREMEASURE acc_x 1700000000000 12.3 "
                        + CentralServerHooks.ctx.moduleKey
        );
    }

    @Then("la mesure est acceptée")
    public void verifier_acceptation() throws Exception {
        String resp = CentralServerHooks.ctx.in.readLine();

        assertNotNull(resp);
        assertTrue(
                resp.equals("OK") || resp.equals("OK IGNORED"),
                "Réponse inattendue : " + resp
        );
    }

    @When("le client envoie une mesure invalide")
    public void envoyer_mesure_invalide() {
        CentralServerHooks.ctx.out.println("STOREMEASURE acc_x");
    }

    @Then("la mesure est refusée")
    public void verifier_refus() throws Exception {
        String resp = CentralServerHooks.ctx.in.readLine();
        assertTrue(
                resp == null || resp.startsWith("ERR") || resp.contains("IGNORED")
        );
    }
}
