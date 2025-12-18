import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../constants';

const SpaceDetailScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.centered}>
        <Text style={styles.text}>Space Detail</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { ...TYPOGRAPHY.h3 },
});

export default SpaceDetailScreen;
