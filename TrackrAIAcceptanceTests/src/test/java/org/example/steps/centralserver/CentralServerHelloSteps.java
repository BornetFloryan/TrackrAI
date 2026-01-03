package org.example.steps.centralserver;

import io.cucumber.java.en.*;
import static org.junit.jupiter.api.Assertions.*;

public class CentralServerHelloSteps {

    @When("le client s'identifie avec HELLO")
    public void envoyer_hello() {
        CentralServerHooks.ctx.out
                .println("HELLO " + CentralServerHooks.ctx.moduleKey);
    }

    @Then("le serveur accepte l'identification")
    public void verifier_hello() throws Exception {
        String resp = CentralServerHooks.ctx.in.readLine();
        assertEquals("OK", resp);
    }
}
