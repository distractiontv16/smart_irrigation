import { useState, useEffect, useCallback } from 'react';
import userService, { UserData } from '../services/user.service';
import { useAuth } from '../contexts/AuthContext';

export function useLanguage() {
  const { currentUser } = useAuth();
  const [language, setLanguage] = useState<'fr' | 'fon'>('fr');
  const [loading, setLoading] = useState(true);

  // Charger la langue depuis le profil utilisateur
  useEffect(() => {
    const fetchLanguage = async () => {
      if (currentUser?.uid) {
        const userData: UserData | null = await userService.getUserData(currentUser.uid);
        if (userData?.language === 'fon' || userData?.language === 'fr') {
          setLanguage(userData.language);
        } else {
          setLanguage('fr');
        }
      }
      setLoading(false);
    };
    fetchLanguage();
  }, [currentUser]);

  // Fonction pour changer la langue (et la mettre à jour dans Firestore)
  const changeLanguage = useCallback(async (lang: 'fr' | 'fon') => {
    if (currentUser?.uid) {
      await userService.updateUserLanguage(currentUser.uid, lang);
      setLanguage(lang);
    }
  }, [currentUser]);

  return { language, changeLanguage, loading };
} 