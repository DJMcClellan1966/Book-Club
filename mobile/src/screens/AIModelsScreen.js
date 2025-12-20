import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';

/**
 * AIModelsScreen
 * Browse available fine-tuned AI models for authors and characters
 * Launch quick fine-tune for new entities
 */
const AIModelsScreen = ({ navigation }) => {
  const { user } = useAuth();
  
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'author', 'character'

  useEffect(() => {
    loadModels();
  }, [filter]);

  /**
   * Load available AI models
   */
  const loadModels = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { type: filter } : {};
      const response = await api.get('/fine-tune/models', { params });
      setModels(response.data.models || []);
    } catch (error) {
      console.error('Error loading models:', error);
      Alert.alert('Error', 'Failed to load AI models');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Refresh models list
   */
  const handleRefresh = () => {
    setRefreshing(true);
    loadModels();
  };

  /**
   * Navigate to chat with model
   */
  const openChat = (model) => {
    if (model.status !== 'completed' && model.status !== 'ready') {
      Alert.alert(
        'Model Not Ready',
        `This AI model is currently ${model.status}. Training typically takes 20-40 minutes.`,
        [
          { text: 'OK' },
          {
            text: 'Chat Anyway',
            onPress: () => navigateToChat(model),
            style: 'default'
          }
        ]
      );
      return;
    }

    navigateToChat(model);
  };

  /**
   * Navigate to chat screen
   */
  const navigateToChat = (model) => {
    navigation.navigate('CharacterChat', {
      modelId: model.id,
      entityName: model.entity_name,
      entityType: model.type,
      bookTitle: model.books?.title || 'Unknown Book',
    });
  };

  /**
   * Get status badge color
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'ready':
        return COLORS.success;
      case 'training':
        return COLORS.warning;
      case 'pending':
        return COLORS.mediumGray;
      case 'failed':
        return COLORS.error;
      default:
        return COLORS.lightGray;
    }
  };

  /**
   * Get status display text
   */
  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
      case 'ready':
        return 'Ready';
      case 'training':
        return 'Training...';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  /**
   * Render individual model card
   */
  const renderModel = ({ item }) => {
    const isReady = item.status === 'completed' || item.status === 'ready';
    const statusColor = getStatusColor(item.status);
    
    return (
      <TouchableOpacity
        style={styles.modelCard}
        onPress={() => openChat(item)}
      >
        <View style={styles.modelHeader}>
          <View style={styles.modelIcon}>
            <Ionicons
              name={item.type === 'author' ? 'create' : 'person'}
              size={24}
              color={COLORS.primary}
            />
          </View>
          
          <View style={styles.modelInfo}>
            <Text style={styles.modelName}>{item.entity_name}</Text>
            <Text style={styles.modelBook}>
              {item.books?.title || 'Unknown Book'}
            </Text>
            {item.books?.author && (
              <Text style={styles.modelAuthor}>by {item.books.author}</Text>
            )}
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        {item.chat_count > 0 && (
          <View style={styles.modelStats}>
            <Ionicons name="chatbubbles-outline" size={14} color={COLORS.mediumGray} />
            <Text style={styles.statsText}>{item.chat_count} conversations</Text>
          </View>
        )}

        {!isReady && item.status === 'training' && (
          <View style={styles.trainingInfo}>
            <ActivityIndicator size="small" color={COLORS.warning} />
            <Text style={styles.trainingText}>
              Training in progress... Usually takes 20-40 min
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  /**
   * Render filter buttons
   */
  const renderFilters = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
        onPress={() => setFilter('all')}
      >
        <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
          All
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.filterButton, filter === 'author' && styles.filterButtonActive]}
        onPress={() => setFilter('author')}
      >
        <Ionicons
          name="create"
          size={16}
          color={filter === 'author' ? COLORS.white : COLORS.primary}
          style={styles.filterIcon}
        />
        <Text style={[styles.filterText, filter === 'author' && styles.filterTextActive]}>
          Authors
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.filterButton, filter === 'character' && styles.filterButtonActive]}
        onPress={() => setFilter('character')}
      >
        <Ionicons
          name="person"
          size={16}
          color={filter === 'character' ? COLORS.white : COLORS.primary}
          style={styles.filterIcon}
        />
        <Text style={[styles.filterText, filter === 'character' && styles.filterTextActive]}>
          Characters
        </Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Render empty state
   */
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color={COLORS.lightGray} />
      <Text style={styles.emptyTitle}>No AI Models Yet</Text>
      <Text style={styles.emptyText}>
        Create fine-tuned AI models for authors and characters from your favorite books.
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('Books')}
      >
        <Ionicons name="add-circle" size={20} color={COLORS.white} />
        <Text style={styles.createButtonText}>Browse Books</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading AI models...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderFilters()}

      <FlatList
        data={models}
        renderItem={renderModel}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContainer,
          models.length === 0 && styles.listContainerEmpty
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={renderEmpty}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => Alert.alert(
          'Create AI Model',
          'To create a new AI model, go to a book detail page and select "Chat with Author" or add a character and select "Chat with Character".',
          [{ text: 'Got it' }]
        )}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    marginTop: SPACING.md,
    color: COLORS.mediumGray,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 20,
    backgroundColor: COLORS.lightBackground,
    marginRight: SPACING.sm,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterIcon: {
    marginRight: SPACING.xs,
  },
  filterText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: COLORS.white,
  },
  listContainer: {
    padding: SPACING.md,
  },
  listContainerEmpty: {
    flex: 1,
  },
  modelCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modelIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.lightBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  modelInfo: {
    flex: 1,
  },
  modelName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  modelBook: {
    ...TYPOGRAPHY.body,
    color: COLORS.mediumGray,
  },
  modelAuthor: {
    ...TYPOGRAPHY.caption,
    color: COLORS.lightGray,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: 12,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '600',
  },
  modelStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statsText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.mediumGray,
    marginLeft: SPACING.xs,
  },
  trainingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  trainingText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.mediumGray,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 24,
  },
  createButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
    marginLeft: SPACING.sm,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default AIModelsScreen;
