import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext.supabase';
import { COLORS, SPACING, TYPOGRAPHY, API_URL } from '../constants';

const AddBookScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { onBookAdded } = route.params || {};
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('title'); // 'title' or 'isbn'
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);

  // Manual entry fields
  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthor, setManualAuthor] = useState('');
  const [manualIsbn, setManualIsbn] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);

  const searchBooks = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a search term');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/books/search?query=${encodeURIComponent(searchQuery)}&type=${searchType}`,
        {
          headers: {
            'Authorization': `Bearer ${user?.access_token}`
          }
        }
      );

      const data = await response.json();
      setSearchResults(data);

      if (data.length === 0) {
        Alert.alert('No Results', 'No books found. Try manual entry instead.');
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search for books');
    } finally {
      setLoading(false);
    }
  };

  const searchByImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to scan book covers');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        setLoading(true);
        
        const response = await fetch(`${API_URL}/books/search-by-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.access_token}`
          },
          body: JSON.stringify({
            imageBase64: result.assets[0].base64
          })
        });

        const data = await response.json();

        if (response.ok) {
          if (data.method === 'isbn' && data.book) {
            setSearchResults([data.book]);
          } else if (data.books) {
            setSearchResults(data.books);
          }
          Alert.alert('Success', 'Book recognized! Select from results below.');
        } else {
          Alert.alert('Not Found', data.message || 'Could not identify the book from the image');
        }

        setLoading(false);
      }
    } catch (error) {
      console.error('Image search error:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to process image. Try entering book details manually.');
    }
  };

  const addBook = async (bookData, navigateToReview = false) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/books/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`
        },
        body: JSON.stringify(bookData)
      });

      const book = await response.json();

      if (response.ok) {
        if (navigateToReview) {
          // Navigate to add to booklist screen
          navigation.navigate('AddToBooklist', { book });
        } else {
          Alert.alert('Success', 'Book added to your list!', [
            {
              text: 'OK',
              onPress: () => {
                if (onBookAdded) {
                  onBookAdded(book);
                }
                navigation.goBack();
              }
            }
          ]);
        }
      } else {
        Alert.alert('Error', book.message || 'Failed to add book');
      }
    } catch (error) {
      console.error('Add book error:', error);
      Alert.alert('Error', 'Failed to add book');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBook = (book) => {
    setSelectedBook(book);
    // Add book to database and navigate to rating/review screen
    addBook({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      description: book.description,
      coverUrl: book.cover_url,
      publishedDate: book.published_date,
      genre: book.genre,
      googleBooksId: book.google_books_id
    }, true);
  };

  const handleManualSubmit = () => {
    if (!manualTitle.trim() || !manualAuthor.trim()) {
      Alert.alert('Error', 'Title and author are required');
      return;
    }

    addBook({
      title: manualTitle,
      author: manualAuthor,
      isbn: manualIsbn,
      description: '',
      coverUrl: '',
      publishedDate: null,
      genre: '',
      googleBooksId: null
    });
  };

  const renderSearchResults = () => {
    if (searchResults.length === 0) return null;

    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.sectionTitle}>Search Results</Text>
        {searchResults.map((book, index) => (
          <TouchableOpacity
            key={index}
            style={styles.resultCard}
            onPress={() => handleSelectBook(book)}
          >
            <Image
              source={{ uri: book.cover_url || 'https://via.placeholder.com/60x90' }}
              style={styles.resultCover}
            />
            <View style={styles.resultInfo}>
              <Text style={styles.resultTitle} numberOfLines={2}>
                {book.title}
              </Text>
              <Text style={styles.resultAuthor}>{book.author}</Text>
              {book.isbn && (
                <Text style={styles.resultIsbn}>ISBN: {book.isbn}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Add a Book</Text>
        <Text style={styles.subtitle}>
          Search by title, ISBN, or scan the book cover
        </Text>

        {/* Search Type Selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, searchType === 'title' && styles.typeButtonActive]}
            onPress={() => setSearchType('title')}
          >
            <Text style={[styles.typeButtonText, searchType === 'title' && styles.typeButtonTextActive]}>
              Title
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, searchType === 'isbn' && styles.typeButtonActive]}
            onPress={() => setSearchType('isbn')}
          >
            <Text style={[styles.typeButtonText, searchType === 'isbn' && styles.typeButtonTextActive]}>
              ISBN
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={searchType === 'title' ? 'Enter book title...' : 'Enter ISBN...'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            keyboardType={searchType === 'isbn' ? 'numeric' : 'default'}
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={searchBooks}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.searchButtonText}>Search</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Scan by Image Button */}
        <TouchableOpacity
          style={styles.scanButton}
          onPress={searchByImage}
          disabled={loading}
        >
          <Text style={styles.scanButtonText}>📷 Scan Book Cover</Text>
        </TouchableOpacity>

        {/* Search Results */}
        {renderSearchResults()}

        {/* Manual Entry Toggle */}
        <TouchableOpacity
          style={styles.manualToggle}
          onPress={() => setShowManualForm(!showManualForm)}
        >
          <Text style={styles.manualToggleText}>
            {showManualForm ? '- Hide Manual Entry' : '+ Add Book Manually'}
          </Text>
        </TouchableOpacity>

        {/* Manual Entry Form */}
        {showManualForm && (
          <View style={styles.manualForm}>
            <Text style={styles.formLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Book title"
              value={manualTitle}
              onChangeText={setManualTitle}
            />

            <Text style={styles.formLabel}>Author *</Text>
            <TextInput
              style={styles.input}
              placeholder="Author name"
              value={manualAuthor}
              onChangeText={setManualAuthor}
            />

            <Text style={styles.formLabel}>ISBN (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="ISBN number"
              value={manualIsbn}
              onChangeText={setManualIsbn}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleManualSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitButtonText}>Add Book</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  typeButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeButtonText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: COLORS.white,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    marginRight: SPACING.sm,
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    justifyContent: 'center',
    minWidth: 80,
  },
  searchButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  scanButton: {
    backgroundColor: COLORS.secondary || COLORS.primary,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  scanButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  resultsContainer: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  resultCover: {
    width: 60,
    height: 90,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  resultInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'center',
  },
  resultTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginBottom: 4,
  },
  resultAuthor: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  resultIsbn: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  manualToggle: {
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  manualToggleText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  manualForm: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: SPACING.lg,
  },
  formLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  submitButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default AddBookScreen;
