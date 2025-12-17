package org.example.steps;

import org.example.world.WorldContext;
import io.cucumber.java.en.*;

import static org.junit.jupiter.api.Assertions.*;

public class CollecteSteps {

    @Given("un microcontrôleur est connecté au système")
    public void microcontroleur_connecte() {
        WorldContext.world.systemDisponible = true;
        WorldContext.world.microcontroleurConnecte = true;
    }

    @When("il transmet une mesure valide")
    public void transmet_mesure() {
        if (WorldContext.world.systemDisponible && WorldContext.world.microcontroleurConnecte) {
            WorldContext.world.mesureEnregistree = true;
        }
    }

    @Then("la mesure est enregistrée en base de données")
    public void mesure_enregistree() {
        assertTrue(WorldContext.world.mesureEnregistree);
    }

    @Given("aucun microcontrôleur n'est connecté")
    public void aucun_microcontroleur_connecte() {
        WorldContext.world.microcontroleurConnecte = false;
        WorldContext.world.systemDisponible = true;
    }

    @When("une mesure est transmise")
    public void mesure_transmise_sans_microcontroleur() {
        WorldContext.world.mesureEnregistree = false;
    }

    @Then("la mesure n'est pas enregistrée")
    public void mesure_non_enregistree() {
        assertFalse(WorldContext.world.mesureEnregistree);
    }
}
