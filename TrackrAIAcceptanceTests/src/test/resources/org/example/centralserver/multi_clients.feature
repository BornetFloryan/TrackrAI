Feature: Gestion de plusieurs clients TCP

  Scenario: Connexion simultanée de plusieurs clients
    Given le serveur central est démarré
    When plusieurs clients se connectent
    Then chaque client est pris en charge
