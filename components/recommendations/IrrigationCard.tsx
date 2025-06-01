import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Alert,
  Switch,
  ViewStyle,
  TextStyle,
  ImageStyle,
  Animated,
  Easing,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import userService from '../../services/user.service';
import { useLanguage } from '../../hooks/useLanguage';
import { t } from '../../utils/i18n';

// Type des propriétés du composant
interface IrrigationCardProps {
  volume: number;         // Volume d'eau par m²
  totalVolume: number;    // Volume d'eau total
  frequency: string;      // Fréquence d'irrigation
  moment: string;         // Moment recommandé
  message: string;        // Message principal
  constraint?: string | null;     // Contrainte éventuelle
  culture: string;        // Culture concernée
  sol: string;            // Type de sol
  weatherIcon?: string;   // Icône météo
  weatherData?: {         // Données météo complémentaires
    temperature?: number;
    humidity?: number;
    isRaining?: boolean;
    rainForecast?: boolean;
    soilMoisture?: number;
  };
  onMarkComplete: () => void; // Callback quand marqué comme arrosé
  initialCompleted?: boolean; // État initial du bouton (optionnel)
}

function format(str: string, vars: Record<string, any>) {
  return str.replace(/\{(.*?)\}/g, (_, v) => vars[v] ?? '');
}

/**
 * Composant de carte de recommandation d'irrigation
 * Affiche les recommandations personnalisées selon la météo, le sol et la culture
 */
const IrrigationCard: React.FC<IrrigationCardProps> = ({
  volume,
  totalVolume,
  frequency,
  moment,
  message,
  constraint,
  culture,
  sol,
  weatherIcon = 'sunny',
  weatherData = {},
  onMarkComplete,
  initialCompleted = false
}) => {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const [username, setUsername] = useState<string>('');
  const [completed, setCompleted] = useState<boolean>(initialCompleted);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(false);
  const [speaking, setSpeaking] = useState<boolean>(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);

  // Refs pour le nettoyage
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animation pour le bouton de marquage
  const buttonScale = new Animated.Value(1);
  const checkmarkOpacity = new Animated.Value(initialCompleted ? 1 : 0);

  // Récupérer le nom d'utilisateur et vérifier si déjà arrosé aujourd'hui
  useEffect(() => {
    const initialize = async () => {
      if (currentUser) {
        try {
          // Charger les données utilisateur
          const userData = await userService.getUserData(currentUser.uid);
          if (userData && userData.username) {
            setUsername(userData.username);
          }
          
          // Vérifier si cette culture a déjà été arrosée aujourd'hui
          const isIrrigatedToday = await userService.hasIrrigatedToday(currentUser.uid, culture);
          
          if (isIrrigatedToday) {
            setCompleted(true);
            Animated.timing(checkmarkOpacity, {
              toValue: 1,
              duration: 0, // Pas d'animation lors du chargement initial
              useNativeDriver: true
            }).start();
          } else {
            setCompleted(initialCompleted);
          }
          
          setIsLoadingStatus(false);
        } catch (error) {
          console.error('Erreur lors de l\'initialisation de la carte d\'irrigation:', error);
          setIsLoadingStatus(false);
        }
      } else {
        setIsLoadingStatus(false);
      }
    };
    
    initialize();
  }, [currentUser, culture, initialCompleted]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Nettoyer le timeout si le composant est démonté
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
      // Arrêter la lecture vocale si en cours
      if (speaking) {
        Speech.stop();
      }
    };
  }, [speaking]);

  // Déterminer si c'est le matin ou le soir
  const isMorning = () => {
    const hour = new Date().getHours();
    return hour >= 0 && hour < 12;
  };

  // Obtenir la salutation selon l'heure
  const getGreeting = () => {
    return isMorning() ? "Bonjour" : "Bonsoir";
  };

  // Mettre en majuscule la première lettre
  const capitalize = (text: string) => {
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  // Générer le message personnalisé
  const getPersonalizedMessage = () => {
    const greeting = isMorning() ? t('recommandations_irrigation.bonjour_arrosage', language) : t('recommandations_irrigation.bonjour_arrosage', language);
    const name = username ? ` ${username}` : '';
    const emoji = isMorning() ? ' 😊 bien réveillé !' : ' 😊';
    if (weatherData.isRaining || (weatherData.humidity && weatherData.humidity > 95)) {
      return t('recommandations_irrigation.pas_irrigation', language);
    }
    if (weatherData.humidity && weatherData.humidity > 80) {
      return format(t('recommandations_irrigation.bonjour_arrosage', language), {
        nom: username,
        volume: (volume/2).toFixed(1),
        culture,
        type_sol: sol,
        volume_total: Math.round(totalVolume/2)
      });
    }
    if (weatherData.temperature && weatherData.temperature > 38) {
      return format(t('recommandations_irrigation.bonjour_arrosage', language), {
        nom: username,
        volume: volume.toFixed(1),
        culture,
        type_sol: sol,
        volume_total: Math.round(totalVolume)
      });
    }
    if (weatherData.rainForecast && isMorning()) {
      return format(t('recommandations_irrigation.bonjour_arrosage', language), {
        nom: username,
        volume: volume.toFixed(1),
        culture,
        type_sol: sol,
        volume_total: Math.round(totalVolume)
      }) + ' ' + t('recommandations_irrigation.arrosez_matin', language);
    }
    return format(t('recommandations_irrigation.bonjour_arrosage', language), {
      nom: username,
      volume: volume.toFixed(1),
      culture,
      type_sol: sol,
      volume_total: Math.round(totalVolume)
    });
  };

  // Générer le message d'information sur la fréquence
  const getFrequencyMessage = () => {
    if (frequency.toLowerCase().includes('24h') || frequency.toLowerCase().includes('24 h') || frequency.toLowerCase().includes('jour')) {
      return t('recommandations_irrigation.cas_normal', language);
    }
    return frequency;
  };

  // Générer les contraintes et alertes
  const getConstraints = () => {
    const constraints = [];
    if (weatherData.isRaining) {
      constraints.push({
        icon: 'rainy',
        message: t('contraintes_alertes.pluie_actuelle', language),
        type: 'danger'
      });
    }
    if (weatherData.humidity && weatherData.humidity > 80) {
      constraints.push({
        icon: 'water-outline',
        message: t('contraintes_alertes.humidite_elevee', language),
        type: 'warning'
      });
    }
    if (weatherData.temperature && weatherData.temperature > 38) {
      constraints.push({
        icon: 'thermometer',
        message: t('contraintes_alertes.temperature_trop_elevee', language),
        type: 'danger'
      });
    }
    if (weatherData.rainForecast) {
      if (isMorning()) {
        constraints.push({
          icon: 'cloudy',
          message: t('contraintes_alertes.pluie_soir_1', language),
          type: 'rain-alert'
        });
      } else {
        constraints.push({
          icon: 'cloudy',
          message: t('contraintes_alertes.pluie_soir_2', language),
          type: 'rain-alert'
        });
      }
    }
    return constraints;
  };

  // Gérer le marquage comme arrosé
  const handleMarkComplete = async () => {
    if (completed) return;
    
    // Animation du bouton
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.bounce
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(checkmarkOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      })
    ]).start();
    
    // Marquer comme complété
    setCompleted(true);
    
    // Enregistrer dans l'historique
    try {
      if (currentUser) {
        await userService.addIrrigationHistory(currentUser.uid, {
          date: new Date(),
          culture: culture,
          volume: volume,
          totalVolume: totalVolume,
          completed: true
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout à l\'historique:', error);
    }
    
    // Appeler le callback
    onMarkComplete();
    
    // Afficher le feedback après un court délai
    feedbackTimeoutRef.current = setTimeout(() => {
      setShowFeedback(true);
    }, 1000);
  };

  // Gérer le feedback de l'utilisateur
  const handleFeedback = async (isGood: boolean) => {
    // Enregistrer le feedback
    try {
      if (currentUser) {
        await userService.addIrrigationFeedback(currentUser.uid, {
          date: new Date(),
          culture: culture,
          volume: volume,
          isGood: isGood
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du feedback:', error);
    }
    
    Alert.alert(
      "Merci pour votre retour !",
      isGood 
        ? "Nous sommes ravis que la recommandation vous ait convenu." 
        : "Nous allons optimiser nos recommandations futures.",
      [{ text: "OK" }]
    );
    setShowFeedback(false);
  };

  // Lecture vocale du message
  const speak = () => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    
    const textToSpeak = `${getPersonalizedMessage()}. ${getConstraints().map(c => c.message).join('. ')}`;
    
    setSpeaking(true);
    Speech.speak(textToSpeak, {
      language: language === 'fr' ? 'fr-FR' : 'fr-FR',
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false)
    });
  };

  // Affichage du message "Pas d'irrigation" si pluie
  const isNoIrrigationRecommended = (): boolean => {
    return weatherData.isRaining === true || (weatherData.humidity !== undefined && weatherData.humidity > 95);
  };

  // Rendu des contraintes
  const renderConstraints = () => {
    const constraints = getConstraints();
    if (constraints.length === 0) return null;
    
    return (
      <View style={styles.constraintsContainer}>
        {constraints.map((constraint, index) => (
          <View 
            key={index} 
            style={[
              styles.constraintItem,
              constraint.type === 'danger' && styles.dangerConstraint,
              constraint.type === 'warning' && styles.warningConstraint,
              constraint.type === 'info' && styles.infoConstraint,
              constraint.type === 'alert' && styles.alertConstraint,
              constraint.type === 'rain-alert' && styles.rainAlertConstraint
            ]}
          >
            <Ionicons 
              name={constraint.icon as any} 
              size={20} 
              color={
                constraint.type === 'danger' ? '#d32f2f' :
                constraint.type === 'warning' ? '#f57c00' : 
                constraint.type === 'alert' ? '#2e7d32' :
                constraint.type === 'rain-alert' ? '#1b5e20' :
                '#1976d2'
              } 
              style={styles.constraintIcon}
            />
            <Text style={[
              styles.constraintText,
              constraint.type === 'alert' && styles.alertConstraintText,
              constraint.type === 'rain-alert' && styles.rainAlertText
            ]}>
              {constraint.message}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  // Rendu du bloc météo et sol
  const renderWeatherAndSoilBlock = () => {
    return (
      <View style={styles.weatherAndSoilBlock}>
        <View style={styles.weatherBlock}>
          <Ionicons 
            name={(weatherData.isRaining ? 'rainy' : weatherIcon) as any} 
            size={24} 
            color={Colors.success} 
          />
          <Text style={styles.weatherText}>
            {weatherData.isRaining 
              ? "🌧 Pluie en cours" 
              : weatherData.rainForecast 
                ? "🌤 Pluie prévue" 
                : "☀️ Temps favorable"}
          </Text>
        </View>
        
        <View style={styles.soilBlock}>
          <MaterialCommunityIcons name="shovel" size={24} color={Colors.earth} />
          <Text style={styles.soilText}>
            🌱 Sol {sol} – capacité de rétention moyenne
          </Text>
        </View>
      </View>
    );
  };

  // Rendu du composant principal
  return (
    <ScrollView>
      <LinearGradient
        colors={isNoIrrigationRecommended() 
          ? ['#E8F5E9', '#C8E6C9', '#A5D6A7'] 
          : ['#EBF7ED', '#D4EEDA', '#BFE5C7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* En-tête - Titre centré */}
        <View style={styles.header}>
          <Text style={styles.title}>RECOMMANDATION DU JOUR</Text>
          
          {/* Switch pour activer/désactiver la lecture vocale */}
          <View style={styles.voiceContainer}>
            <Switch
              value={voiceEnabled}
              onValueChange={(value: boolean) => {
                setVoiceEnabled(value);
                if (value) {
                  speak();
                } else {
                  Speech.stop();
                  setSpeaking(false);
                }
              }}
              thumbColor={voiceEnabled ? Colors.primary : '#f4f3f4'}
              trackColor={{ false: '#767577', true: Colors.secondary }}
            />
            <TouchableOpacity onPress={() => setVoiceEnabled(!voiceEnabled)}>
              <Ionicons 
                name={speaking ? "volume-high" : "volume-medium"} 
                size={22} 
                color={voiceEnabled ? Colors.primary : '#767577'} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bloc Météo & Sol */}
        {renderWeatherAndSoilBlock()}
        
        {/* Séparateur stylisé */}
        <View style={styles.divider} />
        
        {/* Bloc Message Principal avec Salutation */}
        <View style={styles.messageContainer}>
          <Text style={styles.message}>
            {getPersonalizedMessage()}
          </Text>
          
          {/* Mise en évidence de la quantité d'eau */}
          {!isNoIrrigationRecommended() && (
            <View style={styles.waterQuantityHighlight}>
              <MaterialCommunityIcons
                name="water" 
                size={24} 
                color={Colors.primary} 
              />
              <Text style={styles.waterQuantityText}>
                {(volume).toFixed(1)} L/m² — {Math.round(totalVolume)} L total
              </Text>
            </View>
          )}
          
          {/* Illustrations */}
          <View style={styles.illustrationsContainer}>
            <MaterialCommunityIcons
              name="watering-can" 
              size={60} 
              color={Colors.primary} 
              style={styles.dropImage} 
            />
          </View>
        </View>
        
        {/* Bloc Fréquence */}
        {!isNoIrrigationRecommended() && (
          <View style={styles.frequencyContainer}>
            <Ionicons name="time-outline" size={22} color={Colors.success} style={styles.frequencyIcon} />
            <Text style={styles.frequencyText}>
              <Text style={styles.frequencyLabel}>Fréquence : </Text>
              {getFrequencyMessage()}
            </Text>
          </View>
        )}
        
        {/* Bloc Alertes & Contraintes */}
        {renderConstraints()}
        
        {/* Bouton d'action / Feedback */}
        {isLoadingStatus ? (
          <View style={styles.actionContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : !showFeedback ? (
          <Animated.View style={[styles.actionContainer, { transform: [{ scale: buttonScale }] }]}>
            {completed ? (
              <View style={[styles.actionButton, styles.completedButton]}>
                <View style={styles.actionButtonContent}>
                  <Animated.View style={[styles.checkmarkContainer, { opacity: checkmarkOpacity }]}>
                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  </Animated.View>
                  <Text style={styles.actionButtonText}>Marqué comme arrosé</Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, completed && styles.completedButton]}
                onPress={handleMarkComplete}
                disabled={completed || isNoIrrigationRecommended()}
              >
                <View style={styles.actionButtonContent}>
                  {isNoIrrigationRecommended() ? (
                    <Text style={styles.actionButtonText}>Aucune action nécessaire</Text>
                  ) : (
                    <>
                      <MaterialCommunityIcons name="watering-can" size={22} color="#fff" style={styles.actionButtonIcon} />
                      <Text style={styles.actionButtonText}>Marquer comme arrosé</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            )}
          </Animated.View>
        ) :
          // Bloc de Feedback
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackQuestion}>Le volume était-il adapté ?</Text>
            <View style={styles.feedbackButtons}>
              <TouchableOpacity
                style={[styles.feedbackButton, styles.feedbackButtonYes]}
                onPress={() => handleFeedback(true)}
              >
                <Ionicons name="thumbs-up" size={20} color="#fff" />
                <Text style={styles.feedbackButtonText}>Oui</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.feedbackButton, styles.feedbackButtonNo]}
                onPress={() => handleFeedback(false)}
              >
                <Ionicons name="thumbs-down" size={20} color="#fff" />
                <Text style={styles.feedbackButtonText}>Non</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        
        {/* Information additionnelle sur le moment recommandé */}
        {!isNoIrrigationRecommended() && moment && (
          <View style={styles.momentContainer}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.success} />
            <Text style={styles.momentText}>
              Moment idéal : {moment}
            </Text>
          </View>
        )}
        
        {/* Sceau professionnel */}
        <View style={styles.professionalSeal}>
          <MaterialCommunityIcons name="leaf" size={16} color={Colors.success} />
          <Text style={styles.sealText}>
            SmartIrrigation Pro | {new Date().toLocaleDateString('fr-FR')}
          </Text>
        </View>
      </LinearGradient>
    </ScrollView>
  );
};

// Définition des styles
const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: 16,
    marginHorizontal: 12,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1, 
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76, 175, 80, 0.2)',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.primary,
    textAlign: 'center',
    flex: 1,
    letterSpacing: 0.5,
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherAndSoilBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  weatherBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76, 175, 80, 0.1)',
  },
  weatherText: {
    marginLeft: 10,
    fontSize: 16,
    fontFamily: 'OpenSans-SemiBold',
    color: Colors.darkGray,
  },
  soilBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  soilText: {
    marginLeft: 10,
    fontSize: 16,
    fontFamily: 'OpenSans-SemiBold',
    color: Colors.darkGray,
  },
  divider: {
    height: 3,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    marginVertical: 14,
    borderRadius: 1.5,
    width: '90%',
    alignSelf: 'center',
  },
  messageContainer: {
    padding: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 16,
    marginBottom: 18,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  message: {
    fontSize: 18,
    fontFamily: 'OpenSans-Bold',
    color: Colors.darkGray,
    lineHeight: 28,
    textAlign: 'center',
  },
  waterQuantityHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  waterQuantityText: {
    fontSize: 17,
    fontFamily: 'Montserrat-Bold',
    color: Colors.primary,
    marginLeft: 8,
  },
  illustrationsContainer: {
    position: 'absolute',
    bottom: -15,
    right: -15,
    opacity: 0.5,
    transform: [{ rotate: '15deg' }],
  },
  dropImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  frequencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  frequencyIcon: {
    marginRight: 10,
  },
  frequencyLabel: {
    fontFamily: 'OpenSans-Bold',
  },
  frequencyText: {
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    flex: 1,
  },
  constraintsContainer: {
    marginBottom: 18,
  },
  constraintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: Colors.info,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  dangerConstraint: {
    borderLeftColor: '#d32f2f',
    backgroundColor: 'rgba(255, 235, 238, 0.95)',
  },
  warningConstraint: {
    borderLeftColor: '#f57c00',
    backgroundColor: 'rgba(255, 243, 224, 0.95)',
  },
  infoConstraint: {
    borderLeftColor: '#1976d2',
    backgroundColor: 'rgba(227, 242, 253, 0.95)',
  },
  alertConstraint: {
    borderLeftColor: '#2e7d32',
    backgroundColor: 'rgba(232, 245, 233, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.3)',
  },
  rainAlertConstraint: {
    borderLeftColor: '#1b5e20',
    backgroundColor: 'rgba(221, 242, 222, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(27, 94, 32, 0.4)',
    shadowColor: '#1b5e20',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  alertConstraintText: {
    fontFamily: 'OpenSans-Bold',
    color: '#2e7d32',
  },
  rainAlertText: {
    fontFamily: 'OpenSans-Bold',
    color: '#1b5e20',
    fontSize: 16,
  },
  constraintIcon: {
    marginRight: 12,
  },
  constraintText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'OpenSans-SemiBold',
    color: Colors.darkGray,
    lineHeight: 22,
  },
  actionContainer: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedButton: {
    backgroundColor: Colors.success,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonIcon: {
    marginRight: 10,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontFamily: 'Montserrat-Bold',
    letterSpacing: 0.5,
  },
  checkmarkContainer: {
    marginRight: 10,
  },
  feedbackContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  feedbackQuestion: {
    fontSize: 17,
    fontFamily: 'Montserrat-Bold',
    color: Colors.darkGray,
    marginBottom: 16,
    textAlign: 'center',
  },
  feedbackButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  feedbackButtonYes: {
    backgroundColor: Colors.primary,
  },
  feedbackButtonNo: {
    backgroundColor: Colors.darkGray,
  },
  feedbackButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontFamily: 'Montserrat-Bold',
    marginLeft: 8,
  },
  momentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.1)',
  },
  momentText: {
    fontSize: 15,
    fontFamily: 'OpenSans-SemiBold',
    color: Colors.darkGray,
    marginLeft: 6,
  },
  professionalSeal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(76, 175, 80, 0.15)',
    marginTop: 8,
  },
  sealText: {
    fontSize: 13,
    fontFamily: 'OpenSans-Regular',
    color: Colors.success,
    marginLeft: 5,
  },
});

export default IrrigationCard;
