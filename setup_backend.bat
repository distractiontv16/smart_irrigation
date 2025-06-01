@echo off
setlocal enabledelayedexpansion

:: Définition du projet
set PROJECT_NAME=SmartIrrigation-API

:: Création des dossiers
echo 📁 Création de la structure du backend...

:: Créer le dossier du backend
mkdir %PROJECT_NAME%
cd %PROJECT_NAME%

:: Dossiers principaux
mkdir src data scripts tests

:: Sous-dossiers de src/
mkdir src\api src\models src\services src\utils src\config

:: Sous-dossiers de src/api/
mkdir src\api\routes src\api\controllers src\api\middleware

:: Sous-dossiers de data/
mkdir data\crops data\soil-types

:: Sous-dossiers de tests/
mkdir tests\unit tests\integration
mkdir tests\unit\services tests\unit\utils tests\integration\api

:: Création des fichiers essentiels
echo 📄 Création des fichiers...

:: Fichier principal
type nul > src\app.js

:: Fichiers dans src/api/routes/
type nul > src\api\routes\auth.routes.js
type nul > src\api\routes\users.routes.js
type nul > src\api\routes\crops.routes.js
type nul > src\api\routes\weather.routes.js
type nul > src\api\routes\recommendations.routes.js
type nul > src\api\routes\community.routes.js

:: Fichiers dans src/api/controllers/
type nul > src\api\controllers\auth.controller.js
type nul > src\api\controllers\users.controller.js
type nul > src\api\controllers\crops.controller.js
type nul > src\api\controllers\weather.controller.js
type nul > src\api\controllers\recommendations.controller.js
type nul > src\api\controllers\community.controller.js

:: Fichiers dans src/api/middleware/
type nul > src\api\middleware\auth.middleware.js
type nul > src\api\middleware\validation.middleware.js
type nul > src\api\middleware\errorHandler.middleware.js

:: Fichiers dans src/models/
type nul > src\models\user.model.js
type nul > src\models\crop.model.js
type nul > src\models\soil.model.js
type nul > src\models\weather.model.js
type nul > src\models\recommendation.model.js
type nul > src\models\post.model.js

:: Fichiers dans src/services/
type nul > src\services\auth.service.js
type nul > src\services\weather.service.js
type nul > src\services\irrigation.service.js
type nul > src\services\notification.service.js
type nul > src\services\ai.service.js

:: Fichiers dans src/utils/
type nul > src\utils\logger.js
type nul > src\utils\validators.js
type nul > src\utils\constants.js
type nul > src\utils\waterCalculator.js

:: Fichiers dans src/config/
type nul > src\config\database.js
type nul > src\config\environment.js
type nul > src\config\ai-models.js

:: Fichiers dans data/crops/
type nul > data\crops\tomato.json
type nul > data\crops\corn.json
type nul > data\crops\lettuce.json

:: Fichiers dans data/soil-types/
type nul > data\soil-types\sandy.json
type nul > data\soil-types\clay.json
type nul > data\soil-types\loamy.json

:: Fichiers dans scripts/
type nul > scripts\seed.js
type nul > scripts\generate-mock-data.js

:: Fichiers package.json et .env
type nul > package.json
type nul > .env.example
type nul > .gitignore
type nul > README.md

:: Fin du script
echo ✅ La structure du backend a été créée avec succès dans le dossier %PROJECT_NAME% !
exit 