import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';

/**
 * QuickFineTuneButton
 * Component for quickly creating a fine-tuned AI model
 * Can be placed anywhere (book details, character lists, etc.)
 */
const QuickFineTuneButton = ({
  type, // 'author' or 'character'
  entityName,
  description,
  bookInfo, // { title, author, bookId }
  onSuccess,
  style,
}) => {
  const [creating, setCreating] = useState(false);

  /**
   * Handle quick fine-tune creation
   */
  const handleQuickFineTune = async () => {
    Alert.alert(
      `Create AI ${type === 'author' ? 'Author' : 'Character'}`,
      `Create an AI version of ${entityName} that you can chat with? Training takes about 5-10 minutes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: createFineTune,
          style: 'default',
        },
      ]
    );
  };

  /**
   * Create the fine-tuned model
   */
  const createFineTune = async () => {
    try {
      setCreating(true);

      const response = await api.post('/fine-tune/quick', {
        type,
        entityName,
        description,
        bookInfo: {
          title: bookInfo.title,
          author: bookInfo.author,
          description: bookInfo.description,
        },
        bookId: bookInfo.bookId,
      });

      if (response.data.success) {
        Alert.alert(
          'AI Model Creating',
          `Your AI ${type} is being trained! This usually takes 5-10 minutes. You can start chatting once it's ready.`,
          [
            { text: 'OK' },
            {
              text: 'View Models',
              onPress: () => onSuccess?.(response.data.model),
            },
          ]
        );
      } else if (response.data.message === 'Model already exists') {
        Alert.alert(
          'Already Exists',
          `An AI model for ${entityName} already exists. Would you like to chat with it?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Chat Now',
              onPress: () => onSuccess?.(response.data.model),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Quick fine-tune error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to create AI model. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, creating && styles.buttonDisabled, style]}
      onPress={handleQuickFineTune}
      disabled={creating}
    >
      {creating ? (
        <>
          <ActivityIndicator size="small" color={COLORS.white} />
          <Text style={styles.buttonText}>Creating...</Text>
        </>
      ) : (
        <>
          <Ionicons name="sparkles" size={20} color={COLORS.white} />
          <Text style={styles.buttonText}>
            Create AI {type === 'author' ? 'Author' : 'Character'}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

/**
 * Compact version for inline use
 */
export const QuickFineTuneIconButton = ({
  type,
  entityName,
  description,
  bookInfo,
  onSuccess,
  style,
}) => {
  const [creating, setCreating] = useState(false);

  const createFineTune = async () => {
    try {
      setCreating(true);

      const response = await api.post('/fine-tune/quick', {
        type,
        entityName,
        description,
        bookInfo: {
          title: bookInfo.title,
          author: bookInfo.author,
          description: bookInfo.description,
        },
        bookId: bookInfo.bookId,
      });

      if (response.data.success) {
        Alert.alert(
          'AI Model Creating',
          `Training ${entityName}... Ready in 5-10 minutes.`,
          [{ text: 'OK' }]
        );
        onSuccess?.(response.data.model);
      } else if (response.data.message === 'Model already exists') {
        onSuccess?.(response.data.model);
      }
    } catch (error) {
      console.error('Quick fine-tune error:', error);
      Alert.alert('Error', 'Failed to create AI model');
    } finally {
      setCreating(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.iconButton, style]}
      onPress={createFineTune}
      disabled={creating}
    >
      {creating ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : (
        <Ionicons name="sparkles-outline" size={24} color={COLORS.primary} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 24,
    gap: SPACING.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
    marginLeft: SPACING.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default QuickFineTuneButton;
