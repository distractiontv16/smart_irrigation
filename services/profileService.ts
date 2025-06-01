import userService, { UserData } from './user.service';
import * as Location from 'expo-location';

/**
 * Interface pour les données de localisation
 */
export interface UserLocation {
  latitude: number;
  longitude: number;
  regionName: string;
  detailedLocation?: string;
}

/**
 * Service pour gérer les données de profil utilisateur
 */
class ProfileService {
  /**
   * Récupère la localisation de l'utilisateur à partir de son profil
   * Si la localisation n'est pas disponible dans le profil, renvoie null
   * 
   * @param userId ID de l'utilisateur
   * @returns Les données de localisation ou null si non disponibles
   */
  async getUserLocation(userId: string): Promise<UserLocation | null> {
    try {
      // Récupérer les données utilisateur
      const userData = await userService.getUserData(userId);
      
      if (!userData || !userData.location || 
          !userData.location.latitude || !userData.location.longitude) {
        console.log('Localisation non disponible dans le profil utilisateur');
        return null;
      }
      
      // Extraire la localisation
      const { latitude, longitude } = userData.location;
      
      // Récupérer le nom de la région si non disponible
      let regionName = userData.location.region || '';
      
      if (!regionName) {
        try {
          const locationDetails = await this.reverseGeocode(latitude, longitude);
          regionName = locationDetails.primaryName;
          
          // Mettre à jour le profil avec le nom de la région
          await userService.updateUserLocation(
            userId, 
            latitude, 
            longitude, 
            locationDetails.primaryName,
            locationDetails.detailedName
          );
        } catch (error) {
          console.error('Erreur lors du reverse geocoding:', error);
          regionName = 'Région inconnue';
        }
      }
      
      return {
        latitude,
        longitude,
        regionName,
        detailedLocation: userData.location.detailedLocation
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de la localisation utilisateur:', error);
      return null;
    }
  }
  
  /**
   * Obtient la localisation actuelle de l'appareil avec une précision maximale
   * @returns La localisation actuelle
   * @throws Error si la permission n'est pas accordée ou la localisation n'est pas disponible
   */
  async getCurrentDeviceLocation(): Promise<{latitude: number, longitude: number}> {
    // Demander les permissions de localisation précise
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('La permission de localisation est nécessaire');
    }
    
    // Utiliser la précision maximale disponible
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
      maximumAge: 10000, // Utiliser une position récente (max 10 secondes)
      timeout: 15000 // Attendre max 15 secondes pour une position précise
    });
    
    if (!location || !location.coords) {
      throw new Error('Impossible de récupérer la position actuelle');
    }
    
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    };
  }
  
  /**
   * Effectue un reverse geocoding avancé pour obtenir des informations détaillées
   * sur la localisation à partir des coordonnées
   * 
   * @param latitude Latitude
   * @param longitude Longitude
   * @returns Les détails de la localisation
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<{
    primaryName: string;
    detailedName: string;
  }> {
    try {
      // Obtenir les informations de géocodage
      const result = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      }, {
        useGoogleMaps: true, // Utiliser l'API Google Maps si disponible pour une meilleure précision
      });
      
      if (result && result.length > 0) {
        const location = result[0];
        
        // Extraire tous les éléments pertinents
        const street = location.street;
        const district = location.district;
        const city = location.city;
        const subregion = location.subregion;
        const region = location.region;
        const country = location.country;
        const postalCode = location.postalCode;
        const name = location.name;
        
        // Construire un nom primaire concis (le plus précis disponible)
        const primaryName = city || district || subregion || region || 'Région inconnue';
        
        // Construire un nom détaillé qui inclut plus d'informations
        let detailedParts = [];
        
        if (district && district !== city) detailedParts.push(district);
        if (city) detailedParts.push(city);
        if (subregion && subregion !== city) detailedParts.push(subregion);
        if (region && region !== subregion && region !== city) detailedParts.push(region);
        
        const detailedName = detailedParts.join(', ');
        
        console.log('Localisation reverse geocodée:', {
          primaryName,
          detailedName,
          fullDetails: location
        });
        
        return {
          primaryName,
          detailedName: detailedName || primaryName
        };
      }
      
      return {
        primaryName: 'Région inconnue',
        detailedName: 'Localisation non identifiée'
      };
    } catch (error) {
      console.error('Erreur lors du reverse geocoding:', error);
      return {
        primaryName: 'Région inconnue',
        detailedName: 'Erreur de géolocalisation'
      };
    }
  }
  
  /**
   * Rafraîchit et met à jour la localisation de l'utilisateur
   * @param userId ID de l'utilisateur 
   * @returns Les données de localisation mises à jour
   */
  async refreshUserLocation(userId: string): Promise<UserLocation | null> {
    try {
      // Obtenir la position actuelle
      const location = await this.getCurrentDeviceLocation();
      
      // Effectuer le reverse geocoding pour obtenir des informations détaillées
      const locationDetails = await this.reverseGeocode(
        location.latitude,
        location.longitude
      );
      
      // Mettre à jour la localisation de l'utilisateur dans la base de données
      await userService.updateUserLocation(
        userId,
        location.latitude,
        location.longitude,
        locationDetails.primaryName,
        locationDetails.detailedName
      );
      
      // Retourner les informations mises à jour
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        regionName: locationDetails.primaryName,
        detailedLocation: locationDetails.detailedName
      };
    } catch (error) {
      console.error('Erreur lors du rafraîchissement de la localisation:', error);
      return null;
    }
  }
}

// Exporter une instance du service
const profileService = new ProfileService();
export default profileService; 