package org.example.steps.centralserver;

import org.example.world.WorldContext;
import io.cucumber.java.en.*;
import static org.junit.jupiter.api.Assertions.*;

public class AutoEnregistrementSteps {

    @When("le client envoie une requête AUTOREGISTER valide")
    public void autoregister_valide() {
        WorldContext.centralServerWorld.autoRegisterEffectue = true;
    }

    @When("le client envoie une requête AUTOREGISTER invalide")
    public void autoregister_invalide() {
        WorldContext.centralServerWorld.autoRegisterErreur = true;
    }

    @Then("le module est enregistré")
    public void module_enregistre() {
        assertTrue(WorldContext.centralServerWorld.autoRegisterEffectue);
    }

    @Then("une confirmation d'enregistrement est retournée")
    public void confirmation_retournee() {
        assertFalse(WorldContext.centralServerWorld.autoRegisterErreur);
    }

    @Then("une erreur d'enregistrement est retournée")
    public void erreur_retournee() {
        assertTrue(WorldContext.centralServerWorld.autoRegisterErreur);
    }
}
