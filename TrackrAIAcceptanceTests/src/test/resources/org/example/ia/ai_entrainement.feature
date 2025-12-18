@ia
Feature: Entraînement du modèle prédictif IA

  Scenario: Entraînement du modèle sur des données de cyclisme
    Given des données d'entraînement sont disponibles
    When je lance l'entraînement du modèle IA
    Then le statut de la réponse IA doit être 404
