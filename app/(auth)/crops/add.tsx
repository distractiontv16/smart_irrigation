import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function AddCrop() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Ajouter une culture' }} />
      <Text>Formulaire d'ajout de culture</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
}); 