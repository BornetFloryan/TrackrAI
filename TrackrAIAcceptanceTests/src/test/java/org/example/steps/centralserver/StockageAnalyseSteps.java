package org.example.steps.centralserver;

import org.example.world.WorldContext;
import io.cucumber.java.en.*;
import static org.junit.jupiter.api.Assertions.*;

public class StockageAnalyseSteps {

    @When("une requête STOREANALYSIS valide est envoyée")
    public void store_analysis_valide() {
        WorldContext.centralServerWorld.analyseStockee = true;
    }

    @When("une requête STOREANALYSIS invalide est envoyée")
    public void store_analysis_invalide() {
        WorldContext.centralServerWorld.erreurProtocole = true;
    }

    @Then("l'analyse est stockée")
    public void analyse_stockee() {
        assertTrue(WorldContext.centralServerWorld.analyseStockee);
    }

    @Then("une erreur paramètres manquants est retournée")
    public void erreur_parametres_manquants() {
        assertTrue(WorldContext.centralServerWorld.erreurProtocole);
    }

}
