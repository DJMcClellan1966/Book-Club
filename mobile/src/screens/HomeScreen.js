import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext.supabase';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../constants';

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.welcome}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.welcomeName}>{user?.username}! 👋</Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Books')}
        >
          <Ionicons name="book-outline" size={32} color={COLORS.primary} />
          <Text style={styles.actionText}>Browse Books</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Forums')}
        >
          <Ionicons name="chatbubbles-outline" size={32} color={COLORS.secondary} />
          <Text style={styles.actionText}>Forums</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Profile', { screen: 'AIChats' })}
        >
          <Ionicons name="sparkles-outline" size={32} color={COLORS.info} />
          <Text style={styles.actionText}>AI Chats</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.exploreSection}>
        <Text style={styles.sectionTitle}>📚 Start Exploring</Text>
        <Text style={styles.sectionSubtitle}>
          Browse thousands of books, connect with readers, and chat with AI literary characters
        </Text>
        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => navigation.navigate('Books')}
        >
          <Text style={styles.exploreButtonText}>Explore Library</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  welcome: {
    marginBottom: SPACING.xl,
  },
  welcomeText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  welcomeName: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 32,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 16,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  actionText: {
    marginTop: SPACING.sm,
    fontSize: 13,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  exploreSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: 16,
    ...SHADOWS.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  exploreButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  exploreButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default HomeScreen;
