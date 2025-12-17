Feature: Gestion des microcontrôleurs

  Scenario: Consultation de la flotte de microcontrôleurs
    Given un administrateur est authentifié
    When il consulte la liste des microcontrôleurs
    Then les microcontrôleurs enregistrés sont affichés