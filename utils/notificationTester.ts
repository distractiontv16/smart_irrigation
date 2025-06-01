import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';
import notificationService from '../services/notification.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class NotificationTester {
  private static readonly TEST_COUNTER_KEY = 'notification_test_counter';
  private static readonly MAX_TEST_NOTIFICATIONS = 2;
  
  /**
   * Programme des notifications de test pour dans 5 minutes
   * @param userId ID de l'utilisateur
   * @param userName Nom de l'utilisateur pour personnaliser les messages
   */
  static async scheduleTestNotifications(userId: string, userName: string = 'Utilisateur') {
    try {
      console.log('🧪 Démarrage des tests de notifications push...');
      
      // Vérifier les permissions d'abord
      const hasPermission = await notificationService.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permissions requises',
          'Les permissions de notification sont nécessaires pour les tests. Veuillez les activer dans les paramètres.'
        );
        return false;
      }

      // Enregistrer le token push
      const token = await notificationService.registerForPushNotifications(userId);
      console.log('📱 Token push enregistré:', token);

      // Programmer les notifications de test
      const testTime = new Date();
      testTime.setMinutes(testTime.getMinutes() + 5); // Dans 5 minutes
      
      console.log(`⏰ Notifications programmées pour: ${testTime.toLocaleTimeString()}`);

      // Test 1: Notification quotidienne personnalisée
      await this.scheduleTestDailyNotification(testTime, userName);
      
      // Test 2: Alerte météo (30 secondes après la première)
      const weatherTestTime = new Date(testTime);
      weatherTestTime.setSeconds(weatherTestTime.getSeconds() + 30);
      await this.scheduleTestWeatherAlert(weatherTestTime);

      // Afficher confirmation
      Alert.alert(
        '✅ Tests programmés !',
        `Deux notifications de test seront envoyées sur votre Infinix Smart HD :\n\n` +
        `🌱 Notification quotidienne : ${testTime.toLocaleTimeString()}\n` +
        `🌦️ Alerte météo : ${weatherTestTime.toLocaleTimeString()}\n\n` +
        `Gardez votre téléphone à portée de main !`,
        [{ text: 'OK', style: 'default' }]
      );

      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la programmation des tests:', error);
      Alert.alert('Erreur', 'Impossible de programmer les tests de notification');
      return false;
    }
  }

  /**
   * Programme une notification quotidienne de test (une seule fois)
   */
  private static async scheduleTestDailyNotification(triggerTime: Date, userName: string) {
    const trigger = {
      type: 'date' as const,
      date: triggerTime,
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🧪 TEST - Recommandation d\'irrigation',
        body: `Bonjour ${userName} 🌱, ceci est un test ! Vos tomates ont besoin de 3 L/m². Arrosez ce soir si ce n'est pas encore fait.`,
        data: {
          type: 'daily_test',
          testId: 'test_daily_' + Date.now(),
          oneTime: true
        },
        sound: true,
        priority: 'high',
      },
      trigger,
    });

    console.log('📅 Notification quotidienne de test programmée (une fois)');
  }

  /**
   * Programme une alerte météo de test (une seule fois)
   */
  private static async scheduleTestWeatherAlert(triggerTime: Date) {
    const trigger = {
      type: 'date' as const,
      date: triggerTime,
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🧪 TEST - Alerte météo',
        body: '🌧️ Test d\'alerte : Pluie prévue cet après-midi à Porto-Novo. Reportez l\'arrosage du soir.',
        data: {
          type: 'weather_test',
          testId: 'test_weather_' + Date.now(),
          oneTime: true
        },
        sound: true,
        priority: 'high',
      },
      trigger,
    });

    console.log('🌦️ Alerte météo de test programmée (une fois)');
  }

  /**
   * Programme un rappel d'irrigation de test immédiat (limité à 2 occurrences)
   */
  static async scheduleImmediateTestReminder(userName: string = 'Utilisateur') {
    try {
      // Vérifier le compteur de tests
      const currentCount = await this.getTestCounter();

      if (currentCount >= this.MAX_TEST_NOTIFICATIONS) {
        Alert.alert(
          '⚠️ Limite atteinte',
          `Vous avez déjà reçu ${this.MAX_TEST_NOTIFICATIONS} notifications de test. Utilisez "Réinitialiser compteur" pour recommencer.`,
          [{ text: 'OK' }]
        );
        return false;
      }

      // Programmer la première notification immédiatement
      await this.scheduleCountedNotification(userName, 10, currentCount + 1);

      // Programmer la seconde notification 30 secondes après
      if (currentCount + 1 < this.MAX_TEST_NOTIFICATIONS) {
        await this.scheduleCountedNotification(userName, 40, currentCount + 2);
      }

      // Mettre à jour le compteur
      await this.incrementTestCounter();
      if (currentCount + 1 < this.MAX_TEST_NOTIFICATIONS) {
        await this.incrementTestCounter();
      }

      const remainingTests = this.MAX_TEST_NOTIFICATIONS - (currentCount + (currentCount + 1 < this.MAX_TEST_NOTIFICATIONS ? 2 : 1));

      Alert.alert(
        '⚡ Tests programmés',
        `${currentCount + 1 < this.MAX_TEST_NOTIFICATIONS ? '2 notifications' : '1 notification'} de test seront envoyées.\n\n` +
        `Tests restants : ${remainingTests}`,
        [{ text: 'OK' }]
      );

      console.log('⚡ Rappels d\'irrigation immédiats programmés avec compteur');
      return true;
    } catch (error) {
      console.error('❌ Erreur test immédiat:', error);
      return false;
    }
  }

  /**
   * Programme une notification individuelle avec compteur
   */
  private static async scheduleCountedNotification(userName: string, delaySeconds: number, notificationNumber: number) {
    const trigger = {
      type: 'timeInterval' as const,
      seconds: delaySeconds,
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🧪 TEST ${notificationNumber}/${this.MAX_TEST_NOTIFICATIONS} - Rappel d'irrigation`,
        body: `🌿 Test de rappel : Il est temps d'arroser vos cultures, ${userName} !`,
        data: {
          type: 'irrigation_test',
          testId: 'test_irrigation_' + Date.now() + '_' + notificationNumber,
          notificationNumber
        },
        sound: true,
        priority: 'high',
      },
      trigger,
    });
  }

  /**
   * Affiche toutes les notifications programmées
   */
  static async showScheduledNotifications() {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      console.log('📋 Notifications programmées:', scheduled.length);
      
      const testNotifications = scheduled.filter(notif => 
        notif.content.data?.testId || 
        notif.content.title?.includes('TEST')
      );

      if (testNotifications.length > 0) {
        const notifList = testNotifications.map((notif, index) => 
          `${index + 1}. ${notif.content.title} - ${new Date(notif.trigger.value).toLocaleTimeString()}`
        ).join('\n');

        Alert.alert(
          '📋 Notifications de test programmées',
          `${testNotifications.length} notification(s) de test :\n\n${notifList}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          '📋 Aucune notification de test',
          'Aucune notification de test n\'est actuellement programmée.',
          [{ text: 'OK' }]
        );
      }

      return testNotifications;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des notifications:', error);
      return [];
    }
  }

  /**
   * Annule toutes les notifications de test
   */
  static async cancelAllTestNotifications() {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const testNotifications = scheduled.filter(notif => 
        notif.content.data?.testId || 
        notif.content.title?.includes('TEST')
      );

      for (const notif of testNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }

      Alert.alert(
        '🗑️ Tests annulés',
        `${testNotifications.length} notification(s) de test ont été annulées.`,
        [{ text: 'OK' }]
      );

      console.log(`🗑️ ${testNotifications.length} notifications de test annulées`);
      return testNotifications.length;
    } catch (error) {
      console.error('❌ Erreur lors de l\'annulation:', error);
      return 0;
    }
  }

  /**
   * Vérifie le statut des permissions
   */
  static async checkPermissionStatus() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      const testCount = await this.getTestCounter();
      const statusText = status === 'granted' ? '✅ Accordées' :
                        status === 'denied' ? '❌ Refusées' :
                        '⚠️ Non déterminées';

      Alert.alert(
        '🔐 Statut des permissions',
        `Permissions de notification : ${statusText}\n\n` +
        `Statut : ${status}\n` +
        `Tests effectués : ${testCount}/${this.MAX_TEST_NOTIFICATIONS}`,
        [{ text: 'OK' }]
      );

      return status;
    } catch (error) {
      console.error('❌ Erreur vérification permissions:', error);
      return 'unknown';
    }
  }

  /**
   * Récupère le compteur de tests actuel
   */
  private static async getTestCounter(): Promise<number> {
    try {
      const count = await AsyncStorage.getItem(this.TEST_COUNTER_KEY);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      console.error('❌ Erreur lecture compteur:', error);
      return 0;
    }
  }

  /**
   * Incrémente le compteur de tests
   */
  private static async incrementTestCounter(): Promise<void> {
    try {
      const currentCount = await this.getTestCounter();
      await AsyncStorage.setItem(this.TEST_COUNTER_KEY, (currentCount + 1).toString());
    } catch (error) {
      console.error('❌ Erreur incrémentation compteur:', error);
    }
  }

  /**
   * Remet à zéro le compteur de tests
   */
  static async resetTestCounter(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.TEST_COUNTER_KEY);
      Alert.alert(
        '🔄 Compteur réinitialisé',
        'Le compteur de tests a été remis à zéro. Vous pouvez maintenant effectuer de nouveaux tests.',
        [{ text: 'OK' }]
      );
      console.log('🔄 Compteur de tests réinitialisé');
    } catch (error) {
      console.error('❌ Erreur réinitialisation compteur:', error);
    }
  }
}

export default NotificationTester;
