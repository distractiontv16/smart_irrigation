import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ImageBackground,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import Colors from '../../constants/Colors';

export default function LanguageSelectScreen() {
  const [selectedLanguage, setSelectedLanguage] = useState('fr');

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
  };

  const handleContinue = () => {
    // TODO: Sauvegarder la langue sélectionnée
    router.push('/(public)/welcome');
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/welcome.webp')}
      style={styles.backgroundImage}
    >
      <StatusBar style="light" />
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Choisissez votre langue</Text>
            <Text style={styles.subtitle}>Select your language</Text>

            <View style={styles.languageOptions}>
              <TouchableOpacity 
                style={[
                  styles.languageOption, 
                  selectedLanguage === 'fr' && styles.selectedOption
                ]}
                onPress={() => handleLanguageSelect('fr')}
              >
                <Text style={selectedLanguage === 'fr' ? styles.selectedOptionText : styles.optionText}>
                  Français
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.languageOption, 
                  selectedLanguage === 'fon' && styles.selectedOption
                ]}
                onPress={() => handleLanguageSelect('fon')}
              >
                <Text style={selectedLanguage === 'fon' ? styles.selectedOptionText : styles.optionText}>
                  Fon
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleContinue}
            >
              <Text style={styles.buttonText}>Continuer</Text>
            </TouchableOpacity>
          </View>
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
  content: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 30,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    textAlign: 'center',
    marginBottom: 30,
  },
  languageOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 30,
  },
  languageOption: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    padding: 16,
    minWidth: 120,
    alignItems: 'center',
  },
  selectedOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.translucentGreen,
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
  },
  selectedOptionText: {
    fontSize: 16,
    fontFamily: 'OpenSans-Bold',
    color: Colors.primary,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  },
});
