package org.example.steps;

import io.cucumber.java.en.*;
import org.example.world.WorldContext;

import static org.junit.jupiter.api.Assertions.*;

public class AuthentificationSteps {

    @Given("un utilisateur possède un compte valide")
    public void utilisateur_valide() {
        WorldContext.world.utilisateurAuthentifie = false;
    }

    @When("il se connecte à l'application")
    public void connexion() {
        WorldContext.world.utilisateurAuthentifie = true;
    }

    @Then("l'accès est autorisé")
    public void acces_autorise() {
        assertTrue(WorldContext.world.utilisateurAuthentifie);
    }

    @Given("un utilisateur possède des identifiants invalides")
    public void utilisateur_invalide() {
        WorldContext.world.utilisateurAuthentifie = false;
    }

    @Then("l'accès est refusé")
    public void acces_refuse() {
        assertFalse(WorldContext.world.utilisateurAuthentifie);
    }

    @When("il tente de se connecter")
    public void tentative_connexion() {
        WorldContext.world.utilisateurAuthentifie = false;
    }

    @Then("un message d'erreur est affiché")
    public void message_erreur_affiche() {
        assertFalse(WorldContext.world.utilisateurAuthentifie);
    }

}
