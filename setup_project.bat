@echo off
setlocal enabledelayedexpansion

:: Définition du projet
set PROJECT_NAME=SmartIrrigation

:: Création des dossiers
echo 📁 Création de la structure du projet...

:: Dossiers principaux
mkdir app assets components constants hooks services utils store

:: Sous-dossiers de app/
mkdir app\(auth) app\recommendations app\weather app\ai-insights app\community app\crops app\settings app\(public)

:: Sous-dossiers de assets/
mkdir assets\fonts assets\images assets\images\crops assets\images\soil-types assets\images\weather assets\icons

:: Sous-dossiers de components/
mkdir components\ui components\weather components\crops components\recommendations components\community components\charts

:: Sous-dossiers de store/
mkdir store\slices store\middleware

:: Création des fichiers essentiels
echo 📄 Création des fichiers...

:: Fichiers principaux
type nul > app\(auth)\home.tsx
type nul > app\recommendations\[cultureId].tsx
type nul > app\recommendations\index.tsx
type nul > app\weather\index.tsx
type nul > app\ai-insights\index.tsx
type nul > app\community\index.tsx
type nul > app\community\[topicId].tsx
type nul > app\crops\index.tsx
type nul > app\crops\add.tsx
type nul > app\crops\[cropId].tsx
type nul > app\settings\index.tsx
type nul > app\(public)\index.tsx
type nul > app\(public)\register.tsx
type nul > app\(public)\forgot-password.tsx
type nul > app\(public)\language-select.tsx
type nul > app\_layout.tsx

:: Fichiers dans components/
type nul > components\ui\Button.tsx
type nul > components\ui\Card.tsx
type nul > components\ui\Input.tsx
type nul > components\weather\WeatherCard.tsx
type nul > components\weather\ForecastItem.tsx
type nul > components\crops\CropCard.tsx
type nul > components\crops\GrowthStageIndicator.tsx
type nul > components\recommendations\IrrigationCard.tsx
type nul > components\recommendations\AlertBanner.tsx
type nul > components\community\PostItem.tsx
type nul > components\community\CommentList.tsx
type nul > components\charts\WaterUsageChart.tsx
type nul > components\charts\TemperatureChart.tsx

:: Fichiers dans constants/
type nul > constants\Colors.ts
type nul > constants\Layout.ts
type nul > constants\Crops.ts
type nul > constants\SoilTypes.ts

:: Fichiers dans hooks/
type nul > hooks\useWeather.ts
type nul > hooks\useOfflineMode.ts
type nul > hooks\useIrrigation.ts
type nul > hooks\useCommunity.ts

:: Fichiers dans services/
type nul > services\api.ts
type nul > services\auth.service.ts
type nul > services\weather.service.ts
type nul > services\crops.service.ts
type nul > services\recommendations.service.ts
type nul > services\community.service.ts

:: Fichiers dans utils/
type nul > utils\dateFormatter.ts
type nul > utils\waterCalculator.ts
type nul > utils\storage.ts
type nul > utils\i18n.ts

:: Fichiers dans store/
type nul > store\index.ts
type nul > store\slices\authSlice.ts
type nul > store\slices\weatherSlice.ts
type nul > store\slices\cropsSlice.ts
type nul > store\slices\recommendationsSlice.ts
type nul > store\middleware\offlineSync.ts

:: Fin du script
echo ✅ La structure du projet a été créée avec succès !
echo 🔍 Les fichiers et dossiers ont été créés dans le répertoire actuel.
exit
