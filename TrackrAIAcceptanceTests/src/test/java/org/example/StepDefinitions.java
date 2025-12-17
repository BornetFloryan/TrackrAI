package org.example;

import io.cucumber.java.en.*;
import tictactoe.*;

public class StepDefinitions {

    private Grille grilleObj;
    private final String nomJoueur1 = "X";
    private final String nomJoueur2 = "O";
    private Joueur joueur1 = new IA(nomJoueur1, new java.util.Random());
    private Joueur joueur2 = new IA(nomJoueur2, new java.util.Random());
    private Joueur joueurCourant;
    private Throwable exceptionObj;



    @Given("une grille vide")
    public void uneGrilleVide() {
        grilleObj = new Grille();
        joueurCourant = joueur1;
    }

    @Given("une grille pleine sans gagnant")
    public void une_grille_pleine_sans_gagnant() {
        grilleObj = new Grille();
        try {
            grilleObj.joue(0, joueur1);
            grilleObj.joue(1, joueur2);
            grilleObj.joue(2, joueur1);
            grilleObj.joue(3, joueur1);
            grilleObj.joue(4, joueur1);
            grilleObj.joue(5, joueur2);
            grilleObj.joue(6, joueur2);
            grilleObj.joue(7, joueur1);
            grilleObj.joue(8, joueur2);
        } catch (CaseOccupeeException e) {
            exceptionObj = e;
        }
    }

    @Given("une grille avec le centre occupé")
    public void une_grille_avec_le_centre_occupe() {
        grilleObj = new Grille();
        try {
            grilleObj.joue(4, joueur1);
        } catch (CaseOccupeeException e) {
            exceptionObj = e;
        }
        joueurCourant = joueur2;
    }

    @Given("une grille avec deux pions alignés")
    public void une_grille_avec_deux_pions_alignes() {
        grilleObj = new Grille();
        try {
            grilleObj.joue(0, joueur1);
            grilleObj.joue(1, joueur1);
        } catch (CaseOccupeeException e) {
            exceptionObj = e;
        }
        joueurCourant = joueur2;
    }

    @Given("une grille avec deux pions alignés pour l'IA")
    public void une_grille_avec_deux_pions_alignés_pour_l_ia() {
        grilleObj = new Grille();
        try {
            grilleObj.joue(0, joueur2);
            grilleObj.joue(1, joueur2);
        } catch (CaseOccupeeException e) {
            exceptionObj = e;
        }
        joueurCourant = joueur2;
    }

    @When("le joueur place un pion en \\({int},{int}\\)")
    public void le_joueur_place_un_pion_en(int row, int col) {
        try {
            int index = (row - 1) * 3 + (col - 1);
            if (index < 0 || index >= 9) {
                throw new IllegalArgumentException("Index " + index + " en dehors des limites de la grille.");
            }
            grilleObj.joue(index, joueurCourant);
            exceptionObj = null;
        } catch (CaseOccupeeException | IllegalArgumentException e) {
            exceptionObj = e;
        }
        joueurCourant = (joueurCourant == joueur1) ? joueur2 : joueur1;
    }


    @When("c'est au tour de l'IA")
    public void c_est_au_tour_de_l_ia() {
        joueurCourant = joueur2;
    }

    @When("le joueur place un pion au centre")
    public void le_joueur_place_un_pion_au_centre() {
        try {
            grilleObj.joue(4, joueurCourant);
            exceptionObj = null;
        } catch (CaseOccupeeException e) {
            exceptionObj = e;
        }
        joueurCourant = (joueurCourant == joueur1) ? joueur2 : joueur1;
    }

    @Then("l'IA place un pion au centre")
    public void l_ia_place_un_pion_au_centre() {
        if (grilleObj.estLibre(4)) {
            try {
                grilleObj.joue(4, joueur2);
            } catch (CaseOccupeeException e) {
                exceptionObj = e;
            }
        }
    }

    @Then("l'IA place un pion dans un coin")
    public void l_ia_place_un_pion_dans_un_coin() {
        int[] coins = {0, 2, 6, 8};
        for (int coin : coins) {
            if (grilleObj.estLibre(coin)) {
                try {
                    grilleObj.joue(coin, joueur2);
                } catch (CaseOccupeeException e) {
                    exceptionObj = e;
                }
                break;
            }
        }
    }

    @Then("l'IA place un pion pour bloquer la victoire")
    public void l_ia_place_un_pion_pour_bloquer_la_victoire() {
        for (int i : grilleObj.casesVides()) {
            try {
                grilleObj.joue(i, joueur2);
                break;
            } catch (CaseOccupeeException e) {
                exceptionObj = e;
            }
        }
    }

    @Then("l'IA place un pion pour gagner la manche")
    public void l_ia_place_un_pion_pour_gagner_la_manche() {
        for (int i : grilleObj.casesVides()) {
            try {
                grilleObj.joue(i, joueur2);
                break;
            } catch (CaseOccupeeException e) {
                exceptionObj = e;
            }
        }
    }

    @Then("le joueur gagne la manche")
    public void le_joueur_gagne_la_manche() {
        Manche manche = new Manche();
        Joueur gagnant = manche.play(grilleObj, joueur1, joueur2);
        if (gagnant == null || !gagnant.equals(joueur1) && !gagnant.equals(joueur2)) {
            throw new AssertionError("Aucun joueur n'a gagné la manche.");
        }
    }


    @Then("la manche est déclarée nulle")
    public void la_manche_est_declaree_nulle() {
        Manche manche = new Manche();
        Joueur gagnant = manche.play(grilleObj, joueur1, joueur2);
        if (gagnant != null) {
            throw new AssertionError("Il y a un gagnant, la manche n'est pas nulle.");
        }
        if (!grilleObj.isPat()) {
            throw new AssertionError("La grille n'est pas pleine, la manche n'est pas nulle.");
        }
    }

    @Then("une erreur est levée indiquant que la case est déjà occupée")
    public void une_erreur_est_levee_car_la_case_est_deja_occupee() {
        if (exceptionObj == null) {
            throw new AssertionError("Aucune exception n’a été levée.");
        }
        if (!(exceptionObj instanceof CaseOccupeeException)) {
            throw new AssertionError("Le type d’exception n’est pas correct : " + exceptionObj.getClass().getName());
        }
    }

    @Then("une erreur est levée indiquant que le placement est invalide")
    public void une_erreur_est_levee_indiquant_que_le_placement_est_invalide() {
        if (exceptionObj == null) {
            throw new AssertionError("Aucune exception n’a été levée.");
        }
        if (!(exceptionObj instanceof IllegalArgumentException)) {
            throw new AssertionError("Le type d’exception n’est pas correct : " + exceptionObj.getClass().getName());
        }
    }
}
