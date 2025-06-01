import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ImageBackground,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  SafeAreaView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import Colors from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import authService from '../../services/auth.service';
import userService from '../../services/user.service';

// Types des chemins de redirection possibles
type RedirectPath = 
  | '/(auth)/home'
  | '/(public)/language-setup'
  | '/(auth)/initial-config'
  | '/(auth)/crop-config';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      // Connexion avec Firebase
      const userCredential = await authService.login(email, password);
      
      if (userCredential.user) {
        try {
          // Vérifier si l'utilisateur a déjà configuré son profil
          const userData = await userService.getUserData(userCredential.user.uid);
          
          // Déterminer vers quelle page rediriger l'utilisateur
          let redirectTo: RedirectPath = '/(auth)/home';
          
          if (!userData) {
            // L'utilisateur n'a pas de profil, rediriger vers la configuration de langue
            redirectTo = '/(public)/language-setup';
          } else if (!userData.language) {
            // L'utilisateur a un profil mais pas de langue configurée
            redirectTo = '/(public)/language-setup';
          } else if (!userData.location) {
            // L'utilisateur a un profil et une langue mais pas de localisation
            redirectTo = '/(auth)/initial-config';
          } else if (!userData.crops || userData.crops.length === 0) {
            // L'utilisateur a un profil, une langue et une localisation mais pas de cultures
            redirectTo = '/(auth)/crop-config';
          }
          
          // Redirection vers la page appropriée
          router.replace(redirectTo);
          
          if (redirectTo === '/(auth)/home') {
            // Afficher un message de succès uniquement si redirigé vers l'accueil
            Alert.alert("Succès", "Connexion réussie");
          }
        } catch (profileError) {
          console.error("Erreur lors de la vérification du profil:", profileError);
          // En cas d'erreur, diriger par défaut vers la page d'accueil
          router.replace('/(auth)/home');
        }
      }
    } catch (error: any) {
      setError(error.message);
      console.error('Erreur de connexion:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/signup.jpg.webp')}
      style={styles.backgroundImage}
    >
      <StatusBar style="light" />
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <View style={styles.authForm}>
              <Text style={styles.title}>Connexion</Text>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.formGroup}>
                <FontAwesome name="envelope" size={20} color="#888" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#888"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <FontAwesome name="lock" size={20} color="#888" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Mot de passe"
                  placeholderTextColor="#888"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#888" 
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  isLoading && styles.buttonDisabled
                ]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Connexion en cours...' : 'Se connecter'}
                </Text>
              </TouchableOpacity>

              <View style={styles.formFooter}>
                <TouchableOpacity onPress={() => router.push('/(public)/forgot-password')}>
                  <Text style={styles.footerLink}>Mot de passe oublié?</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/(public)/register')}>
                  <Text style={styles.footerLink}>Créer un compte</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  authForm: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 30,
    width: '90%',
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  formGroup: {
    position: 'relative',
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  icon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
  },
  eyeIcon: {
    paddingHorizontal: 12,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  },
  formFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  footerLink: {
    color: Colors.primary,
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: 'OpenSans-Regular',
  },
}); 