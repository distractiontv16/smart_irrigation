import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';

export default function CropDetailScreen() {
  const { cropId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [crop, setCrop] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      setCrop({
        id: cropId,
        name: 'Maïs Nord',
        type: 'Maïs',
        area: 2.5,
        status: 'active'
      });
      setLoading(false);
    }, 1000);
  }, [cropId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de la Culture</Text>
        <View style={styles.headerRight} />
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cropName}>{crop?.name}</Text>
          <Text style={styles.cropType}>{crop?.type}</Text>
          <Text style={styles.cropArea}>{crop?.area} hectares</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: Colors.text },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, paddingTop: 40 },
  backButton: { padding: 8 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', color: Colors.white, textAlign: 'center' },
  headerRight: { width: 40 },
  content: { flex: 1, padding: 16 },
  card: { backgroundColor: Colors.white, borderRadius: 12, padding: 16 },
  cropName: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
  cropType: { fontSize: 16, color: Colors.textSecondary, marginTop: 4 },
  cropArea: { fontSize: 16, color: Colors.text, marginTop: 8 },
});