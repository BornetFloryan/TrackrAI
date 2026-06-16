package org.example.steps.ia;

import org.example.world.WorldContext;
import io.cucumber.java.en.*;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;

import static org.junit.jupiter.api.Assertions.*;

public class AiSteps {

    private String sessionId;

    // =======================
    // ======= GIVEN =========
    // =======================

    @Given("une séance existante avec l'identifiant {string}")
    public void une_seance_existante(String id) {
        // On stocke juste l'id (comme les autres tests)
        this.sessionId = id;
    }

    @Given("des données d'entraînement sont disponibles")
    public void donnees_entrainement_disponibles() {
        // Rien à faire : précondition logique
        assertTrue(true);
    }

    // =======================
    // ======= WHEN ==========
    // =======================

    @When("je demande l'estimation de la fatigue par l'IA")
    public void demander_fatigue() throws Exception {
        envoyerGet("/ai/insights/" + sessionId);
    }

    @When("je demande l'analyse HRV par l'IA")
    public void demander_hrv() throws Exception {
        envoyerGet("/ai/insights/" + sessionId);
    }

    @When("je demande des conseils personnalisés par l'IA")
    public void demander_conseils() throws Exception {
        envoyerGet("/ai/insights/" + sessionId);
    }

    @When("je lance l'entraînement du modèle IA")
    public void entrainer_modele() throws Exception {
        envoyerPost("/ai/train", "{}");
    }

    @When("je demande la prédiction du score par l'IA")
    public void demander_prediction() throws Exception {
        envoyerGet("/ai/predict/" + sessionId);
    }

    // =======================
    // ======= THEN ==========
    // =======================

    @Then("le statut de la réponse IA doit être {int}")
    public void statut_ia(int code) {
        assertEquals(code, WorldContext.api.lastStatusCode);
    }

    @Then("un score de fatigue est retourné")
    public void score_fatigue() {
        assertTrue(
                WorldContext.api.lastResponseBody.contains("fatigue")
                        || WorldContext.api.lastResponseBody.contains("score"),
                "Aucun score de fatigue retourné"
        );
    }

    @Then("un indicateur HRV est retourné")
    public void indicateur_hrv() {
        assertTrue(
                WorldContext.api.lastResponseBody.contains("hrv"),
                "Aucun indicateur HRV retourné"
        );
    }

    @Then("une liste de conseils est retournée")
    public void liste_conseils() {
        assertTrue(
                WorldContext.api.lastResponseBody.contains("advice")
                        || WorldContext.api.lastResponseBody.contains("recommendation"),
                "Aucune recommandation retournée"
        );
    }

    @Then("le modèle IA est entraîné avec succès")
    public void modele_entraine() {
        assertTrue(
                WorldContext.api.lastResponseBody.contains("trained")
                        || WorldContext.api.lastResponseBody.contains("success"),
                "Le modèle n'est pas marqué comme entraîné"
        );
    }

    @Then("une prédiction de performance est retournée")
    public void prediction_retournee() {
        assertTrue(
                WorldContext.api.lastResponseBody.contains("\"global\"")
                        && WorldContext.api.lastResponseBody.contains("\"model\""),
                "Aucune prédiction documentée retournée"
        );
    }

    // =======================
    // ======= OUTILS ========
    // =======================

    private void envoyerPost(String path, String body) throws Exception {
        URL url = new URL(WorldContext.api.baseUrl + path);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();

        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("x-session-id", WorldContext.api.sessionToken);
        conn.setDoOutput(true);

        try (OutputStream os = conn.getOutputStream()) {
            os.write(body.getBytes());
        }

        WorldContext.api.lastStatusCode = conn.getResponseCode();
        WorldContext.api.lastResponseBody = lire(conn);
    }

    private void envoyerGet(String path) throws Exception {
        URL url = new URL(WorldContext.api.baseUrl + path);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();

        conn.setRequestMethod("GET");
        conn.setRequestProperty("x-session-id", WorldContext.api.sessionToken);

        WorldContext.api.lastStatusCode = conn.getResponseCode();
        WorldContext.api.lastResponseBody = lire(conn);
    }

    private String lire(HttpURLConnection conn) throws Exception {
        InputStream is = conn.getResponseCode() >= 400
                ? conn.getErrorStream()
                : conn.getInputStream();

        if (is == null) return "";

        BufferedReader br = new BufferedReader(new InputStreamReader(is));
        StringBuilder sb = new StringBuilder();
        String line;

        while ((line = br.readLine()) != null) {
            sb.append(line);
        }

        return sb.toString();
    }
}
