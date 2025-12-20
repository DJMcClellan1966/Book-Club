import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { useAuth } from '../context/AuthContext.supabase';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';
import ReviewsSummaryModal from '../components/ReviewsSummaryModal';

const RATING_OPTIONS = [
  { value: 'stayed-up-all-night', label: '🌙 Stayed Up All Night', emoji: '🌙', description: 'Couldn\'t stop reading!' },
  { value: 'would-read-again', label: '📚 Would Read Again', emoji: '📚', description: 'Really enjoyed it' },
  { value: 'once-was-enough', label: '✅ Once Was Enough', emoji: '✅', description: 'Good but won\'t reread' },
  { value: 'might-come-back-later', label: '🔖 Might Come Back Later', emoji: '🔖', description: 'Maybe another time' },
  { value: 'meh', label: '😐 Meh', emoji: '😐', description: 'Not for me' },
];

const BooklistScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [booklist, setBooklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [filterRating, setFilterRating] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [communityReviews, setCommunityReviews] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    loadBooklist();
    loadStats();
  }, [filterRating]);

  const loadBooklist = async () => {
    try {
      const endpoint = filterRating 
        ? `http://localhost:5000/api/booklist/by-rating/${filterRating}`
        : 'http://localhost:5000/api/booklist/my-booklist';
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${user?.access_token}`
        }
      });
      
      const data = await response.json();
      setBooklist(data);
    } catch (error) {
      console.error('Load booklist error:', error);
      Alert.alert('Error', 'Failed to load your booklist');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/booklist/stats', {
        headers: {
          'Authorization': `Bearer ${user?.access_token}`
        }
      });
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBooklist();
    loadStats();
  };

  const toggleFavorite = async (item) => {
    try {
      const response = await fetch(`http://localhost:5000/api/booklist/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`
        },
        body: JSON.stringify({
          isFavorite: !item.is_favorite
        })
      });

      if (response.ok) {
        loadBooklist();
        loadStats();
      }
    } catch (error) {
      console.error('Toggle favorite error:', error);
      Alert.alert('Error', 'Failed to update favorite');
    }
  };

  const removeBook = async (item) => {
    Alert.alert(
      'Remove Book',
      `Remove "${item.books.title}" from your booklist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`http://localhost:5000/api/booklist/${item.id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${user?.access_token}`
                }
              });
              loadBooklist();
              loadStats();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove book');
            }
          }
        }
      ]
    );
  };

  const getRatingInfo = (rating) => {
    return RATING_OPTIONS.find(r => r.value === rating) || RATING_OPTIONS[4];
  };

  const handleBookPress = (item) => {
    Alert.alert(
      item.books.title,
      'What would you like to do?',
      [
        {
          text: 'View Details',
          onPress: () => navigation.navigate('BookDetail', { bookId: item.book_id })
        },
        {
          text: '� Community Reviews',
          onPress: () => loadCommunityReviews(item)
        },
        {
          text: '📔 Open Diary',
          onPress: () => navigation.navigate('Diary', { 
            book: { id: item.book_id, title: item.books.title, author: item.books.author }
          })
        },
        {
          text: '✏️ Quick Entry (Cloud)',
          onPress: () => navigation.navigate('AddDiaryEntry', { 
            book: { id: item.book_id, title: item.books.title, author: item.books.author },
            storageType: 'cloud',
            onSave: () => {}
          })
        },
        {
          text: '📱 Quick Entry (Local)',
          onPress: () => navigation.navigate('AddDiaryEntry', { 
            book: { id: item.book_id, title: item.books.title, author: item.books.author },
            storageType: 'local',
            onSave: () => {}
          })
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const loadCommunityReviews = async (item) => {
    setSelectedBook(item.books);
    setLoadingReviews(true);
    setShowReviewsModal(true);
    setCommunityReviews(null);

    try {
      const response = await fetch(`http://localhost:5000/api/books/${item.book_id}/reviews-summary`);
      
      if (response.ok) {
        const data = await response.json();
        setCommunityReviews(data);
      } else {
        Alert.alert('Error', 'Failed to load community reviews');
        setShowReviewsModal(false);
      }
    } catch (error) {
      console.error('Load reviews error:', error);
      Alert.alert('Error', 'Failed to load community reviews');
      setShowReviewsModal(false);
    } finally {
      setLoadingReviews(false);
    }
  };

  const renderBookItem = ({ item }) => {
    const rating = getRatingInfo(item.rating);
    
    return (
      <TouchableOpacity
        style={styles.bookCard}
        onPress={() => handleBookPress(item)}
      >
        <Image
          source={{ uri: item.books.cover_url || 'https://via.placeholder.com/80x120' }}
          style={styles.bookCover}
        />
        
        <View style={styles.bookInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.bookTitle} numberOfLines={2}>
              {item.books.title}
            </Text>
            <TouchableOpacity
              onPress={() => toggleFavorite(item)}
              style={styles.favoriteButton}
            >
              <Text style={styles.favoriteIcon}>
                {item.is_favorite ? '⭐' : '☆'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.bookAuthor}>{item.books.author}</Text>
          
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingEmoji}>{rating.emoji}</Text>
            <Text style={styles.ratingText}>{rating.label}</Text>
          </View>
          
          {item.review_summary && (
            <Text style={styles.reviewSummaryText} numberOfLines={2}>
              💭 {item.review_summary}
            </Text>
          )}
          
          {item.review_text && !item.review_summary && (
            <Text style={styles.reviewText} numberOfLines={2}>
              "{item.review_text}"
            </Text>
          )}
          
          {item.finished_date && (
            <Text style={styles.dateText}>
              Finished: {new Date(item.finished_date).toLocaleDateString()}
            </Text>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeBook(item)}
        >
          <Text style={styles.removeIcon}>×</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderStats = () => {
    if (!stats) return null;
    
    return (
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.totalBooks}</Text>
          <Text style={styles.statLabel}>Books Read</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.favoriteBooks}</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.ratingBreakdown['stayed-up-all-night']}</Text>
          <Text style={styles.statLabel}>🌙 All-Nighters</Text>
        </View>
      </View>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Filter by Rating</Text>
          
          <TouchableOpacity
            style={[styles.filterOption, !filterRating && styles.filterOptionActive]}
            onPress={() => {
              setFilterRating(null);
              setShowFilterModal(false);
            }}
          >
            <Text style={styles.filterOptionText}>All Books</Text>
          </TouchableOpacity>
          
          {RATING_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterOption,
                filterRating === option.value && styles.filterOptionActive
              ]}
              onPress={() => {
                setFilterRating(option.value);
                setShowFilterModal(false);
              }}
            >
              <Text style={styles.filterEmoji}>{option.emoji}</Text>
              <View>
                <Text style={styles.filterOptionText}>{option.label}</Text>
                <Text style={styles.filterOptionDesc}>{option.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowFilterModal(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Booklist</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Text style={styles.filterButtonText}>
            {filterRating ? '🔍 Filtered' : '📋 Filter'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {renderStats()}
      
      <FlatList
        data={booklist}
        renderItem={renderBookItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📚</Text>
            <Text style={styles.emptyText}>No books in your list yet!</Text>
            <Text style={styles.emptySubtext}>
              Start adding books you've read
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate('Spaces')}
            >
              <Text style={styles.browseButtonText}>Browse Books</Text>
            </TouchableOpacity>
          </View>
        }
      />
      
      {renderFilterModal()}
      
      {/* Reviews Summary Modal */}
      <ReviewsSummaryModal
        visible={showReviewsModal}
        onClose={() => setShowReviewsModal(false)}
        bookTitle={selectedBook?.title}
        summary={communityReviews}
      />
      
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddBook', { 
          onBookAdded: (book) => {
            loadBooklist();
            loadStats();
          }
        })}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary,
  },
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  filterButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.sm,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  listContent: {
    padding: SPACING.md,
  },
  bookCard: {
    flexDirection: 'row',
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
  bookCover: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: COLORS.border,
  },
  bookInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bookTitle: {
    ...TYPOGRAPHY.h3,
    flex: 1,
    color: COLORS.text,
  },
  bookAuthor: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: SPACING.sm,
    alignSelf: 'flex-start',
  },
  ratingEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  reviewText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  reviewSummaryText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: COLORS.primary,
    marginTop: SPACING.sm,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  favoriteButton: {
    padding: 4,
  },
  favoriteIcon: {
    fontSize: 24,
  },
  removeButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.error || '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
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
    marginBottom: SPACING.lg,
  },
  browseButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  browseButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
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
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  filterOptionActive: {
    backgroundColor: COLORS.primary,
  },
  filterEmoji: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  filterOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  filterOptionDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    backgroundColor: COLORS.border,
    padding: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLORS.text,
    fontWeight: '600',
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
    color: COLORS.white,
    fontSize: 32,
    fontWeight: '300',
  },
});

export default BooklistScreen;
