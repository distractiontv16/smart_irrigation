import React, { useEffect } from 'react';
import { StyleSheet, View, Image, Text, Animated } from 'react-native';
import { router } from 'expo-router';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/auth.service';

export default function SplashScreen() {
  const loadingProgress = React.useRef(new Animated.Value(0)).current;
  const scaleAnimation = React.useRef(new Animated.Value(1)).current;
  const { currentUser, authStateChecked } = useAuth();

  // Vérifier l'état d'authentification persisté
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // Animation de la barre de chargement
        Animated.timing(loadingProgress, {
          toValue: 100,
          duration: 2000, // Durée réduite pour une meilleure expérience
          useNativeDriver: false,
        }).start();

        // Animation de pulsation du logo
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnimation, {
              toValue: 1.05,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnimation, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();

        // Vérifier l'état d'authentification
        const authState = await authService.getAuthState();
        
        // Redirection après l'animation
        const timer = setTimeout(() => {
          if (authState && currentUser) {
            // Si l'utilisateur est déjà connecté, rediriger vers l'accueil
            router.replace('/(auth)/home');
          } else {
            // Sinon, rediriger vers l'écran de bienvenue
            router.replace('/welcome');
          }
        }, 2000);
        
        return () => clearTimeout(timer);
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'état d\'authentification:', error);
        // En cas d'erreur, rediriger vers l'écran de bienvenue
        router.replace('/welcome');
      }
    };

    checkAuthState();
  }, [currentUser, authStateChecked]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../../assets/images/logo.png')}
        style={[styles.logo, { transform: [{ scale: scaleAnimation }] }]}
        resizeMode="contain"
      />
      <View style={styles.loadingBarContainer}>
        <Animated.View 
          style={[
            styles.loadingBar, 
            { width: loadingProgress.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }) }
          ]} 
        />
      </View>
      <Text style={styles.appName}>SmartIrrigation</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  loadingBarContainer: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginVertical: 20,
    overflow: 'hidden',
  },
  loadingBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
