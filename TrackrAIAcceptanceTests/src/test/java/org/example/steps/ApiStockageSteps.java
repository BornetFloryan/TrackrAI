package org.example.steps;

import io.cucumber.java.en.*;
import org.example.world.WorldContext;

import static org.junit.jupiter.api.Assertions.*;

public class ApiStockageSteps {

    @Given("une analyse a été effectuée")
    public void analyse_effectuee() {
        WorldContext.world.analyseEffectuee = true;
    }

    @When("les résultats sont transmis à l'API")
    public void transmission_api() {
        if (WorldContext.world.analyseEffectuee) {
            WorldContext.world.donneesTransmisesAPI = true;
        }
    }

    @Then("les résultats sont stockés en base de données")
    public void stockage_donnees() {
        WorldContext.world.donneesStockees = WorldContext.world.donneesTransmisesAPI;
        assertTrue(WorldContext.world.donneesStockees);
    }

    @When("le stockage échoue")
    public void stockage_echoue() {
        WorldContext.world.donneesStockees = false;
    }

    @Then("les données ne sont pas enregistrées")
    public void donnees_non_enregistrees() {
        assertFalse(WorldContext.world.donneesStockees);
    }

}
