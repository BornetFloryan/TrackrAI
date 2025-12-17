package org.example.steps.centralserver;

import org.example.world.WorldContext;
import io.cucumber.java.en.*;
import static org.junit.jupiter.api.Assertions.*;

public class ConnexionTcpSteps {

    @Given("le serveur central est démarré")
    public void serveur_demarre() {
        WorldContext.centralServerWorld.serverDemarre = true;
    }

    @Given("un client TCP est connecté")
    public void un_client_tcp_est_connecte() {
        WorldContext.centralServerWorld.serverDemarre = true;
        WorldContext.centralServerWorld.clientConnecte = true;
    }

    @Given("le serveur central est disponible")
    public void serveur_central_disponible() {
        WorldContext.centralServerWorld.serverDemarre = true;
    }

    @When("un client TCP se connecte")
    public void client_se_connecte() {
        if (WorldContext.centralServerWorld.serverDemarre) {
            WorldContext.centralServerWorld.clientConnecte = true;
        }
    }

    @Then("la connexion au server est acceptée")
    public void connexion_acceptee() {
        assertTrue(WorldContext.centralServerWorld.clientConnecte);
    }
}
