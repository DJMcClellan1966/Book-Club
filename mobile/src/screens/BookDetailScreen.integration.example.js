/**
 * Integration Example: Add AI Chat to BookDetailScreen
 * 
 * This file shows how to integrate the AI Character Chat feature
 * into your existing BookDetailScreen.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QuickFineTuneButton from '../components/QuickFineTuneButton';
import api from '../services/api';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';

// ADD THIS SECTION TO YOUR EXISTING BookDetailScreen

/**
 * 1. Import the QuickFineTuneButton component at the top
 */
// import QuickFineTuneButton from '../components/QuickFineTuneButton';

/**
 * 2. Add state for tracking AI models
 */
const [aiModels, setAiModels] = useState([]);
const [loadingModels, setLoadingModels] = useState(false);

/**
 * 3. Load existing AI models for this book
 */
useEffect(() => {
  if (book?.id) {
    loadAIModels();
  }
}, [book?.id]);

const loadAIModels = async () => {
  try {
    setLoadingModels(true);
    const response = await api.get('/fine-tune/models', {
      params: { bookId: book.id }
    });
    setAiModels(response.data.models || []);
  } catch (error) {
    console.error('Error loading AI models:', error);
  } finally {
    setLoadingModels(false);
  }
};

/**
 * 4. Handler for navigating to AI chat
 */
const handleChatWithAuthor = (model) => {
  navigation.navigate('CharacterChat', {
    modelId: model.id,
    entityName: model.entity_name,
    entityType: 'author',
    bookTitle: book.title
  });
};

const handleViewAllModels = () => {
  navigation.navigate('AIModels', {
    bookId: book.id
  });
};

/**
 * 5. Render AI Chat Section
 * Add this in your render method, after book details
 */
const renderAIChatSection = () => {
  if (!book) return null;

  const authorModel = aiModels.find(m => m.type === 'author');
  const characterModels = aiModels.filter(m => m.type === 'character');

  return (
    <View style={styles.aiChatSection}>
      <View style={styles.sectionHeader}>
        <Ionicons name="sparkles" size={24} color={COLORS.accent} />
        <Text style={styles.sectionTitle}>AI Chat</Text>
      </View>

      {/* Chat with Author */}
      <View style={styles.aiCard}>
        <View style={styles.aiCardHeader}>
          <Ionicons name="create" size={20} color={COLORS.primary} />
          <Text style={styles.aiCardTitle}>Chat with the Author</Text>
        </View>
        
        {authorModel ? (
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => handleChatWithAuthor(authorModel)}
          >
            <Ionicons name="chatbubbles" size={20} color={COLORS.white} />
            <Text style={styles.chatButtonText}>Chat with {book.author}</Text>
          </TouchableOpacity>
        ) : (
          <QuickFineTuneButton
            type="author"
            entityName={book.author}
            description={book.description}
            bookInfo={{
              title: book.title,
              author: book.author,
              description: book.description,
              bookId: book.id
            }}
            onSuccess={(model) => {
              setAiModels([...aiModels, model]);
              handleChatWithAuthor(model);
            }}
          />
        )}
        
        <Text style={styles.aiDescription}>
          Ask about their writing process, inspirations, and themes
        </Text>
      </View>

      {/* Chat with Characters */}
      {characterModels.length > 0 && (
        <View style={styles.aiCard}>
          <View style={styles.aiCardHeader}>
            <Ionicons name="people" size={20} color={COLORS.primary} />
            <Text style={styles.aiCardTitle}>Chat with Characters</Text>
          </View>
          
          {characterModels.slice(0, 3).map(model => (
            <TouchableOpacity
              key={model.id}
              style={styles.characterButton}
              onPress={() => navigation.navigate('CharacterChat', {
                modelId: model.id,
                entityName: model.entity_name,
                entityType: 'character',
                bookTitle: book.title
              })}
            >
              <Text style={styles.characterName}>{model.entity_name}</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
            </TouchableOpacity>
          ))}
          
          {characterModels.length > 3 && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={handleViewAllModels}
            >
              <Text style={styles.viewAllText}>
                View all {characterModels.length} characters
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* View All Models Link */}
      <TouchableOpacity
        style={styles.viewAllModelsLink}
        onPress={handleViewAllModels}
      >
        <Ionicons name="list" size={20} color={COLORS.primary} />
        <Text style={styles.viewAllModelsText}>View All AI Models</Text>
        <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );
};

/**
 * 6. Add to your main ScrollView
 */
// <ScrollView style={styles.container}>
//   {/* ... existing book details ... */}
//   
//   {renderAIChatSection()}  {/* ADD THIS */}
//   
//   {/* ... rest of your content ... */}
// </ScrollView>

/**
 * 7. Add these styles to your StyleSheet
 */
const aiChatStyles = StyleSheet.create({
  aiChatSection: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.lightBackground,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  aiCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  aiCardTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  aiDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.mediumGray,
    marginTop: SPACING.sm,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 24,
    marginVertical: SPACING.sm,
  },
  chatButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
    marginLeft: SPACING.sm,
  },
  characterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  characterName: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    marginTop: SPACING.sm,
  },
  viewAllText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
  },
  viewAllModelsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  viewAllModelsText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    marginHorizontal: SPACING.sm,
  },
});

/**
 * ALTERNATIVE: Simple Menu Option Integration
 * 
 * If you prefer a menu approach instead of a dedicated section:
 */

const showBookMenu = () => {
  Alert.alert(
    book.title,
    'Choose an action',
    [
      { text: 'Add to Reading List', onPress: handleAddToList },
      { text: 'Write Review', onPress: handleWriteReview },
      { text: '💬 Chat with Author', onPress: handleQuickCreateAuthor }, // NEW
      { text: '🎭 Browse AI Models', onPress: handleViewAllModels }, // NEW
      { text: 'Cancel', style: 'cancel' },
    ]
  );
};

const handleQuickCreateAuthor = async () => {
  try {
    const response = await api.post('/fine-tune/quick', {
      type: 'author',
      entityName: book.author,
      description: book.description,
      bookInfo: {
        title: book.title,
        author: book.author,
        description: book.description,
      },
      bookId: book.id,
    });

    if (response.data.success) {
      Alert.alert(
        'AI Author Created',
        `Training ${book.author}... Ready in 5-10 minutes.`,
        [
          { text: 'OK' },
          {
            text: 'Chat Now',
            onPress: () => handleChatWithAuthor(response.data.model)
          }
        ]
      );
    }
  } catch (error) {
    console.error('Error creating author:', error);
    Alert.alert('Error', 'Failed to create AI author');
  }
};

/**
 * ALTERNATIVE: Floating Action Button (FAB)
 * 
 * Add a floating button for quick access:
 */

const renderAIFab = () => (
  <TouchableOpacity
    style={styles.aiFab}
    onPress={() => Alert.alert(
      'AI Chat',
      'What would you like to do?',
      [
        {
          text: 'Chat with Author',
          onPress: handleQuickCreateAuthor
        },
        {
          text: 'Browse AI Models',
          onPress: handleViewAllModels
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    )}
  >
    <Ionicons name="sparkles" size={24} color={COLORS.white} />
  </TouchableOpacity>
);

const fabStyles = StyleSheet.create({
  aiFab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

// Then in your render:
// return (
//   <View style={styles.container}>
//     <ScrollView>
//       {/* ... your content ... */}
//     </ScrollView>
//     {renderAIFab()}  {/* ADD THIS */}
//   </View>
// );

export {
  renderAIChatSection,
  renderAIFab,
  aiChatStyles,
  fabStyles
};
