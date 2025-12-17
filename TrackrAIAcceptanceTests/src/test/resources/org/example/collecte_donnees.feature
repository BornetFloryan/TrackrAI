Feature: Collecte de données capteurs

  Scenario: Enregistrement d'une mesure valide
    Given un microcontrôleur est connecté au système
    When il transmet une mesure valide
    Then la mesure est enregistrée en base de données
