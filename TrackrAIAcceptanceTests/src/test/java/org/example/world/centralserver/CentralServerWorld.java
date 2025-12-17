package org.example.world.centralserver;

public class CentralServerWorld {

    // État serveur
    public boolean serverDemarre;
    public boolean clientConnecte;

    // Auto-register
    public boolean autoRegisterEffectue;
    public boolean autoRegisterErreur;

    // Stockage
    public boolean mesureStockee;
    public boolean analyseStockee;

    // Erreurs
    public boolean   erreurProtocole;
    public String dernierMessageErreur;

    // Multi-clients
    public int nombreClientsConnectes;
}
