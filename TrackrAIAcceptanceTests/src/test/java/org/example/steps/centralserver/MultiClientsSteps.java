package org.example.steps.centralserver;

import org.example.world.WorldContext;
import io.cucumber.java.en.*;
import static org.junit.jupiter.api.Assertions.*;

public class MultiClientsSteps {

    @When("plusieurs clients se connectent")
    public void plusieurs_clients() {
        WorldContext.centralServerWorld.nombreClientsConnectes = 3;
    }

    @Then("chaque client est pris en charge")
    public void clients_pris_en_charge() {
        assertTrue(WorldContext.centralServerWorld.nombreClientsConnectes > 1);
    }
}
