import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, API_URL } from '../constants';
import localDiaryService from '../services/localDiaryService';

const AddDiaryEntryScreen = ({ route, navigation }) => {
  const { book, entry, onSave, storageType = 'cloud' } = route.params;
  const { user } = useAuth();
  const [entryText, setEntryText] = useState('');
  const [loading, setLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const isEditing = !!entry;

  useEffect(() => {
    if (entry) {
      setEntryText(entry.entry_text);
      setCharCount(entry.entry_text.length);
    }
  }, [entry]);

  const handleTextChange = (text) => {
    setEntryText(text);
    setCharCount(text.length);
  };

  const handleSave = async () => {
    if (entryText.trim().length < 10) {
      Alert.alert('Too Short', 'Please write at least 10 characters for your diary entry.');
      return;
    }

    setLoading(true);

    try {
      if (storageType === 'local') {
        // Save to local storage
        if (isEditing) {
          await localDiaryService.updateEntry(entry.id, entryText.trim());
        } else {
          await localDiaryService.createEntry(book.id, entryText.trim(), {
            title: book.title,
            author: book.author
          });
        }
        
        Alert.alert(
          'Success',
          isEditing ? 'Diary entry updated!' : 'Diary entry saved locally!',
          [
            {
              text: 'OK',
              onPress: () => {
                if (onSave) onSave();
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        // Save to cloud
        const url = isEditing
          ? `${API_URL}/diary/${entry.id}`
          : `${API_URL}/diary`;
        
        const method = isEditing ? 'PUT' : 'POST';
        
        const body = isEditing
          ? { entryText: entryText.trim() }
          : { bookId: book.id, entryText: entryText.trim() };

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.access_token}`
          },
          body: JSON.stringify(body)
        });

        if (response.ok) {
          Alert.alert(
            'Success',
            isEditing ? 'Diary entry updated!' : 'Diary entry saved to cloud!',
            [
              {
                text: 'OK',
                onPress: () => {
                  if (onSave) onSave();
                  navigation.goBack();
                }
              }
            ]
          );
        } else {
          const error = await response.json();
          
          // Check if it's a limit error
          if (error.upgrade) {
            Alert.alert(
              'Diary Limit Reached',
              error.message + '\n\nTip: You can use Local storage for unlimited diaries on this device.',
              [
                { text: 'OK', style: 'cancel' },
                {
                  text: 'Upgrade',
                  onPress: () => navigation.navigate('Pricing')
                }
              ]
            );
          } else {
            Alert.alert('Error', error.message || 'Failed to save entry');
          }
        }
      }
    } catch (error) {
      console.error('Save entry error:', error);
      Alert.alert('Error', 'Failed to save entry');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (entryText.trim() && entryText !== (entry?.entry_text || '')) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: "Don't Leave", style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.bookTitle} numberOfLines={1}>{book.title}</Text>
          <Text style={styles.bookAuthor}>{book.author}</Text>
          <Text style={styles.storageLabel}>
            {storageType === 'cloud' ? '☁️ Cloud Synced' : '📱 Local Only'}
          </Text>
        </View>
        <Text style={styles.timestamp}>
          {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            {isEditing ? '✏️ Edit Your Entry' : '✍️ Write Your Thoughts'}
          </Text>
          <Text style={styles.subtitle}>
            Reflect on your reading experience, thoughts, emotions, or anything else about this book
          </Text>

          <TextInput
            style={styles.textInput}
            placeholder="Start writing your diary entry here..."
            placeholderTextColor={COLORS.textSecondary}
            value={entryText}
            onChangeText={handleTextChange}
            multiline
            textAlignVertical="top"
            autoFocus={!isEditing}
            maxLength={5000}
          />

          <View style={styles.charCounter}>
            <Text style={styles.charCountText}>
              {charCount} / 5000 characters
            </Text>
            {charCount < 10 && (
              <Text style={styles.warningText}>
                Minimum 10 characters
              </Text>
            )}
          </View>
        </View>

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Writing Tips:</Text>
          <Text style={styles.tipText}>• What are you enjoying or struggling with?</Text>
          <Text style={styles.tipText}>• Which characters or themes resonate with you?</Text>
          <Text style={styles.tipText}>• How does this book make you feel?</Text>
          <Text style={styles.tipText}>• Any predictions or questions?</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading || charCount < 10}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Update Entry' : 'Save Entry'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
    maxWidth: 220,
  },
  bookAuthor: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  storageLabel: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  inputContainer: {
    backgroundColor: COLORS.white,
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 300,
    borderWidth: 1,
    borderColor: COLORS.border,
    lineHeight: 24,
  },
  charCounter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  charCountText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  warningText: {
    fontSize: 12,
    color: COLORS.error || '#DC2626',
    fontWeight: '600',
  },
  tipsContainer: {
    backgroundColor: COLORS.primary + '10',
    margin: SPACING.md,
    marginTop: 0,
    padding: SPACING.md,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  tipText: {
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  saveButton: {
    flex: 2,
    padding: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default AddDiaryEntryScreen;
