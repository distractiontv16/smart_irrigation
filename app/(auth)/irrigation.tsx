import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import userService, { UserData, IrrigationHistoryDisplay } from '../../services/user.service';
import profileService, { UserLocation } from '../../services/profileService';
import weatherService, { FormattedWeatherData } from '../../services/weather.service';
import { 
  CultureData, 
  SolData, 
  WeatherData, 
  Recommandation,
  convertToCultureData,
  convertToSolData,
  genererRecommandation
} from '../../services/recommendations.service';
import IrrigationCard from '../../components/recommendations/IrrigationCard';
import AlertBanner from '../../components/recommendations/AlertBanner';
import * as Location from 'expo-location';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabType = 'besoins' | 'historique';

interface CropDetails {
  id: string;
  name: string;
  soilType: string;
  area: string;
  plantingDate: string;
  image: any;  // Pour l'image locale
}

export default function IrrigationScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('besoins');
  const [selectedCultureIndex, setSelectedCultureIndex] = useState(0);
  const [userCrops, setUserCrops] = useState<CropDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<FormattedWeatherData | null>(null);
  const [recommendation, setRecommendation] = useState<Recommandation | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [irrigationHistory, setIrrigationHistory] = useState<IrrigationHistoryDisplay[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  
  // Obtenir l'utilisateur actuellement connecté
  const { currentUser } = useAuth();

  // Mapping des images locales pour les cultures
  const cropImages: {[key: string]: any} = {
    'Tomate': require('../../assets/images/culture_tomate.jpg.png'),
    'Maïs': require('../../assets/images/culture_tomate.jpg.png'),
    'Laitue': require('../../assets/images/culture_tomate.jpg.png'),
    // Valeur par défaut si l'image n'est pas trouvée
    'default': require('../../assets/images/culture_tomate.jpg.png')
  };

  // Charger la localisation de l'utilisateur
  useEffect(() => {
    if (currentUser) {
      loadUserLocation();
    }
  }, [currentUser]);

  // Charger les données utilisateur et météo une fois la localisation obtenue
  useEffect(() => {
    if (currentUser && userLocation) {
      console.log("Localisation obtenue, chargement des données utilisateur et météo");
      loadUserDataAndWeather();
    }
  }, [currentUser, userLocation]);

  // Charger l'historique d'irrigation
  useEffect(() => {
    if (currentUser) {
      loadIrrigationHistory();
    }
  }, [currentUser]);

  // Générer une recommandation chaque fois que l'utilisateur change de culture sélectionnée
  // ou que les données météo changent
  useEffect(() => {
    if (userCrops.length > 0 && weatherData) {
      console.log("Données disponibles, génération de recommandation");
      generateRecommendation();
    } else {
      console.log("Données incomplètes pour générer une recommandation");
    }
  }, [selectedCultureIndex, weatherData, userCrops]);

  // Effect pour recharger l'historique lorsqu'on passe à l'onglet historique
  useEffect(() => {
    if (activeTab === 'historique' && currentUser) {
      loadIrrigationHistory();
    }
  }, [activeTab, currentUser]);

  // Charger l'historique d'irrigation
  const loadIrrigationHistory = async () => {
    try {
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }
      
      setHistoryLoading(true);
      setHistoryError(null);
      
      // Récupérer l'historique d'irrigation des 30 derniers jours
      const history = await userService.getIrrigationHistory(currentUser.uid, 30);
      setIrrigationHistory(history);
      
      console.log(`Historique d'irrigation chargé: ${history.length} entrées`);
    } catch (error: any) {
      console.error("Erreur lors du chargement de l'historique d'irrigation:", error);
      setHistoryError(error.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Charger la localisation de l'utilisateur
  const loadUserLocation = async () => {
    try {
      setLocationLoading(true);
      setLocationError(null);
      
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }
      
      console.log("Récupération de la localisation pour l'utilisateur:", currentUser.uid);
      
      // Récupérer la localisation à partir du profil
      const location = await profileService.getUserLocation(currentUser.uid);
      
      if (!location) {
        throw new Error('Localisation non disponible dans votre profil. Veuillez activer la géolocalisation.');
      }
      
      console.log("Localisation récupérée:", location);
      setUserLocation(location);
    } catch (error: any) {
      console.error("Erreur lors de la récupération de la localisation:", error);
      setLocationError(error.message);
    } finally {
      setLocationLoading(false);
    }
  };

  // Charger les données utilisateur à partir de Firestore et les données météo
  const loadUserDataAndWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      setWeatherLoading(true);
      setWeatherError(null);
      
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }
      
      if (!userLocation) {
        throw new Error('Localisation non disponible');
      }
      
      console.log("Récupération des données pour l'utilisateur:", currentUser.uid);
      
      // Récupérer les données de l'utilisateur à partir de Firestore
      const userData = await userService.getUserData(currentUser.uid);
      
      if (!userData) {
        throw new Error('Profil utilisateur non trouvé. Veuillez configurer votre profil.');
      }
      
      if (!userData.crops || userData.crops.length === 0) {
        throw new Error('Aucune culture configurée. Veuillez ajouter des cultures dans votre profil.');
      }
      
      console.log("Données utilisateur récupérées:", JSON.stringify(userData));
      
      // Transformer les données des cultures pour inclure les images
      const cropDetails: CropDetails[] = userData.crops.map(crop => {
        // Obtenir l'image correspondante ou l'image par défaut
        const image = cropImages[crop.name] || cropImages.default;
        
        return {
          ...crop,
          image,
        };
      });
      
      setUserCrops(cropDetails);
      
      // Récupérer les données météo en temps réel
      console.log("Récupération des données météo pour la localisation:", userLocation);
      try {
        const weather = await weatherService.getWeatherData(
          userLocation.latitude,
          userLocation.longitude,
          true // La localisation provient de la base de données
        );
        
        if (!weather) {
          throw new Error("Impossible de récupérer les données météo pour votre localisation.");
        }
        
        console.log("Données météo récupérées:", 
          `Température: ${weather.currentTemperature}°C, ` +
          `Humidité: ${weather.currentHumidity}%`);
        
        setWeatherData(weather);
        setWeatherLoading(false);
      } catch (weatherError: any) {
        console.error("Erreur lors de la récupération des données météo:", weatherError);
        setWeatherError(weatherError.message);
        setWeatherLoading(false);
      }
      
      setLoading(false);
    } catch (error: any) {
      console.error("Erreur lors du chargement des données:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Générer une recommandation d'irrigation pour la culture sélectionnée
  const generateRecommendation = () => {
    try {
      if (!weatherData || userCrops.length === 0) {
        console.log("Données météo ou cultures non disponibles, impossible de générer une recommandation");
        return;
      }
      
      const selectedCrop = userCrops[selectedCultureIndex];
      console.log("Génération de recommandation pour la culture:", selectedCrop.name);
      
      // Vérifier que toutes les données nécessaires sont disponibles
      if (!selectedCrop.plantingDate) {
        console.error("Date de plantation manquante pour la culture", selectedCrop.name);
        Alert.alert(
          "Données incomplètes",
          `La date de plantation pour ${selectedCrop.name} est manquante. Veuillez mettre à jour vos informations de culture.`
        );
        return;
      }
      
      if (!selectedCrop.soilType) {
        console.error("Type de sol manquant pour la culture", selectedCrop.name);
        Alert.alert(
          "Données incomplètes",
          `Le type de sol pour ${selectedCrop.name} est manquant. Veuillez mettre à jour vos informations de culture.`
        );
        return;
      }
      
      if (!selectedCrop.area || parseFloat(selectedCrop.area) <= 0) {
        console.error("Superficie invalide pour la culture", selectedCrop.name);
        Alert.alert(
          "Données incomplètes",
          `La superficie pour ${selectedCrop.name} est invalide. Veuillez mettre à jour vos informations de culture.`
        );
        return;
      }
      
      // Convertir les données de culture au format attendu par le service
      const cultureData: CultureData = convertToCultureData(selectedCrop.name, selectedCrop.plantingDate);
      
      // Convertir les données de sol au format attendu par le service
      const solData: SolData = convertToSolData(selectedCrop.soilType);
      
      // Vérifier les données météo
      if (!weatherData.hourlyTemperatures || weatherData.hourlyTemperatures.length === 0) {
        console.error("Données de température horaires manquantes");
        Alert.alert(
          "Données météo incomplètes",
          "Impossible de générer une recommandation d'irrigation précise. Les données météo sont incomplètes."
        );
        return;
      }
      
      if (weatherData.currentHumidity === undefined || weatherData.shortwave_radiation_sum === undefined) {
        console.error("Données d'humidité ou de rayonnement solaire manquantes");
        Alert.alert(
          "Données météo incomplètes",
          "Impossible de générer une recommandation d'irrigation précise. Certaines données météo essentielles sont manquantes."
        );
        return;
      }
      
      // Créer les données météo au format attendu par le service
      const isRaining = weatherData.weatherDescription?.toLowerCase().includes('pluie') || 
                        weatherData.weatherDescription?.toLowerCase().includes('bruine');
      
      const rainForecast = weatherData.nextRainHours?.length > 0;
      
      // Utiliser uniquement les données météo réelles, sans aucune valeur par défaut
      const weatherDataForRecommendation: WeatherData = {
        tMax: Math.max(...weatherData.hourlyTemperatures.slice(0, 24)),
        tMin: Math.min(...weatherData.hourlyTemperatures.slice(0, 24)),
        rayonnement: weatherData.shortwave_radiation_sum,
        humidite: weatherData.currentHumidity,
        pluie: isRaining,
        pluiePrevue: rainForecast,
        heure: new Date().getHours(),
      };
      
      console.log("Données météo pour recommandation:", JSON.stringify(weatherDataForRecommendation, null, 2));
      
      // Convertir la superficie en nombre
      const area = parseFloat(selectedCrop.area);
      
      // Générer la recommandation avec uniquement des données réelles
      const reco = genererRecommandation(
        cultureData,
        solData,
        weatherDataForRecommendation,
        area
      );
      
      console.log("Recommandation générée:", JSON.stringify(reco, null, 2));
      
      // Vérifier que la recommandation a été générée correctement
      if (!reco || reco.volume <= 0) {
        console.error("La recommandation générée n'est pas valide");
        Alert.alert(
          "Erreur",
          "Impossible de générer une recommandation d'irrigation valide avec les données disponibles."
        );
        return;
      }
      
      setRecommendation(reco);
      
    } catch (error: any) {
      console.error('Erreur lors de la génération de la recommandation:', error);
      Alert.alert(
        "Erreur",
        `Impossible de générer une recommandation d'irrigation: ${error.message || "Erreur inconnue"}`
      );
      setRecommendation(null);
    }
  };

  // Marquer une recommandation comme complétée
  const handleMarkComplete = async () => {
    if (!currentUser || !recommendation || selectedCultureIndex >= userCrops.length) {
      Alert.alert("Erreur", "Impossible de compléter cette action pour le moment");
      return;
    }
    
    const selectedCrop = userCrops[selectedCultureIndex];
    
    // Vérifier si la culture a déjà été arrosée aujourd'hui
    try {
      const irrigatedToday = await userService.hasIrrigatedToday(currentUser.uid, selectedCrop.name);
      
      if (irrigatedToday) {
        Alert.alert(
          "Déjà arrosé",
          `Vous avez déjà arrosé ${selectedCrop.name} aujourd'hui.`,
          [{ text: "OK" }]
        );
        return;
      }
      
      // Si pas encore arrosé, afficher la confirmation
      Alert.alert(
        "Irrigation effectuée",
        "Voulez-vous marquer cette irrigation comme effectuée?",
        [
          {
            text: "Annuler",
            style: "cancel"
          },
          {
            text: "Confirmer",
            onPress: async () => {
              try {
                // Ajouter l'irrigation à l'historique
                await userService.addIrrigationHistory(currentUser.uid, {
                  date: new Date(),
                  culture: selectedCrop.name,
                  volume: recommendation.volume,
                  totalVolume: recommendation.total,
                  completed: true
                });
                
                // Recharger l'historique pour afficher la nouvelle entrée
                await loadIrrigationHistory();
                
                // Afficher une confirmation
                Alert.alert(
                  "Parfait!",
                  "Cette irrigation a été marquée comme effectuée et ajoutée à votre historique",
                  [{ text: "OK" }]
                );
              } catch (error: any) {
                console.error("Erreur lors de l'enregistrement de l'irrigation:", error);
                Alert.alert(
                  "Erreur",
                  "Impossible d'enregistrer cette irrigation: " + error.message,
                  [{ text: "OK" }]
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error("Erreur lors de la vérification de l'irrigation:", error);
      Alert.alert(
        "Erreur",
        "Impossible de vérifier votre historique d'irrigation.",
        [{ text: "OK" }]
      );
    }
  };

  // Rendu de l'en-tête avec la localisation
  const renderLocationHeader = () => {
    if (locationLoading) {
      return (
        <View style={styles.locationHeader}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.locationText}>Récupération de la position...</Text>
        </View>
      );
    }

    if (locationError || !userLocation) {
      return (
        <AlertBanner 
          message={locationError || "Impossible de récupérer votre position. Vérifiez vos autorisations de géolocalisation."}
          type="danger"
        />
      );
    }

    return (
      <View style={styles.locationHeader}>
        <View style={styles.locationInfo}>
          <Ionicons name="location" size={20} color={Colors.primary} />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationText}>{userLocation.regionName}</Text>
            {userLocation.detailedLocation && userLocation.detailedLocation !== userLocation.regionName && (
              <Text style={styles.locationDetailText}>{userLocation.detailedLocation}</Text>
            )}
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Enregistrée</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.refreshLocationButton}
          onPress={refreshLocation}
          disabled={locationLoading}
        >
          <Ionicons 
            name="refresh" 
            size={16} 
            color={locationLoading ? Colors.darkGray : Colors.primary} 
          />
        </TouchableOpacity>
      </View>
    );
  };

  // Rafraîchir la position de l'utilisateur
  const refreshLocation = async () => {
    try {
      if (!currentUser) return;
      
      setLocationLoading(true);
      setLocationError(null);
      
      // Utiliser le service de profil pour rafraîchir la position
      const updatedLocation = await profileService.refreshUserLocation(currentUser.uid);
      
      if (!updatedLocation) {
        throw new Error("Impossible de mettre à jour votre position");
      }
      
      setUserLocation(updatedLocation);
      
      // Rafraîchir également les données météo avec la nouvelle position
      if (updatedLocation) {
        try {
          const weather = await weatherService.getWeatherData(
            updatedLocation.latitude,
            updatedLocation.longitude,
            true
          );
          
          if (weather) {
            setWeatherData(weather);
            setWeatherError(null);
            
            // Régénérer la recommandation avec les nouvelles données météo
            if (userCrops.length > 0) {
              generateRecommendation();
            }
          }
        } catch (weatherError: any) {
          console.error("Erreur lors de la mise à jour des données météo:", weatherError);
          // Ne pas bloquer le processus si la météo échoue
        }
      }
      
    } catch (error: any) {
      console.error("Erreur lors du rafraîchissement de la position:", error);
      setLocationError(error.message);
    } finally {
      setLocationLoading(false);
    }
  };

  // Fonction utilitaire pour obtenir l'icône appropriée
  const getCultureIcon = (stage: string) => {
    switch (stage) {
      case 'leaf':
        return 'leaf';
      case 'sprout':
        return 'sprout';
      case 'fruit-tomato':
        return 'fruit-cherries';
      default:
        return 'sprout';
    }
  };

  const renderBesoinsTab = () => {
    if (loading || weatherLoading) {
      return (
        <Animated.View 
          entering={FadeInUp.delay(200)} 
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            {loading ? "Chargement des données utilisateur..." : "Récupération des données météo en temps réel..."}
          </Text>
          <Text style={styles.loadingSubtext}>
            Nous récupérons les données pour générer des recommandations précises
          </Text>
        </Animated.View>
      );
    }

    if (error) {
      return (
        <Animated.View 
          entering={FadeInUp.delay(200)} 
          style={styles.errorContainer}
        >
          <LinearGradient
            colors={['#ffebee', '#ffcdd2']}
            style={styles.errorGradient}
          >
            <Ionicons name="alert-circle" size={48} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorSubtext}>
              Les recommandations d'irrigation nécessitent des données actualisées.
            </Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={loadUserDataAndWeather}
            >
              <Ionicons name="refresh" size={20} color={Colors.white} />
              <Text style={styles.refreshButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      );
    }

    if (userCrops.length === 0) {
      return (
        <Animated.View 
          entering={FadeInUp.delay(200)} 
          style={styles.errorContainer}
        >
          <LinearGradient
            colors={['#e8f5e9', '#c8e6c9']}
            style={styles.errorGradient}
          >
            <Ionicons name="leaf" size={48} color={Colors.primary} />
            <Text style={styles.errorText}>Aucune culture configurée</Text>
            <Text style={styles.errorSubtext}>
              Vous devez ajouter au moins une culture pour recevoir des recommandations d'irrigation.
            </Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={() => router.push('/(auth)/profile')}
            >
              <Ionicons name="add-circle" size={20} color={Colors.white} />
              <Text style={styles.refreshButtonText}>Configurer mon profil</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      );
    }

    const selectedCulture = userCrops[selectedCultureIndex];

    return (
      <ScrollView style={styles.tabContent}>
        {weatherError && (
          <AlertBanner
            message="Impossible de récupérer les données météo actuelles. Les recommandations pourraient ne pas être précises."
            type="warning"
          />
        )}

        {/* En-tête avec météo */}
        <Animated.View 
          entering={FadeInDown.delay(200)} 
          style={styles.weatherHeader}
        >
          <LinearGradient
            colors={weatherData?.backgroundGradient as [string, string] || ['#4A90E2', '#87CEEB'] as [string, string]}
            style={styles.weatherGradient}
          >
            <View style={styles.weatherContent}>
              <View style={styles.weatherMain}>
                <Ionicons 
                  name={(weatherData?.weatherIcon || 'partly-sunny') as any} 
                  size={40} 
                  color="#fff" 
                />
                <Text style={styles.temperature}>
                  {weatherData?.currentTemperature}°C
                </Text>
              </View>
              <Text style={styles.weatherDescription}>
                {weatherData?.weatherDescription || 'Chargement...'}
              </Text>
              <Text style={styles.location}>
                {weatherData?.locationName || 'Localisation...'}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Sélecteur de cultures */}
        {userCrops.length > 1 && (
          <Animated.View 
            entering={FadeInDown.delay(300)} 
            style={styles.culturePicker}
          >
            <Text style={styles.culturePickerLabel}>Sélectionnez une culture:</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.culturePickerScroll}
            >
              {userCrops.map((crop, index) => (
                <TouchableOpacity
                  key={crop.id}
                  style={[
                    styles.culturePickerButton,
                    selectedCultureIndex === index && styles.culturePickerButtonActive
                  ]}
                  onPress={() => setSelectedCultureIndex(index)}
                >
                  <MaterialCommunityIcons
                    name={getCultureIcon(selectedCulture.name)}
                    size={24}
                    color={selectedCultureIndex === index ? Colors.white : Colors.primary}
                  />
                  <Text 
                    style={[
                      styles.culturePickerButtonText,
                      selectedCultureIndex === index && styles.culturePickerButtonTextActive
                    ]}
                  >
                    {selectedCulture.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Carte de recommandation */}
        {recommendation && (
          <Animated.View 
            entering={FadeInUp.delay(200)} 
            style={styles.recommendationCard}
          >
            <IrrigationCard
              culture={recommendation.culture}
              sol={recommendation.sol}
              volume={recommendation.volume}
              totalVolume={recommendation.total}
              frequency={recommendation.frequence}
              moment={recommendation.plageHoraire}
              message={recommendation.message}
              constraint={recommendation.contrainte}
              weatherIcon={weatherData?.weatherIcon}
              weatherData={{
                temperature: weatherData?.currentTemperature,
                humidity: weatherData?.currentHumidity,
                isRaining: weatherData?.weatherDescription?.toLowerCase().includes('pluie'),
                rainForecast: (weatherData?.nextRainHours?.length || 0) > 0
              }}
              onMarkComplete={handleMarkComplete}
              initialCompleted={false} // Sera vérifié à l'intérieur du IrrigationCard
            />
          </Animated.View>
        )}

        {/* Informations détaillées de la culture */}
        <Animated.View 
          entering={FadeInUp.delay(500)}
          style={styles.cultureDetailsCard}
        >
          <LinearGradient
            colors={['#ffffff', '#f8f9fa']}
            style={styles.cultureDetailsGradient}
          >
            <View style={styles.cultureHeader}>
              <MaterialCommunityIcons
                name={getCultureIcon(selectedCulture.name)}
                size={32}
                color={Colors.primary}
              />
              <Text style={styles.cultureName}>{selectedCulture.name}</Text>
            </View>

            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="shovel" size={24} color={Colors.earth} />
                  <Text style={styles.infoLabel}>Type de sol:</Text>
                  <Text style={styles.infoValue}>{selectedCulture.soilType}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="ruler" size={24} color={Colors.primary} />
                  <Text style={styles.infoLabel}>Superficie:</Text>
                  <Text style={styles.infoValue}>{selectedCulture.area} m²</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="calendar" size={24} color={Colors.success} />
                  <Text style={styles.infoLabel}>Planté le:</Text>
                  <Text style={styles.infoValue}>{formatDate(selectedCulture.plantingDate)}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </ScrollView>
    );
  };

  const renderHistoriqueTab = () => {
    if (historyLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement de l'historique d'irrigation...</Text>
        </View>
      );
    }
    
    if (historyError) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={40} color={Colors.white} />
          <Text style={styles.errorText}>{historyError}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadIrrigationHistory}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (irrigationHistory.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="water-outline" size={60} color={Colors.primary} />
          <Text style={styles.emptyText}>
            Vous n'avez pas encore d'historique d'irrigation.
          </Text>
          <Text style={styles.emptySubText}>
            Commencez par marquer vos irrigations comme effectuées dans l'onglet "Besoins en eau".
          </Text>
        </View>
      );
    }
    
    // Déterminer le mois et l'année actuels pour l'affichage
    const currentDate = new Date();
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const currentMonthDisplay = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
    return (
    <ScrollView style={styles.tabContent}>
      <View style={styles.calendarContainer}>
        <TouchableOpacity>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
          <Text style={styles.monthText}>{currentMonthDisplay}</Text>
        <TouchableOpacity>
          <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekDaysContainer}>
        {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((day) => (
          <Text key={day} style={styles.weekDayText}>{day}</Text>
        ))}
      </View>

      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Historique d'irrigation</Text>
          {irrigationHistory.map((item) => (
            <View key={item.id} style={styles.historyItem}>
            <View style={styles.historyDate}>
              <Text style={styles.historyDateText}>{item.date}</Text>
            </View>
            <View style={styles.historyDetails}>
              <Text style={styles.historyText}>{item.culture}</Text>
              <Text style={styles.historyText}>{item.quantity}</Text>
            </View>
            <View style={styles.historyStatus}>
              {item.isCompleted ? (
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              ) : (
                <Ionicons name="close-circle" size={24} color="#F44336" />
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
  };

  // Format date for display
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
      
      <Animated.View 
        entering={FadeInDown} 
        style={styles.screenHeader}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Irrigation</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => router.push('/(auth)/settings')}
        >
          <Ionicons name="settings-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
      </Animated.View>
      
      {/* En-tête de localisation */}
      {renderLocationHeader()}
      
      {/* Message d'erreur global si nécessaire */}
      {error && (
        <AlertBanner 
          message={error}
          type="danger"
        />
      )}
      
      {/* Onglets */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'besoins' && styles.activeTab]}
          onPress={() => setActiveTab('besoins')}
        >
          <Text style={[styles.tabText, activeTab === 'besoins' && styles.activeTabText]}>
            Besoins en eau
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'historique' && styles.activeTab]}
          onPress={() => setActiveTab('historique')}
        >
          <Text style={[styles.tabText, activeTab === 'historique' && styles.activeTabText]}>
            Historique
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Contenu de l'onglet */}
      {activeTab === 'besoins' ? renderBesoinsTab() : renderHistoriqueTab()}

      {/* Barre de navigation restaurée */}
      <View style={styles.navbar}>
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => router.push('/(auth)/home')}
        >
          <Ionicons name="home" size={24} color={Colors.darkGray} />
          <Text style={styles.navText}>Accueil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="water" size={24} color={Colors.primary} />
          <Text style={[styles.navText, styles.activeNavText]}>Irrigation</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  screenHeader: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: Colors.white,
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: Colors.light,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  locationInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  locationText: {
    fontSize: 16,
    fontFamily: 'OpenSans-SemiBold',
    color: Colors.text,
  },
  locationDetailText: {
    fontSize: 12,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    marginTop: 2,
  },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: 'OpenSans-SemiBold',
  },
  refreshLocationButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: Colors.darkGray,
  },
  activeTabText: {
    color: Colors.primary,
  },
  tabContent: {
    flex: 1,
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    textAlign: 'center',
    opacity: 0.8,
  },
  errorContainer: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  errorGradient: {
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.darkGray,
    textAlign: 'center',
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    textAlign: 'center',
    opacity: 0.8,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  refreshButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'OpenSans-SemiBold',
    color: Colors.white,
  },
  weatherHeader: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  weatherGradient: {
    padding: 20,
  },
  weatherContent: {
    alignItems: 'center',
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  temperature: {
    fontSize: 32,
    fontFamily: 'Montserrat-Bold',
    color: Colors.white,
    marginLeft: 12,
  },
  weatherDescription: {
    fontSize: 16,
    fontFamily: 'OpenSans-SemiBold',
    color: Colors.white,
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.white,
    opacity: 0.9,
  },
  culturePicker: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  culturePickerLabel: {
    fontSize: 16,
    fontFamily: 'OpenSans-SemiBold',
    color: Colors.darkGray,
    marginBottom: 12,
  },
  culturePickerScroll: {
    flexGrow: 0,
  },
  culturePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  culturePickerButtonActive: {
    backgroundColor: Colors.primary,
  },
  culturePickerButtonText: {
    fontSize: 16,
    fontFamily: 'OpenSans-SemiBold',
    color: Colors.darkGray,
    marginLeft: 8,
  },
  culturePickerButtonTextActive: {
    color: Colors.white,
  },
  cultureDetailsCard: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cultureDetailsGradient: {
    padding: 20,
  },
  cultureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cultureName: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: Colors.primary,
    marginLeft: 12,
  },
  infoContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'OpenSans-SemiBold',
    color: Colors.darkGray,
    marginLeft: 8,
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.text,
    flex: 1,
  },
  calendarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.white,
  },
  monthText: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.primary,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#E8F5E9',
  },
  weekDayText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
  },
  historyContainer: {
    backgroundColor: Colors.white,
    marginTop: 1,
    padding: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.primary,
    marginBottom: 15,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  historyDate: {
    width: 100,
  },
  historyDateText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
  },
  historyDetails: {
    flex: 1,
  },
  historyText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
  },
  historyStatus: {
    width: 40,
    alignItems: 'center',
  },
  locationBadge: {
    backgroundColor: Colors.blue,
    borderRadius: 8,
    padding: 4,
    marginLeft: 8,
  },
  locationBadgeText: {
    fontSize: 12,
    fontFamily: 'OpenSans-Regular',
    color: Colors.white,
  },
  locationBadgeLive: {
    backgroundColor: '#4CAF50',
  },
  weatherFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  weatherFooterText: {
    fontSize: 12,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    marginTop: 4,
  },
  activeNavText: {
    color: Colors.primary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: Colors.white,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.primary,
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    marginTop: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  },
  recommendationCard: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
}); 