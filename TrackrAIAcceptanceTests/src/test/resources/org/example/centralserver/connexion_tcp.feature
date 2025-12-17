Feature: Connexion TCP au serveur central

  Scenario: Un client se connecte au serveur
    Given le serveur central est démarré
    When un client TCP se connecte
    Then la connexion au server est acceptée
