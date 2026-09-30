# Mises à jour des applications

Une release stable publiée d'agent-chat déclenche `propose-updates.yml`.
Le workflow propose l'archive exacte et le lockfile dans Organisation, Job Finder
et Talos. Il maintient une seule PR ouverte par application sur
`codex/update-agent-chat`. Les préversions sont ignorées ; une version plus ancienne
ne remplace pas une version déjà adoptée. Aucun merge automatique n'est configuré.

## Configuration unique

Dans les paramètres GitHub d'agent-chat, ajouter le secret Actions
`AGENT_UPDATE_TOKEN` avec un **fine-grained personal access token** :

- Propriétaire : `grodriguez-fr`.
- Dépôts sélectionnés uniquement : `organisation`, `job-finder`, `talos`.
- Permissions des dépôts : **Contents: Read and write** et
  **Pull requests: Read and write**. Metadata est ajouté automatiquement.
- Choisir une expiration et renouveler le secret avant cette date.

Ne pas placer le jeton dans le dépôt ni dans un message. Le token Actions standard
d'agent-chat ne peut pas écrire dans les autres dépôts privés. Utiliser le token
dédié permet aussi aux PR du bot de déclencher normalement la CI des applications.
Sans ce secret, le workflow échoue avec une instruction de configuration explicite.

Publier la release avec son asset `agent-chat-X.Y.Z.tgz` déjà attaché (préparer une
release en brouillon, puis la publier). Pour reprendre une proposition après ajout
du secret ou correction d'une release, lancer manuellement le workflow avec son tag
`vX.Y.Z`. Une version déjà adoptée avec la même archive ne produit aucune PR.

## Validation et adoption

- Organisation : contrôle TypeScript et tests existants du transport du chat dans
  `Agent chat compatibility`, plus les autres vérifications de PR présentes.
- Job Finder : CI existante `qa` (build, tests du bridge, unitaires et navigateur).
- Talos : `Validate Talos` (build TypeScript/Vite et tests existants du stream).

Lire les notes de release et vérifier les résultats avant une fusion manuelle.
Chaque application peut adopter la version à une date différente. Organisation
et Job Finder déploient selon leur CI après fusion ; Talos publie une image, dont
le déploiement sur le serveur reste une opération distincte.
Un contrôle vert ne prouve pas à lui seul la compatibilité de tous les parcours.

## Gateway

Ce workflow ne met pas à jour le gateway. Son protocole doit rester compatible
avec les versions des trois applications en production. Une rupture nécessite
une migration explicite. Déployer une image identifiée par digest, conserver
l'image précédente et son cache local pour permettre un retour arrière.
