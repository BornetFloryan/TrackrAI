Feature: Analyse multimédia

  Scenario: Analyse d’une vidéo valide
    Given une vidéo est fournie
    When le système analyse la vidéo
    Then des indicateurs sont produits
