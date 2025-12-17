Feature: Analyse IA des performances

  Scenario: Analyse sur des données existantes
    Given des données sont stockées
    When une analyse IA est lancée
    Then un indicateur est calculé


  Scenario: Analyse IA sans données
    Given aucune donnée n'est stockée
    When une analyse IA est lancée
    Then aucun indicateur n'est calculé
    And une erreur est signalée


  Scenario: Génération de recommandations après analyse IA
    Given une analyse IA a été effectuée
    When les résultats sont traités
    Then une recommandation personnalisée est générée
