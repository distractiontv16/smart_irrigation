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
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../utils/i18n';

const { width } = Dimensions.get('window');

interface Crop {
  id: string;
  name: string;
  type: string;
  plantingDate: string;
  area: number;
  soilType: string;
  status: 'active' | 'harvested' | 'planning';
  progress: number;
}

export default function CropsScreen() {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [crops, setCrops] = useState<Crop[]>([]);

  useEffect(() => {
    if (!currentUser) {
      router.replace('/(public)/login');
      return;
    }

    // Simuler le chargement des cultures
    setTimeout(() => {
      setCrops([
        {
          id: '1',
          name: 'Maïs Nord',
          type: 'Maïs',
          plantingDate: '2024-03-15',
          area: 2.5,
          soilType: 'Argileux',
          status: 'active',
          progress: 65
        },
        {
          id: '2',
          name: 'Tomates Serre 1',
          type: 'Tomate',
          plantingDate: '2024-04-01',
          area: 0.8,
          soilType: 'Sableux',
          status: 'active',
          progress: 40
        },
        {
          id: '3',
          name: 'Manioc Sud',
          type: 'Manioc',
          plantingDate: '2024-02-10',
          area: 1.2,
          soilType: 'Limoneux',
          status: 'harvested',
          progress: 100
        }
      ]);
      setLoading(false);
    }, 1000);
  }, [currentUser]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return Colors.success;
      case 'harvested': return Colors.warning;
      case 'planning': return Colors.info;
      default: return Colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'En cours';
      case 'harvested': return 'Récolté';
      case 'planning': return 'Planifié';
      default: return status;
    }
  };

  const handleDeleteCrop = (cropId: string, cropName: string) => {
    Alert.alert(
      'Supprimer la culture',
      `Êtes-vous sûr de vouloir supprimer "${cropName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setCrops(prev => prev.filter(crop => crop.id !== cropId));
          }
        }
      ]
    );
  };

  const renderCrop = (crop: Crop) => (
    <TouchableOpacity
      key={crop.id}
      style={styles.cropCard}
      onPress={() => router.push(`/crops/${crop.id}`)}
    >
      <View style={styles.cropHeader}>
        <View style={styles.cropInfo}>
          <Text style={styles.cropName}>{crop.name}</Text>
          <Text style={styles.cropType}>{crop.type}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(crop.status) }]}>
          <Text style={styles.statusText}>{getStatusText(crop.status)}</Text>
        </View>
      </View>

      <View style={styles.cropDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>Planté le {new Date(crop.plantingDate).toLocaleDateString('fr-FR')}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="resize-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>{crop.area} hectares</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="earth-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>Sol {crop.soilType.toLowerCase()}</Text>
        </View>
      </View>

      {crop.status === 'active' && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progression</Text>
            <Text style={styles.progressValue}>{crop.progress}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${crop.progress}%` }]}
            />
          </View>
        </View>
      )}

      <View style={styles.cropActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/crops/${crop.id}?edit=true`)}
        >
          <Ionicons name="create-outline" size={20} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Modifier</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteCrop(crop.id, crop.name)}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.danger} />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Supprimer</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement des cultures...</Text>
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
        <Text style={styles.headerTitle}>Mes Cultures</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/crops/add')}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {crops.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="leaf-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyStateText}>Aucune culture enregistrée</Text>
            <Text style={styles.emptyStateSubtext}>
              Commencez par ajouter votre première culture
            </Text>
            <TouchableOpacity
              style={styles.addFirstCropButton}
              onPress={() => router.push('/crops/add')}
            >
              <Ionicons name="add" size={20} color={Colors.white} />
              <Text style={styles.addFirstCropButtonText}>Ajouter une culture</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{crops.filter(c => c.status === 'active').length}</Text>
                <Text style={styles.statLabel}>En cours</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{crops.reduce((sum, c) => sum + c.area, 0).toFixed(1)}</Text>
                <Text style={styles.statLabel}>Hectares</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{crops.filter(c => c.status === 'harvested').length}</Text>
                <Text style={styles.statLabel}>Récoltées</Text>
              </View>
            </View>

            {crops.map(renderCrop)}
          </>
        )}
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
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  cropCard: {
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
  cropHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cropInfo: {
    flex: 1,
  },
  cropName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  cropType: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: 'bold',
  },
  cropDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  cropActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: Colors.background,
  },
  actionButtonText: {
    fontSize: 14,
    color: Colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  deleteButtonText: {
    color: Colors.danger,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  addFirstCropButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstCropButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});