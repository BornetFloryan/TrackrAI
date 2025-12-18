package org.example.steps.api;

import org.example.world.WorldContext;
import io.cucumber.java.en.*;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;

import static org.junit.jupiter.api.Assertions.*;

public class ApiModuleSteps {

    @When("j'enregistre un module avec un µC et des chipsets valides")
    public void enregistrer_module() throws Exception {

        envoyer("""
        {
          "uc": "esp32",
          "chipsets": ["lm35", "bme280"]
        }
        """);
    }

    @When("je demande la liste des modules")
    public void demander_modules() throws Exception {
        URL url = new URL(WorldContext.api.baseUrl + "/module/get");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");

        WorldContext.api.lastStatusCode = conn.getResponseCode();
        WorldContext.api.lastResponseBody = lire(conn);
    }

    @Then("une clé de module est générée")
    public void cle_generee() {
        assertTrue(
                WorldContext.api.lastResponseBody.contains("key"),
                "Aucune clé générée"
        );
    }

    private void envoyer(String body) throws Exception {
        URL url = new URL(WorldContext.api.baseUrl + "/module/register");
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
