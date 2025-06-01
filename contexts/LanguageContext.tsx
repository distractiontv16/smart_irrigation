import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import userService from '../services/user.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'fr' | 'fon';

interface LanguageContextType {
  language: Language;
  changeLanguage: (lang: Language) => Promise<void>;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [language, setLanguage] = useState<Language>('fr');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        if (currentUser?.uid) {
          // Essayer de charger depuis Firestore
          const userData = await userService.getUserData(currentUser.uid);
          if (userData?.language === 'fon' || userData?.language === 'fr') {
            setLanguage(userData.language);
            await AsyncStorage.setItem('userLanguage', userData.language);
          } else {
            // Fallback sur le stockage local
            const savedLanguage = await AsyncStorage.getItem('userLanguage');
            if (savedLanguage === 'fon' || savedLanguage === 'fr') {
              setLanguage(savedLanguage);
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la langue:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLanguage();
  }, [currentUser]);

  const changeLanguage = async (newLang: Language) => {
    try {
      if (currentUser?.uid) {
        await userService.updateUserLanguage(currentUser.uid, newLang);
        await AsyncStorage.setItem('userLanguage', newLang);
        setLanguage(newLang);
      }
    } catch (error) {
      console.error('Erreur lors du changement de langue:', error);
      throw error;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, loading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
} 