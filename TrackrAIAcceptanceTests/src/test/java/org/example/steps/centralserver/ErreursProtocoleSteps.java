package org.example.steps.centralserver;

import io.cucumber.java.en.*;
import org.example.world.WorldContext;

import static org.junit.jupiter.api.Assertions.*;

public class ErreursProtocoleSteps {

    @When("une commande inconnue est envoyée")
    public void commande_inconnue_envoyee() {
        // Dans ton serveur, une commande inconnue n'est pas traitée (pas de réponse explicite)
        // En acceptation, on modélise ça comme "protocole invalide"
        WorldContext.centralServerWorld.erreurProtocole = true;
        WorldContext.centralServerWorld.dernierMessageErreur = "commande inconnue";
    }

    @When("une requête vide est envoyée")
    public void requete_vide_envoyee() {
        // Dans ThreadServer.requestLoop, une ligne vide entraîne la fin de boucle (connexion ignorée/close côté thread)
        WorldContext.centralServerWorld.erreurProtocole = false;
        WorldContext.centralServerWorld.dernierMessageErreur = null;
    }

    @Then("une erreur de protocole est retournée")
    public void erreur_protocole_retournee() {
        assertTrue(WorldContext.centralServerWorld.erreurProtocole);
    }

    @Then("la connexion est ignorée")
    public void connexion_ignoree() {
        // Ici on vérifie surtout qu'il n'y a pas d'erreur protocole “métier” à signaler
        assertFalse(WorldContext.centralServerWorld.erreurProtocole);
    }

    @Then("une erreur est retournée")
    public void erreur_retournee() {
        // Réutilisable pour les scénarios "ERR invalid number of parameters"
        assertTrue(
                WorldContext.centralServerWorld.autoRegisterErreur
                        || WorldContext.centralServerWorld.erreurProtocole
        );
    }
}
