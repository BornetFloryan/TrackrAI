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
}
