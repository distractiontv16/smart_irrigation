import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import authService from '../services/auth.service';
import { router, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateProfile as firebaseUpdateProfile } from 'firebase/auth';

// Type pour le contexte d'authentification
interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  authStateChecked: boolean;
  updateProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
}

// Valeur par défaut du contexte
const defaultAuthContext: AuthContextType = {
  currentUser: null,
  isLoading: true,
  logout: async () => {},
  authStateChecked: false,
  updateProfile: async () => {},
};

// Création du contexte
const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => useContext(AuthContext);

// Vérifier si le chemin actuel est protégé par authentification
const useProtectedRoute = (user: User | null) => {
  const segments = useSegments();
  
  // Détecter si nous sommes sur une route protégée (/(auth)/...)
  const isProtectedRoute = segments.length > 0 && segments[0] === '(auth)';
  
  // Détecter si nous sommes sur une route publique mais hors configuration de langue
  const isPublicRoute = segments.length > 0 && segments[0] === '(public)';
  const isLanguageSetup = segments.length > 1 && segments[1] === 'language-setup';
  
  useEffect(() => {
    if (!user && isProtectedRoute) {
      // Si aucun utilisateur n'est connecté et que nous sommes sur une route protégée,
      // rediriger vers la page de connexion
      router.replace('/(public)/login');
    } else if (user && isPublicRoute && !isLanguageSetup) {
      // Si un utilisateur est connecté et que nous sommes sur une route publique
      // (et pas sur la configuration de langue), rediriger vers la page d'accueil
      router.replace('/(auth)/home');
    }
  }, [user, isProtectedRoute, isPublicRoute, isLanguageSetup]);
};

// Props pour le fournisseur de contexte
interface AuthProviderProps {
  children: ReactNode;
}

// Fournisseur de contexte
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authStateChecked, setAuthStateChecked] = useState(false);
  
  // Utiliser le hook de route protégée
  useProtectedRoute(currentUser);

  useEffect(() => {
    // Fonction pour restaurer l'état d'authentification
    const restoreAuthState = async () => {
      try {
        // Vérifier si des données d'authentification sont stockées
        const authState = await authService.getAuthState();
        
        if (authState) {
          // Si l'utilisateur a des données d'authentification stockées,
          // nous attendons que Firebase confirme l'état d'authentification
          if (!auth.currentUser) {
            console.log('Restauration de l\'état d\'authentification en cours...');
          }
        }
      } catch (error) {
        console.error('Erreur lors de la restauration de l\'état d\'authentification:', error);
      } finally {
        setAuthStateChecked(true);
      }
    };

    // S'abonner aux changements d'état d'authentification de Firebase
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsLoading(false);
    });

    // Restaurer l'état d'authentification
    restoreAuthState();

    // Nettoyer l'abonnement lors du démontage
    return () => {
      unsubscribe();
      authService.cleanup();
    };
  }, []);

  // Fonction de déconnexion
  const logout = async () => {
    try {
      await authService.logout();
      setCurrentUser(null);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      throw error;
    }
  };

  const updateProfile = async (data: { displayName?: string; photoURL?: string }) => {
    try {
      if (!currentUser) {
        throw new Error('Aucun utilisateur connecté');
      }
      await firebaseUpdateProfile(currentUser, data);
      setCurrentUser({ ...currentUser, ...data });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    isLoading,
    logout,
    authStateChecked,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 