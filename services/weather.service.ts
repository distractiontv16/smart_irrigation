/**
 * Service météo pour l'application SmartIrrigation
 * Utilise l'API Open-Meteo pour récupérer les données météorologiques
 * Documentation API: https://open-meteo.com/en/docs
 */

// Types pour les données météo
export interface CurrentWeatherData {
  temperature: number;        // Température en °C
  windspeed: number;          // Vitesse du vent en km/h
  winddirection: number;      // Direction du vent en degrés
  weathercode: number;        // Code météo WMO
  time: string;               // Horodatage
}

export interface HourlyWeatherData {
  time: string[];                   // Horodatages pour les prévisions horaires
  temperature_2m: number[];         // Températures horaires en °C
  relative_humidity_2m: number[];   // Humidité relative horaire en %
  precipitation: number[];          // Précipitations horaires en mm
  cloudcover: number[];             // Couverture nuageuse horaire en %
  windspeed_10m: number[];          // Vitesse du vent horaire en km/h
  winddirection_10m: number[];      // Direction du vent horaire en degrés
}

export interface WeatherResponse {
  current_weather: CurrentWeatherData;
  hourly: HourlyWeatherData;
  daily: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    shortwave_radiation_sum: number[];
  };
}

// Interface pour les données météo formatées
export interface FormattedWeatherData {
  currentTemperature: number;       // Température actuelle en °C
  currentHumidity: number;          // Humidité actuelle en %
  currentWeatherCode: number;       // Code WMO pour la condition météo actuelle
  forecastHours: string[];          // Heures de prévision
  hourlyTemperatures: number[];     // Températures horaires en °C
  hourlyHumidity: number[];         // Humidité horaire en %
  hourlyPrecipitation: number[];    // Précipitations horaires en mm
  weatherDescription: string;       // Description textuelle de la météo actuelle
  nextRainHours: string[];          // Heures où la pluie est prévue
  locationName: string;             // Nom de la localisation
  weatherIcon: string;              // Icône représentant la météo actuelle
  backgroundGradient: string[];     // Couleurs du dégradé pour l'arrière-plan
  isNight: boolean;                 // Indique si c'est la nuit
  cloudCover: number;               // Couverture nuageuse actuelle en %
  windSpeed: number;                // Vitesse du vent actuelle en km/h
  windDirection: number;            // Direction du vent actuelle en degrés
  shortwave_radiation_sum: number;  // Rayonnement solaire en MJ/m²/jour
  isLocalFromDB?: boolean;          // Indique si la localisation provient de la base de données
  dailyForecast: {
    maxTemperatures: number[];
    minTemperatures: number[];
    precipitationSum: number[];
    precipitationProbability: number[];
  };
}

/**
 * Classe pour gérer les appels à l'API météo et formater les données
 */
class WeatherService {
  // Mapping des codes météo WMO vers des descriptions en français
  private weatherCodeDescriptions: { [key: number]: string } = {
    0: "Ciel dégagé",
    1: "Principalement dégagé",
    2: "Partiellement nuageux",
    3: "Couvert",
    45: "Brouillard",
    48: "Brouillard givrant",
    51: "Bruine légère",
    53: "Bruine modérée",
    55: "Bruine dense",
    56: "Bruine verglaçante légère",
    57: "Bruine verglaçante dense",
    61: "Pluie légère",
    63: "Pluie modérée",
    65: "Pluie forte",
    66: "Pluie verglaçante légère",
    67: "Pluie verglaçante forte",
    71: "Neige légère",
    73: "Neige modérée",
    75: "Neige forte",
    77: "Grains de neige",
    80: "Averses de pluie légères",
    81: "Averses de pluie modérées",
    82: "Averses de pluie violentes",
    85: "Averses de neige légères",
    86: "Averses de neige fortes",
    95: "Orage",
    96: "Orage avec grêle légère",
    99: "Orage avec grêle forte"
  };

  // Mapping des codes météo vers les icônes
  private weatherIcons: { [key: number]: string } = {
    0: "sun",              // Ciel dégagé
    1: "partly-sunny",     // Principalement dégagé
    2: "partly-sunny",     // Partiellement nuageux
    3: "cloudy",          // Couvert
    45: "cloud",          // Brouillard
    48: "cloud",          // Brouillard givrant
    51: "rainy",          // Bruine légère
    53: "rainy",          // Bruine modérée
    55: "rainy",          // Bruine dense
    56: "snow",           // Bruine verglaçante légère
    57: "snow",           // Bruine verglaçante dense
    61: "rainy",          // Pluie légère
    63: "rainy",          // Pluie modérée
    65: "thunderstorm",   // Pluie forte
    66: "snow",           // Pluie verglaçante légère
    67: "snow",           // Pluie verglaçante forte
    71: "snow",           // Neige légère
    73: "snow",           // Neige modérée
    75: "snow",           // Neige forte
    77: "snow",           // Grains de neige
    80: "rainy",          // Averses de pluie légères
    81: "rainy",          // Averses de pluie modérées
    82: "thunderstorm",   // Averses de pluie violentes
    85: "snow",           // Averses de neige légères
    86: "snow",           // Averses de neige fortes
    95: "thunderstorm",   // Orage
    96: "thunderstorm",   // Orage avec grêle légère
    99: "thunderstorm",   // Orage avec grêle forte
  };

  // Mapping des codes météo vers les dégradés de couleur
  private weatherGradients: { [key: number]: string[], defaultGradient: string[] } = {
    0: ['#4A90E2', '#87CEEB'],    // Ciel dégagé - bleu clair
    1: ['#4A90E2', '#B7E4F7'],    // Principalement dégagé
    2: ['#6FB1E5', '#C9E6F7'],    // Partiellement nuageux
    3: ['#8C9EAA', '#B8C3CB'],    // Couvert
    45: ['#9EA7AD', '#CFD8DC'],   // Brouillard
    48: ['#9EA7AD', '#CFD8DC'],   // Brouillard givrant
    51: ['#4A90E2', '#6FB1E5'],   // Bruine légère
    53: ['#4A90E2', '#6FB1E5'],   // Bruine modérée
    55: ['#4A90E2', '#6FB1E5'],   // Bruine dense
    61: ['#4A90E2', '#6FB1E5'],   // Pluie légère
    63: ['#4A90E2', '#6FB1E5'],   // Pluie modérée
    65: ['#34495E', '#4A90E2'],   // Pluie forte
    80: ['#4A90E2', '#6FB1E5'],   // Averses
    95: ['#34495E', '#4A90E2'],   // Orage
    defaultGradient: ['#4A90E2', '#87CEEB'] // Dégradé par défaut - bleu ciel
  };

  /**
   * Récupère les données météo pour une localisation donnée
   * @param latitude Latitude de la localisation
   * @param longitude Longitude de la localisation
   * @param isLocalFromDB Indique si la localisation provient de la base de données
   * @returns Promise contenant les données météo formatées
   * @throws Error si les données ne peuvent pas être récupérées
   */
  async getWeatherData(
    latitude: number, 
    longitude: number, 
    isLocalFromDB: boolean = false
  ): Promise<FormattedWeatherData> {
    console.log(`Récupération des données météo pour: Lat: ${latitude}, Long: ${longitude}`);
    
    try {
      // Ajout de paramètres supplémentaires pour plus de précision
      const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,precipitation,weathercode,cloudcover,windspeed_10m,winddirection_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,shortwave_radiation_sum&timezone=auto&forecast_days=10`;
      
      console.log(`Appel API: ${apiUrl}`);
      // Faire la requête à l'API
      const response = await fetch(apiUrl);
      
      // Vérifier si la requête a réussi
      if (!response.ok) {
        throw new Error(`Erreur API météo: ${response.status} - ${response.statusText}`);
      }
      
      // Convertir la réponse en JSON
      const data: WeatherResponse = await response.json();
      
      // Récupérer l'index de l'heure actuelle
      const currentHourIndex = this.getCurrentHourIndex(data.hourly.time);
      
      // Récupérer les heures où il va pleuvoir
      const nextRainHours = this.getNextRainHours(
        data.hourly.time.slice(currentHourIndex, currentHourIndex + 24),
        data.hourly.precipitation.slice(currentHourIndex, currentHourIndex + 24)
      );

      const weatherCode = data.current_weather.weathercode;
      
      // Déterminer si c'est le jour ou la nuit
      const isNight = this.isNightTime();
      
      // Récupérer le nom de la localisation
      let locationName;
      try {
        locationName = await this.getLocationName(latitude, longitude);
      } catch (locError) {
        console.error("Erreur lors de la récupération du nom de la localisation:", locError);
        // Ne pas interrompre le flux, mais garder une trace de l'erreur
        locationName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
      
      // Formater les données
      const formattedData: FormattedWeatherData = {
        currentTemperature: data.current_weather.temperature,
        currentHumidity: data.hourly.relative_humidity_2m[currentHourIndex],
        currentWeatherCode: weatherCode,
        forecastHours: data.hourly.time.slice(currentHourIndex, currentHourIndex + 24).map(this.formatHour),
        hourlyTemperatures: data.hourly.temperature_2m.slice(currentHourIndex, currentHourIndex + 24),
        hourlyHumidity: data.hourly.relative_humidity_2m.slice(currentHourIndex, currentHourIndex + 24),
        hourlyPrecipitation: data.hourly.precipitation.slice(currentHourIndex, currentHourIndex + 24),
        weatherDescription: this.getWeatherDescription(weatherCode),
        nextRainHours: nextRainHours,
        locationName: locationName,
        weatherIcon: this.weatherIcons[weatherCode] || "cloud",
        backgroundGradient: isNight ? this.getNightGradient() : this.getDayGradient(weatherCode),
        isNight: isNight,
        cloudCover: data.hourly.cloudcover[currentHourIndex],
        windSpeed: data.hourly.windspeed_10m[currentHourIndex],
        windDirection: data.hourly.winddirection_10m[currentHourIndex],
        shortwave_radiation_sum: data.daily.shortwave_radiation_sum[0],
        isLocalFromDB: isLocalFromDB,
        dailyForecast: {
          maxTemperatures: data.daily.temperature_2m_max,
          minTemperatures: data.daily.temperature_2m_min,
          precipitationSum: data.daily.precipitation_sum,
          precipitationProbability: data.daily.precipitation_probability_max
        }
      };
      
      console.log(`Données météo récupérées avec succès pour: ${locationName}`);
      return formattedData;
    } catch (error) {
      console.error('Erreur lors de la récupération des données météo:', error);
      throw new Error(`Impossible de récupérer les données météo: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère l'index de l'heure actuelle dans le tableau des heures de prévision
   * @param timeArray Tableau des heures de prévision
   * @returns Index de l'heure actuelle
   */
  private getCurrentHourIndex(timeArray: string[]): number {
    const now = new Date();
    const currentTimeString = now.toISOString().split('T')[0] + 'T' + now.getHours() + ':00';
    
    // Trouver l'index de l'heure la plus proche
    return timeArray.findIndex(time => time >= currentTimeString);
  }

  /**
   * Formate une heure ISO en format plus lisible (HH:MM)
   * @param isoTime Heure au format ISO
   * @returns Heure formatée (HH:MM)
   */
  private formatHour(isoTime: string): string {
    const date = new Date(isoTime);
    return date.getHours() + ':00';
  }

  /**
   * Récupère la description textuelle d'un code météo WMO
   * @param code Code météo WMO
   * @returns Description textuelle
   */
  private getWeatherDescription(code: number): string {
    return this.weatherCodeDescriptions[code] || "Conditions inconnues";
  }

  /**
   * Récupère les heures où il va pleuvoir dans les prochaines 24h
   * @param hours Tableau des heures
   * @param precipitation Tableau des précipitations
   * @returns Tableau des heures où il va pleuvoir
   */
  private getNextRainHours(hours: string[], precipitation: number[]): string[] {
    const rainHours: string[] = [];
    
    for (let i = 0; i < hours.length; i++) {
      if (precipitation[i] > 0) {
        rainHours.push(this.formatHour(hours[i]));
      }
    }
    
    return rainHours;
  }

  /**
   * Récupère le nom de la localisation à partir des coordonnées
   * @param latitude Latitude
   * @param longitude Longitude
   * @returns Nom de la localisation
   */
  private async getLocationName(latitude: number, longitude: number): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=fr`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'SmartIrrigation/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de la localisation');
      }
      
      const data = await response.json();
      if (data && data.address) {
        // Essayer de récupérer le nom le plus pertinent
        return data.address.village || 
               data.address.town || 
               data.address.city || 
               data.address.municipality ||
               'Localisation inconnue';
      }
      return 'Localisation inconnue';
    } catch (error) {
      console.error('Erreur lors de la récupération du nom de la localisation:', error);
      return 'Localisation inconnue';
    }
  }

  private isNightTime(): boolean {
    const now = new Date();
    const hours = now.getHours();
    return hours >= 20 || hours < 6;
  }

  private getDayGradient(weatherCode: number): string[] {
    // Retourner le dégradé correspondant au code météo ou le dégradé par défaut
    return this.weatherGradients[weatherCode] || this.weatherGradients.defaultGradient;
  }

  private getNightGradient(): string[] {
    // Gradient nuit étoilée
    return ['#1a1b4b', '#090a2a'];
  }

  async getCurrentWeather(): Promise<FormattedWeatherData> {
    try {
      // Coordonnées par défaut de Porto-Novo, Bénin
      // TODO: Récupérer les vraies coordonnées de l'utilisateur via la géolocalisation
      const defaultLatitude = 6.4969;
      const defaultLongitude = 2.6283;

      // Utiliser getWeatherData qui fait déjà l'appel à l'API
      return await this.getWeatherData(defaultLatitude, defaultLongitude, false);
    } catch (error) {
      console.error('Erreur lors de la récupération des données météo:', error);
      // En cas d'erreur, retourner les données de démo
    return {
      currentTemperature: 36,
      currentHumidity: 85,
      currentWeatherCode: 3,
      forecastHours: ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00"],
      hourlyTemperatures: [26, 27, 29, 32, 34, 35],
      hourlyHumidity: [80, 78, 75, 70, 68, 65],
      hourlyPrecipitation: [0, 0, 0, 0, 0, 0],
      weatherDescription: "Partiellement nuageux",
      nextRainHours: ["14:00", "15:00", "16:00"],
      locationName: "Porto-Novo, Bénin",
      weatherIcon: "partly-sunny",
      backgroundGradient: ['#4A90E2', '#87CEEB'],
      isNight: false,
      cloudCover: 50,
      windSpeed: 10,
      windDirection: 180,
      shortwave_radiation_sum: 22.5,
      dailyForecast: {
        maxTemperatures: [36, 34, 35, 33, 34, 36, 35],
        minTemperatures: [24, 23, 24, 23, 22, 23, 24],
        precipitationSum: [0, 5, 10, 2, 0, 0, 3],
        precipitationProbability: [10, 60, 80, 40, 20, 10, 30]
      }
    };
    }
  }

  /**
   * Récupère les prévisions météo sur 7 jours
   */
  async getWeatherForecast(): Promise<WeatherData[]> {
    try {
      // Coordonnées par défaut de Porto-Novo, Bénin
      const defaultLatitude = 6.4969;
      const defaultLongitude = 2.6283;

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${defaultLatitude}&longitude=${defaultLongitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,shortwave_radiation_sum&timezone=auto&forecast_days=7`
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des prévisions météo');
      }

      const data = await response.json();

      return data.daily.time.map((date: string, index: number) => ({
        tMax: data.daily.temperature_2m_max[index],
        tMin: data.daily.temperature_2m_min[index],
        rayonnement: data.daily.shortwave_radiation_sum[index] || 15,
        humidite: 75, // Valeur par défaut
        pluie: data.daily.precipitation_sum[index] > 0,
        pluiePrevue: data.daily.precipitation_probability_max[index] > 50,
        heure: 12
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des prévisions météo:', error);
      // En cas d'erreur, retourner des données de démo
      return Array(7).fill({
        tMax: 32,
        tMin: 24,
        rayonnement: 15,
        humidite: 75,
        pluie: false,
        pluiePrevue: false,
        heure: 12
      });
    }
  }
}

// Exporter une instance du service
const weatherService = new WeatherService();
export default weatherService;

