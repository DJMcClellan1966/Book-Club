import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';

const BookDetailScreen = ({ route }) => {
  const { bookId } = route.params;
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.bookIcon}>
          <Ionicons name="book" size={60} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Book Title</Text>
        <Text style={styles.author}>Author Name</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>Book description will appear here...</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.button}>
          <Ionicons name="add-circle-outline" size={24} color={COLORS.white} />
          <Text style={styles.buttonText}>Add to Reading List</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { alignItems: 'center', padding: SPACING.xl, backgroundColor: COLORS.white },
  bookIcon: { width: 120, height: 160, backgroundColor: COLORS.light, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  title: { ...TYPOGRAPHY.h2, textAlign: 'center', marginBottom: SPACING.xs },
  author: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  section: { padding: SPACING.lg, backgroundColor: COLORS.white, marginTop: SPACING.md },
  sectionTitle: { ...TYPOGRAPHY.h3, marginBottom: SPACING.md },
  description: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, lineHeight: 24 },
  actions: { padding: SPACING.lg },
  button: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: SPACING.md, borderRadius: 8 },
  buttonText: { color: COLORS.white, marginLeft: SPACING.sm, fontWeight: '600' },
});

export default BookDetailScreen;
