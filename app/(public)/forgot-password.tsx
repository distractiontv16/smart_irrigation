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
import { FontAwesome } from '@expo/vector-icons';
import authService from '../../services/auth.service';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      setError('Veuillez entrer votre adresse email');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      // Envoi de l'email de réinitialisation avec Firebase
      await authService.resetPassword(email);
      
      // Affichage du message de succès
      setSuccess(true);
    } catch (error: any) {
      setError(error.message);
      console.error('Erreur de réinitialisation:', error.message);
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
              <Text style={styles.title}>Mot de passe oublié</Text>
              
              {success ? (
                <View style={styles.successContainer}>
                  <Text style={styles.successText}>
                    Un email de réinitialisation a été envoyé à {email}.
                  </Text>
                  <Text style={styles.instructionText}>
                    Veuillez vérifier votre boîte de réception et suivre les instructions.
                  </Text>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push('/(public)/login')}
                  >
                    <Text style={styles.buttonText}>Retour à la connexion</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.instruction}>
                    Entrez votre adresse email pour recevoir un lien de réinitialisation de mot de passe.
                  </Text>

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

                  <TouchableOpacity
                    style={[
                      styles.button,
                      isLoading && styles.buttonDisabled
                    ]}
                    onPress={handleResetPassword}
                    disabled={isLoading}
                  >
                    <Text style={styles.buttonText}>
                      {isLoading ? 'Envoi en cours...' : 'Réinitialiser le mot de passe'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.formFooter}>
                    <TouchableOpacity onPress={() => router.push('/(public)/login')}>
                      <Text style={styles.footerLink}>Retour à la connexion</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
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
  instruction: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
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
    alignItems: 'center',
    marginTop: 20,
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
  successContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  successText: {
    fontSize: 16,
    fontFamily: 'OpenSans-Bold',
    color: Colors.success,
    textAlign: 'center',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    textAlign: 'center',
    marginBottom: 20,
  },
});
