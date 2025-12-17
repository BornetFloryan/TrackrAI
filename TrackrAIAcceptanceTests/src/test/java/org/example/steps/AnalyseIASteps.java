package org.example.steps;

import org.example.world.WorldContext;
import io.cucumber.java.en.*;

import static org.junit.jupiter.api.Assertions.*;

public class AnalyseIASteps {

    @Given("des données sont stockées")
    public void donnees_stockees() {
        WorldContext.world.mesureEnregistree = true;
    }

    @When("une analyse IA est lancée")
    public void analyse_lancee() {
        if (WorldContext.world.mesureEnregistree) {
            WorldContext.world.analyseEffectuee = true;
        }
    }

    @Then("un indicateur est calculé")
    public void indicateur_calcule() {
        assertTrue(WorldContext.world.analyseEffectuee);
    }
}
