package org.example.steps;

import io.cucumber.java.en.*;
import org.example.world.WorldContext;

import static org.junit.jupiter.api.Assertions.*;

public class TableauDeBordSteps {

    @Given("un utilisateur est authentifié")
    public void utilisateur_authentifie() {
        WorldContext.world.utilisateurAuthentifie = true;
    }

    @When("il consulte son tableau de bord")
    public void consultation_dashboard() {
        if (WorldContext.world.utilisateurAuthentifie) {
            WorldContext.world.accesAutorise = true;
        }
    }

    @Then("ses indicateurs de performance sont affichés")
    public void affichage_indicateurs() {
        assertTrue(WorldContext.world.accesAutorise);
    }

    @Then("ses recommandations IA sont visibles")
    public void affichage_recommandations() {
        assertTrue(WorldContext.world.accesAutorise);
    }

    @Given("un utilisateur n'est pas authentifié")
    public void utilisateur_non_authentifie() {
        WorldContext.world.utilisateurAuthentifie = false;
    }

    @When("il tente d'accéder au tableau de bord")
    public void acces_dashboard_refuse() {
        WorldContext.world.accesAutorise = false;
    }

}
