import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import IrrigationCard from '@/components/recommendations/IrrigationCard';
import AlertBanner from '@/components/recommendations/AlertBanner';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useTranslation } from '@/utils/i18n';
import { 
  genererRecommandation, 
  type CultureData, 
  type SolData, 
  type WeatherData, 
  type Recommandation 
} from '@/services/recommendations.service';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import WeatherService from '@/services/weather.service';
import userService from '@/services/user.service';
import notificationService from '@/services/notification.service';

// Récupérer la fonction du service météo
const getWeatherData = async (lat: number, lon: number) => {
  const weatherService = WeatherService;
  return await weatherService.getWeatherData(lat, lon);
};

export default function RecommendationsScreen() {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<Recommandation | null>(null);
  const [weatherIcon, setWeatherIcon] = useState('sunny');
  const [userCultures, setUserCultures] = useState<CultureData[]>([]);
  const [selectedCulture, setSelectedCulture] = useState<CultureData | null>(null);

  // Function to mark irrigation as completed
  const handleMarkComplete = async () => {
    try {
      // Annuler les rappels d'irrigation pour cette culture
      await notificationService.cancelAllNotifications();
      alert('Irrigation marquée comme complétée !');
    } catch (error) {
      console.error('Erreur lors de la marque comme complétée:', error);
    }
  };

  // Get current weather condition for icon
  const determineWeatherIcon = (weather: WeatherData) => {
    if (weather.pluie) return 'rainy';
    if (weather.pluiePrevue) return 'cloudy';
    if (weather.humidite > 80) return 'partly-sunny';
    if (weather.tMax > 35) return 'sunny';
    return 'partly-sunny';
  };

  // Get culture icon based on type
  const getCultureIcon = (cultureName: string) => {
    switch (cultureName) {
      case 'Tomate':
        return 'nutrition';
      case 'Laitue':
        return 'leaf';
      case 'Maïs':
        return 'flower';
      default:
        return 'leaf';
    }
  };

  // Load user data and generate recommendation
  const loadRecommendation = async (culture: CultureData) => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch user's data from Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        setError(t('messages_erreur.donnees_incompletes'));
        setLoading(false);
        return;
      }
      
      const userData = userDoc.data();
      
      // Vérification des champs obligatoires
      if (!userData.location?.latitude || !userData.location?.longitude) {
        setError(t('messages_erreur.donnees_meteo_incompletes'));
        setLoading(false);
        return;
      }
      
      // Get soil data for the selected culture
      const sol: SolData = {
        name: culture.soilType,
        capaciteRetenue: 0.3,
        intervalleIrrigation: 24
      };
      
      // Récupération des données météo dynamiques
      try {
        const formattedWeather = await getWeatherData(
          userData.location.latitude,
          userData.location.longitude
        );
        
        // Conversion des données météo au format attendu par le service de recommandations
        const weather: WeatherData = {
          tMax: formattedWeather.dailyForecast.maxTemperatures[0] || 30,
          tMin: formattedWeather.dailyForecast.minTemperatures[0] || 22,
          rayonnement: formattedWeather.shortwave_radiation_sum || 20, 
          humidite: formattedWeather.currentHumidity || 65,
          pluie: formattedWeather.hourlyPrecipitation[0] > 0.5,
          pluiePrevue: formattedWeather.nextRainHours.length > 0,
          heure: new Date().getHours()
        };
        
        setWeatherIcon(formattedWeather.weatherIcon || determineWeatherIcon(weather));
        
        // Generate recommendation
        const reco = genererRecommandation(culture, sol, weather, culture.area);
        setRecommendation(reco);

        // Planifier les notifications si les préférences sont activées
        if (userData.notificationSettings?.daily) {
          await notificationService.scheduleDailyNotification(
            culture.name,
            reco.message,
            userData.language || 'fr'
          );
        }

        // Planifier les rappels d'irrigation si activés
        if (userData.notificationSettings?.irrigation) {
          // Premier rappel après 1 heure
          await notificationService.scheduleIrrigationReminder(culture.name, true, userData.language || 'fr');
          // Second rappel après 6 heures
          await notificationService.scheduleIrrigationReminder(culture.name, false, userData.language || 'fr');
        }

        // Envoyer une alerte météo si nécessaire
        if (userData.notificationSettings?.weather) {
          if (weather.pluie || weather.pluiePrevue) {
            await notificationService.sendWeatherAlert(
              t('notifications.meteo.message'),
              userData.language || 'fr'
            );
          }
        }
        
      } catch (weatherError) {
        console.error("Erreur lors de la récupération des données météo:", weatherError);
        setError(t('messages_erreur.impossible_recommandation'));
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error loading recommendation:", err);
      setError(t('messages_erreur.impossible_recommandation'));
      setLoading(false);
    }
  };

  // Load user cultures
  const loadUserCultures = async () => {
    if (!currentUser) return;
    
    try {
      const cultures = await userService.getUserCultures(currentUser.uid);
      
      // Vérifier l'unicité des noms de cultures
      const uniqueCultures = cultures.filter((culture, index, self) =>
        index === self.findIndex((c) => c.name === culture.name)
      );
      
      setUserCultures(uniqueCultures);
      
      if (uniqueCultures.length > 0) {
        setSelectedCulture(uniqueCultures[0]);
        loadRecommendation(uniqueCultures[0]);
      } else {
        setError(t('recommandations_irrigation.configurer_cultures'));
      }
    } catch (err) {
      console.error("Error loading cultures:", err);
      setError(t('messages_erreur.donnees_incompletes'));
    }
  };

  // Load initial data
  useEffect(() => {
    const initializeNotifications = async () => {
      if (currentUser) {
        // Demander les permissions pour les notifications
        const hasPermission = await notificationService.requestPermissions();
        if (hasPermission) {
          // Enregistrer le token de notification
          await notificationService.registerForPushNotifications(currentUser.uid);
        }
      }
    };

    initializeNotifications();
    loadUserCultures();
  }, [currentUser]);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    if (selectedCulture) {
      await loadRecommendation(selectedCulture);
    }
    setRefreshing(false);
  };

  // Handle culture selection
  const handleCultureSelect = (culture: CultureData) => {
    setSelectedCulture(culture);
    loadRecommendation(culture);
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ThemedView style={styles.header}>
        <ThemedText type="title">{t('recommandations_irrigation.titre')}</ThemedText>
        <ThemedText style={styles.subtitle}>
          {t('recommandations_irrigation.sous_titre')}
        </ThemedText>
      </ThemedView>

      {/* Culture selector */}
      {userCultures.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.cultureSelector}
          contentContainerStyle={styles.cultureSelectorContent}
        >
          {userCultures.map((culture) => (
            <TouchableOpacity
              key={culture.id}
              style={[
                styles.cultureButton,
                selectedCulture?.id === culture.id && styles.selectedCultureButton
              ]}
              onPress={() => handleCultureSelect(culture)}
            >
              <Ionicons 
                name={getCultureIcon(culture.name)} 
                size={24} 
                color={selectedCulture?.id === culture.id ? Colors.white : Colors.primary} 
              />
              <ThemedText 
                style={[
                  styles.cultureButtonText,
                  selectedCulture?.id === culture.id && styles.selectedCultureButtonText
                ]}
                numberOfLines={1}
              >
                {culture.name}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.blue} />
          <ThemedText style={styles.loadingText}>
            {t('recommandations_irrigation.calcul_en_cours')}
          </ThemedText>
        </View>
      ) : error ? (
        <AlertBanner 
          message={error} 
          type="danger" 
        />
      ) : recommendation ? (
        <View style={styles.recommendationContainer}>
          <IrrigationCard
            culture={recommendation.culture}
            sol={recommendation.sol}
            volume={recommendation.volume}
            totalVolume={recommendation.total}
            frequency={recommendation.frequence}
            moment={recommendation.moment}
            message={recommendation.message}
            constraint={recommendation.contrainte}
            weatherIcon={weatherIcon}
            onMarkComplete={handleMarkComplete}
          />
          
          {/* Explication de la recommandation */}
          <ThemedView style={styles.explanationCard}>
            <View style={styles.explanationHeader}>
              <Ionicons name="information-circle" size={24} color={Colors.blue} />
              <ThemedText style={styles.explanationTitle}>
                {t('recommandations_irrigation.comprendre_titre')}
              </ThemedText>
            </View>
            <ThemedText style={styles.explanationText}>
              {t('recommandations_irrigation.comprendre_texte', {
                culture: recommendation.culture,
                sol: recommendation.sol
              })}
            </ThemedText>
          </ThemedView>
        </View>
      ) : (
        <ThemedView style={styles.emptyContainer}>
          <Ionicons name="water-outline" size={64} color={Colors.blue} />
          <ThemedText style={styles.emptyText}>
            {t('recommandations_irrigation.aucune_recommandation')}
          </ThemedText>
          <ThemedText style={styles.emptySubtext}>
            {t('recommandations_irrigation.configurer_cultures')}
          </ThemedText>
        </ThemedView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  subtitle: {
    marginTop: 8,
    opacity: 0.7,
  },
  cultureSelector: {
    marginBottom: 16,
  },
  cultureSelectorContent: {
    paddingHorizontal: 4,
  },
  cultureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.primary,
    minWidth: 120,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedCultureButton: {
    backgroundColor: Colors.primary,
    transform: [{ scale: 1.05 }],
  },
  cultureButtonText: {
    marginLeft: 8,
    color: Colors.primary,
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
  },
  selectedCultureButtonText: {
    color: Colors.white,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  recommendationContainer: {
    gap: 16,
  },
  explanationCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  explanationText: {
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    marginTop: 8,
    opacity: 0.7,
    textAlign: 'center',
  },
});
