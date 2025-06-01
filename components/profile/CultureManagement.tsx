import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { CultureData } from '../../types/culture';
import userService from '../../services/user.service';
import { useAuth } from '../../contexts/AuthContext';

interface CultureManagementProps {
  cultures: CultureData[];
  onCulturesUpdate: () => void;
}

export default function CultureManagement({ cultures, onCulturesUpdate }: CultureManagementProps) {
  const { currentUser } = useAuth();
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedCulture, setSelectedCulture] = useState<CultureData | null>(null);
  const [newCulture, setNewCulture] = useState({
    name: '',
    soilType: 'Sablonneux',
    area: '',
    plantingDate: new Date().toISOString().split('T')[0],
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleAddCulture = async () => {
    if (!currentUser?.uid) {
      Alert.alert('Erreur', 'Vous devez être connecté pour ajouter une culture');
      return;
    }

    if (!newCulture.name || !newCulture.area) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsLoading(true);
    try {
      const cultureToAdd: CultureData = {
        id: `${newCulture.name.toLowerCase()}-${Date.now()}`,
        name: newCulture.name as 'Tomate' | 'Laitue' | 'Maïs',
        soilType: newCulture.soilType as 'Sablonneux' | 'Argileux' | 'Limoneux',
        area: Number(newCulture.area),
        plantingDate: newCulture.plantingDate,
      };

      await userService.addUserCulture(currentUser.uid, cultureToAdd);
      setIsAddModalVisible(false);
      setNewCulture({
        name: '',
        soilType: 'Sablonneux',
        area: '',
        plantingDate: new Date().toISOString().split('T')[0],
      });
      onCulturesUpdate();
      Alert.alert('Succès', 'Culture ajoutée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la culture:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter la culture');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCulture = async () => {
    if (!currentUser?.uid || !selectedCulture) {
      Alert.alert('Erreur', 'Impossible de supprimer la culture');
      return;
    }

    setIsLoading(true);
    try {
      await userService.deleteUserCulture(currentUser.uid, selectedCulture.id);
      setIsDeleteModalVisible(false);
      setSelectedCulture(null);
      onCulturesUpdate();
      Alert.alert('Succès', 'Culture supprimée avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression de la culture:', error);
      Alert.alert('Erreur', 'Impossible de supprimer la culture');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestion des Cultures</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAddModalVisible(true)}
        >
          <Ionicons name="add-circle" size={24} color={Colors.white} />
          <Text style={styles.addButtonText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.culturesList}>
        {cultures.map((culture) => (
          <View key={culture.id} style={styles.cultureItem}>
            <View style={styles.cultureInfo}>
              <Text style={styles.cultureName}>{culture.name}</Text>
              <Text style={styles.cultureDetails}>
                Sol: {culture.soilType} • Surface: {culture.area}m²
              </Text>
              <Text style={styles.cultureDetails}>
                Planté le: {new Date(culture.plantingDate).toLocaleDateString()}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => {
                setSelectedCulture(culture);
                setIsDeleteModalVisible(true);
              }}
            >
              <Ionicons name="trash-outline" size={24} color={Colors.error} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Modal d'ajout de culture */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter une culture</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Nom de la culture"
              value={newCulture.name}
              onChangeText={(text) => setNewCulture({ ...newCulture, name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Surface (m²)"
              value={newCulture.area}
              onChangeText={(text) => setNewCulture({ ...newCulture, area: text })}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Date de plantation"
              value={newCulture.plantingDate}
              onChangeText={(text) => setNewCulture({ ...newCulture, plantingDate: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsAddModalVisible(false)}
                disabled={isLoading}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddCulture}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.modalButtonText}>Ajouter</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal
        visible={isDeleteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Supprimer la culture</Text>
            <Text style={styles.modalText}>
              Êtes-vous sûr de vouloir supprimer cette culture ? Cette action est irréversible.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsDeleteModalVisible(false)}
                disabled={isLoading}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteModalButton]}
                onPress={handleDeleteCulture}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.modalButtonText}>Supprimer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.darkGray,
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 90,
    justifyContent: 'center',
  },
  addButtonText: {
    color: Colors.white,
    marginLeft: 4,
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
  },
  culturesList: {
    maxHeight: 300,
  },
  cultureItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    marginBottom: 8,
    minHeight: 80,
  },
  cultureInfo: {
    flex: 1,
    marginRight: 12,
  },
  cultureName: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: Colors.darkGray,
    marginBottom: 4,
  },
  cultureDetails: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: Colors.darkGray,
    marginBottom: 2,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: Colors.darkGray,
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    color: Colors.darkGray,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontFamily: 'Montserrat-Regular',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    marginLeft: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.lightGray,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  deleteModalButton: {
    backgroundColor: Colors.error,
  },
  modalButtonText: {
    color: Colors.white,
    fontFamily: 'Montserrat-Medium',
  },
}); 