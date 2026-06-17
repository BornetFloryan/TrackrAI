# Limites corrigees et perspectives

## Capteurs

Les mesures GPS et accelerometre restent sensibles au materiel, mais le traitement a ete renforce :

- suppression des points GPS trop proches, des sauts irrealisables et des vitesses aberrantes ;
- estimation des pas par seuil adaptatif sur la norme accelerometre ;
- ajout d'un indicateur de fiabilite pour GPS et pas.

Ces corrections reduisent les valeurs incoherentes, sans transformer les capteurs en reference scientifique.

## Analyse video

Le POC analyse le squat avec MediaPipe/OpenCV et propose deux extensions experimentales :

- squat : detection des repetitions, profondeur, inclinaison du buste, symetrie gauche/droite ;
- developpe couche : detection heuristique via l'angle des coudes ;
- souleve de terre : detection heuristique via l'extension de hanche ;
- score, erreurs, conseils et stockage dans l'historique.

Les modes developpe couche et souleve de terre reduisent la limite "squat uniquement", mais restent a presenter comme experimentaux. Ils dependent fortement de l'angle de camera, de la visibilite du corps et d'une validation sur davantage de videos.

## IA et LLM

Le score de seance utilise un pipeline XGBoost exploitable pour la demonstration. Pour rendre la demo plus robuste avec peu de donnees, l'entrainement ajoute une augmentation synthetique controlee autour des seances reelles. Cela stabilise le modele, mais ne remplace pas un vrai dataset multi-athletes annote.

La generation de programmes personnalises par LLM n'est pas integree dans TrackrAI final. Elle reste une perspective credible grace au prototype LifterLens, qui combine prediction SBD et generation de programme. Une integration future pourrait utiliser :

- historique des seances TrackrAI ;
- fatigue et recuperation ;
- progression ;
- objectifs sportifs ;
- resultats d'analyse video.

## Roles

La relation coach/sportif est modelisee en "un sportif a un coach referent" et "un coach suit plusieurs sportifs".

- Un admin affecte un coach a un sportif.
- Un coach peut consulter ses sportifs et voir la liste globale.
- Un sportif voit son coach referent.
