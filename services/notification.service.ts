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
  public async scheduleDailyNotification(cultureName: string, recommendation: string, language: 'fr' | 'fon' = 'fr') {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: t('notifications.quotidien.titre', language),
          body: `${cultureName}: ${recommendation}`,
          data: { type: 'daily' },
        },
        trigger: {
          hour: 8,
          minute: 0,
          repeats: true,
        },
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

  // Planifier un rappel d'irrigation
  public async scheduleIrrigationReminder(cultureName: string, isFirstReminder: boolean, language: 'fr' | 'fon' = 'fr') {
    try {
      const trigger = isFirstReminder
        ? { seconds: 3600 } // 1 heure après la notification quotidienne
        : { seconds: 21600 }; // 6 heures après si pas encore arrosé

      await Notifications.scheduleNotificationAsync({
        content: {
          title: t('notifications.irrigation.titre', language),
          body: t('notifications.irrigation.rappel', language).replace('{culture}', cultureName),
          data: { type: 'irrigation' },
        },
        trigger,
      });
    } catch (error) {
      console.error('Erreur lors de la planification du rappel d\'irrigation:', error);
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
              userData.lastRecommendation.message
            );
          }
          
          if (settings.irrigation && userData.lastRecommendation) {
            await this.scheduleIrrigationReminder(userData.lastRecommendation.cultureName, true);
            await this.scheduleIrrigationReminder(userData.lastRecommendation.cultureName, false);
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