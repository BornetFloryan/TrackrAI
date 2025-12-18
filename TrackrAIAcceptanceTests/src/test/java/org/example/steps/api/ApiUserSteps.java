package org.example.steps.api;

import org.example.world.WorldContext;
import io.cucumber.java.en.*;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;

public class ApiUserSteps {

    @When("je crée un utilisateur avec des données valides")
    public void creer_utilisateur() throws Exception {

        envoyer("""
        {
          "login": "user_test",
          "password": "password123",
          "email": "user@test.com",
          "rights": ["basic"]
        }
        """);
    }

    @When("je crée un utilisateur avec un login déjà existant")
    public void creer_login_existant() throws Exception {
        creer_utilisateur();
    }

    @Given("je suis authentifié")
    public void je_suis_authentifie() throws Exception {
        new ApiAuthSteps().login_valide();
    }

    @When("je demande la liste des utilisateurs")
    public void demander_utilisateurs() throws Exception {

        URL url = new URL(WorldContext.api.baseUrl + "/user/getusers");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("x-session-id", WorldContext.api.sessionToken);

        WorldContext.api.lastStatusCode = conn.getResponseCode();
        WorldContext.api.lastResponseBody = lire(conn);
    }

    private void envoyer(String body) throws Exception {
        URL url = new URL(WorldContext.api.baseUrl + "/user/create");
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
