package org.example.world.api;

public class ApiWorld {

    public String baseUrl =
            System.getenv().getOrDefault("API_BASE_URL", "http://localhost:4567/trackrapi");

    public int lastStatusCode;
    public String lastResponseBody;

    public String sessionToken;
}
