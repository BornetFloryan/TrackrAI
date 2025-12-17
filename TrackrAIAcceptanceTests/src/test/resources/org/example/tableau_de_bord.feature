Feature: Consultation du tableau de bord

  Scenario: Consultation des performances sportives
    Given un utilisateur est authentifié
    When il consulte son tableau de bord
    Then ses indicateurs de performance sont affichés
    And ses recommandations IA sont visibles


  Scenario: Accès refusé au tableau de bord
    Given un utilisateur n'est pas authentifié
    When il tente d'accéder au tableau de bord
    Then l'accès est refusé
