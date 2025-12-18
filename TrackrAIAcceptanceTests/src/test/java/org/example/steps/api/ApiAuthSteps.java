package org.example.steps.api;

import org.example.world.WorldContext;
import io.cucumber.java.en.*;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;

import static org.junit.jupiter.api.Assertions.*;

public class ApiAuthSteps {

    @When("je me connecte avec un login valide et un mot de passe valide")
    public void login_valide() throws Exception {
        envoyerRequeteAuth("admin", "admin");

        if (WorldContext.api.lastResponseBody.contains("token")) {
            String body = WorldContext.api.lastResponseBody;
            WorldContext.api.sessionToken =
                    body.substring(body.indexOf("token") + 7)
                            .replaceAll("[^a-zA-Z0-9-]", "");
        }
    }

    @When("je me connecte avec un login valide et un mot de passe invalide")
    public void login_invalide() throws Exception {
        envoyerRequeteAuth("admin", "wrongpassword");
    }

    @Then("un token de session est retourné")
    public void token_retourne() {
        assertTrue(
                WorldContext.api.lastResponseBody.contains("token"),
                "Aucun token trouvé"
        );
    }

    private void envoyerRequeteAuth(String login, String password) throws Exception {

        URL url = new URL(WorldContext.api.baseUrl + "/auth/signin");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();

        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);

        String body = """
        {
          "login": "%s",
          "password": "%s"
        }
        """.formatted(login, password);

        try (OutputStream os = conn.getOutputStream()) {
            os.write(body.getBytes());
        }

        WorldContext.api.lastStatusCode = conn.getResponseCode();

        InputStream is = conn.getResponseCode() >= 400
                ? conn.getErrorStream()
                : conn.getInputStream();

        WorldContext.api.lastResponseBody = lire(is);
    }

    private String lire(InputStream is) throws Exception {
        if (is == null) return "";
        BufferedReader br = new BufferedReader(new InputStreamReader(is));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) sb.append(line);
        return sb.toString();
    }
}
