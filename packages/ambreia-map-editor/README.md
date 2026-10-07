# Éditeur de cartes d'Ambreia

Logiciel Windows (Tauri 2) au-dessus de `@ambreia/map-editor-core`, disposé comme les maquettes du
propriétaire (`vortex-rpg-client/mockup/map-editor`). Spec :
`docs/superpowers/specs/2026-10-07-ambreia-map-editor-design.md`.

## Lancer

1. L'émulateur tourne, avec son API web sur `:8080` (le plugin `Vortex.WebApi` chargé).
2. `vortex-imager` tourne sur `:8081` pour les vrais sprites et les miniatures :
   `pnpm imager:build` une fois, puis `pnpm imager` ; ou `pnpm dev`, qui le démarre avec le client.
   Sans lui, les mobis sont dessinés en blocs.
3. Depuis la racine du dépôt : `pnpm editor`. La première fois, Cargo compile la coquille (≈ 2 min).
   Sans Rust : `pnpm editor:web`, puis ouvrir http://localhost:5178 dans le navigateur.
4. Se connecter avec un compte du site qui a le droit `world.zone.edit` (le rôle owner l'a).

Le proxy de Vite envoie `/api` vers `http://127.0.0.1:8080` et `/habbo-imaging` vers
`http://127.0.0.1:8081` (`AMBREIA_API`, `AMBREIA_IMAGER` pour d'autres adresses).

## Utiliser

| Catégorie | Ce qu'on y fait |
|---|---|
| Sol | Sélection (S), Ajouter case (A), Supprimer case (D), Monter (R), Descendre (F), Rectangle (C), Remplir (B), Non marchable (W, Maj : marchable), Porte (P), Spawn joueur (J) ; hauteur à peindre 0–7 ou plus ; modèles de salle |
| Mobis | Catalogue par catégorie, Favoris, Récents, recherche ; clic sur un mobi puis sur le sol pour le poser ; Sélection (S), Déplacer (M), Rotation (R), Ctrl+C / Ctrl+V (sous le pointeur) / Ctrl+D, Suppr, Verrouiller |
| Paramètres | Nom, région, capacité, type de map, niveau, PvP, musique, météo, modèle |
| Validation | Les contrôles locaux en continu ; « Vérifier la map » ajoute ceux du serveur |

À droite, les propriétés de la sélection (mobi, cases) ou de la salle. En bas : mini-carte
(cliquer pour s'y rendre), calques (visible, verrouillé), informations, journal et historique
(cliquer une ligne pour y revenir). Vue : clic droit pour déplacer, molette pour zoomer ; le menu
Affichage règle la grille, les hauteurs, les murs et les vrais mobis.

PNJ, Spawns de monstres, Zones, Triggers et Audio arrivent avec les calques RPG (lot B).
