


# banking-system-api

Description du système bancaire (API REST). Ce projet permet de gérer les opérations bancaires de base, l'authentification des utilisateurs, la gestion des comptes et la sécurisation des transactions financières.


## Prerequis

Avant de lancer le projet, assurez-vous d'installer les outils suivants sur votre machine :
* Node.js (Version 18 ou supérieure recommandée)
* NPM (inclus avec Node.js)
* Une base de données PostgreSQL active et configurée



## Commandes pour lancer le projet

Voici toutes les étapes et les commandes nécessaires pour configurer, initialiser et démarrer l'application.

### 1. Installation des dependances
A exécuter à la racine du projet pour installer tous les modules requis :
```bash
npm install
```

### 2. Synchronisation de la base de donnees

A exécuter pour créer ou réinitialiser les tables de la base de données selon vos modèles Sequelize :

```bash
npm run db:sync
```

### 3. Lancement en mode developpement

Permet de démarrer le serveur avec un rechargement automatique à chaque modification du code source :

```bash
npm run dev
```

### 4. Compilation et lancement en production

Pour préparer et lancer l'application dans un environnement de production :

Compiler le code TypeScript en JavaScript :

```bash
npm run build
```

Démarrer le serveur à partir des fichiers compilés :

```bash
npm start
```

### 5. Execution des tests

Pour lancer la suite de tests unitaires et d'intégration avec Jest :

```bash
npm test
```
