import NotificationService from '../services/notification.service';
import * as Notifications from 'expo-notifications';

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  AndroidImportance: {
    MAX: 'max'
  }
}));

// Mock Firebase
jest.mock('../firebaseConfig', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  updateDoc: jest.fn(),
  getDoc: jest.fn()
}));

// Mock i18n
jest.mock('../utils/i18n', () => ({
  t: jest.fn((key: string) => key)
}));

describe('NotificationService', () => {
  let notificationService: any;

  beforeEach(() => {
    notificationService = NotificationService;
    jest.clearAllMocks();
  });

  describe('Permissions', () => {
    it('should request permissions successfully', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined'
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted'
      });

      const result = await notificationService.requestPermissions();
      
      expect(result).toBe(true);
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('should return false when permissions denied', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied'
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied'
      });

      const result = await notificationService.requestPermissions();
      
      expect(result).toBe(false);
    });
  });

  describe('Daily Notifications', () => {
    it('should schedule daily notification with correct format', async () => {
      const cultureName = 'Tomate';
      const userName = 'Jean';
      const waterAmount = '3';
      const language = 'fr';

      await notificationService.scheduleDailyNotification(
        cultureName, 
        userName, 
        waterAmount, 
        language
      );

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'notifications.quotidien.titre',
          body: `Bonjour ${userName} 🌱, aujourd'hui vos ${cultureName} ont besoin de ${waterAmount} L/m². Arrosez ce soir si ce n'est pas encore fait.`,
          data: { type: 'daily' }
        },
        trigger: {
          hour: 6,
          minute: 30,
          repeats: true
        }
      });
    });

    it('should schedule daily notification without username', async () => {
      const cultureName = 'Maïs';
      const waterAmount = '2';

      await notificationService.scheduleDailyNotification(
        cultureName, 
        '', 
        waterAmount
      );

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'notifications.quotidien.titre',
          body: `🌱 Aujourd'hui vos ${cultureName} ont besoin de ${waterAmount} L/m². Arrosez ce soir si ce n'est pas encore fait.`,
          data: { type: 'daily' }
        },
        trigger: {
          hour: 6,
          minute: 30,
          repeats: true
        }
      });
    });
  });

  describe('Weather Alerts', () => {
    it('should send weather alert immediately', async () => {
      const alertMessage = 'Pluie prévue cet après-midi';
      const language = 'fr';

      await notificationService.sendWeatherAlert(alertMessage, language);

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'notifications.meteo.titre',
          body: alertMessage,
          data: { type: 'weather' }
        },
        trigger: null
      });
    });
  });

  describe('Irrigation Reminders', () => {
    it('should schedule irrigation reminder at 18:00', async () => {
      const cultureName = 'Laitue';
      const userId = 'user123';
      const language = 'fr';

      // Mock hasUserIrrigatedToday to return false
      jest.spyOn(notificationService as any, 'hasUserIrrigatedToday')
        .mockResolvedValue(false);

      await notificationService.scheduleIrrigationReminder(
        cultureName, 
        userId, 
        language
      );

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'notifications.irrigation.titre',
          body: 'notifications.irrigation.rappel',
          data: { type: 'irrigation' }
        },
        trigger: {
          hour: 18,
          minute: 0,
          repeats: true
        }
      });
    });
  });

  describe('Weather Alert Logic', () => {
    it('should detect rain alert', async () => {
      const weatherData = {
        pluie: true,
        currentTemperature: 25,
        currentHumidity: 70,
        windSpeed: 15
      };

      const sendWeatherAlertSpy = jest.spyOn(notificationService, 'sendWeatherAlert');
      jest.spyOn(notificationService as any, 'hasWeatherAlertToday')
        .mockResolvedValue(false);
      jest.spyOn(notificationService as any, 'markWeatherAlertSent')
        .mockResolvedValue(undefined);

      await notificationService.checkAndSendWeatherAlerts(
        weatherData, 
        'Porto-Novo', 
        'user123', 
        'fr'
      );

      expect(sendWeatherAlertSpy).toHaveBeenCalledWith(
        'Pluie prévue cet après-midi à Porto-Novo. Reportez l\'arrosage du soir.',
        'fr'
      );
    });

    it('should detect heat wave alert', async () => {
      const weatherData = {
        pluie: false,
        currentTemperature: 35,
        currentHumidity: 60,
        windSpeed: 10
      };

      const sendWeatherAlertSpy = jest.spyOn(notificationService, 'sendWeatherAlert');
      jest.spyOn(notificationService as any, 'hasWeatherAlertToday')
        .mockResolvedValue(false);
      jest.spyOn(notificationService as any, 'markWeatherAlertSent')
        .mockResolvedValue(undefined);

      await notificationService.checkAndSendWeatherAlerts(
        weatherData, 
        'Porto-Novo', 
        'user123', 
        'fr'
      );

      expect(sendWeatherAlertSpy).toHaveBeenCalledWith(
        'Canicule détectée ! Arrosez tôt le matin pour éviter l\'évaporation.',
        'fr'
      );
    });

    it('should detect high humidity alert', async () => {
      const weatherData = {
        pluie: false,
        currentTemperature: 28,
        currentHumidity: 90,
        windSpeed: 8
      };

      const sendWeatherAlertSpy = jest.spyOn(notificationService, 'sendWeatherAlert');
      jest.spyOn(notificationService as any, 'hasWeatherAlertToday')
        .mockResolvedValue(false);
      jest.spyOn(notificationService as any, 'markWeatherAlertSent')
        .mockResolvedValue(undefined);

      await notificationService.checkAndSendWeatherAlerts(
        weatherData, 
        'Porto-Novo', 
        'user123', 
        'fr'
      );

      expect(sendWeatherAlertSpy).toHaveBeenCalledWith(
        'Humidité > 85 % prévue demain. Diminuez la quantité d\'eau.',
        'fr'
      );
    });

    it('should not send alert if already sent today', async () => {
      const weatherData = {
        pluie: true,
        currentTemperature: 25,
        currentHumidity: 70,
        windSpeed: 15
      };

      const sendWeatherAlertSpy = jest.spyOn(notificationService, 'sendWeatherAlert');
      jest.spyOn(notificationService as any, 'hasWeatherAlertToday')
        .mockResolvedValue(true);

      await notificationService.checkAndSendWeatherAlerts(
        weatherData, 
        'Porto-Novo', 
        'user123', 
        'fr'
      );

      expect(sendWeatherAlertSpy).not.toHaveBeenCalled();
    });
  });
});
