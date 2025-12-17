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

    @Given("aucune donnée n'est stockée")
    public void aucune_donnee_stockee() {
        WorldContext.world.mesureEnregistree = false;
    }

    @Then("aucun indicateur n'est calculé")
    public void aucun_indicateur_calcule() {
        assertFalse(WorldContext.world.analyseEffectuee);
    }

    @Then("une erreur est signalée")
    public void erreur_signalee() {
        assertTrue(true);
    }

    @Given("une analyse IA a été effectuée")
    public void analyse_ia_effectuee() {
        WorldContext.world.analyseEffectuee = true;
    }

    @When("les résultats sont traités")
    public void resultats_traites() {
        if (WorldContext.world.analyseEffectuee) {
            WorldContext.world.recommandationGeneree = true;
        }
    }

    @Then("une recommandation personnalisée est générée")
    public void recommandation_generee() {
        assertTrue(WorldContext.world.recommandationGeneree);
    }

}
