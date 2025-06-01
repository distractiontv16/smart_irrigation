/**
 * Service de stockage local pour l'application
 */

// Importer AsyncStorage avec require pour éviter les erreurs
const AsyncStorage = require('@react-native-async-storage/async-storage').default;

class StorageService {
  /**
   * Stocke une valeur dans le stockage local
   * @param key Clé de stockage
   * @param value Valeur à stocker (sera convertie en JSON)
   */
  async setItem(key: string, value: any): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Erreur lors du stockage:', error);
    }
  }

  /**
   * Récupère une valeur depuis le stockage local
   * @param key Clé de stockage
   * @returns La valeur stockée ou null si non trouvée
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Erreur lors de la récupération:', error);
      return null;
    }
  }

  /**
   * Supprime une valeur du stockage local
   * @param key Clé de stockage
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  }

  /**
   * Efface tout le stockage local
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Erreur lors de l\'effacement du stockage:', error);
    }
  }
}

const storageService = new StorageService();
export default storageService; 