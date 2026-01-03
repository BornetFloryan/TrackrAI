package org.example.steps.centralserver;

import java.io.*;
import java.net.Socket;

public class CentralServerContext {

    public Socket socket;
    public BufferedReader in;
    public PrintWriter out;

    public String lastResponse;
    public String moduleKey;

    public String host = System.getenv()
            .getOrDefault("CENTRAL_HOST", "localhost");

    public int port = Integer.parseInt(
            System.getenv().getOrDefault("CENTRAL_PORT", "29000")
    );
}
