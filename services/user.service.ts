import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
  orderBy,
  limit,
  deleteDoc,
  startAfter,
  DocumentData,
  CollectionReference,
  DocumentReference,
  QuerySnapshot,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { CultureData } from '../types/culture';

// Interface pour les données utilisateur
export interface UserData {
  userId: string;
  username?: string;
  email?: string;
  language?: string;
  location?: {
    latitude: number;
    longitude: number;
    region?: string;
    detailedLocation?: string;
  };
  crops?: Array<{
    id: string;
    name: string;
    soilType: string;
    area: string;
    plantingDate: string;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface pour l'historique d'irrigation
export interface IrrigationHistoryItem {
  date: Date;
  culture: string;
  volume: number;
  totalVolume: number;
  completed: boolean;
}

// Format pour la présentation de l'historique d'irrigation dans l'UI
export interface IrrigationHistoryDisplay {
  id: string;
  date: string;
  culture: string;
  quantity: string;
  isCompleted: boolean;
}

interface UserStats {
  cultures: number;
  irrigations: number;
  efficiency: number;
}

// Interface pour les questions fréquentes (FAQ)
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

/**
 * Service pour gérer les données utilisateur dans Firestore
 */
class UserService {
  /**
   * Crée un nouveau profil utilisateur après l'inscription
   * @param userId ID de l'utilisateur Firebase Auth
   * @param username Nom d'utilisateur
   * @param email Email de l'utilisateur
   * @returns Une promesse
   */
  async createUserProfile(userId: string, username: string, email: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const userData: UserData = {
        userId,
        username,
        email,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(userRef, userData);
      console.log('Profil utilisateur créé avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la création du profil utilisateur:', error);
      throw new Error('Erreur lors de la création du profil utilisateur: ' + error.message);
    }
  }

  /**
   * Met à jour la langue préférée de l'utilisateur
   * @param userId ID de l'utilisateur
   * @param language Code de la langue
   * @returns Une promesse
   */
  async updateUserLanguage(userId: string, language: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        language,
        updatedAt: new Date()
      });
      console.log('Langue utilisateur mise à jour avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de la langue:', error);
      throw new Error('Erreur lors de la mise à jour de la langue: ' + error.message);
    }
  }

  /**
   * Met à jour la localisation de l'utilisateur
   * @param userId ID de l'utilisateur
   * @param latitude Latitude
   * @param longitude Longitude
   * @param primaryName Nom principal de la localisation
   * @param detailedName Nom détaillé de la localisation
   * @returns Une promesse
   */
  async updateUserLocation(
    userId: string, 
    latitude: number, 
    longitude: number, 
    primaryName: string,
    detailedName: string
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      
      // Vérifier que toutes les données requises sont présentes
      if (!latitude || !longitude || !primaryName) {
        throw new Error('Données de localisation incomplètes');
      }

      const locationData = {
          latitude,
          longitude,
        primaryName,
        detailedName: detailedName || primaryName, // Utiliser primaryName comme fallback
        updatedAt: new Date()
      };

      await updateDoc(userRef, {
        location: locationData
      });

      console.log('Localisation mise à jour avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de la localisation:', error);
      throw new Error('Erreur lors de la mise à jour de la localisation: ' + error.message);
    }
  }

  /**
   * Met à jour les cultures de l'utilisateur
   * @param userId ID de l'utilisateur
   * @param crops Tableau des cultures
   * @returns Une promesse
   */
  async updateUserCrops(
    userId: string, 
    crops: Array<{
      id: string;
      name: string;
      soilType: string;
      area: string;
      plantingDate: string;
    }>
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        crops,
        updatedAt: new Date()
      });
      console.log('Cultures utilisateur mises à jour avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour des cultures:', error);
      throw new Error('Erreur lors de la mise à jour des cultures: ' + error.message);
    }
  }

  /**
   * Récupère les données d'un utilisateur
   * @param userId ID de l'utilisateur
   * @returns Les données utilisateur ou null si non trouvé
   */
  async getUserData(userId: string): Promise<UserData | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data() as UserData;
      } else {
        console.log('Aucun profil utilisateur trouvé');
        return null;
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      throw new Error('Erreur lors de la récupération des données utilisateur: ' + error.message);
    }
  }

  /**
   * Vérifie si un profil utilisateur existe
   * @param userId ID de l'utilisateur
   * @returns true si le profil existe, false sinon
   */
  async doesUserProfileExist(userId: string): Promise<boolean> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      return userDoc.exists();
    } catch (error: any) {
      console.error('Erreur lors de la vérification du profil utilisateur:', error);
      throw new Error('Erreur lors de la vérification du profil utilisateur: ' + error.message);
    }
  }

  /**
   * Ajoute une entrée à l'historique d'irrigation
   * @param userId ID de l'utilisateur
   * @param irrigationData Données d'irrigation
   * @returns Une promesse avec l'ID du document créé
   */
  async addIrrigationHistory(
    userId: string,
    irrigationData: IrrigationHistoryItem
  ): Promise<string> {
    try {
      // Vérifier que userId est défini
      if (!userId) {
        throw new Error('ID utilisateur non défini');
      }
      
      // Vérifier que les données d'irrigation sont valides
      if (!irrigationData.culture || irrigationData.volume <= 0) {
        throw new Error("Données d'irrigation invalides");
      }
      
      // Créer la référence à la collection d'historique de l'utilisateur
      const historyCollection = collection(db, 'users', userId, 'irrigationHistory');
      
      // Ajouter le document
      const docRef = await addDoc(historyCollection, {
        date: Timestamp.fromDate(irrigationData.date || new Date()),
        culture: irrigationData.culture,
        volume: irrigationData.volume,
        totalVolume: irrigationData.totalVolume,
        completed: irrigationData.completed,
        createdAt: Timestamp.now()
      });
      
      console.log('Historique d\'irrigation ajouté avec succès, ID:', docRef.id);
      return docRef.id;
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout à l\'historique d\'irrigation:', error);
      throw new Error('Erreur lors de l\'ajout à l\'historique d\'irrigation: ' + error.message);
    }
  }

  /**
   * Vérifie si une culture spécifique a déjà été arrosée aujourd'hui
   * @param userId ID de l'utilisateur
   * @param cultureName Nom de la culture
   * @returns Une promesse qui résout en true si la culture a été arrosée aujourd'hui, false sinon
   */
  async hasIrrigatedToday(userId: string, cultureName: string): Promise<boolean> {
    try {
      if (!userId || !cultureName) {
        return false;
      }

      // Créer la référence à la collection d'historique de l'utilisateur
      const historyCollection = collection(db, 'users', userId, 'irrigationHistory');
      
      // Définir le début et la fin de la journée actuelle
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Utilisons une approche simplifiée qui ne nécessite pas d'index composite
      // Récupérer toutes les irrigations d'aujourd'hui, puis filtrer côté client
      const simpleQuery = query(
        historyCollection,
        where('date', '>=', Timestamp.fromDate(today)),
        where('date', '<', Timestamp.fromDate(tomorrow))
      );
      
      try {
        const snapshot = await getDocs(simpleQuery);
        
          // Filtrer manuellement les résultats
          return snapshot.docs.some(doc => {
            const data = doc.data();
            return data.culture === cultureName && data.completed === true;
          });
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'irrigation aujourd\'hui:', error);
          return false;
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'irrigation aujourd\'hui:', error);
      return false; // En cas d'erreur, supposons que l'irrigation n'a pas été effectuée
    }
  }

  /**
   * Récupère l'historique d'irrigation d'un utilisateur
   * @param userId ID de l'utilisateur
   * @param days Nombre de jours d'historique à récupérer (par défaut: 30)
   * @returns Une promesse contenant un tableau d'éléments d'historique formatés pour l'affichage
   */
  async getIrrigationHistory(
    userId: string,
    days: number = 30
  ): Promise<IrrigationHistoryDisplay[]> {
    try {
      // Vérifier que userId est défini
      if (!userId) {
        throw new Error('ID utilisateur non défini');
      }
      
      // Calculer la date limite pour la requête
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - days);
      
      // Créer la requête
      const historyCollection = collection(db, 'users', userId, 'irrigationHistory');
      const q = query(
        historyCollection,
        where('date', '>=', Timestamp.fromDate(limitDate)),
        orderBy('date', 'desc')
      );
      
      // Exécuter la requête
      const querySnapshot = await getDocs(q);
      
      console.log(`Nombre d'entrées trouvées: ${querySnapshot.size}`);
      
      // Formater les résultats pour l'affichage
      const history: IrrigationHistoryDisplay[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Vérifier que date est bien un Timestamp
        if (!data.date || !data.date.toDate) {
          console.warn(`Date invalide pour l'entrée ${doc.id}:`, data.date);
          return; // Ignorer cette entrée
        }
        
        const date = data.date.toDate();
        
        history.push({
          id: doc.id,
          date: date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }),
          culture: data.culture || 'Culture inconnue',
          quantity: `${(data.volume || 0).toFixed(1)}L/m²`,
          isCompleted: !!data.completed
        });
      });
      
      return history;
    } catch (error: any) {
      console.error('Erreur lors de la récupération de l\'historique d\'irrigation:', error);
      throw new Error('Erreur lors de la récupération de l\'historique d\'irrigation: ' + error.message);
    }
  }

  /**
   * Enregistre le feedback de l'utilisateur sur une recommandation d'irrigation
   * @param userId ID de l'utilisateur
   * @param feedbackData Données du feedback
   * @returns Une promesse
   */
  async addIrrigationFeedback(
    userId: string,
    feedbackData: {
      date: Date;
      culture: string;
      volume: number;
      isGood: boolean;
    }
  ): Promise<void> {
    try {
      const feedbackCollection = collection(db, 'users', userId, 'irrigationFeedback');
      
      await addDoc(feedbackCollection, {
        date: Timestamp.fromDate(feedbackData.date),
        culture: feedbackData.culture,
        volume: feedbackData.volume,
        isGood: feedbackData.isGood,
        createdAt: Timestamp.now()
      });
      
      console.log('Feedback d\'irrigation enregistré avec succès');
    } catch (error: any) {
      console.error('Erreur lors de l\'enregistrement du feedback d\'irrigation:', error);
      throw new Error('Erreur lors de l\'enregistrement du feedback d\'irrigation: ' + error.message);
    }
  }

  async getUserCultures(userId: string | undefined): Promise<CultureData[]> {
    try {
      // Vérifier si l'utilisateur est connecté
      if (!userId) {
        console.log('Erreur: userId non défini');
        throw new Error('Utilisateur non connecté');
      }

      // Récupérer le document utilisateur
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        console.log('Erreur: document utilisateur non trouvé pour userId:', userId);
        throw new Error('Profil utilisateur non trouvé');
      }

      const userData = userDoc.data() as UserData;
      console.log('Données utilisateur récupérées:', userData);
      
      // Vérifier si l'utilisateur a des cultures
      if (!userData.crops || userData.crops.length === 0) {
        console.log('Aucune culture trouvée pour l\'utilisateur:', userId);
        return []; // Retourner un tableau vide au lieu de lever une exception
      }

      console.log('Cultures trouvées:', userData.crops);

      // Convertir les données en format CultureData
      const cultures = userData.crops
        .filter(crop => crop && crop.name && crop.plantingDate && crop.soilType && crop.area)
        .map(crop => {
          try {
            // Convertir le nom de la culture
            const cultureName = crop.name.toLowerCase();
            let normalizedName: 'Tomate' | 'Laitue' | 'Maïs';
            
            if (cultureName.includes('tomate')) {
              normalizedName = 'Tomate';
            } else if (cultureName.includes('laitue')) {
              normalizedName = 'Laitue';
            } else if (cultureName.includes('maïs') || cultureName.includes('mais')) {
              normalizedName = 'Maïs';
            } else {
              console.warn('Nom de culture non reconnu:', crop.name);
              return null;
            }

            // Convertir le type de sol
            const soilType = crop.soilType.toLowerCase();
            let normalizedSoilType: 'Sablonneux' | 'Argileux' | 'Limoneux';
            
            if (soilType.includes('sablon') || soilType.includes('sandy')) {
              normalizedSoilType = 'Sablonneux';
            } else if (soilType.includes('argil') || soilType.includes('clay')) {
              normalizedSoilType = 'Argileux';
            } else if (soilType.includes('limon') || soilType.includes('loam')) {
              normalizedSoilType = 'Limoneux';
            } else {
              // Si le type de sol n'est pas reconnu, utiliser Sablonneux par défaut
              console.warn('Type de sol non reconnu, utilisation de Sablonneux par défaut:', crop.soilType);
              normalizedSoilType = 'Sablonneux';
            }

            // Convertir la date de plantation
            const plantingDate = new Date(crop.plantingDate);
            if (isNaN(plantingDate.getTime())) {
              console.warn('Date de plantation invalide:', crop.plantingDate);
              return null;
            }

            // Convertir la superficie
            const area = parseFloat(crop.area);
            if (isNaN(area) || area <= 0) {
              console.warn('Superficie invalide:', crop.area);
              return null;
            }

            const cultureData = {
              id: crop.id,
              name: normalizedName,
              soilType: normalizedSoilType,
              plantingDate: plantingDate.toISOString(),
              area: area
            };

            console.log('Culture convertie:', cultureData);
            return cultureData;
          } catch (error) {
            console.error('Erreur lors de la conversion de la culture:', error);
            return null;
          }
        }).filter((crop): crop is CultureData => crop !== null);

      console.log('Cultures finales:', cultures);
      return cultures;

    } catch (error) {
      console.error('Erreur lors de la récupération des cultures:', error);
      return []; // Retourner un tableau vide en cas d'erreur au lieu de propager l'erreur
    }
  }

  /**
   * Calcule les statistiques de l'utilisateur
   * @param userId ID de l'utilisateur
   * @returns Une promesse contenant les statistiques de l'utilisateur
   */
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      // Récupérer les cultures de l'utilisateur
      const cultures = await this.getUserCultures(userId);
      
      // Récupérer l'historique d'irrigation
      const irrigationHistory = await this.getIrrigationHistory(userId);
      
      // Calculer l'efficacité
      const efficiency = this.calculateEfficiency(cultures, irrigationHistory);
      
      return {
        cultures: cultures.length,
        irrigations: irrigationHistory.length,
        efficiency: Math.round(efficiency * 100) // Convertir en pourcentage
      };
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      throw error;
    }
  }

  /**
   * Calcule l'efficacité d'irrigation
   * @param cultures Cultures de l'utilisateur
   * @param irrigationHistory Historique d'irrigation
   * @returns Un nombre entre 0 et 1 représentant l'efficacité
   */
  private calculateEfficiency(cultures: CultureData[], irrigationHistory: IrrigationHistoryDisplay[]): number {
    if (cultures.length === 0 || irrigationHistory.length === 0) {
      return 0;
    }

    // Calculer le nombre d'irrigations par culture
    const irrigationsPerCulture = irrigationHistory.reduce((acc, irrigation) => {
      acc[irrigation.culture] = (acc[irrigation.culture] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculer l'efficacité moyenne
    let totalEfficiency = 0;
    let cultureCount = 0;

    cultures.forEach(culture => {
      const irrigations = irrigationsPerCulture[culture.name] || 0;
      const expectedIrrigations = this.getExpectedIrrigations(culture);
      
      if (expectedIrrigations > 0) {
        const cultureEfficiency = Math.min(irrigations / expectedIrrigations, 1);
        totalEfficiency += cultureEfficiency;
        cultureCount++;
      }
    });

    return cultureCount > 0 ? totalEfficiency / cultureCount : 0;
  }

  /**
   * Calcule le nombre d'irrigations attendues pour une culture
   * @param culture Données de la culture
   * @returns Nombre d'irrigations attendues
   */
  private getExpectedIrrigations(culture: CultureData): number {
    const plantingDate = new Date(culture.plantingDate);
    const now = new Date();
    const daysSincePlanting = Math.floor((now.getTime() - plantingDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Nombre d'irrigations attendues par semaine selon le type de culture
    const irrigationsPerWeek: Record<string, number> = {
      'Tomate': 3,
      'Laitue': 2,
      'Maïs': 2
    };

    const expectedIrrigations = Math.floor((daysSincePlanting / 7) * (irrigationsPerWeek[culture.name] || 2));
    return Math.max(expectedIrrigations, 0);
  }

  /**
   * Récupère les questions fréquentes (FAQ)
   * @returns Une promesse contenant un tableau de FAQ
   */
  async getFAQs(): Promise<FAQ[]> {
    try {
      const faqCollection = collection(db, 'faqs');
      const q = query(faqCollection, orderBy('category'), orderBy('order'));
      const querySnapshot = await getDocs(q);
      
      const faqs: FAQ[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        faqs.push({
          id: doc.id,
          question: data.question,
          answer: data.answer,
          category: data.category
        });
      });
      
      return faqs;
    } catch (error) {
      console.error('Erreur lors de la récupération des FAQs:', error);
      throw error;
    }
  }

  async addUserCulture(userId: string, culture: CultureData): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error('Utilisateur non trouvé');
      }

      const userData = userDoc.data() as UserData;
      const currentCrops = userData.crops || [];

      // Vérifier si la culture existe déjà
      const cultureExists = currentCrops.some(c => c.id === culture.id);
      if (cultureExists) {
        throw new Error('Cette culture existe déjà');
      }

      // Ajouter la nouvelle culture
      const updatedCrops = [...currentCrops, culture];

      // Mettre à jour le document utilisateur
      await updateDoc(userRef, {
        crops: updatedCrops,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la culture:', error);
      throw error;
    }
  }

  async deleteUserCulture(userId: string, cultureId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error('Utilisateur non trouvé');
      }

      const userData = userDoc.data() as UserData;
      const currentCrops = userData.crops || [];

      // Filtrer la culture à supprimer
      const updatedCrops = currentCrops.filter(c => c.id !== cultureId);

      // Mettre à jour le document utilisateur
      await updateDoc(userRef, {
        crops: updatedCrops,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la culture:', error);
      throw error;
    }
  }

  // Mettre à jour le profil utilisateur
  public async updateUserProfile(userId: string, data: { photoURL?: string; displayName?: string }) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...data,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  }
}

// Exporter une instance du service
const userService = new UserService();
export default userService; 