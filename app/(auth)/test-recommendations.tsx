import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RecommendationsTester from '@/components/tools/RecommendationsTester';

/**
 * Écran de test pour le débogage et la validation des recommandations
 * Permet de simuler différents scénarios et paramètres
 */
export default function TestRecommendationsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <RecommendationsTester />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
}); 