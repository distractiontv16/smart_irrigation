import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { t } from '../utils/i18n';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationSettings {
  daily: boolean;
  weather: boolean;
  irrigation: boolean;
}

class NotificationService {
  private static instance: NotificationService;

  private constructor() {
    // Constructor is now clean - no React hooks
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Demander les permissions pour les notifications
  public async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return true;
  }

  // Enregistrer le token de notification
  public async registerForPushNotifications(userId: string): Promise<string | null> {
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      
      // Sauvegarder le token dans Firestore
      await updateDoc(doc(db, 'users', userId), {
        pushToken: token,
      });

      return token;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du token:', error);
      return null;
    }
  }

  // Envoyer une notification quotidienne
  public async scheduleDailyNotification(cultureName: string, userName: string = '', waterAmount: string = '', language: 'fr' | 'fon' = 'fr') {
    try {
      // Format du message selon les spécifications : "Bonjour [UserName] 🌱, aujourd'hui vos [CropType] ont besoin de [Amount] L/m². Arrosez ce soir si ce n'est pas encore fait."
      const formattedMessage = userName
        ? `Bonjour ${userName} 🌱, aujourd'hui vos ${cultureName} ont besoin de ${waterAmount} L/m². Arrosez ce soir si ce n'est pas encore fait.`
        : `🌱 Aujourd'hui vos ${cultureName} ont besoin de ${waterAmount} L/m². Arrosez ce soir si ce n'est pas encore fait.`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: t('notifications.quotidien.titre', language),
          body: formattedMessage,
          data: { type: 'daily' },
        },
        trigger: {
          hour: 6,
          minute: 30,
          repeats: true,
        } as any,
      });
    } catch (error) {
      console.error('Erreur lors de la planification de la notification quotidienne:', error);
    }
  }

  // Envoyer une alerte météo
  public async sendWeatherAlert(alert: string, language: 'fr' | 'fon' = 'fr') {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: t('notifications.meteo.titre', language),
          body: alert,
          data: { type: 'weather' },
        },
        trigger: null, // Notification immédiate
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'alerte météo:', error);
    }
  }

  // Analyser les conditions météo et envoyer des alertes si nécessaire
  public async checkAndSendWeatherAlerts(weatherData: any, location: string, userId: string, language: 'fr' | 'fon' = 'fr') {
    try {
      // Vérifier si une alerte météo a déjà été envoyée aujourd'hui
      const hasAlertToday = await this.hasWeatherAlertToday(userId);
      if (hasAlertToday) {
        console.log('Alerte météo déjà envoyée aujourd\'hui');
        return;
      }

      let alertMessage = '';
      let shouldSendAlert = false;

      // Alerte pluie
      if (weatherData.pluie || weatherData.pluiePrevue || (weatherData.nextRainHours && weatherData.nextRainHours.length > 0)) {
        alertMessage = `Pluie prévue cet après-midi à ${location}. Reportez l'arrosage du soir.`;
        shouldSendAlert = true;
      }
      // Alerte canicule (température > 32°C)
      else if (weatherData.currentTemperature > 32 || (weatherData.dailyForecast?.maxTemperatures?.[1] > 32)) {
        alertMessage = `Canicule détectée ! Arrosez tôt le matin pour éviter l'évaporation.`;
        shouldSendAlert = true;
      }
      // Alerte humidité élevée (> 85%)
      else if (weatherData.currentHumidity > 85) {
        alertMessage = `Humidité > 85 % prévue demain. Diminuez la quantité d'eau.`;
        shouldSendAlert = true;
      }
      // Alerte vent fort (> 30 km/h)
      else if (weatherData.windSpeed > 30) {
        alertMessage = `Vent fort détecté (${Math.round(weatherData.windSpeed)} km/h). Protégez vos cultures fragiles.`;
        shouldSendAlert = true;
      }

      if (shouldSendAlert && alertMessage) {
        await this.sendWeatherAlert(alertMessage, language);
        await this.markWeatherAlertSent(userId);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des alertes météo:', error);
    }
  }

  // Vérifier si une alerte météo a été envoyée aujourd'hui
  private async hasWeatherAlertToday(userId: string): Promise<boolean> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return false;

      const userData = userDoc.data();
      const today = new Date().toDateString();

      return userData.lastWeatherAlert?.toDate?.()?.toDateString() === today;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'alerte météo:', error);
      return false;
    }
  }

  // Marquer qu'une alerte météo a été envoyée aujourd'hui
  private async markWeatherAlertSent(userId: string) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        lastWeatherAlert: new Date(),
      });
    } catch (error) {
      console.error('Erreur lors du marquage de l\'alerte météo:', error);
    }
  }

  // Planifier un rappel d'irrigation
  public async scheduleIrrigationReminder(cultureName: string, userId: string, language: 'fr' | 'fon' = 'fr') {
    try {
      // Vérifier d'abord si l'utilisateur a déjà arrosé aujourd'hui
      const hasIrrigated = await this.hasUserIrrigatedToday(userId, cultureName);
      if (hasIrrigated) {
        console.log('Utilisateur a déjà arrosé, pas de rappel nécessaire');
        return;
      }

      // Programmer le rappel pour 18h00 (entre 17h30 et 18h30)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: t('notifications.irrigation.titre', language),
          body: t('notifications.irrigation.rappel', language).replace('{culture}', cultureName),
          data: { type: 'irrigation' },
        },
        trigger: {
          hour: 18,
          minute: 0,
          repeats: true,
        } as any,
      });
    } catch (error) {
      console.error('Erreur lors de la planification du rappel d\'irrigation:', error);
    }
  }

  // Vérifier si l'utilisateur a arrosé aujourd'hui
  private async hasUserIrrigatedToday(userId: string, cultureName: string): Promise<boolean> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return false;

      const userData = userDoc.data();
      const today = new Date().toDateString();

      // Vérifier dans l'historique d'irrigation d'aujourd'hui
      return userData.irrigationHistory?.some((record: any) =>
        record.date?.toDate?.()?.toDateString() === today &&
        record.culture === cultureName &&
        record.completed === true
      ) || false;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'irrigation:', error);
      return false;
    }
  }

  // Annuler toutes les notifications
  public async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Erreur lors de l\'annulation des notifications:', error);
    }
  }

  // Mettre à jour les préférences de notification
  public async updateNotificationSettings(userId: string, settings: NotificationSettings) {
    try {
      // Mettre à jour les préférences dans Firestore
      await updateDoc(doc(db, 'users', userId), {
        notificationSettings: settings,
      });

      // Si les notifications sont désactivées, annuler toutes les notifications planifiées
      if (!settings.daily && !settings.weather && !settings.irrigation) {
        await this.cancelAllNotifications();
      } else {
        // Annuler et recréer les notifications selon les nouvelles préférences
        await this.cancelAllNotifications();
        
        // Récupérer les données utilisateur pour recréer les notifications
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Recréer les notifications selon les préférences
          if (settings.daily && userData.lastRecommendation) {
            await this.scheduleDailyNotification(
              userData.lastRecommendation.cultureName,
              userData.username || '',
              userData.lastRecommendation.waterAmount || '2-3'
            );
          }
          
          if (settings.irrigation && userData.lastRecommendation) {
            await this.scheduleIrrigationReminder(userData.lastRecommendation.cultureName, userId);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences de notification:', error);
      throw error;
    }
  }

  // Vérifier si les notifications sont activées
  public async areNotificationsEnabled(userId: string): Promise<NotificationSettings> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data().notificationSettings || {
          daily: true,
          weather: true,
          irrigation: true,
        };
      }
      return {
        daily: true,
        weather: true,
        irrigation: true,
      };
    } catch (error) {
      console.error('Erreur lors de la vérification des préférences de notification:', error);
      return {
        daily: true,
        weather: true,
        irrigation: true,
      };
    }
  }
}

export default NotificationService.getInstance(); 