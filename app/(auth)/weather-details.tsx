import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import Colors from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { FormattedWeatherData } from '../../services/weather.service';
import weatherService from '../../services/weather.service';
import * as Location from 'expo-location';

export default function WeatherDetailsScreen() {
  // Hide the header with Stack.Screen component
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <WeatherDetailsContent />
    </>
  );
}

function WeatherDetailsContent() {
  const [weatherData, setWeatherData] = React.useState<FormattedWeatherData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Hide the status bar at the top
  React.useEffect(() => {
    // Hide header on mount
    const hideHeader = async () => {
      // Wait for next frame to ensure UI is ready
      await new Promise(resolve => requestAnimationFrame(resolve));
    };
    
    hideHeader();
  }, []);

  // Fonction pour obtenir la position actuelle
  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission de localisation refusée');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      return location;
    } catch (error) {
      console.error('Erreur de géolocalisation:', error);
      setError('Impossible d\'obtenir votre position');
      return null;
    }
  };

  // Fonction pour charger les données météo
  const loadWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);

      const location = await getLocation();
      if (!location) {
        throw new Error('Position non disponible');
      }

      const data = await weatherService.getWeatherData(
        location.coords.latitude,
        location.coords.longitude
      );
      
      setWeatherData(data);
    } catch (error) {
      console.error('Erreur lors du chargement des données météo:', error);
      setError('Impossible de charger les données météo');
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage du composant
  React.useEffect(() => {
    loadWeatherData();
  }, []);

  // Afficher un message d'erreur si nécessaire
  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détails Météo</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadWeatherData}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails Météo</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {weatherData ? (
          <>
            {/* Carte météo principale */}
            <LinearGradient
              colors={['#4880EC', '#019CAD']}
              style={styles.mainCard}
            >
              <View style={styles.mainInfo}>
                <FontAwesome5 
                  name="cloud-sun" 
                  size={72} 
                  color={Colors.white} 
                />
                <Text style={styles.temperature}>
                  {Math.round(weatherData.currentTemperature)}°C
                </Text>
                <Text style={styles.description}>
                  {weatherData.weatherDescription}
                </Text>
                <Text style={styles.location}>
                  {weatherData.locationName}
                </Text>
              </View>
            </LinearGradient>

            {/* Prévisions horaires */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Prévisions horaires</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {weatherData.forecastHours.map((hour, index) => (
                  <View key={index} style={styles.hourlyCard}>
                    <Text style={styles.hourText}>{hour}</Text>
                    <FontAwesome5 
                      name="cloud" 
                      size={24} 
                      color={Colors.primary} 
                    />
                    <Text style={styles.hourlyTemp}>
                      {Math.round(weatherData.hourlyTemperatures[index])}°C
                    </Text>
                    <Text style={styles.hourlyHumidity}>
                      {weatherData.hourlyHumidity[index]}%
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Détails supplémentaires */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Détails</Text>
              <View style={styles.detailsGrid}>
                <View style={styles.detailCard}>
                  <FontAwesome5 name="temperature-high" size={24} color={Colors.primary} />
                  <Text style={styles.detailValue}>{weatherData.currentTemperature}°C</Text>
                  <Text style={styles.detailLabel}>Température</Text>
                </View>
                <View style={styles.detailCard}>
                  <FontAwesome5 name="tint" size={24} color={Colors.primary} />
                  <Text style={styles.detailValue}>{weatherData.currentHumidity}%</Text>
                  <Text style={styles.detailLabel}>Humidité</Text>
                </View>
                <View style={styles.detailCard}>
                  <FontAwesome5 name="cloud-rain" size={24} color={Colors.primary} />
                  <Text style={styles.detailValue}>{weatherData.hourlyPrecipitation[0] || 0}mm</Text>
                  <Text style={styles.detailLabel}>Précipitations</Text>
                </View>
                <View style={styles.detailCard}>
                  <FontAwesome5 name="wind" size={24} color={Colors.primary} />
                  <Text style={styles.detailValue}>{weatherData.windSpeed} km/h</Text>
                  <Text style={styles.detailLabel}>Vent</Text>
                </View>
              </View>
            </View>

            {/* Prévisions de pluie */}
            {weatherData.nextRainHours.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Prévisions de pluie</Text>
                <View style={styles.rainCard}>
                  <FontAwesome5 name="cloud-rain" size={24} color={Colors.primary} />
                  <Text style={styles.rainText}>
                    Pluie prévue à : {weatherData.nextRainHours.join(', ')}
                  </Text>
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Chargement des données météo...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Colors.primary,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: Colors.white,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  mainCard: {
    margin: 20,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  mainInfo: {
    alignItems: 'center',
  },
  temperature: {
    fontSize: 72,
    fontFamily: 'Montserrat-Bold',
    color: Colors.white,
    marginTop: 10,
  },
  description: {
    fontSize: 24,
    fontFamily: 'OpenSans-Regular',
    color: Colors.white,
    marginTop: 5,
  },
  location: {
    fontSize: 18,
    fontFamily: 'OpenSans-Regular',
    color: Colors.white,
    marginTop: 5,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: Colors.darkGray,
    marginBottom: 15,
  },
  hourlyCard: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 15,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 80,
  },
  hourText: {
    fontSize: 16,
    fontFamily: 'OpenSans-Bold',
    color: Colors.darkGray,
    marginBottom: 5,
  },
  hourlyTemp: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.primary,
    marginTop: 5,
  },
  hourlyHumidity: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    marginTop: 5,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailCard: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 15,
    width: '48%',
    marginBottom: 15,
    alignItems: 'center',
  },
  detailValue: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: Colors.primary,
    marginTop: 10,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    marginTop: 5,
  },
  rainCard: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rainText: {
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    marginLeft: 10,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    textAlign: 'center',
    marginVertical: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'OpenSans-Bold',
  },
}); 