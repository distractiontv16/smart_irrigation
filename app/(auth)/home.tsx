import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../firebaseConfig';
import userService from '../../services/user.service';
import weatherService, { FormattedWeatherData } from '../../services/weather.service';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// Coordonnées par défaut pour Cotonou, Bénin
const DEFAULT_COORDS = {
  latitude: 6.36,
  longitude: 2.42,
};

// Interface mise à jour pour ajouter les propriétés dynamiques
interface UserCrop {
  id: string;
  name: string;
  soilType: string;
  area: string; // Doit être une chaîne de caractères pour compatibilité
  plantingDate: string;
  // Propriétés calculées (optionnelles)
  irrigationStatus?: string;
  waterNeeded?: string;
  nextWateringTime?: string;
  irrigatedToday?: boolean; // Nouvelle propriété pour savoir si la culture a été arrosée aujourd'hui
}

// Images des cultures
const cropImages: { [key: string]: any } = {
  tomato: require('../../assets/images/culture_tomate.jpg.png'),
  lettuce: require('../../assets/images/lettuce.png'),
  corn: require('../../assets/images/corn.png'),
  // Ajouter d'autres cultures si nécessaire
};

export default function HomeScreen() {
  const { currentUser } = useAuth();
  const [userCrops, setUserCrops] = useState<UserCrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<FormattedWeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string>("Localisation...");
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showWeatherDetails, setShowWeatherDetails] = useState(false);
  const [weatherAlerts, setWeatherAlerts] = useState<string[]>([]);
  const [cropsLoading, setCropsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<{type: string, message: string}[]>([]);
  const router = useRouter();

  // Fonction pour demander la permission de géolocalisation et obtenir la position
  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission de localisation refusée');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(location);
      return location;
    } catch (error) {
      console.error('Erreur de géolocalisation:', error);
      setLocationError('Impossible d\'obtenir votre position');
      return null;
    }
  };

  // Fonction pour charger les données météo avec la position actuelle
  const fetchWeatherData = async () => {
    try {
      setWeatherLoading(true);
      setWeatherError(null);

      // Obtenir la position actuelle
      const currentLocation = await getLocation();
      if (!currentLocation) {
        throw new Error('Position non disponible');
      }

      // Récupérer les données météo pour la position actuelle
      const data = await weatherService.getWeatherData(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );
      
      setWeatherData(data);
      
      // Générer des alertes météo basées sur les données réelles
      generateWeatherAlerts(data);
    } catch (error) {
      setWeatherError('Erreur lors de la récupération des données météo');
      console.error(error);
    } finally {
      setWeatherLoading(false);
    }
  };

  // Générer des alertes météo basées sur les données réelles
  const generateWeatherAlerts = (data: FormattedWeatherData) => {
    const alerts = [];

    // Alerte de température élevée
    const maxTemp = data.dailyForecast.maxTemperatures[1]; // Demain
    if (maxTemp > 32) {
      alerts.push(`Température élevée demain (${Math.round(maxTemp)}°C), arrosez en fin de journée`);
    }

    // Alerte de pluie
    if (data.nextRainHours.length > 0) {
      alerts.push(`Pluie prévue à ${data.nextRainHours.join(', ')}, ajustez votre plan d'irrigation`);
    }

    // Alerte de vent fort
    if (data.windSpeed > 30) {
      alerts.push(`Vent fort (${Math.round(data.windSpeed)} km/h), protégez vos cultures fragiles`);
    }

    // Alerte de probabilité de précipitation
    const precipProb = data.dailyForecast.precipitationProbability[0]; // Aujourd'hui
    if (precipProb > 70) {
      alerts.push(`Forte probabilité de précipitation aujourd'hui (${precipProb}%), reportez l'irrigation`);
    }

    // S'il n'y a pas d'alertes spécifiques
    if (alerts.length === 0) {
      alerts.push("Conditions normales aujourd'hui, suivez le plan d'irrigation recommandé");
    }

    setWeatherAlerts(alerts);
  };

  // Fonction pour charger les cultures de l'utilisateur depuis Firestore
  const loadUserCrops = async () => {
    if (!currentUser) return;
    
    try {
      setCropsLoading(true);
      
      // Récupérer les cultures de l'utilisateur
      const crops = await userService.getUserCultures(currentUser.uid);
      
      // Transformer en format UserCrop
      const userCropsData: UserCrop[] = crops.map(crop => ({
        id: crop.id,
        name: crop.name,
        soilType: crop.soilType,
        area: String(crop.area),
        plantingDate: crop.plantingDate,
        irrigationStatus: getIrrigationStatus(crop.id),
        waterNeeded: getWaterNeeded(crop.id, String(crop.area)),
        nextWateringTime: getNextWateringTime(crop.id),
        irrigatedToday: false // Valeur par défaut, sera mise à jour après
      }));
      
      setUserCrops(userCropsData);
      
      // Vérifier pour chaque culture si elle a été arrosée aujourd'hui
      const updatedCrops = await Promise.all(
        userCropsData.map(async (crop) => {
          const irrigatedToday = await userService.hasIrrigatedToday(currentUser.uid, crop.name);
          return { ...crop, irrigatedToday };
        })
      );
      
      setUserCrops(updatedCrops);
      setCropsLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des cultures:', error);
      setCropsLoading(false);
    }
  };
  
  // Charger les cultures au chargement de l'écran
  useEffect(() => {
    loadUserCrops();
    fetchWeatherData();
  }, []);

  // Fonction pour obtenir une image par défaut en fonction du nom de la culture
  const getCropImage = (cropId: string) => {
    return cropImages[cropId] || require('../../assets/images/culture_tomate.jpg.png'); // Image par défaut
  };
  
  // Fonction temporaire (simulation) pour les statuts d'irrigation
  const getIrrigationStatus = (cropId: string) => {
    // Dans une implémentation réelle, cela serait basé sur des calculs
    const statuses = ['Besoin d\'eau', 'Humidité optimale'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };
  
  // Fonction temporaire (simulation) pour les besoins en eau
  const getWaterNeeded = (cropId: string, area: string) => {
    // Dans une implémentation réelle, cela serait basé sur des calculs
    const baseNeeds = {
      tomato: 4,
      lettuce: 2.5,
      corn: 3
    };
    
    return `${baseNeeds[cropId as keyof typeof baseNeeds] || 3}L/m²`;
  };
  
  // Fonction temporaire (simulation) pour le prochain arrosage
  const getNextWateringTime = (cropId: string) => {
    // Dans une implémentation réelle, cela serait basé sur des calculs
    const times = [
      '17:00 - 18:00',
      '06:00 - 07:00 (demain)',
      '16:00 - 17:00'
    ];
    
    return times[Math.floor(Math.random() * times.length)];
  };

  const handleIrrigationDone = async (id: string) => {
    console.log("Début de handleIrrigationDone pour la culture ID:", id);
    
    // Vérifier si l'utilisateur est connecté
    if (!currentUser) {
      console.error("Erreur: utilisateur non connecté");
      Alert.alert('Erreur', 'Vous devez être connecté pour effectuer cette action');
      return;
    }
    console.log("Utilisateur connecté:", currentUser.uid);

    // Rechercher la culture correspondante
    const crop = userCrops.find(c => c.id === id);
    if (!crop) {
      console.error("Erreur: culture introuvable avec l'ID", id);
      Alert.alert('Erreur', 'Culture introuvable');
      return;
    }
    console.log("Culture trouvée:", crop.name);
    
    // Vérifier si la culture a déjà été arrosée aujourd'hui
    if (crop.irrigatedToday) {
      Alert.alert(
        'Déjà arrosé', 
        `Vous avez déjà arrosé ${crop.name} aujourd'hui.`
      );
      return;
    }
    
    // Vérifier si une irrigation est nécessaire basée sur les données météo actuelles
    // Cette logique doit être identique à celle du composant IrrigationCard
    const isNoIrrigationRecommended = weatherData && (
      (weatherData.weatherDescription?.toLowerCase().includes('pluie') || 
       weatherData.weatherDescription?.toLowerCase().includes('bruine')) ||
      (weatherData.currentHumidity !== undefined && weatherData.currentHumidity > 95)
    );
    
    if (isNoIrrigationRecommended) {
      Alert.alert(
        'Irrigation non nécessaire',
        `Pas d'irrigation recommandée aujourd'hui pour ${crop.name}. La pluie ou l'humidité élevée suffit.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      // Calculer le volume d'eau basé sur la fonction getWaterNeeded
      const waterNeededText = getWaterNeeded(crop.id, crop.area);
      console.log("Volume d'eau nécessaire:", waterNeededText);
      
      // Extraire le nombre du format "XL/m²"
      const volumePerM2 = parseFloat(waterNeededText.replace('L/m²', ''));
      const area = parseFloat(crop.area);
      const totalVolume = volumePerM2 * area;
      
      console.log(`Calculs: ${volumePerM2} L/m² × ${area} m² = ${totalVolume} L au total`);
      
      // Préparer les données d'irrigation
      const irrigationData = {
        date: new Date(),
        culture: crop.name,
        volume: volumePerM2,
        totalVolume: totalVolume,
        completed: true
      };
      console.log("Données d'irrigation à enregistrer:", irrigationData);
      
      // Ajouter l'irrigation à l'historique
      const recordId = await userService.addIrrigationHistory(currentUser.uid, irrigationData);
      console.log("Irrigation enregistrée avec succès, ID:", recordId);
      
      // Mettre à jour l'état local
      setUserCrops(prevCrops => prevCrops.map(c => 
        c.id === id ? { ...c, irrigatedToday: true } : c
      ));
      
      // Afficher un message de succès
      Alert.alert(
        'Irrigation enregistrée', 
        'Votre action d\'irrigation a été enregistrée avec succès et ajoutée à votre historique.'
      );
    } catch (error) {
      console.error('Erreur détaillée lors de l\'enregistrement de l\'irrigation:', error);
      Alert.alert(
        'Erreur', 
        'Impossible d\'enregistrer cette irrigation. Veuillez réessayer.'
      );
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  // Mise à jour de la section météo dans le rendu
  const renderWeatherSection = () => {
    if (weatherLoading) {
      return (
        <View style={styles.weatherSection}>
          <View style={styles.weatherLoading}>
            <ActivityIndicator size="large" color={Colors.white} />
            <Text style={styles.weatherLoadingText}>Chargement des données météo...</Text>
          </View>
        </View>
      );
    }

    if (weatherError) {
      return (
        <View style={styles.weatherSection}>
          <View style={styles.weatherError}>
            <Ionicons name="alert-circle" size={24} color={Colors.white} />
            <Text style={styles.weatherErrorText}>{weatherError}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchWeatherData}
            >
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (!weatherData) return null;

    // Définir le dégradé en fonction du jour/nuit
    const dayGradient: [string, string] = ['#4A90E2', '#87CEEB']; // Dégradé bleu ciel pour la journée
    const nightGradient: [string, string] = ['#1a1b4b', '#090a2a']; // Dégradé nuit
    
    // Déterminer si c'est le jour ou la nuit
    const isNight = weatherData.isNight;
    
    // Choisir le dégradé approprié
    const gradientColors = isNight ? nightGradient : dayGradient;

    return (
      <View style={styles.weatherSection}>
        <Text style={styles.weatherSectionTitle}>Météo du jour</Text>
        <LinearGradient
          colors={gradientColors}
          style={styles.weatherGradient}
        >
          {isNight && (
            <Image
              source={require('../../assets/images/stars.png.png')}
              style={styles.starsOverlay}
            />
          )}
          <View style={styles.weatherHeader}>
            <Text style={styles.weatherTitle}>Météo</Text>
            <Text style={styles.weatherLocation}>{weatherData.locationName}</Text>
          </View>
          
          <View style={styles.weatherMain}>
            <View style={styles.weatherIconContainer}>
              <FontAwesome5 
                name={getWeatherIcon(weatherData.currentWeatherCode)}
                size={72}
                color={getWeatherIconColor(weatherData.currentWeatherCode)}
              />
            </View>
            <View style={styles.weatherMainInfo}>
              <Text style={styles.weatherTemp}>
                {Math.round(weatherData.currentTemperature)}°C
              </Text>
              <Text style={styles.weatherDesc}>
                {weatherData.weatherDescription}
              </Text>
            </View>
          </View>

          <View style={styles.weatherGrid}>
            <View style={styles.weatherItem}>
              <FontAwesome5 
                name="temperature-high" 
                size={20} 
                color={Colors.white} 
              />
              <Text style={styles.weatherValue}>{weatherData.currentTemperature}°C</Text>
              <Text style={styles.weatherLabel}>Température</Text>
            </View>
            <View style={styles.weatherItem}>
              <FontAwesome5 
                name="tint" 
                size={20} 
                color="#4FC3F7" 
              />
              <Text style={styles.weatherValue}>{weatherData.currentHumidity}%</Text>
              <Text style={styles.weatherLabel}>Humidité</Text>
            </View>
            <View style={styles.weatherItem}>
              <FontAwesome5 
                name="cloud-rain" 
                size={20} 
                color="#81D4FA" 
              />
              <Text style={styles.weatherValue}>{weatherData.hourlyPrecipitation[0] || 0}mm</Text>
              <Text style={styles.weatherLabel}>Précipitations</Text>
            </View>
            <View style={styles.weatherItem}>
              <FontAwesome5 
                name="wind" 
                size={20} 
                color="#B3E5FC" 
              />
              <Text style={styles.weatherValue}>{weatherData.windSpeed} km/h</Text>
              <Text style={styles.weatherLabel}>Vent</Text>
            </View>
          </View>

          {weatherData.nextRainHours.length > 0 && (
            <View style={styles.rainForecast}>
              <Text style={styles.rainForecastTitle}>🌧️ Pluie prévue à :</Text>
              <Text style={styles.rainForecastHours}>
                {weatherData.nextRainHours.join(', ')}
              </Text>
            </View>
          )}

          <TouchableOpacity 
            style={styles.detailsButton}
            onPress={() => router.push('/weather-details' as any)}
          >
            <Text style={styles.detailsButtonText}>Voir les détails</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.white} />
          </TouchableOpacity>
        </LinearGradient>
        <Text style={styles.weatherDisclaimer}>
          Les données météo sont basées sur la position de vos cultures. Des écarts peuvent exister selon les conditions locales.
        </Text>
      </View>
    );
  };

  return (
    <ImageBackground
      source={require('../../assets/images/acceuille.webp')}
      style={styles.backgroundImage}
    >
      <StatusBar style="light" />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Image 
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
          />
          <Text style={styles.headerTitle}>SmartIrrigation</Text>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => router.push('/(auth)/settings')}
          >
            <Ionicons name="settings-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          {/* Message de bienvenue */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>
              Bonjour, {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Utilisateur'}
            </Text>
            <Text style={styles.subText}>
              Voici les recommandations pour vos cultures aujourd'hui
            </Text>
          </View>

          {/* Alerte Météo - Maintenant basée sur des données réelles */}
          {weatherAlerts.length > 0 && (
          <View style={styles.alertContainer}>
            <View style={styles.alertContent}>
              <Ionicons name="warning" size={24} color="#FFA000" />
              <Text style={styles.alertText}>
                  {weatherAlerts[0]} {/* Afficher la première alerte */}
              </Text>
            </View>
          </View>
          )}

          {/* Section Météo */}
          {renderWeatherSection()}

          {/* Liste des cultures - design conservé, données mises à jour */}
          <View style={styles.culturesContainer}>
            <Text style={styles.sectionTitle}>Vos Cultures</Text>
            
            {cropsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.white} />
                <Text style={styles.loadingText}>Chargement de vos cultures...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={40} color={Colors.white} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={loadUserCrops}
                >
                  <Text style={styles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
              </View>
            ) : userCrops.length === 0 ? (
              <View style={styles.noCropsContainer}>
                <FontAwesome5 name="seedling" size={40} color={Colors.white} />
                <Text style={styles.noCropsText}>
                  Vous n'avez pas encore configuré de cultures
                </Text>
                <TouchableOpacity 
                  style={styles.addCropButton}
                  onPress={() => router.push('/(auth)/crop-config')}
                >
                  <Text style={styles.addCropButtonText}>Ajouter des cultures</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // La conception reste la même, mais utilise les données réelles récupérées de Firebase
              userCrops.map((crop) => (
                  <View key={crop.id} style={styles.cultureCard}>
                    <Image source={getCropImage(crop.id)} style={styles.cultureImage} />
                    <View style={styles.cultureInfo}>
                      <Text style={styles.cultureName}>{crop.name}</Text>
                      <View style={styles.cultureDetails}>
                        <View style={styles.detailItem}>
                          <Ionicons name="water" size={16} color={Colors.primary} />
                        <Text style={styles.detailText}>{crop.waterNeeded || getWaterNeeded(crop.id, crop.area)}</Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Ionicons name="time" size={16} color={Colors.primary} />
                        <Text style={styles.detailText}>{crop.nextWateringTime || getNextWateringTime(crop.id)}</Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Ionicons name="leaf" size={16} color={Colors.primary} />
                          <Text style={styles.detailText}>
                            Sol: {crop.soilType}
                          </Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Ionicons name="calendar" size={16} color={Colors.primary} />
                          <Text style={styles.detailText}>
                            Planté le: {formatDate(crop.plantingDate)}
                          </Text>
                        </View>
                        <View style={[styles.statusBadge, 
                        (crop.irrigationStatus || getIrrigationStatus(crop.id)) === 'Humidité optimale' 
                          ? styles.statusOptimal : styles.statusNeedsWater
                        ]}>
                        <Text style={styles.statusText}>{crop.irrigationStatus || getIrrigationStatus(crop.id)}</Text>
                        </View>
                      </View>
                      
                      {/* Amélioration pour éviter la duplication d'informations */}
                      <View style={styles.irrigationActionContainer}>
                        {crop.irrigatedToday ? (
                          <View style={styles.irrigationButtonCompleted}>
                            <Ionicons name="checkmark-circle" size={18} color="#fff" />
                            <Text style={styles.irrigationButtonCompletedText}>Arrosé aujourd'hui</Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.irrigationButton}
                            onPress={() => handleIrrigationDone(crop.id)}
                          >
                            {weatherData && 
                              ((weatherData.weatherDescription?.toLowerCase().includes('pluie') || 
                               weatherData.weatherDescription?.toLowerCase().includes('bruine')) ||
                              (weatherData.currentHumidity !== undefined && weatherData.currentHumidity > 95)) ? (
                              <Text style={styles.irrigationButtonText}>Aucune action nécessaire</Text>
                            ) : (
                              <Text style={styles.irrigationButtonText}>Marquer comme arrosé</Text>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Navigation Bar */}
        <View style={styles.navbar}>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="home" size={24} color={Colors.primary} />
            <Text style={[styles.navText, styles.activeNavText]}>Accueil</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => router.push('/(auth)/irrigation')}
          >
            <Ionicons name="water" size={24} color={Colors.darkGray} />
            <Text style={styles.navText}>Irrigation</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => router.push('/(auth)/conseils-ia')}
          >
            <Ionicons name="analytics" size={24} color={Colors.darkGray} />
            <Text style={styles.navText}>Conseils IA</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => router.push('/(auth)/profile')}
          >
            <Ionicons name="person" size={24} color={Colors.darkGray} />
            <Text style={styles.navText}>Profil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Colors.primary,
  },
  logo: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: Colors.white,
  },
  settingsButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    padding: 20,
    marginTop: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontFamily: 'Montserrat-Bold',
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  subText: {
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    color: Colors.white,
    marginTop: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  alertContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 248, 225, 0.95)',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA000',
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  alertText: {
    marginLeft: 10,
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: '#5D4037',
    flex: 1,
  },
  weatherSection: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  weatherGradient: {
    padding: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  weatherTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: Colors.white,
    flex: 1,
    marginRight: 10,
  },
  weatherLocation: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.white,
    flex: 1,
    textAlign: 'right',
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  weatherMainInfo: {
    marginLeft: 20,
    flex: 1,
    minWidth: 200,
  },
  weatherTemp: {
    fontSize: 48,
    fontFamily: 'Montserrat-Bold',
    color: Colors.white,
    flexWrap: 'wrap',
  },
  weatherDesc: {
    fontSize: 18,
    fontFamily: 'OpenSans-Regular',
    color: Colors.white,
    flexWrap: 'wrap',
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  weatherItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
    minWidth: 150,
  },
  weatherValue: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: Colors.white,
    marginVertical: 5,
    textAlign: 'center',
  },
  weatherLabel: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.white,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  culturesContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: Colors.white,
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
  },
  loadingText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    marginTop: 15,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
  },
  errorText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    marginTop: 15,
    marginBottom: 15,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  noCropsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
  },
  noCropsText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    marginTop: 15,
    marginBottom: 15,
    textAlign: 'center',
  },
  addCropButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addCropButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  },
  cultureCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cultureImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  cultureInfo: {
    flex: 1,
  },
  cultureName: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.primary,
    marginBottom: 5,
  },
  cultureDetails: {
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    marginLeft: 5,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginTop: 5,
  },
  statusOptimal: {
    backgroundColor: '#4CAF50',
  },
  statusNeedsWater: {
    backgroundColor: '#FFA000',
  },
  statusText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: 'OpenSans-Bold',
  },
  irrigationButton: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  irrigationButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
  },
  irrigationDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  irrigationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  irrigationInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  irrigationInfoText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
  },
  irrigationButtonCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 10,
  },
  irrigationButtonCompletedText: {
    color: '#fff',
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 14,
    marginLeft: 4,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 12,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    marginTop: 4,
  },
  activeNavText: {
    fontFamily: 'Montserrat-Bold',
  },
  rainForecast: {
    marginTop: 15,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    flexWrap: 'wrap',
  },
  rainForecastTitle: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    marginBottom: 5,
    flexWrap: 'wrap',
  },
  rainForecastHours: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    flexWrap: 'wrap',
  },
  weatherLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  weatherLoadingText: {
    color: Colors.white,
    marginTop: 10,
    fontSize: 16,
  },
  weatherError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  weatherErrorText: {
    color: Colors.white,
    marginTop: 10,
    marginBottom: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  detailsButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'OpenSans-Bold',
    marginRight: 5,
  },
  weatherSectionTitle: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: Colors.white,
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
    flexWrap: 'wrap',
  },
  weatherIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 40,
    padding: 15,
    marginRight: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
    resizeMode: 'cover',
  },
  weatherDisclaimer: {
    fontSize: 12,
    color: '#6e6e6e',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
    flexWrap: 'wrap',
  },
  irrigationActionContainer: {
    marginTop: 10,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    width: '100%',
  },
});

// Fonction utilitaire pour obtenir l'icône météo appropriée
const getWeatherIcon = (weatherCode: number): string => {
  // Mapping des codes météo vers les icônes FontAwesome 5
  const iconMap: { [key: number]: string } = {
    0: 'sun',                // Ciel dégagé
    1: 'cloud-sun',          // Principalement dégagé
    2: 'cloud-sun',          // Partiellement nuageux
    3: 'cloud',             // Couvert
    45: 'smog',             // Brouillard
    48: 'smog',             // Brouillard givrant
    51: 'cloud-rain',       // Bruine légère
    53: 'cloud-rain',       // Bruine modérée
    55: 'cloud-showers-heavy', // Bruine dense
    61: 'cloud-rain',       // Pluie légère
    63: 'cloud-showers-heavy', // Pluie modérée
    65: 'cloud-showers-heavy', // Pluie forte
    71: 'snowflake',        // Neige légère
    73: 'snowflake',        // Neige modérée
    75: 'snowflake',        // Neige forte
    95: 'bolt',             // Orage
    96: 'cloud-bolt',       // Orage avec grêle légère
    99: 'cloud-bolt',       // Orage avec grêle forte
  };
  return iconMap[weatherCode] || 'cloud';
};

// Fonction utilitaire pour obtenir la couleur de l'icône météo
const getWeatherIconColor = (weatherCode: number): string => {
  // Mapping des codes météo vers les couleurs
  const colorMap: { [key: number]: string } = {
    0: '#FFD700',           // Jaune doré pour le soleil
    1: '#FFA500',           // Orange pour soleil partiellement couvert
    2: '#87CEEB',           // Bleu ciel pour nuages légers
    3: '#B8C3CB',           // Gris pour couvert
    45: '#CFD8DC',          // Gris clair pour brouillard
    48: '#CFD8DC',          // Gris clair pour brouillard givrant
    51: '#4FC3F7',          // Bleu clair pour bruine
    53: '#4FC3F7',          // Bleu clair pour bruine
    55: '#2196F3',          // Bleu pour pluie
    61: '#2196F3',          // Bleu pour pluie
    63: '#1976D2',          // Bleu foncé pour pluie forte
    65: '#1565C0',          // Bleu très foncé pour pluie très forte
    71: '#B3E5FC',          // Bleu très clair pour neige
    73: '#B3E5FC',          // Bleu très clair pour neige
    75: '#B3E5FC',          // Bleu très clair pour neige
    95: '#FFA000',          // Orange pour orage
    96: '#FF8F00',          // Orange foncé pour orage avec grêle
    99: '#FF6F00',          // Orange très foncé pour orage violent
  };
  return colorMap[weatherCode] || '#87CEEB';
};
