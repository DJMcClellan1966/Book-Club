import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { booksAPI, readingListAPI } from '../services/supabase';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../constants';

// Book Genres
const GENRES = [
  { id: 'all', name: 'All Books', icon: '📚' },
  { id: 'fiction', name: 'Fiction', icon: '📖' },
  { id: 'non-fiction', name: 'Non-Fiction', icon: '📰' },
  { id: 'mystery', name: 'Mystery', icon: '🔍' },
  { id: 'romance', name: 'Romance', icon: '💕' },
  { id: 'sci-fi', name: 'Sci-Fi', icon: '🚀' },
  { id: 'fantasy', name: 'Fantasy', icon: '🧙‍♂️' },
  { id: 'thriller', name: 'Thriller', icon: '🎭' },
  { id: 'horror', name: 'Horror', icon: '👻' },
  { id: 'biography', name: 'Biography', icon: '👤' },
  { id: 'history', name: 'History', icon: '🏛️' },
  { id: 'self-help', name: 'Self-Help', icon: '💪' },
];

// Popular & Classic Books (Sample Data)
const POPULAR_CLASSIC_BOOKS = [
  { id: 'classic-1', title: 'To Kill a Mockingbird', author: 'Harper Lee', genre: 'fiction', average_rating: 4.8, review_count: 5234 },
  { id: 'classic-2', title: '1984', author: 'George Orwell', genre: 'fiction', average_rating: 4.7, review_count: 6841 },
  { id: 'classic-3', title: 'Pride and Prejudice', author: 'Jane Austen', genre: 'romance', average_rating: 4.6, review_count: 4523 },
  { id: 'classic-4', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', genre: 'fiction', average_rating: 4.5, review_count: 3912 },
  { id: 'classic-5', title: 'Harry Potter and the Sorcerer\'s Stone', author: 'J.K. Rowling', genre: 'fantasy', average_rating: 4.9, review_count: 8234 },
  { id: 'classic-6', title: 'The Lord of the Rings', author: 'J.R.R. Tolkien', genre: 'fantasy', average_rating: 4.8, review_count: 7156 },
  { id: 'mystery-1', title: 'The Da Vinci Code', author: 'Dan Brown', genre: 'mystery', average_rating: 4.3, review_count: 4567 },
  { id: 'mystery-2', title: 'Gone Girl', author: 'Gillian Flynn', genre: 'thriller', average_rating: 4.4, review_count: 5234 },
  { id: 'scifi-1', title: 'Dune', author: 'Frank Herbert', genre: 'sci-fi', average_rating: 4.6, review_count: 6234 },
  { id: 'scifi-2', title: 'The Martian', author: 'Andy Weir', genre: 'sci-fi', average_rating: 4.7, review_count: 5678 },
  { id: 'horror-1', title: 'The Shining', author: 'Stephen King', genre: 'horror', average_rating: 4.5, review_count: 4123 },
  { id: 'horror-2', title: 'Dracula', author: 'Bram Stoker', genre: 'horror', average_rating: 4.4, review_count: 3456 },
  { id: 'bio-1', title: 'Steve Jobs', author: 'Walter Isaacson', genre: 'biography', average_rating: 4.6, review_count: 4789 },
  { id: 'bio-2', title: 'Becoming', author: 'Michelle Obama', genre: 'biography', average_rating: 4.8, review_count: 6234 },
  { id: 'history-1', title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'history', average_rating: 4.7, review_count: 7234 },
  { id: 'history-2', title: 'The Guns of August', author: 'Barbara W. Tuchman', genre: 'history', average_rating: 4.5, review_count: 2345 },
  { id: 'self-1', title: 'Atomic Habits', author: 'James Clear', genre: 'self-help', average_rating: 4.8, review_count: 8123 },
  { id: 'self-2', title: 'The 7 Habits of Highly Effective People', author: 'Stephen Covey', genre: 'self-help', average_rating: 4.6, review_count: 5678 },
];

const BooksScreen = ({ navigation }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [newBookData, setNewBookData] = useState({ title: '', author: '', genre: 'fiction' });

  useEffect(() => {
    loadBooks();
  }, [selectedGenre]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getAll(page, 20);
      // Combine API books with popular/classic books
      const allBooks = [...POPULAR_CLASSIC_BOOKS, ...(response.books || [])];
      setBooks(allBooks);
    } catch (error) {
      console.error('Error loading books:', error);
      // If API fails, still show popular/classic books
      setBooks(POPULAR_CLASSIC_BOOKS);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadBooks();
      return;
    }
    
    try {
      setLoading(true);
      const results = await booksAPI.search(searchQuery);
      setBooks(results || []);
    } catch (error) {
      console.error('Error searching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = useMemo(() => {
    if (selectedGenre === 'all' || !books.length) return books;
    return books.filter(book => book.genre?.toLowerCase() === selectedGenre);
  }, [books, selectedGenre]);

  const toggleBookSelection = useCallback((bookId) => {
    setSelectedBooks(prev => {
      if (prev.includes(bookId)) {
        return prev.filter(id => id !== bookId);
      }
      return [...prev, bookId];
    });
  }, []);

  const handleAddSelectedToList = async () => {
    if (selectedBooks.length === 0) {
      Alert.alert('No Books Selected', 'Please select at least one book to add to your list.');
      return;
    }

    try {
      setLoading(true);
      // Add all selected books to reading list
      for (const bookId of selectedBooks) {
        await readingListAPI.add(bookId, 'want-to-read');
      }
      Alert.alert(
        'Success!',
        `Added ${selectedBooks.length} book(s) to your reading list.`,
        [{ text: 'OK', onPress: () => {
          setSelectedBooks([]);
          setSelectionMode(false);
        }}]
      );
    } catch (error) {
      console.error('Error adding books to list:', error);
      Alert.alert('Error', 'Failed to add some books. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewBook = async () => {
    if (!newBookData.title.trim() || !newBookData.author.trim()) {
      Alert.alert('Missing Information', 'Please enter both title and author.');
      return;
    }

    try {
      setLoading(true);
      const bookData = {
        title: newBookData.title,
        author: newBookData.author,
        genre: newBookData.genre,
        description: '',
        cover_url: '',
      };
      
      await booksAPI.create(bookData);
      Alert.alert('Success!', `"${bookData.title}" has been added to ${GENRES.find(g => g.id === bookData.genre)?.name || bookData.genre}.`);
      setShowAddBookModal(false);
      setNewBookData({ title: '', author: '', genre: 'fiction' });
      loadBooks(); // Reload books
    } catch (error) {
      console.error('Error adding book:', error);
      Alert.alert('Error', 'Failed to add book. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderGenreChip = useCallback(({ item }) => (
    <TouchableOpacity
      style={[
        styles.genreChip,
        selectedGenre === item.id && styles.genreChipActive
      ]}
      onPress={() => setSelectedGenre(item.id)}
    >
      <Text style={styles.genreEmoji}>{item.icon}</Text>
      <Text style={[
        styles.genreText,
        selectedGenre === item.id && styles.genreTextActive
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  ), [selectedGenre]);

  const renderBook = useCallback(({ item }) => {
    const isSelected = selectedBooks.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.bookCard, isSelected && styles.bookCardSelected]}
        onPress={() => selectionMode ? toggleBookSelection(item.id) : navigation.navigate('BookDetail', { bookId: item.id })}
      >
        {selectionMode && (
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => toggleBookSelection(item.id)}
          >
            <Ionicons
              name={isSelected ? 'checkbox' : 'square-outline'}
              size={28}
              color={isSelected ? COLORS.primary : COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}
        <View style={styles.bookIcon}>
          <Ionicons name="book" size={30} color={COLORS.primary} />
        </View>
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.bookAuthor}>{item.author}</Text>
          {item.genre && (
            <Text style={styles.bookGenre}>{item.genre}</Text>
          )}
          <View style={styles.bookStats}>
            <Ionicons name="star" size={14} color={COLORS.warning} />
            <Text style={styles.bookRating}>{item.average_rating?.toFixed(1) || 'N/A'}</Text>
            <Text style={styles.bookReviews}>• {item.review_count || 0} reviews</Text>
          </View>
        </View>
        <View style={styles.bookActions}>
          <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  }, [navigation, selectionMode, selectedBooks, toggleBookSelection]);

  return (
    <View style={styles.container}>
      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setSelectionMode(!selectionMode)}
        >
          <Ionicons name={selectionMode ? 'close' : 'checkmark-circle-outline'} size={24} color={COLORS.primary} />
          <Text style={styles.actionButtonText}>{selectionMode ? 'Cancel' : 'Select'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowAddBookModal(true)}
        >
          <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
          <Text style={styles.actionButtonText}>Add Book</Text>
        </TouchableOpacity>

        {selectionMode && selectedBooks.length > 0 && (
          <TouchableOpacity
            style={[styles.actionButton, styles.addToListButton]}
            onPress={handleAddSelectedToList}
          >
            <Ionicons name="list" size={24} color={COLORS.white} />
            <Text style={styles.addToListButtonText}>Add {selectedBooks.length} to List</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search books by title or author..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => {setSearchQuery(''); loadBooks();}}>
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Genre Filter */}
      <View style={styles.genresSection}>
        <Text style={styles.sectionTitle}>Browse by Genre</Text>
        <View style={styles.genresGrid}>
          {GENRES.map((genre) => (
            <TouchableOpacity
              key={genre.id}
              style={[
                styles.genreChip,
                selectedGenre === genre.id && styles.genreChipActive
              ]}
              onPress={() => setSelectedGenre(genre.id)}
            >
              <Text style={styles.genreEmoji}>{genre.icon}</Text>
              <Text style={[
                styles.genreText,
                selectedGenre === genre.id && styles.genreTextActive
              ]}>
                {genre.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredBooks}
          renderItem={renderBook}
          keyExtractor={(item) => item.id || item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="book-outline" size={64} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>No books found</Text>
            </View>
          }
        />
      )}

      {/* Add Book Modal */}
      <Modal
        visible={showAddBookModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddBookModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Book</Text>
              <TouchableOpacity onPress={() => setShowAddBookModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Book Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter book title"
                placeholderTextColor={COLORS.textSecondary}
                value={newBookData.title}
                onChangeText={(text) => setNewBookData({ ...newBookData, title: text })}
              />

              <Text style={styles.inputLabel}>Author *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter author name"
                placeholderTextColor={COLORS.textSecondary}
                value={newBookData.author}
                onChangeText={(text) => setNewBookData({ ...newBookData, author: text })}
              />

              <Text style={styles.inputLabel}>Genre *</Text>
              <View style={styles.genrePickerGrid}>
                {GENRES.filter(g => g.id !== 'all').map((genre) => (
                  <TouchableOpacity
                    key={genre.id}
                    style={[
                      styles.genrePickerChip,
                      newBookData.genre === genre.id && styles.genrePickerChipActive
                    ]}
                    onPress={() => setNewBookData({ ...newBookData, genre: genre.id })}
                  >
                    <Text style={styles.genreEmoji}>{genre.icon}</Text>
                    <Text style={[
                      styles.genrePickerText,
                      newBookData.genre === genre.id && styles.genrePickerTextActive
                    ]}>
                      {genre.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddNewBook}
              >
                <Text style={styles.addButtonText}>Add Book to Collection</Text>
              </TouchableOpacity>
            </ScrollView>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    margin: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: SPACING.md,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    elevation: 2,
    alignItems: 'center',
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
  },
  bookTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.xs,
  },
  bookAuthor: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  bookStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookRating: {
    marginLeft: SPACING.xs,
    marginRight: SPACING.sm,
    fontWeight: '600',
  },
  bookReviews: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  empty: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  genresSection: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.md,
    fontWeight: '700',
  },
  genresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
  },
  genreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    marginHorizontal: SPACING.xs,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  genreChipActive: {
    backgroundColor: COLORS.primary,
  },
  genreEmoji: {
    fontSize: 18,
    marginRight: SPACING.xs,
  },
  genreText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  genreTextActive: {
    color: COLORS.white,
  },
  bookGenre: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.light,
  },
  actionButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  addToListButton: {
    backgroundColor: COLORS.primary,
  },
  addToListButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  checkbox: {
    marginRight: SPACING.sm,
  },
  bookCardSelected: {
    backgroundColor: '#f0f8ff',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: '700',
  },
  modalBody: {
    padding: SPACING.lg,
  },
  inputLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.light,
    padding: SPACING.md,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border || '#ddd',
  },
  genrePickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
    marginHorizontal: -SPACING.xs,
  },
  genrePickerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    marginHorizontal: SPACING.xs,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  genrePickerChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genrePickerText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
    fontSize: 14,
  },
  genrePickerTextActive: {
    color: COLORS.white,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  addButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
});

export default BooksScreen;
