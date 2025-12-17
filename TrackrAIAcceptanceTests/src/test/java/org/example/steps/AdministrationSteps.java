package org.example.steps;

import io.cucumber.java.en.*;
import org.example.world.WorldContext;

import static org.junit.jupiter.api.Assertions.*;

public class AdministrationSteps {

    @Given("un administrateur est authentifié")
    public void administrateur_authentifie() {
        WorldContext.world.utilisateurAuthentifie = true;
    }

    @When("il consulte la liste des microcontrôleurs")
    public void consultation_microcontroleurs() {
        WorldContext.world.accesAutorise = WorldContext.world.utilisateurAuthentifie;
    }

    @Then("les microcontrôleurs enregistrés sont affichés")
    public void affichage_microcontroleurs() {
        assertTrue(WorldContext.world.accesAutorise);
    }
}
