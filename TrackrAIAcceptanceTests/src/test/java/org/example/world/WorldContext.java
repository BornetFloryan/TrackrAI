package org.example.world;

import org.example.world.api.ApiWorld;
import org.example.world.centralserver.CentralServerWorld;

public class WorldContext {
    public static TrackrWorld world = new TrackrWorld();
    public static CentralServerWorld centralServerWorld = new CentralServerWorld();
    public static ApiWorld api = new ApiWorld();

}
