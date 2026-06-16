@ia
Feature: Entraînement du modèle prédictif IA

  Scenario: Entraînement du modèle sur des données de cyclisme
    Given des données d'entraînement sont disponibles
    And je suis authentifié
    When je lance l'entraînement du modèle IA
    Then le statut de la réponse IA doit être 200
    And le modèle IA est entraîné avec succès
