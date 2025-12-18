import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';

const SpacesScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.centered}>
        <Ionicons name="people-outline" size={64} color={COLORS.textSecondary} />
        <Text style={styles.emptyText}>Spaces Coming Soon</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  emptyText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, marginTop: SPACING.md },
});

export default SpacesScreen;
