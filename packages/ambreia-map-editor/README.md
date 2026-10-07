# Éditeur de cartes d'Ambreia

Logiciel Windows (Tauri 2) au-dessus de `@ambreia/map-editor-core`. Spec :
`docs/superpowers/specs/2026-10-07-ambreia-map-editor-design.md`.

## Lancer

1. L'émulateur tourne, avec son API web sur `:8080` (le plugin `Vortex.WebApi` chargé).
2. Depuis la racine du dépôt : `pnpm editor`. La première fois, Cargo compile la coquille (≈ 2 min).
   Sans Rust : `pnpm editor:web`, puis ouvrir http://localhost:5178 dans le navigateur.
3. Se connecter avec un compte du site qui a le droit `world.zone.edit` (le rôle owner l'a).

Le proxy de Vite envoie `/api` vers `http://127.0.0.1:8080` (`AMBREIA_API` pour un autre serveur).

## Utiliser

| Action | Comment |
|---|---|
| Ouvrir / créer une zone | écran Zones ; la zone ouverte est verrouillée à votre nom |
| Sculpter le sol | outils ⬆ ⬇ (2, 3), trou ◌ (4), non marchable ⛔ (5) ; Maj inverse ; glisser peint plusieurs cases |
| Poser un meuble | chercher dans la palette (nom de classe ou id), cliquer, puis cliquer sur le sol (7) |
| Sélectionner, déplacer | outil ⬚ (1) : clic, Maj+clic, glisser un meuble ; glisser sur le sol choisit des cases |
| Tourner, supprimer | R, Suppr, ou l'inspecteur à droite |
| Annuler, refaire | Ctrl+Z, Ctrl+Y, ou un clic dans l'Historique |
| Enregistrer, publier | Ctrl+S, puis Publier : la room de la zone se recharge, les joueurs dedans y reviennent |
| Tester | publie si besoin et ouvre le client du jeu (http://localhost:5173) |
| Vue | clic droit pour déplacer, molette pour zoomer |

Les constats viennent de la validation locale et du serveur (à l'enregistrement) ; un clic sur
un constat lié à un meuble le sélectionne.
