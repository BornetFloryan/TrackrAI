package org.example.steps.centralserver;

import io.cucumber.java.After;
import io.cucumber.java.Before;

public class CentralServerHooks {

    public static CentralServerContext ctx;

    @Before("@central")
    public void setup() {
        ctx = new CentralServerContext();
    }

    @After("@central")
    public void cleanup() throws Exception {
        if (ctx.socket != null && !ctx.socket.isClosed()) {
            ctx.socket.close();
        }
    }
}
