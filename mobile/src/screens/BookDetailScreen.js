import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { booksAPI, reviewsAPI, readingListAPI } from '../services/supabase';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../constants';

const BookDetailScreen = ({ route, navigation }) => {
  const { bookId } = route.params;
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inReadingList, setInReadingList] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadBook();
    checkReadingList();
  }, [bookId]);

  const loadBook = async () => {
    try {
      const data = await booksAPI.getById(bookId);
      setBook(data);
    } catch (error) {
      console.error('Error loading book:', error);
      Alert.alert('Error', 'Failed to load book details');
    } finally {
      setLoading(false);
    }
  };

  const checkReadingList = async () => {
    try {
      const list = await readingListAPI.getMyList();
      setInReadingList(list.some(item => item.book_id === bookId));
    } catch (error) {
      console.error('Error checking reading list:', error);
    }
  };

  const toggleReadingList = async () => {
    try {
      if (inReadingList) {
        await readingListAPI.remove(bookId);
        Alert.alert('Removed', 'Book removed from your reading list');
        setInReadingList(false);
      } else {
        await readingListAPI.add(bookId, 'want-to-read');
        Alert.alert('Added', 'Book added to your reading list!');
        setInReadingList(true);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update reading list');
    }
  };

  const submitReview = async () => {
    if (!reviewTitle.trim() || !reviewContent.trim()) {
      Alert.alert('Error', 'Please fill in both title and content');
      return;
    }

    setSubmitting(true);
    try {
      await reviewsAPI.create(bookId, {
        title: reviewTitle,
        content: reviewContent,
        rating: reviewRating
      });
      Alert.alert('Success', 'Review posted!');
      setShowReviewForm(false);
      setReviewTitle('');
      setReviewContent('');
      setReviewRating(5);
      loadBook(); // Reload to show new review
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to post review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Book not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={COLORS.gradient.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.bookIcon}>
          <Ionicons name="book" size={60} color={COLORS.white} />
        </View>
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.author}>{book.author}</Text>
        {book.average_rating > 0 && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={20} color={COLORS.warning} />
            <Text style={styles.ratingText}>{book.average_rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({book.review_count} reviews)</Text>
          </View>
        )}
      </LinearGradient>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton, inReadingList && styles.actionButtonActive]}
          onPress={toggleReadingList}
        >
          <Ionicons 
            name={inReadingList ? "checkmark-circle" : "add-circle-outline"} 
            size={24} 
            color={COLORS.white} 
          />
          <Text style={styles.actionButtonText}>
            {inReadingList ? 'In Reading List' : 'Add to List'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowReviewForm(!showReviewForm)}
        >
          <Ionicons name="create-outline" size={24} color={COLORS.white} />
          <Text style={styles.actionButtonText}>Write Review</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.connectButton}
        onPress={() => navigation.navigate('BookReaders', { bookId, bookTitle: book.title })}
      >
        <Ionicons name="people" size={24} color={COLORS.primary} />
        <View style={styles.connectButtonText}>
          <Text style={styles.connectTitle}>Connect with Readers</Text>
          <Text style={styles.connectSubtitle}>Chat with people reading this book</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
      </TouchableOpacity>

      {book.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{book.description}</Text>
        </View>
      )}

      {showReviewForm && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Write a Review</Text>
          
          <Text style={styles.label}>Rating</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                <Ionicons 
                  name={star <= reviewRating ? "star" : "star-outline"} 
                  size={32} 
                  color={COLORS.warning} 
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Review title"
            value={reviewTitle}
            onChangeText={setReviewTitle}
            editable={!submitting}
          />

          <Text style={styles.label}>Your Review</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Share your thoughts..."
            value={reviewContent}
            onChangeText={setReviewContent}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            editable={!submitting}
          />

          <TouchableOpacity 
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={submitReview}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>Post Review</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {book.reviews && book.reviews.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews ({book.reviews.length})</Text>
          {book.reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewAuthor}>{review.profiles?.username || 'Anonymous'}</Text>
                <View style={styles.reviewRating}>
                  <Ionicons name="star" size={16} color={COLORS.warning} />
                  <Text style={styles.reviewRatingText}>{review.rating}</Text>
                </View>
              </View>
              <Text style={styles.reviewTitle}>{review.title}</Text>
              <Text style={styles.reviewContent}>{review.content}</Text>
              <Text style={styles.reviewDate}>
                {new Date(review.created_at).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { alignItems: 'center', padding: SPACING.xl, backgroundColor: COLORS.white },
  bookIcon: { width: 120, height: 160, backgroundColor: COLORS.light, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: 12,
    ...SHADOWS.md,
  },
  connectButtonText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  connectTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  connectSubtitle: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  title: { ...TYPOGRAPHY.h2, textAlign: 'center', marginBottom: SPACING.xs },
  author: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  section: { padding: SPACING.lg, backgroundColor: COLORS.white, marginTop: SPACING.md },
  sectionTitle: { ...TYPOGRAPHY.h3, marginBottom: SPACING.md },
  description: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, lineHeight: 24 },
  actions: { padding: SPACING.lg },
  button: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: SPACING.md, borderRadius: 8 },
  buttonText: { color: COLORS.white, marginLeft: SPACING.sm, fontWeight: '600' },
});

export default BookDetailScreen;
