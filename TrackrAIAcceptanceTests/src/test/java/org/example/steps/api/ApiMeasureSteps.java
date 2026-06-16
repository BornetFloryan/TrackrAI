package org.example.steps.api;

import org.example.world.WorldContext;
import io.cucumber.java.en.*;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class ApiMeasureSteps {

    @When("j'envoie une mesure valide")
    public void envoyer_mesure_valide() throws Exception {
        envoyer("""
        {
          "type": "temperature",
          "value": 22.5,
          "date": "2025-12-18T10:00:00",
          "module": "invalid"
        }
        """);
    }

    @Then("la mesure est explicitement ignorée")
    public void mesure_ignoree() {
        assertTrue(
                WorldContext.api.lastResponseBody.contains("\"ignored\":true"),
                "La mesure sans session active doit être explicitement ignorée"
        );
    }

    @When("j'envoie une mesure sans type")
    public void envoyer_mesure_sans_type() throws Exception {
        envoyer("""
        {
          "value": 22.5,
          "date": "2025-12-18T10:00:00",
          "module": "invalid"
        }
        """);
    }

    @When("je demande les mesures")
    public void demander_mesures() throws Exception {
        URL url = new URL(WorldContext.api.baseUrl + "/measure/get");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("x-session-id", WorldContext.api.sessionToken);

        WorldContext.api.lastStatusCode = conn.getResponseCode();
        WorldContext.api.lastResponseBody = lire(conn);
    }

    @When("je demande les analyses vidéo")
    public void demander_analyses_video() throws Exception {
        URL url = new URL(WorldContext.api.baseUrl + "/analysis");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("x-session-id", WorldContext.api.sessionToken);

        WorldContext.api.lastStatusCode = conn.getResponseCode();
        WorldContext.api.lastResponseBody = lire(conn);
    }

    @Then("une liste d'analyses vidéo est retournée")
    public void liste_analyses_video() {
        assertTrue(
                WorldContext.api.lastResponseBody.contains("\"data\":["),
                "L'API doit retourner une enveloppe avec une liste d'analyses vidéo"
        );
    }

    private void envoyer(String body) throws Exception {
        URL url = new URL(WorldContext.api.baseUrl + "/measure/create");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();

        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);

        try (OutputStream os = conn.getOutputStream()) {
            os.write(body.getBytes());
        }

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
        String l;
        while ((l = br.readLine()) != null) sb.append(l);
        return sb.toString();
    }
}
