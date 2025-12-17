Feature: Analyse multimédia

  Scenario: Analyse d'une vidéo valide
    Given une vidéo est fournie
    When le système analyse la vidéo
    Then des indicateurs sont produits


  Scenario: Analyse impossible d'une vidéo invalide
    Given une vidéo est fournie
    When la vidéo est invalide
    Then l'analyse échoue
    And une erreur est produite


  Scenario: Analyse impossible si le système est indisponible
    Given le système d'analyse est indisponible
    When une vidéo est envoyée
    Then aucune analyse n'est effectuée
    And une erreur est signalée