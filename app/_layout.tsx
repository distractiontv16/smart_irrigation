import React, { useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';
import { AuthProvider } from '../contexts/AuthContext';
import { LanguageProvider } from '../contexts/LanguageContext';

// Gardez l'écran de démarrage visible jusqu'à ce que les ressources soient prêtes
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Montserrat-Bold': require('../assets/fonts/Montserrat-Bold.ttf'),
    'OpenSans-Regular': require('../assets/fonts/OpenSans-Regular.ttf'),
    'RobotoMono-Regular': require('../assets/fonts/RobotoMono-Regular.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <LanguageProvider>
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: '#3A7D44',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontFamily: 'Montserrat-Bold',
              },
            }}
          >
            <Stack.Screen
              name="(public)/index"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(public)/welcome"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(public)/login"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(public)/register"
              options={{
                title: "Inscription",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(public)/forgot-password"
              options={{
                title: "Mot de passe oublié",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(public)/language-select"
              options={{
                title: "Sélection de la langue",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(public)/language-setup"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(auth)/home"
              options={{
                title: "Accueil",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(auth)/initial-config"
              options={{
                title: "Configuration Initiale",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(auth)/crop-config"
              options={{
                title: "Configuration des Cultures",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(auth)/irrigation"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(auth)/settings"
              options={{
                title: "Paramètres",
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="(auth)/conseils-ia"
              options={{
                title: "Conseils IA",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(auth)/profile"
              options={{
                title: "Profil",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(auth)/weather-details"
              options={{
                title: "Détails Météo",
                headerShown: false,
              }}
            />
          </Stack>
        </View>
      </LanguageProvider>
    </AuthProvider>
  );
}
