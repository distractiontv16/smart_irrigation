import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import userService from '../../services/user.service';
import NotificationTester from '../../utils/notificationTester';
import Colors from '../../constants/Colors';

export default function NotificationTestScreen() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [testStatus, setTestStatus] = useState<string>('');

  useEffect(() => {
    loadUserData();
  }, [currentUser]);

  const loadUserData = async () => {
    if (currentUser) {
      try {
        const userData = await userService.getUserData(currentUser.uid);
        setUserName(userData?.username || 'Utilisateur');
      } catch (error) {
        console.error('Erreur chargement données utilisateur:', error);
      }
    }
  };

  const handleScheduleTests = async () => {
    if (!currentUser) {
      Alert.alert('Erreur', 'Utilisateur non connecté');
      return;
    }

    setLoading(true);
    setTestStatus('Programmation des tests...');

    try {
      const success = await NotificationTester.scheduleTestNotifications(
        currentUser.uid,
        userName
      );

      if (success) {
        setTestStatus('✅ Tests programmés avec succès !');
      } else {
        setTestStatus('❌ Échec de la programmation');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setTestStatus('❌ Erreur lors de la programmation');
    } finally {
      setLoading(false);
    }
  };

  const handleImmediateTest = async () => {
    setLoading(true);
    setTestStatus('Test immédiat en cours...');

    try {
      const success = await NotificationTester.scheduleImmediateTestReminder(userName);
      if (success) {
        setTestStatus('⚡ Test immédiat programmé !');
      } else {
        setTestStatus('❌ Échec du test immédiat');
      }
    } catch (error) {
      setTestStatus('❌ Erreur test immédiat');
    } finally {
      setLoading(false);
    }
  };

  const handleShowScheduled = async () => {
    setLoading(true);
    try {
      await NotificationTester.showScheduledNotifications();
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTests = async () => {
    setLoading(true);
    setTestStatus('Annulation des tests...');

    try {
      const cancelled = await NotificationTester.cancelAllTestNotifications();
      setTestStatus(`🗑️ ${cancelled} test(s) annulé(s)`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckPermissions = async () => {
    setLoading(true);
    try {
      await NotificationTester.checkPermissionStatus();
    } finally {
      setLoading(false);
    }
  };

  const handleResetCounter = async () => {
    setLoading(true);
    setTestStatus('Réinitialisation du compteur...');
    try {
      await NotificationTester.resetTestCounter();
      setTestStatus('🔄 Compteur réinitialisé');
    } finally {
      setLoading(false);
    }
  };

  const TestButton = ({ 
    title, 
    subtitle, 
    icon, 
    onPress, 
    color = Colors.primary,
    disabled = false 
  }: {
    title: string;
    subtitle: string;
    icon: string;
    onPress: () => void;
    color?: string;
    disabled?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.testButton, { borderColor: color }, disabled && styles.disabledButton]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <View style={styles.buttonContent}>
        <Ionicons name={icon as any} size={24} color={color} />
        <View style={styles.buttonText}>
          <Text style={[styles.buttonTitle, { color }]}>{title}</Text>
          <Text style={styles.buttonSubtitle}>{subtitle}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Ionicons name="notifications" size={48} color={Colors.primary} />
        <Text style={styles.title}>🧪 Test des Notifications Push</Text>
        <Text style={styles.subtitle}>
          Testez les notifications push réelles sur votre Infinix Smart HD
        </Text>
        {userName && (
          <Text style={styles.userInfo}>👤 Utilisateur : {userName}</Text>
        )}
      </View>

      {testStatus ? (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{testStatus}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚀 Tests Principaux</Text>
        
        <TestButton
          title="Test Complet (5 min)"
          subtitle="2 notifications dans 5 minutes"
          icon="time"
          onPress={handleScheduleTests}
          color={Colors.primary}
        />

        <TestButton
          title="Test Immédiat (10 sec)"
          subtitle="Rappel d'irrigation dans 10 secondes"
          icon="flash"
          onPress={handleImmediateTest}
          color="#FF6B35"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔧 Outils de Diagnostic</Text>
        
        <TestButton
          title="Vérifier Permissions"
          subtitle="Statut des autorisations"
          icon="shield-checkmark"
          onPress={handleCheckPermissions}
          color="#4CAF50"
        />

        <TestButton
          title="Voir Programmées"
          subtitle="Notifications en attente"
          icon="list"
          onPress={handleShowScheduled}
          color="#2196F3"
        />

        <TestButton
          title="Annuler Tests"
          subtitle="Supprimer tous les tests"
          icon="trash"
          onPress={handleCancelTests}
          color="#F44336"
        />

        <TestButton
          title="Réinitialiser Compteur"
          subtitle="Remettre à zéro les tests"
          icon="refresh"
          onPress={handleResetCounter}
          color="#9C27B0"
        />
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Traitement en cours...</Text>
        </View>
      )}

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>📱 Instructions :</Text>
        <Text style={styles.instructionsText}>
          1. Assurez-vous que les notifications sont activées{'\n'}
          2. Gardez votre téléphone à portée de main{'\n'}
          3. Les notifications apparaîtront même si l'app est fermée{'\n'}
          4. Vérifiez le son et les vibrations
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  userInfo: {
    fontSize: 14,
    color: Colors.primary,
    marginTop: 10,
    fontWeight: '600',
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  testButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  buttonText: {
    marginLeft: 15,
    flex: 1,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  instructions: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginTop: 10,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
