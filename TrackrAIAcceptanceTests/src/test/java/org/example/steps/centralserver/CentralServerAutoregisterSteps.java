package org.example.steps.centralserver;

import io.cucumber.java.en.*;
import static org.junit.jupiter.api.Assertions.*;

public class CentralServerAutoregisterSteps {

    @When("le client envoie AUTOREGISTER valide")
    public void envoyer_autoregister() {
        CentralServerHooks.ctx.out
                .println("AUTOREGISTER esp32 gps imu hr");
    }

    @Then("le serveur confirme l'enregistrement")
    public void verifier_confirmation() throws Exception {
        String resp = CentralServerHooks.ctx.in.readLine();
        assertNotNull(resp);
        assertTrue(resp.startsWith("OK"));

        String[] parts = resp.split(",");
        assertTrue(parts.length >= 3);

        CentralServerHooks.ctx.moduleKey = parts[2];
        CentralServerHooks.ctx.lastResponse = resp;
    }

    @When("le client envoie AUTOREGISTER invalide")
    public void envoyer_autoregister_invalide() {
        CentralServerHooks.ctx.out.println("AUTOREGISTER");
    }

    @Then("le serveur retourne une erreur d'enregistrement")
    public void verifier_erreur() throws Exception {
        String resp = CentralServerHooks.ctx.in.readLine();
        assertTrue(resp.startsWith("ERR"));
    }
}
