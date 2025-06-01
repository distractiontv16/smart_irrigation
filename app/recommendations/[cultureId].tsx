import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import IrrigationCard from '@/components/recommendations/IrrigationCard';
import AlertBanner from '@/components/recommendations/AlertBanner';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { 
  genererRecommandation,
  getStadeCroissance,
  type CultureData, 
  type SolData, 
  type WeatherData, 
  type Recommandation 
} from '@/services/recommendations.service';

export default function CultureDetailScreen() {
  const { cultureId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [culture, setCulture] = useState<CultureData | null>(null);
  const [sol, setSol] = useState<SolData | null>(null);
  const [recommendation, setRecommendation] = useState<Recommandation | null>(null);

  useEffect(() => {
    loadCultureData();
  }, [cultureId]);

  const loadCultureData = async () => {
    if (!cultureId) {
      setError("ID de culture non spécifié");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch culture data from Firestore
      const cultureDocRef = doc(db, 'cultures', cultureId as string);
      const cultureDoc = await getDoc(cultureDocRef);
      
      if (!cultureDoc.exists()) {
        setError("Culture non trouvée");
        setLoading(false);
        return;
      }
      
      const cultureData = cultureDoc.data();
      
      // Create culture object
      const cultureInfo: CultureData = {
        nom: cultureData.nom,
        datePlantation: cultureData.datePlantation
      };
      
      // Get soil data
      const solDocRef = doc(db, 'sols', cultureData.solId);
      const solDoc = await getDoc(solDocRef);
      
      if (!solDoc.exists()) {
        setError("Données de sol non trouvées");
        setLoading(false);
        return;
      }
      
      const solData = solDoc.data();
      
      // Create soil object
      const solInfo: SolData = {
        nom: solData.nom,
        capaciteRetenue: solData.capaciteRetenue,
        intervalleIrrigation: solData.intervalleIrrigation
      };
      
      // Set data
      setCulture(cultureInfo);
      setSol(solInfo);
      
      // Simulate weather data (would come from a weather API)
      const now = new Date();
      const weather: WeatherData = {
        tMax: 32,
        tMin: 26,
        rayonnement: 20,
        humidite: 65,
        pluie: false,
        pluiePrevue: false,
        heure: now.getHours()
      };
      
      // Generate recommendation
      const reco = genererRecommandation(
        cultureInfo, 
        solInfo, 
        weather, 
        cultureData.superficie || 100
      );
      
      setRecommendation(reco);
      setLoading(false);
    } catch (err) {
      console.error("Error loading culture data:", err);
      setError("Erreur lors du chargement des données");
      setLoading(false);
    }
  };

  // Get human-readable stage name
  const getStageDisplay = (datePlantation: string) => {
    const stage = getStadeCroissance(datePlantation);
    switch (stage) {
      case 'initial': return 'Phase initiale';
      case 'developpement': return 'Développement';
      case 'floraison': return 'Floraison';
      case 'fin': return 'Fin de cycle';
      default: return stage;
    }
  };

  // Calculate days since planting
  const getDaysSincePlanting = (datePlantation: string) => {
    const now = new Date();
    const planted = new Date(datePlantation);
    const diffTime = Math.abs(now.getTime() - planted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <ScrollView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.blue} />
          <ThemedText style={styles.loadingText}>
            Chargement des données...
          </ThemedText>
        </View>
      ) : error ? (
        <AlertBanner message={error} type="danger" />
      ) : culture && sol && recommendation ? (
        <View style={styles.contentContainer}>
          {/* Culture Header */}
          <ThemedView style={styles.cultureHeader}>
            <ThemedText type="title">{culture.nom}</ThemedText>
            <View style={styles.cultureInfo}>
              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={18} color={Colors.blue} />
                <ThemedText style={styles.infoText}>
                  Planté le: {new Date(culture.datePlantation).toLocaleDateString()}
                </ThemedText>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="timer-outline" size={18} color={Colors.blue} />
                <ThemedText style={styles.infoText}>
                  Âge: {getDaysSincePlanting(culture.datePlantation)} jours
                </ThemedText>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="leaf-outline" size={18} color={Colors.blue} />
                <ThemedText style={styles.infoText}>
                  Stade: {getStageDisplay(culture.datePlantation)}
                </ThemedText>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="layers-outline" size={18} color={Colors.blue} />
                <ThemedText style={styles.infoText}>
                  Sol: {sol.nom}
                </ThemedText>
              </View>
            </View>
          </ThemedView>

          {/* Recommendation Card */}
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Recommandation d'irrigation
          </ThemedText>
          
          <IrrigationCard
            culture={recommendation.culture}
            sol={recommendation.sol}
            volume={recommendation.volume}
            totalVolume={recommendation.total}
            frequency={recommendation.frequence}
            moment={recommendation.moment}
            message={recommendation.message}
            constraint={recommendation.contrainte}
            weatherIcon="sunny"
            onMarkComplete={() => alert('Irrigation marquée comme complétée !')}
          />

          {/* Additional Information */}
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Informations complémentaires
          </ThemedText>
          
          <ThemedView style={styles.infoCard}>
            <ThemedText style={styles.infoCardTitle}>Cycle d'irrigation recommandé</ThemedText>
            <ThemedText style={styles.infoCardText}>
              Pour ce type de sol ({sol.nom}), il est recommandé d'irriguer 
              tous les {sol.intervalleIrrigation} jour(s).
            </ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.infoCard}>
            <ThemedText style={styles.infoCardTitle}>Besoins en eau selon le stade</ThemedText>
            <ThemedText style={styles.infoCardText}>
              Les besoins en eau varient selon le stade de développement. 
              Au stade actuel ({getStageDisplay(culture.datePlantation)}), 
              les besoins sont {recommendation.volume.toFixed(1)} L/m²/jour.
            </ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.infoCard}>
            <ThemedText style={styles.infoCardTitle}>Conseils additionnels</ThemedText>
            <ThemedText style={styles.infoCardText}>
              Arrosez de préférence tôt le matin ou en fin de journée pour limiter l'évaporation.
              Surveillez régulièrement les signes de stress hydrique (feuilles qui flétrissent).
            </ThemedText>
          </ThemedView>
        </View>
      ) : (
        <ThemedView style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.yellow} />
          <ThemedText style={styles.emptyText}>
            Données non disponibles
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  cultureHeader: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  cultureInfo: {
    marginTop: 16,
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 8,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoCardText: {
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
});
