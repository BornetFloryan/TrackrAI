@central
Feature: Stockage des analyses

  Scenario: Analyse valide
    Given le serveur central est accessible
    When une analyse valide est envoyée
    Then l'analyse est acceptée
