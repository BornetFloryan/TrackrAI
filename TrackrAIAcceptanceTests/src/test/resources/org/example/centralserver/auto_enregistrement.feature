Feature: Auto-enregistrement d'un microcontrôleur

  Scenario: Enregistrement valide d'un microcontrôleur
    Given le serveur central est démarré
    And un client TCP est connecté
    When le client envoie une requête AUTOREGISTER valide
    Then le module est enregistré
    And une confirmation d'enregistrement est retournée

  Scenario: Auto-enregistrement avec paramètres invalides
    Given le serveur central est démarré
    And un client TCP est connecté
    When le client envoie une requête AUTOREGISTER invalide
    Then une erreur d'enregistrement est retournée
