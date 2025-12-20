import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  RefreshControl,
  Switch
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, API_URL } from '../constants';
import localDiaryService from '../services/localDiaryService';

const DiaryScreen = ({ route, navigation }) => {
  const { book } = route.params;
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [storageType, setStorageType] = useState('cloud'); // 'cloud' or 'local'
  const [diaryUsage, setDiaryUsage] = useState(null);

  useEffect(() => {
    loadUsage();
    loadEntries();
  }, [storageType]);

  const loadUsage = async () => {
    try {
      const response = await fetch(`${API_URL}/diary/usage`, {
        headers: {
          'Authorization': `Bearer ${user?.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDiaryUsage(data);
      }
    } catch (error) {
      console.error('Load usage error:', error);
    }
  };

  const loadEntries = async () => {
    try {
      if (storageType === 'local') {
        // Load from local storage
        const localEntries = await localDiaryService.getEntriesForBook(book.id);
        setEntries(localEntries);
      } else {
        // Load from cloud
        const response = await fetch(`${API_URL}/diary/book/${book.id}`, {
          headers: {
            'Authorization': `Bearer ${user?.access_token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setEntries(data);
        } else {
          console.error('Failed to load diary entries');
        }
      }
    } catch (error) {
      console.error('Load entries error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEntries();
  };

  const handleDeleteEntry = (entry) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this diary entry? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (storageType === 'local') {
                await localDiaryService.deleteEntry(entry.id);
                setEntries(entries.filter(e => e.id !== entry.id));
              } else {
                const response = await fetch(`${API_URL}/diary/${entry.id}`, {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${user?.access_token}`
                  }
                });

                if (response.ok) {
                  setEntries(entries.filter(e => e.id !== entry.id));
                } else {
                  Alert.alert('Error', 'Failed to delete entry');
                }
              }
            } catch (error) {
              console.error('Delete entry error:', error);
              Alert.alert('Error', 'Failed to delete entry');
            }
          }
        }
      ]
    );
  };

  const handleEditEntry = (entry) => {
    navigation.navigate('AddDiaryEntry', {
      book,
      entry,
      storageType,
      onSave: loadEntries
    });
  };

  const handleToggleStorage = (value) => {
    const newType = value ? 'local' : 'cloud';
    
    if (entries.length > 0) {
      Alert.alert(
        'Switch Storage Type?',
        `You have ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} in ${storageType} storage. They won't be lost, but you'll need to switch back to see them again.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Switch',
            onPress: () => setStorageType(newType)
          }
        ]
      );
    } else {
      setStorageType(newType);
    }
  };

  const generateAIInsights = async () => {
    if (entries.length === 0) {
      Alert.alert('No Entries', 'Write some diary entries first to get AI insights!');
      return;
    }

    if (storageType === 'local') {
      Alert.alert('Local Diary', 'AI insights are only available for cloud-synced diaries. Switch to cloud storage to use this feature.');
      return;
    }

    setAnalyzingAI(true);
    setShowAIModal(true);
    setAiAnalysis(null);

    try {
      const response = await fetch(`${API_URL}/diary/summarize/${book.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAiAnalysis(data);
      } else {
        const error = await response.json();
        Alert.alert('Error', error.message || 'Failed to generate insights');
        setShowAIModal(false);
      }
    } catch (error) {
      console.error('AI insights error:', error);
      Alert.alert('Error', 'Failed to generate insights');
      setShowAIModal(false);
    } finally {
      setAnalyzingAI(false);
    }
  };

  const renderEntry = ({ item, index }) => {
    const createdDate = new Date(item.created_at);
    const updatedDate = new Date(item.updated_at);
    const isEdited = createdDate.getTime() !== updatedDate.getTime();

    return (
      <View style={styles.entryCard}>
        <View style={styles.entryHeader}>
          <View>
            <Text style={styles.entryNumber}>Entry #{entries.length - index}</Text>
            <Text style={styles.entryDate}>
              {createdDate.toLocaleDateString()} at {createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isEdited && (
              <Text style={styles.editedLabel}>
                Edited {updatedDate.toLocaleDateString()}
              </Text>
            )}
          </View>
          <View style={styles.entryActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditEntry(item)}
            >
              <Text style={styles.actionButtonText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteEntry(item)}
            >
              <Text style={styles.actionButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.entryText}>{item.entry_text}</Text>
      </View>
    );
  };

  const renderAIModal = () => (
    <Modal
      visible={showAIModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowAIModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.aiModalContent}>
          <Text style={styles.aiModalTitle}>📖 AI Reading Insights</Text>
          
          {analyzingAI ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Analyzing your diary entries...</Text>
            </View>
          ) : aiAnalysis ? (
            <ScrollView style={styles.aiResultsScroll}>
              <View style={styles.aiSection}>
                <Text style={styles.aiSectionTitle}>📝 Summary</Text>
                <Text style={styles.aiSummaryText}>{aiAnalysis.summary}</Text>
              </View>

              {aiAnalysis.insights && aiAnalysis.insights.length > 0 && (
                <View style={styles.aiSection}>
                  <Text style={styles.aiSectionTitle}>💡 Insights</Text>
                  {aiAnalysis.insights.map((insight, index) => (
                    <View key={index} style={styles.insightItem}>
                      <Text style={styles.insightBullet}>•</Text>
                      <Text style={styles.insightText}>{insight}</Text>
                    </View>
                  ))}
                </View>
              )}

              {aiAnalysis.themes && aiAnalysis.themes.length > 0 && (
                <View style={styles.aiSection}>
                  <Text style={styles.aiSectionTitle}>🎭 Themes</Text>
                  <View style={styles.themesContainer}>
                    {aiAnalysis.themes.map((theme, index) => (
                      <View key={index} style={styles.themeTag}>
                        <Text style={styles.themeText}>{theme}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {aiAnalysis.entryCount && (
                <View style={styles.statsSection}>
                  <Text style={styles.statsText}>
                    Based on {aiAnalysis.entryCount} {aiAnalysis.entryCount === 1 ? 'entry' : 'entries'}
                  </Text>
                  {aiAnalysis.dateRange && (
                    <Text style={styles.statsText}>
                      From {new Date(aiAnalysis.dateRange.first).toLocaleDateString()} to{' '}
                      {new Date(aiAnalysis.dateRange.last).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              )}
            </ScrollView>
          ) : null}

          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={() => setShowAIModal(false)}
          >
            <Text style={styles.closeModalButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.bookHeader}>
        <Text style={styles.bookTitle}>{book.title}</Text>
        <Text style={styles.bookAuthor}>by {book.author}</Text>
        <View style={styles.headerRow}>
          <Text style={styles.privateLabel}>🔒 Private Diary</Text>
          {diaryUsage && storageType === 'cloud' && (
            <Text style={styles.limitLabel}>
              {diaryUsage.limit === Infinity 
                ? `${diaryUsage.currentUsage} books` 
                : `${diaryUsage.currentUsage}/${diaryUsage.limit} books`}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.storageToggle}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>
              {storageType === 'cloud' ? '☁️ Cloud Synced' : '📱 Local Only'}
            </Text>
            <Text style={styles.toggleSubtext}>
              {storageType === 'cloud' 
                ? 'Saved online, access anywhere' 
                : 'Saved on device, offline access'}
            </Text>
          </View>
          <Switch
            value={storageType === 'local'}
            onValueChange={handleToggleStorage}
            trackColor={{ false: COLORS.primary, true: COLORS.textSecondary }}
            thumbColor={COLORS.white}
          />
        </View>
      </View>

      {entries.length > 0 && storageType === 'cloud' && (
        <TouchableOpacity
          style={styles.aiButton}
          onPress={generateAIInsights}
        >
          <Text style={styles.aiButtonText}>✨ Get AI Insights</Text>
        </TouchableOpacity>
      )}

      {entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📔</Text>
          <Text style={styles.emptyText}>No diary entries yet</Text>
          <Text style={styles.emptySubtext}>
            Start writing your thoughts and reflections about this book
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={renderEntry}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddDiaryEntry', { book, storageType, onSave: loadEntries })}
      >
        <Text style={styles.fabIcon}>✍️</Text>
      </TouchableOpacity>

      {renderAIModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  bookHeader: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  bookTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  bookAuthor: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  privateLabel: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  limitLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  storageToggle: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  toggleSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  aiButton: {
    backgroundColor: COLORS.primary,
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  aiButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  listContainer: {
    padding: SPACING.md,
  },
  entryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    alignItems: 'flex-start',
  },
  entryNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  entryDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  editedLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  entryActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#FECACA',
  },
  actionButtonText: {
    fontSize: 16,
  },
  entryText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    lineHeight: 22,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyText: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 28,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.lg,
    width: '90%',
    maxHeight: '80%',
  },
  aiModalTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  aiResultsScroll: {
    maxHeight: 400,
  },
  aiSection: {
    marginBottom: SPACING.lg,
  },
  aiSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  aiSummaryText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    lineHeight: 22,
    fontStyle: 'italic',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 8,
  },
  insightItem: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    paddingLeft: SPACING.sm,
  },
  insightBullet: {
    fontSize: 18,
    color: COLORS.primary,
    marginRight: SPACING.sm,
    lineHeight: 22,
  },
  insightText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
    lineHeight: 22,
  },
  themesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  themeTag: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
  themeText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  statsSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  closeModalButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default DiaryScreen;
