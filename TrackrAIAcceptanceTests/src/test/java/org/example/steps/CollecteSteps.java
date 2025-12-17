package org.example.steps;

import org.example.world.WorldContext;
import io.cucumber.java.en.*;

import static org.junit.jupiter.api.Assertions.*;

public class CollecteSteps {

    @Given("un microcontrôleur est connecté au système")
    public void microcontroleur_connecte() {
        WorldContext.world.systemDisponible = true;
    }

    @When("il transmet une mesure valide")
    public void transmet_mesure() {
        if (WorldContext.world.systemDisponible) {
            WorldContext.world.mesureEnregistree = true;
        }
    }

    @Then("la mesure est enregistrée en base de données")
    public void mesure_enregistree() {
        assertTrue(WorldContext.world.mesureEnregistree);
    }
}
