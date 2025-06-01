import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import Colors from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../firebaseConfig';
import userService from '../../services/user.service';
import * as Location from 'expo-location';

// Dimensions de l'écran
const { width, height } = Dimensions.get('window');

// Coordonnées simulées pour le Bénin (centre du pays)
const BENIN_COORDS = {
  latitude: 9.3077,
  longitude: 2.3158,
  region: "Bénin Central"
};

export default function InitialConfigScreen() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLocationPermission = async () => {
    try {
      setIsLoading(true);
      
      // Demander la permission de localisation
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          "Permission refusée",
          "L'accès à votre position est nécessaire pour certaines fonctionnalités de l'application.",
          [{ text: "OK" }]
        );
        return;
      }

      // Obtenir la position actuelle
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      // Obtenir les informations de géocodage inverse
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (!address) {
        throw new Error("Impossible d'obtenir les informations de localisation");
      }

      // Mettre à jour la localisation dans Firestore
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Utilisateur non connecté");
      }

      await userService.updateUserLocation(
        user.uid, 
        location.coords.latitude,
        location.coords.longitude,
        address.city || address.region || "Localisation inconnue",
        `${address.street ? address.street + ', ' : ''}${address.city || ''}${address.region ? ', ' + address.region : ''}`
      );
      
      // Redirection vers la configuration des cultures
      router.replace('/(auth)/crop-config');
    } catch (error: any) {
      console.error("Erreur lors de la configuration de la localisation:", error);
      Alert.alert(
        "Erreur",
        "Impossible de configurer votre localisation. Veuillez réessayer."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/map-benin.png')}
      style={styles.backgroundImage}
    >
      <StatusBar style="light" />
        <SafeAreaView style={styles.container}>
        <View style={styles.content}>
            <Text style={styles.title}>Configuration Initiale</Text>
              <Text style={styles.subtitle}>Votre localisation</Text>
              
              <Text style={styles.locationText}>
            Activez votre localisation pour voir votre position sur la carte.
              </Text>

              <Text style={styles.locationImportance}>
                La localisation est nécessaire pour :
                {'\n'}- Identifier les types de sols disponibles dans votre région
                {'\n'}- Obtenir des prévisions météo précises
                {'\n'}- Recevoir des recommandations d'irrigation adaptées
              </Text>

              <View style={styles.mapContainer}>
                <Image 
                  source={require('../../assets/images/map-benin.png')} 
                  style={styles.mapImage}
                  resizeMode="contain"
                />
              </View>

                <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLocationPermission}
                  disabled={isLoading}
                >
                      <Ionicons name="location" size={20} color={Colors.white} />
            <Text style={styles.buttonText}>
              {isLoading ? 'Activation en cours...' : 'Activer la localisation'}
            </Text>
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
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Montserrat-Bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  locationText: {
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
  locationImportance: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.white,
    marginBottom: 20,
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
  mapContainer: {
    width: '100%',
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minWidth: 220,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
  },
}); 