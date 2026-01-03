package org.example.steps.centralserver;

import io.cucumber.java.en.*;
import static org.junit.jupiter.api.Assertions.*;

import java.net.Socket;
import java.io.*;

public class CentralServerConnectionSteps {

    @Given("le serveur central est accessible")
    public void serveur_accessible() throws Exception {
        CentralServerHooks.ctx.socket =
                new Socket(
                        CentralServerHooks.ctx.host,
                        CentralServerHooks.ctx.port
                );

        CentralServerHooks.ctx.in =
                new BufferedReader(
                        new InputStreamReader(
                                CentralServerHooks.ctx.socket.getInputStream()
                        )
                );

        CentralServerHooks.ctx.out =
                new PrintWriter(
                        CentralServerHooks.ctx.socket.getOutputStream(),
                        true
                );

        assertTrue(CentralServerHooks.ctx.socket.isConnected());
    }
}
