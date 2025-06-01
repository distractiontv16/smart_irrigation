SmartIrrigation

## Application d'Irrigation Intelligente pour l'Agriculture Béninoise

![Logo SmartIrrigation ](https://placeholder.com/logo)

## Table des matières
1. [Description du projet](#description-du-projet)
2. [Objectifs](#objectifs)
3. [Public cible](#public-cible)
4. [Fonctionnalités principales](#fonctionnalités-principales)
5. [Architecture du système](#architecture-du-système)
6. [Workflow utilisateur](#workflow-utilisateur)
7. [Description des écrans](#description-des-écrans)
8. [Charte graphique](#charte-graphique)
9. [Technologies utilisées](#technologies-utilisées)
10. [Installation et déploiement](#installation-et-déploiement)
11. [Perspectives d'évolution](#perspectives-dévolution)

## Description du projet

SmartIrrigation est une application mobile intelligente développée pour les agriculteurs béninois, visant à optimiser l'irrigation des cultures grâce à une analyse précise des données météorologiques et des besoins spécifiques des plantes. En utilisant des algorithmes d'intelligence artificielle, l'application génère des recommandations personnalisées pour maximiser les rendements agricoles tout en économisant l'eau, une ressource précieuse.

Le projet répond à plusieurs défis majeurs de l'agriculture béninoise :
- La gestion inefficace de l'irrigation basée sur des méthodes traditionnelles
- L'adaptation aux différents types de sols présents dans le pays
- La variation des conditions climatiques selon les régions
- Le besoin d'informations précises et accessibles pour les agriculteurs

## Objectifs

- Fournir des recommandations d'irrigation personnalisées et précises
- Réduire le gaspillage d'eau en optimisant les apports
- Améliorer les rendements agricoles
- Rendre l'information accessible à tous les agriculteurs, indépendamment de leur niveau d'éducation ou de leur langue
- Créer une communauté d'entraide entre agriculteurs

## Public cible

- Agriculteurs béninois cultivant des tomates, du maïs ou de la laitue
- Extensions prévues pour d'autres cultures
- Adapté aux petites, moyennes et grandes exploitations

## Fonctionnalités principales

1. **Recommandations d'irrigation intelligentes**
   - Calcul précis des besoins en eau basé sur les conditions météorologiques et le type de sol
   - Notifications quotidiennes avec instructions claires

2. **Suivi météorologique en temps réel**
   - Température, humidité, précipitations, ensoleillement
   - Alertes pour conditions météorologiques exceptionnelles

3. **Personnalisation selon les cultures et types de sol**
   - Adaptation aux besoins spécifiques de chaque plante
   - Prise en compte des différents types de sols béninois

4. **Mode hors-ligne**
   - Fonctionnement partiel sans connexion internet
   - Synchronisation automatique lors de la reconnexion

6. **Support multilingue**
   - Interface disponible en français et langues locales (fon)

7. **Analyse IA et conseils avancés**
   - Visualisation des données historiques
   - Prédictions et tendances

## Architecture du système

```
┌───────────────────┐     ┌────────────────────┐     ┌───────────────────┐
│  Application      │     │  Backend API        │     │  Services externes │
│  Mobile           │◄───►│  - Authentification │◄───►│  - API Météo      │
│  - UI/UX          │     │  - Base de données  │     │  - Stockage cloud │
│  - Stockage local │     │  - Moteur IA        │     └───────────────────┘
└───────────────────┘     └────────────────────┘
```

## Workflow utilisateur

1. **Inscription et configuration initiale**
   - Création de compte
   - Sélection de la langue préférée
   - Configuration de la localisation

2. **Configuration des cultures**
   - Sélection du type de culture
   - Indication de la date de plantation/semis
   - Précision de la surface cultivée
   - Sélection du type de sol

3. **Utilisation quotidienne**
   - Consultation des recommandations d'irrigation
   - Réception des alertes météorologiques
   - Consultation des conseils IA

4. **Suivi et adaptation**
   - Saisie des actions d'irrigation réalisées (facultatif)
   - Consultation des analyses et statistiques
   - Participation aux discussions communautaires

5. **Cycle de culture**
   - Indication de la fin de cycle
   - Saisie du rendement obtenu
   - Recommandations pour le prochain cycle

## Description des écrans

### 1. Écran de connexion/inscription
**Objectif** : Permettre l'authentification de l'utilisateur ou la création d'un nouveau compte.

**Éléments** :
- Logo SmartAgri
- Champs de saisie (email/numéro de téléphone et mot de passe)
- Bouton de connexion
- Option "Créer un compte"
- Choix de la langue (français, fon, yoruba, goun)
- Option "Mot de passe oublié"

**Interactions** :
- Validation des informations d'identification
- Redirection vers l'écran d'accueil après connexion réussie
- Redirection vers formulaire d'inscription si "Créer un compte"

### 2. Écran d'accueil
**Objectif** : Fournir un aperçu rapide des conditions météorologiques et permettre la sélection des cultures.

**Éléments** :
- En-tête avec logo et menu
- Carte météo du jour (température, humidité, précipitations, ensoleillement)
- Prévisions météo à court terme (24-48h)
- Sélection des cultures (maïs, tomate, laitue) avec icônes
- Sélection du type de sol (sablonneux, argileux, limoneux)
- Champ pour indiquer la superficie (m²)
- Barre de navigation principale

**Interactions** :
- Sélection d'une culture mène à l'écran de détail/recommandation
- Mise à jour automatique des données météo
- Menu hamburger pour accéder aux autres sections

### 3. Écran de recommandations
**Objectif** : Afficher les recommandations d'irrigation personnalisées pour la culture sélectionnée.

**Éléments** :
- En-tête avec type de culture et type de sol
- Recommandations du jour :
  - Quantité d'eau (L/m²)
  - Fréquence d'irrigation
  - Moment optimal pour l'irrigation
- Alertes météo spécifiques
- Indicateur du stade de croissance
- Interrupteur pour le mode hors-ligne
- Bouton pour marquer comme "réalisé"

**Interactions** :
- Activation/désactivation du mode hors-ligne
- Marquage des recommandations comme "réalisées"
- Navigation vers les détails des alertes

### 4. Écran de conseils IA
**Objectif** : Fournir des analyses approfondies et des conseils basés sur l'IA.

**Éléments** :
- Graphiques d'évolution (besoins en eau, température, humidité)
- Statistiques comparatives (économies d'eau réalisées)
- Prédictions à moyen terme (7-14 jours)
- Conseils personnalisés basés sur l'analyse des données
- Facteurs influençant les recommandations actuelles
- Explications sur les calculs d'évapotranspiration

**Interactions** :
- Sélection de différentes périodes pour les graphiques
- Accès à des conseils détaillés
- Navigation entre différentes métriques

### 5. Écran de notifications
**Objectif** : Centraliser toutes les alertes et recommandations envoyées à l'utilisateur.

**Éléments** :
- Liste chronologique des notifications
- Catégorisation (irrigation, alertes météo, conseils)
- Statut (lue/non lue, traitée/non traitée)
- Détails de chaque notification
- Options de filtrage

**Interactions** :
- Marquer comme lu/non lu
- Filtrer par type ou date
- Accéder directement aux écrans correspondants

### 6. Écran communautaire
**Objectif** : Permettre les échanges entre agriculteurs et le partage d'expériences.

**Éléments** :
- Forum de discussion par thématiques
- Section de questions/réponses
- Partage de photos de cultures
- Témoignages et retours d'expérience
- Classement des meilleurs conseils

**Interactions** :
- Publication de messages ou questions
- Commentaires et réponses
- Évaluation des conseils (utile/pas utile)
- Filtrage par région ou type de culture

### 7. Écran de paramètres
**Objectif** : Permettre la personnalisation de l'application selon les préférences de l'utilisateur.

**Éléments** :
- Profil utilisateur (nom, localisation, superficie totale cultivée)
- Préférences de notification (fréquence, horaires)
- Choix de la langue
- Gestion du mode hors-ligne (données à synchroniser)
- Options de confidentialité
- Aide et support

**Interactions** :
- Modification des informations personnelles
- Activation/désactivation des notifications
- Changement de langue
- Configuration du mode hors-ligne

### 8. Écran de suivi de culture
**Objectif** : Suivre l'évolution d'une culture spécifique tout au long de son cycle.

**Éléments** :
- Informations de base (type, date de plantation, superficie)
- Timeline du cycle de croissance
- Historique des irrigations
- Journal des événements (météo exceptionnelle, maladies)
- Prévision de rendement
- Option pour marquer la fin du cycle

**Interactions** :
- Ajout d'observations personnelles
- Consultation de l'historique
- Navigation dans la timeline
- Saisie du rendement final

## Charte graphique

### Palette de couleurs

**Couleurs principales** :
- **Vert foncé** (#3A7D44): Couleur principale, utilisée pour les en-têtes et éléments importants
- **Vert clair** (#6CBB7A): Éléments secondaires, boutons et accents
- **Vert pastel** (#A5D6A7): Arrière-plans et zones de contenu

**Couleurs secondaires** :
- **Bleu** (#4A90E2): Éléments liés à l'eau et l'irrigation
- **Jaune** (#F5C731): Alertes et notifications importantes
- **Terre** (#A67C52): Éléments liés au sol

**Couleurs neutres** :
- **Blanc** (#FFFFFF): Arrière-plan principal
- **Gris clair** (#F0F0F0): Séparateurs et zones inactives
- **Gris foncé** (#555555): Texte principal

### Typographie
- **Titres**: Montserrat Bold
- **Corps de texte**: Open Sans
- **Données et chiffres**: Roboto Mono

### Iconographie
- Style: Flat design avec contours légers
- Cohérence visuelle entre toutes les icônes
- Utilisation d'icônes intuitives pour les fonctions agricoles

## Technologies utilisées

### Frontend
- Framework: React Native
- Gestion d'état: Redux
- Graphiques: React Native Charts
- Stockage local: AsyncStorage
- Localisation: i18next

### Backend
- API: Node.js avec Express
- Base de données: MongoDB
- Authentification: JWT
- IA/ML: TensorFlow/XGBoost
- Intégration API météo: OpenWeatherMap/AccuWeather

### Infrastructure
- Serveur: AWS/Google Cloud
- CI/CD: GitHub Actions
- Monitoring: Sentry


## Perspectives d'évolution

1. **Intégration de capteurs IoT**
   - Connexion avec des capteurs d'humidité du sol
   - Stations météo locales pour des données plus précises

2. **Extension à d'autres cultures**
   - Élargissement de la base de données de cultures
   - Prise en compte des associations de cultures

3. **Fonctionnalités avancées d'IA**
   - Détection de maladies par analyse d'images
   - Prédiction de rendement basée sur l'historique

4. **Intégration avec d'autres services**
   - Connexion avec les services de météorologie nationaux
   - Intégration avec des plateformes de commerce agricole

5. **Amélioration de l'accessibilité**
   - Support pour plus de langues locales
   - Version USSD pour téléphones basiques


Je vais analyser le README et proposer une structure complète pour le projet SmartIrrigation.

Ran tool
Basé sur l'analyse du README et la structure actuelle du projet, voici une proposition de structure complète pour le projet SmartIrrigation:

## Structure du Front-end (Application Mobile - React Native/Expo)

```
/SmartIrrigation
├── app/                            # Application mobile (Expo Router)
│   ├── (auth)/                     # Routes protégées par authentification
│   │   ├── home.tsx                # Écran d'accueil
│   │   ├── recommendations/        # Écrans liés aux recommandations d'irrigation
│   │   │   ├── [cultureId].tsx     # Détails pour une culture spécifique
│   │   │   └── index.tsx           # Liste des recommandations
│   │   ├── weather/                # Suivi météorologique
│   │   │   └── index.tsx           # Écran météo
│   │   ├── ai-insights/            # Conseils IA
│   │   │   └── index.tsx           # Analyses et prédictions
│   │   ├── community/              # Section communautaire
│   │   │   ├── index.tsx           # Forum principal
│   │   │   └── [topicId].tsx       # Discussion spécifique
│   │   ├── crops/                  # Gestion des cultures
│   │   │   ├── index.tsx           # Liste des cultures
│   │   │   ├── add.tsx             # Ajout d'une culture
│   │   │   └── [cropId].tsx        # Suivi d'une culture spécifique
│   │   └── settings/               # Paramètres utilisateur
│   │       └── index.tsx           # Écran de paramètres
│   ├── (public)/                   # Routes publiques
│   │   ├── index.tsx               # Écran de connexion
│   │   ├── register.tsx            # Inscription
│   │   ├── forgot-password.tsx     # Récupération de mot de passe
│   │   └── language-select.tsx     # Sélection de la langue
│   └── _layout.tsx                 # Layout principal de l'application
├── assets/                         # Ressources statiques
│   ├── fonts/                      # Polices (Montserrat, Open Sans, Roboto Mono)
│   ├── images/                     # Images et illustrations
│   │   ├── crops/                  # Images des cultures
│   │   ├── soil-types/             # Images des types de sol
│   │   └── weather/                # Icônes météo
│   └── icons/                      # Icônes personnalisées
├── components/                     # Composants réutilisables
│   ├── ui/                         # Composants UI de base
│   │   ├── Button.tsx              # Bouton personnalisé
│   │   ├── Card.tsx                # Carte
│   │   ├── Input.tsx               # Champ de saisie
│   │   └── ...                     # Autres composants UI
│   ├── weather/                    # Composants liés à la météo
│   │   ├── WeatherCard.tsx         # Carte météo
│   │   └── ForecastItem.tsx        # Élément de prévision
│   ├── crops/                      # Composants liés aux cultures
│   │   ├── CropCard.tsx            # Carte de culture
│   │   └── GrowthStageIndicator.tsx # Indicateur de stade de croissance
│   ├── recommendations/            # Composants pour les recommandations
│   │   ├── IrrigationCard.tsx      # Carte de recommandation d'irrigation
│   │   └── AlertBanner.tsx         # Bannière d'alerte
│   ├── community/                  # Composants communautaires
│   │   ├── PostItem.tsx            # Élément de post
│   │   └── CommentList.tsx         # Liste de commentaires
│   └── charts/                     # Graphiques et visualisations
│       ├── WaterUsageChart.tsx     # Graphique d'utilisation d'eau
│       └── TemperatureChart.tsx    # Graphique de température
├── constants/                      # Constantes de l'application
│   ├── Colors.ts                   # Palette de couleurs
│   ├── Layout.ts                   # Constantes de mise en page
│   ├── Crops.ts                    # Types de cultures
│   └── SoilTypes.ts                # Types de sol
├── hooks/                          # Hooks personnalisés
│   ├── useWeather.ts               # Hook pour les données météo
│   ├── useOfflineMode.ts           # Gestion du mode hors-ligne
│   ├── useIrrigation.ts            # Calculs d'irrigation
│   └── useCommunity.ts             # Interactions communautaires
├── services/                       # Services et intégrations API
│   ├── api.ts                      # Configuration et intercepteurs API
│   ├── auth.service.ts             # Service d'authentification
│   ├── weather.service.ts          # Service météo
│   ├── crops.service.ts            # Service de gestion des cultures
│   ├── recommendations.service.ts  # Service de recommandations
│   └── community.service.ts        # Service communautaire
├── utils/                          # Utilitaires
│   ├── dateFormatter.ts            # Formatage des dates
│   ├── waterCalculator.ts          # Calcul des besoins en eau
│   ├── storage.ts                  # Gestion du stockage local
│   └── i18n.ts                     # Internationalisation
└── store/                          # Gestion d'état (Redux)
    ├── index.ts                    # Configuration du store
    ├── slices/                     # Slices Redux
    │   ├── authSlice.ts            # Authentification
    │   ├── weatherSlice.ts         # Données météo
    │   ├── cropsSlice.ts           # Cultures
    │   └── recommendationsSlice.ts # Recommandations d'irrigation
    └── middleware/                 # Middleware Redux
        └── offlineSync.ts          # Synchronisation hors-ligne
```

## Structure du Back-end (Node.js/Express)

```
/SmartIrrigation-API
├── src/                           # Source du backend
│   ├── api/                       # Endpoints API
│   │   ├── routes/                # Définition des routes
│   │   │   ├── auth.routes.js     # Routes d'authentification
│   │   │   ├── users.routes.js    # Routes utilisateurs
│   │   │   ├── crops.routes.js    # Routes des cultures
│   │   │   ├── weather.routes.js  # Routes météo
│   │   │   ├── recommendations.routes.js # Routes de recommandations
│   │   │   └── community.routes.js # Routes communautaires
│   │   ├── controllers/           # Contrôleurs
│   │   │   ├── auth.controller.js # Contrôleur d'authentification
│   │   │   ├── users.controller.js # Contrôleur utilisateurs
│   │   │   ├── crops.controller.js # Contrôleur des cultures
│   │   │   ├── weather.controller.js # Contrôleur météo
│   │   │   ├── recommendations.controller.js # Contrôleur de recommandations
│   │   │   └── community.controller.js # Contrôleur communautaire
│   │   └── middleware/            # Middleware API
│   │       ├── auth.middleware.js # Middleware d'authentification
│   │       ├── validation.middleware.js # Validation des requêtes
│   │       └── errorHandler.middleware.js # Gestion des erreurs
│   ├── models/                    # Modèles de données
│   │   ├── user.model.js          # Modèle utilisateur
│   │   ├── crop.model.js          # Modèle de culture
│   │   ├── soil.model.js          # Modèle de sol
│   │   ├── weather.model.js       # Modèle météo
│   │   ├── recommendation.model.js # Modèle de recommandation
│   │   └── post.model.js          # Modèle de post communautaire
│   ├── services/                  # Services métier
│   │   ├── auth.service.js        # Service d'authentification
│   │   ├── weather.service.js     # Service météo (intégration API externe)
│   │   ├── irrigation.service.js  # Calculs d'irrigation
│   │   ├── notification.service.js # Gestion des notifications
│   │   └── ai.service.js          # Modèles IA et prédictions
│   ├── utils/                     # Utilitaires
│   │   ├── logger.js              # Journalisation
│   │   ├── validators.js          # Validation des données
│   │   ├── constants.js           # Constantes partagées
│   │   └── waterCalculator.js     # Algorithmes de calcul des besoins en eau
│   ├── config/                    # Configuration
│   │   ├── database.js            # Configuration de la base de données
│   │   ├── environment.js         # Variables d'environnement
│   │   └── ai-models.js           # Configuration des modèles IA
│   └── app.js                     # Point d'entrée de l'application
├── data/                          # Données de référence
│   ├── crops/                     # Données des cultures
│   │   ├── tomato.json            # Besoins spécifiques des tomates
│   │   ├── corn.json              # Besoins spécifiques du maïs
│   │   └── lettuce.json           # Besoins spécifiques de la laitue
│   └── soil-types/                # Types de sols
│       ├── sandy.json             # Caractéristiques des sols sablonneux
│       ├── clay.json              # Caractéristiques des sols argileux
│       └── loamy.json             # Caractéristiques des sols limoneux
├── scripts/                       # Scripts utilitaires
│   ├── seed.js                    # Script de remplissage de la base de données
│   └── generate-mock-data.js      # Générateur de données de test
└── tests/                         # Tests
    ├── unit/                      # Tests unitaires
    │   ├── services/              # Tests des services
    │   └── utils/                 # Tests des utilitaires
    └── integration/               # Tests d'intégration
        └── api/                   # Tests des endpoints API
```

## Structure de déploiement et de configuration

```
/SmartIrrigation-Infrastructure
├── docker/                       # Configuration Docker
│   ├── api/                      # Configuration Docker pour l'API
│   │   └── Dockerfile            # Dockerfile pour l'API
│   └── docker-compose.yml        # Composition des services
├── nginx/                        # Configuration Nginx
│   └── nginx.conf                # Configuration du serveur web
├── database/                     # Scripts de base de données
│   └── init.js                   # Initialisation MongoDB
└── terraform/                    # Configuration d'infrastructure (IaC)
    ├── main.tf                   # Configuration principale
    ├── variables.tf              # Variables Terraform
    └── outputs.tf                # Sorties Terraform
```

Cette structure est conforme aux besoins décrits dans le README et suit les meilleures pratiques pour les applications React Native (Expo) et les API Node.js. Elle prend en compte toutes les fonctionnalités mentionnées dans le document tout en maintenant une organisation claire et modulaire.

---

© 2025 SmartIrrigation - Tous droits réservés



# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Installation et déploiement

1. Install dependencies

   ```bash
   npm install
