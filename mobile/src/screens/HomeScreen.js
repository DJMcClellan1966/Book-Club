import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { booksAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentBooks, setRecentBooks] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [booksRes, recsRes] = await Promise.all([
        booksAPI.getAll({ limit: 5 }),
        usersAPI.getRecommendations(),
      ]);
      setRecentBooks(booksRes.data.books || []);
      setRecommendations(recsRes.data.recommendations || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderBookItem = ({ item }) => (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() => navigation.navigate('BookDetail', { bookId: item._id })}
    >
      <View style={styles.bookIcon}>
        <Ionicons name="book" size={30} color={COLORS.primary} />
      </View>
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>
          {item.author}
        </Text>
        <View style={styles.bookMeta}>
          <Ionicons name="star" size={14} color={COLORS.warning} />
          <Text style={styles.bookRating}>{item.averageRating?.toFixed(1) || 'N/A'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListHeaderComponent={
        <>
          <View style={styles.welcome}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.welcomeName}>{user?.username}! 👋</Text>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Books')}
            >
              <Ionicons name="book-outline" size={24} color={COLORS.primary} />
              <Text style={styles.actionText}>Browse Books</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Forums')}
            >
              <Ionicons name="chatbubbles-outline" size={24} color={COLORS.secondary} />
              <Text style={styles.actionText}>Forums</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('ProfileMain', { screen: 'AIChats' })}
            >
              <Ionicons name="sparkles-outline" size={24} color={COLORS.info} />
              <Text style={styles.actionText}>AI Chats</Text>
            </TouchableOpacity>
          </View>

          {recommendations.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>🎯 Recommended for You</Text>
              <Text style={styles.sectionSubtitle}>Based on your reading history</Text>
            </>
          )}
        </>
      }
      data={recommendations.length > 0 ? recommendations : recentBooks}
      renderItem={renderBookItem}
      keyExtractor={(item) => item._id}
      ListFooterComponent={
        <TouchableOpacity
          style={styles.seeMore}
          onPress={() => navigation.navigate('Books')}
        >
          <Text style={styles.seeMoreText}>See All Books</Text>
          <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcome: {
    marginBottom: SPACING.lg,
  },
  welcomeText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  welcomeName: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionText: {
    marginTop: SPACING.xs,
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookIcon: {
    width: 60,
    height: 80,
    backgroundColor: COLORS.light,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  bookAuthor: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  bookMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookRating: {
    ...TYPOGRAPHY.small,
    color: COLORS.text,
    marginLeft: SPACING.xs,
  },
  seeMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  seeMoreText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
    marginRight: SPACING.xs,
  },
});

export default HomeScreen;
