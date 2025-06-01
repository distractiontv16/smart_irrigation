import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Image,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import weatherService, { FormattedWeatherData } from '../../services/weather.service';
import { auth } from '../../firebaseConfig';
import userService from '../../services/user.service';

// Coordonnées par défaut pour Cotonou, Bénin (utilisées uniquement si l'utilisateur n'a pas de localisation)
const DEFAULT_COORDS = {
  latitude: 6.36,
  longitude: 2.42,
};

// Largeur de l'écran pour le graphique
const { width } = Dimensions.get('window');

export default function WeatherScreen() {
  const [weatherData, setWeatherData] = useState<FormattedWeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number, region?: string} | null>(null);
  const [locationName, setLocationName] = useState<string>("Localisation...");

  // Fonction pour charger la localisation de l'utilisateur depuis Firestore
  const loadUserLocation = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('Aucun utilisateur connecté');
        return null;
      }

      const userData = await userService.getUserData(user.uid);
      if (userData && userData.location) {
        setUserLocation(userData.location);
        setLocationName(userData.location.region || "Votre localisation");
        return userData.location;
      } else {
        console.warn('Aucune localisation trouvée pour l\'utilisateur');
        setLocationName("Cotonou, Bénin (par défaut)");
        return null;
      }
    } catch (err) {
      console.error('Erreur lors du chargement de la localisation utilisateur:', err);
      setLocationName("Cotonou, Bénin (par défaut)");
      return null;
    }
  };

  // Fonction pour charger les données météo
  const loadWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger la localisation de l'utilisateur
      const location = await loadUserLocation();
      
      // Utiliser la localisation de l'utilisateur ou les coordonnées par défaut
      const latitude = location?.latitude || DEFAULT_COORDS.latitude;
      const longitude = location?.longitude || DEFAULT_COORDS.longitude;
      
      const data = await weatherService.getWeatherData(latitude, longitude);
      setWeatherData(data);
    } catch (err: any) {
      setError(err.message || 'Une erreur s\'est produite');
      console.error('Erreur lors du chargement des données météo:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Charger les données au chargement de l'écran
  useEffect(() => {
    loadWeatherData();
  }, []);

  // Gérer le rafraîchissement par pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadWeatherData();
  };

  // Obtenir une icône météo en fonction du code météo
  const getWeatherIcon = (weatherCode: number) => {
    // Map des codes météo WMO vers les icônes Ionicons
    // Source: https://open-meteo.com/en/docs
    if (weatherCode === 0) return 'sunny';
    if (weatherCode <= 3) return 'partly-sunny';
    if (weatherCode <= 48) return 'cloud';
    if (weatherCode <= 57) return 'rainy';
    if (weatherCode <= 67) return 'thunderstorm';
    if (weatherCode <= 77) return 'snow';
    if (weatherCode <= 82) return 'rainy';
    if (weatherCode <= 86) return 'snow';
    if (weatherCode <= 99) return 'thunderstorm';
    
    return 'cloud'; // Par défaut
  };

  // Obtenir la couleur pour les précipitations
  const getPrecipitationColor = (precipitationAmount: number) => {
    if (precipitationAmount === 0) return Colors.success;
    if (precipitationAmount < 0.5) return Colors.blue;
    if (precipitationAmount < 2) return Colors.info;
    if (precipitationAmount < 10) return Colors.warning;
    return Colors.danger;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Météo</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/(auth)/settings')}
        >
          <Ionicons name="settings-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Chargement des données météo...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="cloud-offline" size={64} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadWeatherData}
            >
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : weatherData ? (
          <>
            {/* Localisation */}
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={20} color={Colors.primary} />
              <Text style={styles.locationText}>{locationName}</Text>
            </View>

            {/* Météo actuelle */}
            <View style={styles.currentWeatherCard}>
              <View style={styles.currentWeatherHeader}>
                <Ionicons
                  name={getWeatherIcon(weatherData.currentWeatherCode) as any}
                  size={72}
                  color={Colors.primary}
                />
                <View style={styles.currentWeatherInfo}>
                  <Text style={styles.currentTemperature}>
                    {weatherData.currentTemperature.toFixed(1)}°C
                  </Text>
                  <Text style={styles.weatherDescription}>
                    {weatherData.weatherDescription}
                  </Text>
                </View>
              </View>
              
              <View style={styles.weatherDetailGrid}>
                <View style={styles.weatherDetailItem}>
                  <FontAwesome5 name="temperature-high" size={24} color={Colors.primary} />
                  <Text style={styles.weatherDetailLabel}>Température</Text>
                  <Text style={styles.weatherDetailValue}>
                    {weatherData.currentTemperature.toFixed(1)}°C
                  </Text>
                </View>
                
                <View style={styles.weatherDetailItem}>
                  <Ionicons name="water" size={24} color={Colors.primary} />
                  <Text style={styles.weatherDetailLabel}>Humidité</Text>
                  <Text style={styles.weatherDetailValue}>
                    {weatherData.currentHumidity.toFixed(0)}%
                  </Text>
                </View>
                
                <View style={styles.weatherDetailItem}>
                  <Ionicons name="rainy" size={24} color={Colors.primary} />
                  <Text style={styles.weatherDetailLabel}>Précipitations</Text>
                  <Text style={styles.weatherDetailValue}>
                    {weatherData.hourlyPrecipitation[0]}mm
                  </Text>
                </View>
              </View>
            </View>

            {/* Prévisions horaires */}
            <View style={styles.forecastCard}>
              <Text style={styles.forecastTitle}>Prévisions sur 24h</Text>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyForecast}>
                {weatherData.forecastHours.map((hour, index) => (
                  <View key={index} style={styles.hourlyItem}>
                    <Text style={styles.hourlyTime}>{hour}</Text>
                    <Ionicons
                      name={index === 0 
                        ? getWeatherIcon(weatherData.currentWeatherCode) as any 
                        : 'partly-sunny'
                      }
                      size={24}
                      color={Colors.primary}
                    />
                    <Text style={styles.hourlyTemp}>
                      {weatherData.hourlyTemperatures[index].toFixed(1)}°C
                    </Text>
                    <View style={[
                      styles.precipitationIndicator,
                      { backgroundColor: getPrecipitationColor(weatherData.hourlyPrecipitation[index]) }
                    ]}>
                      <Text style={styles.precipitationText}>
                        {weatherData.hourlyPrecipitation[index]}mm
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Graphique de la température */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Évolution de la température</Text>
              
              <View style={styles.chart}>
                {weatherData.hourlyTemperatures.slice(0, 12).map((temp, index) => {
                  // Normaliser la température pour l'affichage (entre 15°C et 35°C)
                  const minTemp = 15;
                  const maxTemp = 35;
                  const normalizedHeight = 
                    Math.min(100, Math.max(0, ((temp - minTemp) / (maxTemp - minTemp)) * 100));
                  
                  return (
                    <View key={index} style={styles.chartColumn}>
                      <View style={styles.chartValueContainer}>
                        <Text style={styles.chartValue}>{temp.toFixed(1)}°</Text>
                      </View>
                      <View style={[
                        styles.chartBar,
                        { height: `${normalizedHeight}%` }
                      ]} />
                      <Text style={styles.chartLabel}>
                        {weatherData.forecastHours[index]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Indice agricole - Section pour les futures recommandations */}
            <View style={styles.agricultureCard}>
              <View style={styles.agricultureHeader}>
                <FontAwesome5 name="seedling" size={24} color={Colors.primary} />
                <Text style={styles.agricultureTitle}>Impact sur vos cultures</Text>
              </View>
              
              <View style={styles.agricultureContent}>
                <Text style={styles.agricultureDescription}>
                  {weatherData.hourlyPrecipitation.some(p => p > 0.5)
                    ? "Les prévisions indiquent des précipitations dans les prochaines heures. Vous pourriez réduire l'irrigation aujourd'hui."
                    : "Peu ou pas de précipitations prévues. Vos cultures pourraient nécessiter une irrigation selon leur calendrier habituel."
                  }
                </Text>
                
                <View style={styles.agricultureRecommendation}>
                  <Ionicons 
                    name={weatherData.hourlyPrecipitation.some(p => p > 0.5) ? "checkmark-circle" : "water"}
                    size={24}
                    color={Colors.primary}
                  />
                  <Text style={styles.recommendationText}>
                    {weatherData.hourlyPrecipitation.some(p => p > 0.5)
                      ? "Irrigation probablement non nécessaire aujourd'hui"
                      : "Suivez votre planning d'irrigation habituel"
                    }
                  </Text>
                </View>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    height: 56,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: Colors.white,
  },
  settingsButton: {
    padding: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 300,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.darkGray,
    fontFamily: 'OpenSans-Regular',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    height: 300,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.danger,
    textAlign: 'center',
    fontFamily: 'OpenSans-Regular',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    fontSize: 16,
    marginLeft: 8,
    color: Colors.darkGray,
    fontFamily: 'OpenSans-Regular',
  },
  currentWeatherCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  currentWeatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  currentWeatherInfo: {
    marginLeft: 20,
  },
  currentTemperature: {
    fontSize: 36,
    fontFamily: 'Montserrat-Bold',
    color: Colors.darkGray,
  },
  weatherDescription: {
    fontSize: 18,
    color: Colors.darkGray,
    fontFamily: 'OpenSans-Regular',
  },
  weatherDetailGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weatherDetailItem: {
    alignItems: 'center',
    flex: 1,
  },
  weatherDetailLabel: {
    fontSize: 14,
    color: Colors.darkGray,
    marginTop: 8,
    fontFamily: 'OpenSans-Regular',
  },
  weatherDetailValue: {
    fontSize: 16,
    fontFamily: 'RobotoMono-Regular',
    color: Colors.darkGray,
    marginTop: 4,
  },
  forecastCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  forecastTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.darkGray,
    marginBottom: 16,
  },
  hourlyForecast: {
    flexDirection: 'row',
  },
  hourlyItem: {
    alignItems: 'center',
    marginRight: 20,
    minWidth: 60,
  },
  hourlyTime: {
    fontSize: 14,
    color: Colors.darkGray,
    marginBottom: 8,
    fontFamily: 'OpenSans-Regular',
  },
  hourlyTemp: {
    fontSize: 16,
    fontFamily: 'RobotoMono-Regular',
    color: Colors.darkGray,
    marginTop: 8,
    marginBottom: 8,
  },
  precipitationIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  precipitationText: {
    fontSize: 12,
    color: Colors.white,
    fontFamily: 'RobotoMono-Regular',
  },
  chartCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.darkGray,
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    height: 180,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 20,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  chartValueContainer: {
    position: 'absolute',
    top: -20,
    alignItems: 'center',
  },
  chartValue: {
    fontSize: 12,
    color: Colors.darkGray,
    fontFamily: 'RobotoMono-Regular',
  },
  chartBar: {
    width: 8,
    backgroundColor: Colors.primary,
    borderRadius: 4,
    minHeight: 5,
  },
  chartLabel: {
    fontSize: 10,
    color: Colors.darkGray,
    marginTop: 8,
    fontFamily: 'OpenSans-Regular',
  },
  agricultureCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  agricultureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  agricultureTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.darkGray,
    marginLeft: 12,
  },
  agricultureContent: {
    paddingHorizontal: 4,
  },
  agricultureDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.darkGray,
    marginBottom: 16,
    fontFamily: 'OpenSans-Regular',
  },
  agricultureRecommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.translucentGreen,
    padding: 12,
    borderRadius: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: Colors.darkGray,
    marginLeft: 12,
    flex: 1,
    fontFamily: 'OpenSans-Regular',
  },
});

