package org.example.steps;

import io.cucumber.java.Before;
import org.example.world.WorldContext;
import org.example.world.TrackrWorld;

public class Hooks {

    @Before
    public void resetWorld() {
        WorldContext.world = new TrackrWorld();
    }
}
