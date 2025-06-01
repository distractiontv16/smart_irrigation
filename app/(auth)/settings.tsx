import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Switch,
  Alert,
  Platform,
  Linking,
  Modal,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../../constants/Colors';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../../contexts/AuthContext';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import Constants from 'expo-constants';
import { useLanguage } from '../../contexts/LanguageContext';
import userService from '../../services/user.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../../services/auth.service';
import notificationService from '../../services/notification.service';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebaseConfig';

export default function SettingsScreen() {
  // Récupérer les données de l'utilisateur depuis le contexte d'authentification
  const { currentUser, logout } = useAuth();
  const { language, changeLanguage, loading: languageLoading } = useLanguage();
  
  // États pour les différents paramètres
  const [notifications, setNotifications] = useState({
    daily: true,
    weather: true,
    irrigation: true,
  });
  const [offlineMode, setOfflineMode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(language === 'fr' ? 'Français' : 'Fon');
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [reportText, setReportText] = useState('');
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [userData, setUserData] = useState({
    name: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Utilisateur',
    email: currentUser?.email || 'Non disponible',
    phone: '+229 XX XX XX XX',
    avatar: currentUser?.photoURL || 
      `https://ui-avatars.com/api/?name=${currentUser?.displayName || 'User'}&background=3A7D44&color=fff&size=256`,
  });
  
  // Récupérer la version de l'application depuis app.json
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  
  const languages = ['Français', 'Fon', 'Yoruba', 'Goun'];

  // Charger le mode hors ligne au démarrage
  useEffect(() => {
    const loadOfflineMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('offlineMode');
        if (savedMode !== null) {
          setOfflineMode(JSON.parse(savedMode));
        }
      } catch (error) {
        console.error('Erreur lors du chargement du mode hors ligne:', error);
      }
    };
    loadOfflineMode();
  }, []);

  // Sauvegarder le mode hors ligne quand il change
  useEffect(() => {
    const saveOfflineMode = async () => {
      try {
        await AsyncStorage.setItem('offlineMode', JSON.stringify(offlineMode));
      } catch (error) {
        console.error('Erreur lors de la sauvegarde du mode hors ligne:', error);
      }
    };
    saveOfflineMode();
  }, [offlineMode]);

  // Sécurité : Vérification de session
  useEffect(() => {
    // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
    if (!currentUser) {
      router.replace('/(public)/login');
    }
  }, [currentUser]);

  // Mettre à jour selectedLanguage quand language change
  useEffect(() => {
    setSelectedLanguage(language === 'fr' ? 'Français' : 'Fon');
  }, [language]);

  // Charger les préférences de notification au démarrage
  useEffect(() => {
    const loadNotificationSettings = async () => {
      if (currentUser) {
        try {
          const settings = await notificationService.areNotificationsEnabled(currentUser.uid);
          setNotifications(settings);
        } catch (error) {
          console.error('Erreur lors du chargement des préférences de notification:', error);
        }
      }
    };
    loadNotificationSettings();
  }, [currentUser]);

  const handleLanguageChange = async (language: string) => {
    try {
      const langCode = language === 'Français' ? 'fr' : 'fon';
      await changeLanguage(langCode);
      setSelectedLanguage(language);
      Alert.alert(
        'Succès',
        'La langue a été mise à jour avec succès. Les changements seront appliqués immédiatement.'
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de changer la langue. Veuillez réessayer.');
    }
  };

  // Sécurité : Gestion sécurisée de la déconnexion
  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/(public)/login');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de se déconnecter. Veuillez réessayer.');
            }
          }
        }
      ]
    );
  };

  // Sécurité : Modification du profil sécurisée
  const handleProfileUpdate = async (newData: any) => {
    try {
      // TODO: Implémenter la validation et la mise à jour sécurisée
      // - Valider les données
      // - Chiffrer si nécessaire
      // - Envoyer au backend
      await validateAndUpdateProfile(newData);
      Alert.alert('Succès', 'Profil mis à jour avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil. Veuillez réessayer.');
    }
  };
  
  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      // Vérifier l'ancien mot de passe
      await authService.login(currentUser?.email || '', passwordData.currentPassword);
      
      // Mettre à jour le mot de passe
      await authService.updatePassword(passwordData.newPassword);
      
      Alert.alert('Succès', 'Le mot de passe a été mis à jour avec succès');
      setIsPasswordModalVisible(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const handleReportSubmit = async () => {
    if (!reportText.trim()) {
      Alert.alert('Erreur', 'Veuillez décrire le problème');
      return;
    }

    try {
      await addDoc(collection(db, 'reports'), {
        userId: currentUser?.uid,
        userEmail: currentUser?.email,
        report: reportText,
        timestamp: new Date(),
        status: 'pending'
      });

      Alert.alert('Succès', 'Votre signalement a été envoyé avec succès');
      setIsReportModalVisible(false);
      setReportText('');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer le signalement. Veuillez réessayer.');
    }
  };

  // Gérer le changement des préférences de notification
  const handleNotificationChange = async (type: keyof typeof notifications, value: boolean) => {
    try {
      const newSettings = { ...notifications, [type]: value };
      setNotifications(newSettings);
      
      if (currentUser) {
        await notificationService.updateNotificationSettings(currentUser.uid, newSettings);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences de notification:', error);
      // Revenir à l'état précédent en cas d'erreur
      setNotifications(notifications);
      Alert.alert('Erreur', 'Impossible de mettre à jour les préférences de notification');
    }
  };

  // Gérer la sélection d'une nouvelle photo de profil
  const handleImagePick = async () => {
    try {
      // Demander la permission d'accéder à la galerie
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à la galerie');
        return;
      }

      // Ouvrir le sélecteur d'image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Afficher un indicateur de chargement
        Alert.alert('Chargement', 'Mise à jour de votre photo de profil...');

        // Convertir l'image en blob
        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();

        // Créer une référence unique pour l'image
        const imageRef = ref(storage, `profile_photos/${currentUser?.uid}`);

        // Uploader l'image
        await uploadBytes(imageRef, blob);

        // Obtenir l'URL de l'image
        const downloadURL = await getDownloadURL(imageRef);

        // Mettre à jour le profil utilisateur
        if (currentUser) {
          await userService.updateUserProfile(currentUser.uid, {
            photoURL: downloadURL,
          });

          // Mettre à jour l'état local
          setUserData(prev => ({
            ...prev,
            avatar: downloadURL,
          }));

          Alert.alert('Succès', 'Votre photo de profil a été mise à jour avec succès');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la photo de profil:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour votre photo de profil');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section Profil */}
        <Animated.View 
          entering={FadeInDown.delay(100)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Profil</Text>
          <View style={styles.profileContainer}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: userData.avatar }} style={styles.avatar} />
              <TouchableOpacity 
                style={styles.editAvatarButton}
                onPress={handleImagePick}
              >
                <Ionicons name="camera" size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userData.name}</Text>
              <Text style={styles.profileEmail}>{userData.email}</Text>
              <Text style={styles.profilePhone}>{userData.phone}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => Alert.alert('Modification du profil', 'Cette fonctionnalité sera bientôt disponible')}
          >
            <Ionicons name="create-outline" size={24} color={Colors.white} />
            <Text style={styles.buttonText}>Modifier le profil</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Section Notifications */}
        <Animated.View 
          entering={FadeInDown.delay(200)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.notificationOption}>
            <View style={styles.notificationInfo}>
              <Ionicons name="notifications" size={24} color={Colors.darkGray} />
              <Text style={styles.optionText}>Notifications quotidiennes</Text>
            </View>
            <Switch
              value={notifications.daily}
              onValueChange={(value) => handleNotificationChange('daily', value)}
              trackColor={{ false: Colors.lightGray, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>

          <View style={styles.notificationOption}>
            <View style={styles.notificationInfo}>
              <Ionicons name="cloud" size={24} color={Colors.darkGray} />
              <Text style={styles.optionText}>Alertes météo</Text>
            </View>
            <Switch
              value={notifications.weather}
              onValueChange={(value) => handleNotificationChange('weather', value)}
              trackColor={{ false: Colors.lightGray, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>

          <View style={styles.notificationOption}>
            <View style={styles.notificationInfo}>
              <Ionicons name="water" size={24} color={Colors.darkGray} />
              <Text style={styles.optionText}>Rappels d'irrigation</Text>
            </View>
            <Switch
              value={notifications.irrigation}
              onValueChange={(value) => handleNotificationChange('irrigation', value)}
              trackColor={{ false: Colors.lightGray, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </Animated.View>

        {/* Section Langue */}
        <Animated.View 
          entering={FadeInDown.delay(300)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Langue</Text>
          <View style={styles.languageContainer}>
            {languages.map((language) => (
              <TouchableOpacity
                key={language}
                style={[
                  styles.languageButton,
                  selectedLanguage === language && styles.languageButtonActive
                ]}
                onPress={() => handleLanguageChange(language)}
                disabled={languageLoading}
              >
                <Text style={[
                  styles.languageButtonText,
                  selectedLanguage === language && styles.languageButtonTextActive
                ]}>
                  {language}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Section Mode Hors-ligne */}
        <Animated.View 
          entering={FadeInDown.delay(400)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Mode Hors-ligne</Text>
          <View style={styles.optionContainer}>
            <View style={styles.option}>
              <Ionicons name="cloud-offline" size={24} color={Colors.darkGray} />
              <Text style={styles.optionText}>Activer le mode hors-ligne</Text>
              <Switch
                value={offlineMode}
                onValueChange={setOfflineMode}
                trackColor={{ false: Colors.lightGray, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
          </View>
          <Text style={styles.helpText}>
            Le mode hors-ligne vous permet d'accéder à vos données même sans connexion internet
          </Text>
        </Animated.View>

        {/* Section Sécurité */}
        <Animated.View 
          entering={FadeInDown.delay(500)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Sécurité</Text>
          <TouchableOpacity 
            style={styles.securityOption}
            onPress={() => setIsPasswordModalVisible(true)}
          >
            <Ionicons name="lock-closed" size={24} color={Colors.darkGray} />
            <Text style={styles.securityOptionText}>Changer le mot de passe</Text>
            <Ionicons name="chevron-forward" size={24} color={Colors.darkGray} />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Section Aide */}
        <Animated.View 
          entering={FadeInDown.delay(600)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Aide</Text>
          <TouchableOpacity 
            style={styles.option}
            onPress={() => setIsReportModalVisible(true)}
          >
            <Ionicons name="warning" size={24} color={Colors.darkGray} />
            <Text style={styles.optionText}>Signaler un problème</Text>
            <Ionicons name="chevron-forward" size={24} color={Colors.darkGray} />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Section À propos / Crédits */}
        <Animated.View 
          entering={FadeInDown.delay(650)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>À propos</Text>
          <View style={styles.aboutContainer}>
            <Text style={styles.aboutText}>
              SmartIrrigation est une application destinée à aider les agriculteurs béninois 
              à optimiser l'irrigation de leurs cultures grâce à des recommandations personnalisées 
              basées sur les conditions météorologiques et les besoins spécifiques des plantes.
            </Text>
            <View style={styles.versionContainer}>
              <Text style={styles.versionText}>Version {appVersion}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Bouton Déconnexion */}
        <Animated.View
          entering={FadeInDown.delay(700)}
          style={styles.logoutSection}
        >
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color={Colors.danger} />
            <Text style={styles.logoutButtonText}>Se déconnecter</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Modal de signalement */}
      <Modal
        visible={isReportModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsReportModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Signaler un problème</Text>
            <TextInput
              style={styles.reportInput}
              multiline
              numberOfLines={4}
              placeholder="Décrivez le problème que vous rencontrez..."
              value={reportText}
              onChangeText={setReportText}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsReportModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleReportSubmit}
              >
                <Text style={styles.modalButtonText}>Envoyer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de changement de mot de passe */}
      <Modal
        visible={isPasswordModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsPasswordModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Changer le mot de passe</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              placeholder="Mot de passe actuel"
              value={passwordData.currentPassword}
              onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
            />
            <TextInput
              style={styles.input}
              secureTextEntry
              placeholder="Nouveau mot de passe"
              value={passwordData.newPassword}
              onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
            />
            <TextInput
              style={styles.input}
              secureTextEntry
              placeholder="Confirmer le nouveau mot de passe"
              value={passwordData.confirmPassword}
              onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsPasswordModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handlePasswordChange}
              >
                <Text style={styles.modalButtonText}>Changer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#3A7D44',
    height: 56,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.darkGray,
    marginBottom: 16,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.darkGray,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    opacity: 0.8,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    marginLeft: 8,
  },
  optionContainer: {
    marginBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    marginLeft: 12,
  },
  languageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  languageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    margin: 4,
  },
  languageButtonActive: {
    backgroundColor: Colors.primary,
  },
  languageButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
  },
  languageButtonTextActive: {
    color: Colors.white,
  },
  helpText: {
    fontSize: 12,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    opacity: 0.8,
    marginTop: 8,
  },
  securityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  securityOptionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    marginLeft: 12,
  },
  logoutSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  logoutButtonText: {
    color: Colors.danger,
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    marginLeft: 8,
  },
  aboutContainer: {
    paddingVertical: 8,
  },
  aboutText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    lineHeight: 20,
    textAlign: 'justify',
  },
  versionContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 13,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    opacity: 0.7,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: Colors.darkGray,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontFamily: 'OpenSans-Regular',
  },
  reportInput: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    height: 120,
    textAlignVertical: 'top',
    fontFamily: 'OpenSans-Regular',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: Colors.lightGray,
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  modalButtonText: {
    color: Colors.white,
    fontFamily: 'Montserrat-Medium',
  },
  notificationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

// Fonction utilitaire pour valider et mettre à jour le profil
const validateAndUpdateProfile = async (data: any) => {
  // TODO: Implémenter la validation et mise à jour du profil
  return Promise.resolve();
}; 