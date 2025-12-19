import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { readerConnectionAPI } from '../services/supabase';
import { useAuth } from '../context/AuthContext.supabase';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../constants';

const BookReadersScreen = ({ route, navigation }) => {
  const { bookId, bookTitle } = route.params;
  const { user } = useAuth();
  const [readers, setReaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReaders();
  }, []);

  const loadReaders = async () => {
    try {
      const data = await readerConnectionAPI.getBookReaders(bookId);
      // Filter out current user
      setReaders(data.filter(r => r.id !== user?.id));
    } catch (error) {
      console.error('Error loading readers:', error);
      Alert.alert('Error', 'Failed to load readers');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (reader) => {
    try {
      const space = await readerConnectionAPI.startDirectMessage(reader.id);
      navigation.navigate('Spaces');
      // Navigate to the specific space/chat
      setTimeout(() => {
        navigation.navigate('SpaceDetail', { spaceId: space.id });
      }, 100);
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'Failed to start chat');
    }
  };

  const handleCreateForum = () => {
    Alert.prompt(
      'Create Forum',
      `Create a discussion forum about "${bookTitle}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async (title) => {
            if (title) {
              try {
                await readerConnectionAPI.createBookForum(
                  bookId,
                  title,
                  `Discussion about ${bookTitle}`
                );
                Alert.alert('Success', 'Forum created!', [
                  { text: 'OK', onPress: () => navigation.navigate('Forums') }
                ]);
              } catch (error) {
                Alert.alert('Error', 'Failed to create forum');
              }
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const getStatusBadge = (status) => {
    const badges = {
      'reading': { text: '📖 Reading', color: COLORS.info },
      'completed': { text: '✓ Read', color: COLORS.success },
      'want_to_read': { text: '💫 Want to Read', color: COLORS.warning },
      'reviewed': { text: '⭐ Reviewed', color: COLORS.accent },
    };
    return badges[status] || badges.reading;
  };

  const renderReader = ({ item }) => {
    const badge = getStatusBadge(item.status);
    
    return (
      <View style={styles.readerCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={32} color={COLORS.primary} />
        </View>
        
        <View style={styles.readerInfo}>
          <Text style={styles.username}>{item.username}</Text>
          {item.bio && (
            <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>
          )}
          <View style={styles.statusBadge}>
            <Text style={[styles.statusText, { color: badge.color }]}>
              {badge.text}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => handleStartChat(item)}
        >
          <Ionicons name="chatbubble-ellipses" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Readers of "{bookTitle}"</Text>
        <Text style={styles.subtitle}>Connect with {readers.length} other readers</Text>
      </View>

      <TouchableOpacity style={styles.createForumButton} onPress={handleCreateForum}>
        <Ionicons name="people" size={20} color={COLORS.white} />
        <Text style={styles.createForumText}>Create Discussion Forum</Text>
      </TouchableOpacity>

      {readers.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No other readers yet</Text>
          <Text style={styles.emptySubtext}>Be the first to add this book!</Text>
        </View>
      ) : (
        <FlatList
          data={readers}
          renderItem={renderReader}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    fontWeight: '700',
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  createForumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: 12,
    ...SHADOWS.md,
  },
  createForumText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
    marginLeft: SPACING.sm,
  },
  list: {
    padding: SPACING.md,
  },
  readerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  readerInfo: {
    flex: 1,
  },
  username: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    fontWeight: '600',
  },
  bio: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  statusBadge: {
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
});

export default BookReadersScreen;
