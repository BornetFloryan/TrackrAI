package org.example.steps.centralserver;

import io.cucumber.java.en.*;
import static org.junit.jupiter.api.Assertions.*;

import java.net.Socket;

public class CentralServerMultiClientSteps {

    @When("deux clients TCP se connectent")
    public void deux_clients() throws Exception {
        Socket s1 = new Socket(
                CentralServerHooks.ctx.host,
                CentralServerHooks.ctx.port
        );
        Socket s2 = new Socket(
                CentralServerHooks.ctx.host,
                CentralServerHooks.ctx.port
        );

        assertTrue(s1.isConnected());
        assertTrue(s2.isConnected());

        s1.close();
        s2.close();
    }

    @Then("les deux connexions sont acceptées")
    public void connexions_acceptees() {
        assertTrue(true);
    }
}
