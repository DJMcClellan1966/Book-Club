import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../constants';

// Famous Authors and Literary Characters
const FAMOUS_AUTHORS = [
  { id: 'shakespeare', name: 'William Shakespeare', emoji: '🎭', era: 'Renaissance', specialty: 'Playwright & Poet' },
  { id: 'austen', name: 'Jane Austen', emoji: '📖', era: '19th Century', specialty: 'Romance & Social Commentary' },
  { id: 'hemingway', name: 'Ernest Hemingway', emoji: '🥃', era: '20th Century', specialty: 'Modernist Fiction' },
  { id: 'tolkien', name: 'J.R.R. Tolkien', emoji: '🧙‍♂️', era: '20th Century', specialty: 'Fantasy Epic' },
  { id: 'christie', name: 'Agatha Christie', emoji: '🔍', era: '20th Century', specialty: 'Mystery & Detective' },
  { id: 'rowling', name: 'J.K. Rowling', emoji: '⚡', era: 'Contemporary', specialty: 'Fantasy Young Adult' },
  { id: 'king', name: 'Stephen King', emoji: '👻', era: 'Contemporary', specialty: 'Horror & Suspense' },
  { id: 'atwood', name: 'Margaret Atwood', emoji: '📚', era: 'Contemporary', specialty: 'Dystopian Fiction' },
  { id: 'fitzgerald', name: 'F. Scott Fitzgerald', emoji: '🎩', era: '1920s', specialty: 'Jazz Age Literature' },
  { id: 'twain', name: 'Mark Twain', emoji: '🚢', era: '19th Century', specialty: 'American Realism' },
  { id: 'poe', name: 'Edgar Allan Poe', emoji: '🦅', era: '19th Century', specialty: 'Gothic Horror & Poetry' },
  { id: 'dickens', name: 'Charles Dickens', emoji: '🏴󐁧󐁢󐁥󐁮󐁧󐁿', era: 'Victorian', specialty: 'Social Critique' },
];

const FAMOUS_CHARACTERS = [
  { id: 'sherlock', name: 'Sherlock Holmes', emoji: '🔎', type: 'Detective', from: 'Arthur Conan Doyle stories' },
  { id: 'darcy', name: 'Mr. Darcy', emoji: '💼', type: 'Romantic Lead', from: 'Pride and Prejudice' },
  { id: 'gatsby', name: 'Jay Gatsby', emoji: '🥂', type: 'Tragic Hero', from: 'The Great Gatsby' },
  { id: 'potter', name: 'Harry Potter', emoji: '⚡', type: 'Young Wizard', from: 'Harry Potter series' },
  { id: 'hermione', name: 'Hermione Granger', emoji: '📚', type: 'Brilliant Witch', from: 'Harry Potter series' },
  { id: 'gandalf', name: 'Gandalf', emoji: '🧙', type: 'Wizard', from: 'Lord of the Rings' },
  { id: 'katniss', name: 'Katniss Everdeen', emoji: '🏹', type: 'Revolutionary', from: 'The Hunger Games' },
  { id: 'atticus', name: 'Atticus Finch', emoji: '⚖️', type: 'Lawyer', from: 'To Kill a Mockingbird' },
  { id: 'elizabeth', name: 'Elizabeth Bennet', emoji: '💃', type: 'Independent Woman', from: 'Pride and Prejudice' },
  { id: 'dracula', name: 'Count Dracula', emoji: '🧛', type: 'Vampire', from: 'Dracula by Bram Stoker' },
  { id: 'holden', name: 'Holden Caulfield', emoji: '🎒', type: 'Troubled Teen', from: 'The Catcher in the Rye' },
  { id: 'scout', name: 'Scout Finch', emoji: '👧', type: 'Young Narrator', from: 'To Kill a Mockingbird' },
];

const AIChatsScreen = ({ navigation }) => {
  const [showInfo, setShowInfo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('authors'); // 'authors' or 'characters'

  const handleStartChat = useCallback((person) => {
    Alert.alert(
      `Chat with ${person.name}`,
      `Start an AI conversation with ${person.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Chat',
          onPress: () => {
            Alert.alert('Coming Soon', `AI chat with ${person.name} will be available soon!`);
          }
        }
      ]
    );
  }, []);

  const filteredAuthors = useMemo(() => 
    searchQuery ? FAMOUS_AUTHORS.filter(author =>
      author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      author.specialty.toLowerCase().includes(searchQuery.toLowerCase())
    ) : FAMOUS_AUTHORS,
    [searchQuery]
  );

  const filteredCharacters = useMemo(() => 
    searchQuery ? FAMOUS_CHARACTERS.filter(char =>
      char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.from.toLowerCase().includes(searchQuery.toLowerCase())
    ) : FAMOUS_CHARACTERS,
    [searchQuery]
  );

  const renderPersonCard = (person, isCharacter = false) => (
    <TouchableOpacity
      key={person.id}
      style={styles.personCard}
      onPress={() => handleStartChat(person)}
    >
      <View style={styles.personEmoji}>
        <Text style={styles.emojiText}>{person.emoji}</Text>
      </View>
      <View style={styles.personInfo}>
        <Text style={styles.personName}>{person.name}</Text>
        <Text style={styles.personMeta}>
          {isCharacter ? person.type : person.era}
        </Text>
        <Text style={styles.personSpecialty}>
          {isCharacter ? `From: ${person.from}` : person.specialty}
        </Text>
      </View>
      <Ionicons name="chatbubble-ellipses" size={24} color={COLORS.primary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header with Info Button */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>✨ AI Literary Chats</Text>
            <Text style={styles.headerSubtitle}>Chat with authors & characters</Text>
          </View>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => setShowInfo(true)}
          >
            <Ionicons name="information-circle" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search authors or characters..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'authors' && styles.tabActive]}
            onPress={() => setSelectedTab('authors')}
          >
            <Text style={[styles.tabText, selectedTab === 'authors' && styles.tabTextActive]}>
              Authors ({FAMOUS_AUTHORS.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'characters' && styles.tabActive]}
            onPress={() => setSelectedTab('characters')}
          >
            <Text style={[styles.tabText, selectedTab === 'characters' && styles.tabTextActive]}>
              Characters ({FAMOUS_CHARACTERS.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={selectedTab === 'authors' ? filteredAuthors : filteredCharacters}
        renderItem={({ item }) => renderPersonCard(item, selectedTab === 'characters')}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={8}
        windowSize={10}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No {selectedTab} found</Text>
          </View>
        }
      />

      {/* Info Modal */}
      <Modal
        visible={showInfo}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInfo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ℹ️ How to Use AI Chats</Text>
              <TouchableOpacity onPress={() => setShowInfo(false)}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>📚 What is this?</Text>
                <Text style={styles.infoText}>
                  AI Literary Chats lets you have conversations with famous authors and beloved literary characters using AI technology. Each persona responds based on their writing style, personality, and historical context.
                </Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>💬 How to Start</Text>
                <Text style={styles.infoText}>
                  1. Choose between Authors or Characters{'\n'}
                  2. Browse or search for someone to chat with{'\n'}
                  3. Tap on their card to start a conversation{'\n'}
                  4. Ask questions, discuss books, or get writing advice
                </Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>🎭 Chat Ideas</Text>
                <Text style={styles.infoText}>
                  • Ask Shakespeare about writing techniques{'\n'}
                  • Discuss romance with Mr. Darcy{'\n'}
                  • Get mystery tips from Sherlock Holmes{'\n'}
                  • Talk fantasy worldbuilding with Tolkien{'\n'}
                  • Explore themes with literary characters
                </Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>✨ Features</Text>
                <Text style={styles.infoText}>
                  • 12 famous authors from different eras{'\n'}
                  • 12 iconic literary characters{'\n'}
                  • Authentic personality & style responses{'\n'}
                  • Educational and entertaining{'\n'}
                  • Perfect for book clubs and readers
                </Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>⚠️ Note</Text>
                <Text style={styles.infoText}>
                  These are AI-powered simulations based on public knowledge about these authors and characters. Responses are generated for educational and entertainment purposes.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowInfo(false)}
            >
              <Text style={styles.modalButtonText}>Got It!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    ...SHADOWS.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  infoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.md,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  personEmoji: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  emojiText: {
    fontSize: 32,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  personMeta: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  personSpecialty: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    ...SHADOWS.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    fontWeight: '700',
  },
  modalBody: {
    padding: SPACING.lg,
  },
  infoSection: {
    marginBottom: SPACING.lg,
  },
  infoSectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  infoText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.lg,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  modalButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
});

export default AIChatsScreen;
