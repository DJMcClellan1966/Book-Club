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
import { useAuth } from '../context/AuthContext.supabase';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';
import ReviewsSummaryModal from '../components/ReviewsSummaryModal';

const RATING_OPTIONS = [
  { value: 'stayed-up-all-night', label: '🌙 Stayed Up All Night', emoji: '🌙' },
  { value: 'would-read-again', label: '📚 Would Read Again', emoji: '📚' },
  { value: 'once-was-enough', label: '✅ Once Was Enough', emoji: '✅' },
  { value: 'might-come-back-later', label: '🔙 Might Come Back Later', emoji: '🔙' },
  { value: 'meh', label: '😐 Meh', emoji: '😐' },
];

const AddToBooklistScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { book } = route.params;
  
  const [rating, setRating] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewSummary, setReviewSummary] = useState('');
  const [finishedDate, setFinishedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [communityReviews, setCommunityReviews] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const loadCommunityReviews = async () => {
    setLoadingReviews(true);
    try {
      const response = await fetch(`http://localhost:5000/api/books/${book.id}/reviews-summary`);
      
      if (response.ok) {
        const data = await response.json();
        setCommunityReviews(data);
        setShowReviewsModal(true);
      } else {
        Alert.alert('Error', 'Failed to load community reviews');
      }
    } catch (error) {
      console.error('Load reviews error:', error);
      Alert.alert('Error', 'Failed to load community reviews');
    } finally {
      setLoadingReviews(false);
    }
  };

  const generateSummary = async () => {
    if (!reviewText || reviewText.length < 50) {
      Alert.alert('Review Too Short', 'Please write at least 50 characters to generate a summary');
      return;
    }

    setSummarizing(true);
    try {
      const response = await fetch('http://localhost:5000/api/booklist/summarize-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`
        },
        body: JSON.stringify({ reviewText })
      });

      const data = await response.json();

      if (response.ok) {
        setReviewSummary(data.summary);
        Alert.alert('Summary Generated!', 'AI has created a concise summary of your review');
      } else {
        Alert.alert('Error', data.message || 'Failed to generate summary');
      }
    } catch (error) {
      console.error('Generate summary error:', error);
      Alert.alert('Error', 'Failed to generate summary');
    } finally {
      setSummarizing(false);
    }
  };

  const handleSubmit = async () => {
    if (!rating) {
      Alert.alert('Rating Required', 'Please select a rating for this book');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/booklist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`
        },
        body: JSON.stringify({
          bookId: book.id,
          rating,
          reviewText: reviewText || null,
          reviewSummary: reviewSummary || null,
          finishedDate,
          isFavorite
        })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Book added to your booklist!', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Booklist')
          }
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to add book to booklist');
      }
    } catch (error) {
      console.error('Add to booklist error:', error);
      Alert.alert('Error', 'Failed to add book to booklist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Book Info */}
        <View style={styles.bookCard}>
          <Image
            source={{ uri: book.cover_url || 'https://via.placeholder.com/100x150' }}
            style={styles.bookCover}
          />
          <View style={styles.bookInfo}>
            <Text style={styles.bookTitle}>{book.title}</Text>
            <Text style={styles.bookAuthor}>{book.author}</Text>
          </View>
        </View>

        {/* Community Reviews Button */}
        <TouchableOpacity
          style={styles.communityButton}
          onPress={loadCommunityReviews}
          disabled={loadingReviews}
        >
          {loadingReviews ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <>
              <Text style={styles.communityButtonIcon}>📚</Text>
              <Text style={styles.communityButtonText}>See Community Reviews</Text>
              <Text style={styles.communityButtonSubtext}>
                Before you save, see what others think
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Rating Selection */}
        <Text style={styles.sectionTitle}>How did you like it? *</Text>
        <View style={styles.ratingContainer}>
          {RATING_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.ratingOption,
                rating === option.value && styles.ratingOptionActive
              ]}
              onPress={() => setRating(option.value)}
            >
              <Text style={styles.ratingEmoji}>{option.emoji}</Text>
              <Text style={[
                styles.ratingLabel,
                rating === option.value && styles.ratingLabelActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Favorite Toggle */}
        <TouchableOpacity
          style={styles.favoriteToggle}
          onPress={() => setIsFavorite(!isFavorite)}
        >
          <Text style={styles.favoriteIcon}>{isFavorite ? '⭐' : '☆'}</Text>
          <Text style={styles.favoriteText}>Mark as Favorite</Text>
        </TouchableOpacity>

        {/* Finished Date */}
        <Text style={styles.sectionTitle}>When did you finish?</Text>
        <TextInput
          style={styles.dateInput}
          placeholder="YYYY-MM-DD"
          value={finishedDate}
          onChangeText={setFinishedDate}
        />

        {/* Review Text */}
        <Text style={styles.sectionTitle}>Write Your Review (Optional)</Text>
        <Text style={styles.sectionSubtitle}>
          Share your thoughts about this book
        </Text>
        <TextInput
          style={styles.reviewInput}
          placeholder="What did you think about this book? Any memorable moments or characters?"
          value={reviewText}
          onChangeText={setReviewText}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
        />

        {reviewText.length >= 50 && (
          <TouchableOpacity
            style={styles.aiButton}
            onPress={generateSummary}
            disabled={summarizing}
          >
            {summarizing ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.aiButtonIcon}>✨</Text>
                <Text style={styles.aiButtonText}>
                  Generate AI Summary
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* AI Summary */}
        {reviewSummary && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>AI Summary:</Text>
            <Text style={styles.summaryText}>{reviewSummary}</Text>
            <TouchableOpacity
              style={styles.editSummaryButton}
              onPress={() => setReviewSummary('')}
            >
              <Text style={styles.editSummaryText}>✏️ Regenerate</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, !rating && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading || !rating}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitButtonText}>Add to Booklist</Text>
          )}
        </TouchableOpacity>
      </View>
      {/* Reviews Summary Modal */}
      <ReviewsSummaryModal
        visible={showReviewsModal}
        onClose={() => setShowReviewsModal(false)}
        bookTitle={book.title}
        summary={communityReviews}
      />    </ScrollView>
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
  bookCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
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
    justifyContent: 'center',
  },
  bookTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: 4,
  },
  bookAuthor: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  communityButton: {
    backgroundColor: COLORS.primary + '15',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  communityButtonIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  communityButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  communityButtonSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: SPACING.sm,
  },
  ratingContainer: {
    marginBottom: SPACING.md,
  },
  ratingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  ratingOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  ratingEmoji: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  ratingLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '500',
  },
  ratingLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  favoriteToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  favoriteIcon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  favoriteText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  dateInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  reviewInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    minHeight: 150,
    marginBottom: SPACING.sm,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary || '#8B5CF6',
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  aiButtonIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  aiButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  summaryContainer: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.secondary || '#8B5CF6',
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  summaryTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  summaryText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  editSummaryButton: {
    alignSelf: 'flex-end',
    marginTop: SPACING.sm,
  },
  editSummaryText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 18,
  },
});

export default AddToBooklistScreen;
