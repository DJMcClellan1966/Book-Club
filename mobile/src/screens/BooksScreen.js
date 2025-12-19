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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { booksAPI } from '../services/supabase';
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

const BooksScreen = ({ navigation }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadBooks();
  }, [selectedGenre]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getAll(page, 20);
      setBooks(response.books || []);
    } catch (error) {
      console.error('Error loading books:', error);
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

  const renderBook = useCallback(({ item }) => (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() => navigation.navigate('BookDetail', { bookId: item.id })}
    >
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
  ), [navigation]);

  return (
    <View style={styles.container}>
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
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={GENRES}
          renderItem={renderGenreChip}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.genresList}
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={books}
          renderItem={renderBook}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="book-outline" size={64} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>No books found</Text>
            </View>
          }
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
});

export default BooksScreen;
