import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';

const RATING_OPTIONS = [
  { value: 'stayed-up-all-night', label: 'Stayed Up All Night', emoji: '🌙', color: '#8B5CF6' },
  { value: 'would-read-again', label: 'Would Read Again', emoji: '🔁', color: '#10B981' },
  { value: 'once-was-enough', label: 'Once Was Enough', emoji: '✅', color: '#F59E0B' },
  { value: 'might-come-back-later', label: 'Might Come Back Later', emoji: '🤔', color: '#6B7280' },
  { value: 'meh', label: 'Meh', emoji: '😐', color: '#9CA3AF' }
];

const ReviewsSummaryModal = ({ visible, onClose, bookTitle, summary }) => {
  if (!summary) return null;

  const getRatingInfo = (ratingValue) => {
    return RATING_OPTIONS.find(r => r.value === ratingValue) || RATING_OPTIONS[4];
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <View style={styles.starsContainer}>
        {[...Array(fullStars)].map((_, i) => (
          <Text key={`full-${i}`} style={styles.star}>⭐</Text>
        ))}
        {hasHalfStar && <Text style={styles.star}>✨</Text>}
        {[...Array(emptyStars)].map((_, i) => (
          <Text key={`empty-${i}`} style={styles.starEmpty}>☆</Text>
        ))}
        <Text style={styles.ratingNumber}>{rating.toFixed(1)}</Text>
      </View>
    );
  };

  const renderRatingBar = (ratingOption, count) => {
    const percentage = summary.totalRatings > 0 
      ? (count / summary.totalRatings) * 100 
      : 0;

    return (
      <View key={ratingOption.value} style={styles.ratingBar}>
        <Text style={styles.ratingEmoji}>{ratingOption.emoji}</Text>
        <View style={styles.barContainer}>
          <View 
            style={[
              styles.barFill, 
              { width: `${percentage}%`, backgroundColor: ratingOption.color }
            ]} 
          />
        </View>
        <Text style={styles.ratingCount}>{count}</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>📚 Community Reviews</Text>
              <Text style={styles.bookTitle} numberOfLines={1}>{bookTitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {summary.totalRatings === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📝</Text>
                <Text style={styles.emptyText}>No reviews yet</Text>
                <Text style={styles.emptySubtext}>Be the first to rate this book!</Text>
              </View>
            ) : (
              <>
                {/* Overall Rating */}
                <View style={styles.overallSection}>
                  {renderStars(summary.averageRating)}
                  <Text style={styles.statsText}>
                    Based on {summary.totalRatings} {summary.totalRatings === 1 ? 'rating' : 'ratings'}
                  </Text>
                  {summary.favoriteCount > 0 && (
                    <Text style={styles.favoritesText}>
                      ⭐ {summary.favoriteCount} {summary.favoriteCount === 1 ? 'person' : 'people'} marked as favorite
                    </Text>
                  )}
                </View>

                {/* Rating Breakdown */}
                <View style={styles.breakdownSection}>
                  <Text style={styles.sectionTitle}>Rating Breakdown</Text>
                  {RATING_OPTIONS.map(option => 
                    renderRatingBar(option, summary.ratingBreakdown[option.value] || 0)
                  )}
                </View>

                {/* Sample Reviews */}
                {summary.sampleReviews && summary.sampleReviews.length > 0 && (
                  <View style={styles.reviewsSection}>
                    <Text style={styles.sectionTitle}>
                      Sample Reviews ({summary.totalReviews} total)
                    </Text>
                    {summary.sampleReviews.map((review, index) => {
                      const ratingInfo = getRatingInfo(review.rating);
                      return (
                        <View key={index} style={styles.reviewCard}>
                          <View style={styles.reviewHeader}>
                            <Text style={styles.reviewAuthor}>{review.displayName}</Text>
                            <View style={styles.reviewRating}>
                              <Text style={styles.reviewEmoji}>{ratingInfo.emoji}</Text>
                              {review.isFavorite && <Text style={styles.favoriteIcon}>⭐</Text>}
                            </View>
                          </View>
                          
                          {review.reviewSummary && (
                            <Text style={styles.reviewSummary}>
                              💭 {review.reviewSummary}
                            </Text>
                          )}
                          
                          {review.reviewText && !review.reviewSummary && (
                            <Text style={styles.reviewText} numberOfLines={3}>
                              "{review.reviewText}"
                            </Text>
                          )}
                          
                          {review.finishedDate && (
                            <Text style={styles.reviewDate}>
                              Finished: {new Date(review.finishedDate).toLocaleDateString()}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                    {summary.totalReviews > 5 && (
                      <Text style={styles.moreReviews}>
                        + {summary.totalReviews - 5} more {summary.totalReviews - 5 === 1 ? 'review' : 'reviews'}
                      </Text>
                    )}
                  </View>
                )}
              </>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.actionButton} onPress={onClose}>
            <Text style={styles.actionButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: Dimensions.get('window').height * 0.85,
    paddingBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  bookTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  closeButtonText: {
    fontSize: 20,
    color: COLORS.text,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyText: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  overallSection: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  star: {
    fontSize: 24,
    marginHorizontal: 2,
  },
  starEmpty: {
    fontSize: 24,
    marginHorizontal: 2,
    opacity: 0.3,
  },
  ratingNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  statsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  favoritesText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  breakdownSection: {
    paddingVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  ratingEmoji: {
    fontSize: 20,
    width: 30,
  },
  barContainer: {
    flex: 1,
    height: 24,
    backgroundColor: COLORS.border,
    borderRadius: 12,
    marginHorizontal: SPACING.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 12,
  },
  ratingCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    width: 30,
    textAlign: 'right',
  },
  reviewsSection: {
    paddingVertical: SPACING.md,
  },
  reviewCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewEmoji: {
    fontSize: 18,
  },
  favoriteIcon: {
    fontSize: 16,
    marginLeft: 4,
  },
  reviewSummary: {
    fontSize: 14,
    color: COLORS.primary,
    fontStyle: 'italic',
    marginBottom: SPACING.xs,
    lineHeight: 20,
  },
  reviewText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginBottom: SPACING.xs,
    lineHeight: 20,
  },
  reviewDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  moreReviews: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReviewsSummaryModal;
