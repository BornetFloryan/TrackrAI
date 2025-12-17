Feature: Authentification utilisateur

  Scenario: Connexion réussie
    Given un utilisateur possède un compte valide
    When il se connecte à l'application
    Then l'accès est autorisé


  Scenario: Connexion refusée
    Given un utilisateur possède des identifiants invalides
    When il tente de se connecter
    Then l'accès est refusé
    And un message d'erreur est affiché
