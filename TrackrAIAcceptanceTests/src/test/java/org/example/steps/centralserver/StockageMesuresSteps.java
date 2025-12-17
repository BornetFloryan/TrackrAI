package org.example.steps.centralserver;

import org.example.world.WorldContext;
import io.cucumber.java.en.*;
import static org.junit.jupiter.api.Assertions.*;

public class StockageMesuresSteps {

    @Given("un module est déjà enregistré")
    public void module_existe() {
        WorldContext.centralServerWorld.autoRegisterEffectue = true;
    }

    @When("une requête STOREMEASURE valide est envoyée")
    public void store_measure_valide() {
        WorldContext.centralServerWorld.mesureStockee = true;
    }

    @When("une requête STOREMEASURE invalide est envoyée")
    public void store_measure_invalide() {
        WorldContext.centralServerWorld.erreurProtocole = true;
    }

    @Then("la mesure est stockée")
    public void mesure_stockee() {
        assertTrue(WorldContext.centralServerWorld.mesureStockee);
    }

    @Then("la mesure est refusée")
    public void mesure_refusee() {
        assertTrue(WorldContext.centralServerWorld.erreurProtocole);
    }

    @Then("une erreur STOREMEASURE invalide est retournée")
    public void erreur_storemeasure_invalide() {
        assertTrue(WorldContext.centralServerWorld.erreurProtocole);
    }

}
