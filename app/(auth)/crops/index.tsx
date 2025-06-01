import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function CropsList() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Mes cultures' }} />
      <Text>Liste des cultures</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
}); 