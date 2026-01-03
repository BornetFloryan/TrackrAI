package org.example.steps.centralserver;

import io.cucumber.java.en.*;
import static org.junit.jupiter.api.Assertions.*;

public class CentralServerProtocolErrorSteps {

    @When("une commande inconnue est envoyée")
    public void envoyer_commande_inconnue() {
        CentralServerHooks.ctx.out.println("FOOBAR");
    }

    @Then("le serveur retourne une erreur de protocole")
    public void verifier_erreur() throws Exception {
        String resp = CentralServerHooks.ctx.in.readLine();
        assertTrue(resp.startsWith("ERR"));
    }
}
