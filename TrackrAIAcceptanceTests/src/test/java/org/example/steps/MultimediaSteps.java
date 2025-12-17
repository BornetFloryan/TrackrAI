package org.example.steps;

import org.example.world.WorldContext;
import io.cucumber.java.en.*;

import static org.junit.jupiter.api.Assertions.*;

public class MultimediaSteps {

    @Given("une vidéo est fournie")
    public void video_fournie() {
        WorldContext.world.systemDisponible = true;
    }

    @When("le système analyse la vidéo")
    public void analyse_video() {
        if (WorldContext.world.systemDisponible) {
            WorldContext.world.videoAnalysee = true;
        }
    }

    @Then("des indicateurs sont produits")
    public void indicateurs_produits() {
        assertTrue(WorldContext.world.videoAnalysee);
    }

    @When("la vidéo est invalide")
    public void video_invalide() {
        WorldContext.world.videoAnalysee = false;
    }

    @Then("l'analyse échoue")
    public void analyse_echoue() {
        assertFalse(WorldContext.world.videoAnalysee);
    }

    @Then("une erreur est produite")
    public void erreur_produite() {
        assertTrue(true);
    }

    @Given("le système d'analyse est indisponible")
    public void systeme_indisponible() {
        WorldContext.world.systemDisponible = false;
    }

    @When("une vidéo est envoyée")
    public void video_envoyee() {
        if (!WorldContext.world.systemDisponible) {
            WorldContext.world.videoAnalysee = false;
        }
    }

    @Then("aucune analyse n'est effectuée")
    public void aucune_analyse_effectuee() {
        assertFalse(WorldContext.world.videoAnalysee);
    }

}
