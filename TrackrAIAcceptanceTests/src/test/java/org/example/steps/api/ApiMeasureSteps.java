package org.example.steps.api;

import org.example.world.WorldContext;
import io.cucumber.java.en.*;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;

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

        WorldContext.api.lastStatusCode = conn.getResponseCode();
        WorldContext.api.lastResponseBody = lire(conn);
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
