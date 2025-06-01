import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../utils/i18n';

export default function AIInsightsScreen() {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    if (!currentUser) {
      router.replace('/(public)/login');
      return;
    }

    // Simuler le chargement des insights IA
    setTimeout(() => {
      setInsights([
        {
          id: 1,
          title: 'Optimisation de l\'irrigation',
          description: 'Basé sur vos données, vous pourriez économiser 15% d\'eau en ajustant vos horaires d\'arrosage.',
          type: 'water-saving',
          priority: 'high'
        },
        {
          id: 2,
          title: 'Prévision météo',
          description: 'Pluie prévue dans 2 jours. Réduisez l\'irrigation de 30% aujourd\'hui.',
          type: 'weather',
          priority: 'medium'
        }
      ]);
      setLoading(false);
    }, 1500);
  }, [currentUser]);

  const renderInsight = (insight: any) => (
    <View key={insight.id} style={styles.insightCard}>
      <View style={styles.insightHeader}>
        <Ionicons
          name={insight.type === 'water-saving' ? 'water' : 'cloud'}
          size={24}
          color={Colors.primary}
        />
        <Text style={styles.insightTitle}>{insight.title}</Text>
      </View>
      <Text style={styles.insightDescription}>{insight.description}</Text>
      <View style={[styles.priorityBadge,
        insight.priority === 'high' ? styles.highPriority : styles.mediumPriority
      ]}>
        <Text style={styles.priorityText}>
          {insight.priority === 'high' ? 'Priorité élevée' : 'Priorité moyenne'}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Analyse des données en cours...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conseils IA</Text>
        <View style={styles.headerRight} />
      </LinearGradient>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Recommandations personnalisées</Text>

        {insights.map(renderInsight)}

        <TouchableOpacity style={styles.refreshButton} onPress={() => setLoading(true)}>
          <Ionicons name="refresh" size={20} color={Colors.white} />
          <Text style={styles.refreshButtonText}>Actualiser les conseils</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 40,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  insightCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 8,
  },
  insightDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  highPriority: {
    backgroundColor: Colors.danger,
  },
  mediumPriority: {
    backgroundColor: Colors.warning,
  },
  priorityText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: 'bold',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  refreshButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});