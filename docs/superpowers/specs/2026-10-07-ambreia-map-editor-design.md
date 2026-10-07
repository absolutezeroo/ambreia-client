# Éditeur de cartes d'Ambreia — specs 2 et 3 (premier rendu)

> **Statut :** à relire par le propriétaire (feu vert donné pour aller jusqu'au premier rendu) ·
> **Date :** 2026-10-07 · **Langue :** français
> **Dépôt :** `vortex-rpg-client`, branche `editeur-cartes` (worktree séparé de la refonte J0–J6).
> Spec 1 (serveur, faite) : `vortex-rpg-emulator/docs/superpowers/specs/2026-10-07-rpg-world-map-editor-design.md`.
> Architecture client : `docs/superpowers/specs/2026-10-07-client-architecture-design.md` (§8 : World editor, J4).

---

## 1. Intention

Le propriétaire veut **utiliser** l'éditeur, pas le voir se construire : créer une zone, sculpter son
sol, y poser de vrais meubles Habbo, enregistrer, publier, puis la tester dans le jeu. Le serveur
sait déjà tout stocker, valider, publier et recharger (spec 1).

Le vrai rendu isométrique (`@ambreia/iso`, J4) et les fenêtres Habbo (`@ambreia/ui`, J3) ne sont pas
encore sortis du moteur. Le premier rendu ne les attend pas :

| Brique | Premier rendu | Quand J3/J4 arrivent |
|---|---|---|
| Cœur (document, annuler/refaire, sélection, calques, validation, client API) | **définitif** : `@ambreia/map-editor-core`, TypeScript pur | inchangé |
| Vue de la carte | **vue isométrique simple** sur canvas : cases et hauteurs, porte, emprise des meubles avec leur nom de classe | remplacée par `@ambreia/iso` (vrais sprites) ; la vue simple reste comme calque « navigation » |
| Panneaux | HTML/CSS aux couleurs Habbo | portés en fenêtres `@ambreia/ui` si utile |
| Coquille | **Tauri** (logiciel Windows) | inchangée |

## 2. Cœur : `packages/ambreia-map-editor-core` (`@ambreia/map-editor-core`)

- **Types du document** générés depuis `vortex-rpg-emulator/schemas/zone.schema.json` par
  `tools/gen-zone-types.mjs` (paquet `json-schema-to-typescript`, dépendance de dev). Le fichier
  généré est commité, et son contrôle `--check` échoue s'il diffère (même mécanisme que
  `Headers.generated.ts`). C'est l'exception au « un type par fichier » : un fichier généré n'est pas
  écrit à la main.
- **Historique** (`EditorHistory`) : chaque action produit un nouveau document immuable ; annuler et
  refaire restaurent les instantanés. Les commandes sont libellées (« Poser throne »), ce qui donne
  le panneau Historique sans code de retour arrière par commande.
- **Actions**, une par fichier : poser, déplacer, tourner et supprimer un meuble ; régler la case
  (hauteur, marchable, trou) ; peindre une zone rectangulaire de cases ; redimensionner le sol ;
  déplacer la porte.
- **Sélection** (`EditorSelection`) : ensemble d'ids, clic, Maj+clic, rectangle de cases.
- **Calques** (`LayerState`) : visible et verrouillé par calque ; état de l'éditeur, absent du document.
- **Validation locale** (`LocalValidator`) : bornes, ids en double, porte marchable, emprise dans le
  sol. Le serveur reste l'autorité : son verdict s'affiche à l'enregistrement.
- **Client API** (`EditorApiClient`) : `/api/editor/*` et la connexion web, avec un `fetch` injecté.
  Les tests n'ont donc pas besoin de réseau.
- Dépendances : aucune hors `@ambreia/common` (permise, non requise). Mur ESLint et test de frontières.

## 3. Application : `packages/ambreia-map-editor` (Tauri)

- **Coquille Tauri 2** (Rust) : une fenêtre, un titre « Ambreia — Éditeur de cartes », le menu de
  la WebView. Le front est une page Vite qui importe le cœur.
- **Connexion** : adresse du serveur (défaut `http://127.0.0.1:8080`), e-mail, mot de passe.
  L'utilisateur se connecte avec son compte, qui porte `world.zone.edit`.
- **Écran principal**, disposé comme la maquette du propriétaire :
  - barre du haut : Zones (ouvrir / créer), Enregistrer, Publier, Annuler / Refaire, Tester ;
  - à gauche : outils (Sélection, Sol : monter / descendre / trou / marchable, Porte, Mobis) ;
  - palette de meubles avec recherche par nom de classe et par id ;
  - au centre : la vue isométrique ;
  - à droite : l'inspecteur (case ou meuble sélectionné : X/Y/Z, rotation, état, supprimer) ;
  - en bas : calques, historique, constats de validation (cliquables : la vue se centre).
- **Tester** : publie si besoin, puis ouvre le client du jeu (`http://localhost:5173/?...`) dans le
  navigateur, sur un compte de test. L'entrée directe dans la zone viendra avec le ticket de test
  (spec 1 §6.6, reportée).
- **Verrou** : l'ouverture d'une zone en écriture prend le verrou ; un refus est affiché avec son
  détenteur.

## 4. Hors du premier rendu

Sprites réels (J4), fenêtres Habbo (J3), calques RPG dans l'interface (PNJ, spawns, zones logiques,
triggers… : le format les porte déjà, leurs panneaux viennent ensuite), prefabs et pinceau de
dispersion, mini-carte, vue Monde.

## 5. Critère de réussite

Lancer l'application → se connecter → créer `village_test` → sculpter un relief → poser trois
meubles de la palette, en tourner un → annuler, refaire → Enregistrer → Publier → `driver.mjs zone`
(ou le client) entre dans la zone et voit les mêmes meubles aux mêmes places.
