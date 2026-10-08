# Révisions de production — headers tirés au hasard à chaque mise en production

> **Statut :** à relire par le propriétaire · **Date :** 2026-10-08 · **Langue :** français
> **Dépôts :** `vortex-rpg-emulator` (source de vérité, §3) et `vortex-rpg-client` (§4).
> Prolonge la §6 de `2026-10-07-client-architecture-design.md` (« les numéros de messages viennent
> de l'émulateur »).

---

## 1. Intention

Comme Habbo : **chaque mise en production tire de nouveaux identifiants de messages au hasard**,
sous un numéro de révision daté. Un bot ou un outil écrit contre une version cesse de fonctionner à
la suivante, et il ne peut pas relire la nouvelle table en clair dans le client.

**Décisions prises avec le propriétaire :**

| Sujet | Décision |
|---|---|
| Client resté sur une ancienne révision | Déconnecté, avec un message « mise à jour disponible » |
| Quand une révision naît | À chaque mise en production (pas à chaque changement de protocole, pas à chaque build) |
| Format du numéro | `AMBREIA-YYYYMMDDHHMM`, heure UTC du tirage (ex. `AMBREIA-202610081530`) |
| Noms des messages dans le client de production | Retirés : seuls les numéros restent |
| Où naît la table | Dans l'émulateur, un fichier par révision, lu par les deux côtés |

**Hors périmètre :** garder plusieurs révisions actives à la fois ; obscurcir autre chose que les
identifiants de messages (forme des paquets, chiffrement) ; changer les parsers ou serializers.

---

## 2. Vue d'ensemble

```
revision:new (émulateur) ──► Releases/AMBREIA-202610081530.json ──┬──► ReleaseRevision (émulateur, au démarrage)
                                                                  └──► build de prod du client (numéros inlinés)
```

- **En dev, rien ne change** : la révision `AMBREIA-DEV` garde les numéros de `Headers.cs`, le
  client garde ses noms.
- **En prod**, seule la dernière révision tirée est acceptée.
- **Deux identifiants sont fixes dans toutes les révisions** : `ClientHelloMessageEvent` (4000,
  client → serveur) et `DisconnectReasonComposer` (4000, serveur → client). Le premier porte le
  numéro de révision du client avant que le serveur sache quelle table lui appliquer ; le second
  doit rester lisible par un client de n'importe quelle version pour lui dire de se mettre à jour.

---

## 3. Émulateur (`vortex-rpg-emulator`)

### 3.1 Le fichier de révision

`Vortex.Revisions/Releases/AMBREIA-YYYYMMDDHHMM.json`, commité :

```json
{
  "revision": "AMBREIA-202610081530",
  "incoming": { "SSOTicketMessageEvent": 1873, "ClientHelloMessageEvent": 4000 },
  "outgoing": { "AuthenticationOKMessageComposer": 412, "DisconnectReasonComposer": 4000 }
}
```

- Une entrée par constante de `MessageEvent` (`incoming`) et de `MessageComposer` (`outgoing`).
- Numéros dans `1..3999`, uniques dans un même sens ; 4000 réservé aux deux identifiants fixes.

### 3.2 `revision:new`

Commande de l'émulateur lancée au déploiement :

1. lit les noms par réflexion sur `MessageEvent` / `MessageComposer` — exactement ceux que le
   serveur utilise, pas une copie ;
2. tire un numéro par nom avec `RandomNumberGenerator` (cryptographique : la révision suivante ne
   se déduit pas de la précédente), sans doublon, en gardant les deux identifiants fixes ;
3. écrit le JSON sous le nom `AMBREIA-` + date et heure UTC à la minute.

### 3.3 Deux révisions, aucune map réécrite

- **`AMBREIA-DEV`** : l'actuelle `Revision20260701` renommée. Ses maps, parsers et serializers ne
  changent pas ; elle continue de lire `Headers.cs`.
- **`ReleaseRevision`** : construite au démarrage à partir de `AMBREIA-DEV` et du JSON le plus
  récent de `Releases/` (le format trie dans l'ordre chronologique) :
  - **parsers** : chaque entrée de `AMBREIA-DEV` est reprise sous son nouveau numéro
    (numéro de dev → nom → numéro de la révision) ;
  - **serializers** : chacun est enveloppé ; l'enveloppe appelle le serializer d'origine puis
    réécrit l'identifiant du paquet produit (`AbstractSerializer` l'écrit en `short` à l'offset 4,
    après la longueur).

### 3.4 Quelle révision est acceptée

Configuration de l'émulateur :

- **production** : seule `ReleaseRevision` est enregistrée. `AMBREIA-DEV` est refusée — ses
  numéros sont dans le dépôt, un bot n'aurait qu'à les utiliser.
- **dev** : seule `AMBREIA-DEV` est enregistrée.

### 3.5 Poignée de main

`ClientHelloMessageHandler` rejette déjà une révision inconnue en fermant la session. Il envoie
d'abord `DisconnectReasonComposer` avec une nouvelle raison **client périmé**, puis ferme. La valeur
de cette raison est choisie au plan, hors des codes de raison que le client connaît déjà.

### 3.6 Erreurs au démarrage (production)

L'émulateur refuse de démarrer, en nommant le problème, quand :

- `Releases/` ne contient aucun fichier de révision ;
- un nom mappé par `AMBREIA-DEV` manque dans la table ;
- la table contient un doublon dans un même sens, ou un autre message que les deux fixes sur 4000.

Un nom présent dans la table mais inconnu du serveur est signalé en avertissement (message retiré
depuis le tirage).

---

## 4. Client (`vortex-rpg-client`)

### 4.1 Préalable : aucun numéro écrit en dur

`HabboMessages.ts` déclare 59 identifiants en littéraux (`this._composers.set(4000, …)`). Ils
passent tous par `Incoming.X` / `Outgoing.X` de `Headers.generated.ts`. Sans ce préalable, une
nouvelle révision changerait la table sans changer ces numéros. (C'est déjà la règle du CLAUDE.md :
« Never type a message id ».)

### 4.2 `gen-headers` en deux modes

- **Dev**, inchangé : lit `Headers.cs`, écrit `Headers.generated.ts` avec les noms, plus
  `export const REVISION = 'AMBREIA-DEV'`. Le contrôle du pre-commit ne change pas.
- **Build de prod** : lit le JSON de révision le plus récent de l'émulateur (ou celui passé en
  argument) et le fournit au build, avec `REVISION` égal au numéro de cette révision.

### 4.3 `ClientHello` envoie `REVISION`

À la place du `'WIN63-202607011411-782849652'` écrit en dur dans `ClientHelloMessageComposer`.

### 4.4 Les noms disparaissent du bundle de production

- Un plugin Vite, actif seulement au build de prod, remplace chaque `Incoming.X` / `Outgoing.X`
  par le numéro de la révision. L'objet `Incoming`/`Outgoing` n'est plus utilisé et le build
  l'élimine.
- **Le build échoue** si le client utilise un nom absent de la table, en le nommant : on ne déploie
  pas un client qui parlerait d'un message que le serveur ne connaît pas.
- **Source maps désactivées au build de prod** (`build.sourcemap` vaut aujourd'hui `true` dans
  `packages/vortex-client/vite.config.ts`) : elles contiennent le source d'origine, donc les noms.
- La minification renomme déjà les classes ; en prod les journaux qui affichent
  `constructor.name` montreront des noms courts. C'est accepté.

### 4.5 Client périmé

À réception de `DisconnectReason` avec la raison **client périmé**, le client affiche « Une mise à
jour est disponible » avec un bouton **Recharger**, à la place de l'écran de déconnexion habituel.

---

## 5. Mise en production

1. Dans l'émulateur : `revision:new`, puis commit du JSON.
2. Build du client de prod contre cette révision.
3. Déploiement des deux ensemble. Les joueurs connectés reçoivent « mise à jour disponible » à la
   reconnexion.

---

## 6. Tests et vérifications

**Émulateur :**

- le générateur couvre tous les noms de `MessageEvent` / `MessageComposer`, sans doublon, avec les
  deux identifiants fixes sur 4000 ;
- `ReleaseRevision` enregistre chaque parser sous son nouveau numéro, et le paquet d'un serializer
  enveloppé porte le nouveau numéro à l'offset 4, corps identique ;
- une révision inconnue reçoit `DisconnectReason` (client périmé) puis la fermeture ;
- démarrage en prod refusé pour chacun des cas de la §3.6.

**Client :**

- le plugin remplace `Incoming.X` / `Outgoing.X` par le bon numéro ;
- un nom absent de la table fait échouer le build ;
- **le bundle de prod ne contient aucun nom de message** : le test cherche par exemple
  `SSOTicketMessageEvent` dans le JS généré et échoue s'il le trouve ; aucun `.map` n'est produit.

**De bout en bout** (skill `run-vortex-client`) : un client de prod contre l'émulateur local en
révision de prod se connecte et entre en jeu ; un client en `AMBREIA-DEV` contre ce même émulateur
voit l'écran « mise à jour disponible ».

---

## 7. Ordre de réalisation

1. Client : `HabboMessages.ts` sur `Incoming` / `Outgoing` (§4.1) — utile seul, sans rien d'autre.
2. Émulateur : `AMBREIA-DEV`, `revision:new`, `ReleaseRevision`, sélection par config, poignée de
   main (§3).
3. Client : `REVISION`, `gen-headers` prod, plugin Vite, source maps, écran « mise à jour » (§4.2–4.5).
4. Vérification de bout en bout (§6).
