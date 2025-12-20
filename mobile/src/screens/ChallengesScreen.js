import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = 'http://localhost:5000'; // Update with your API URL

const ChallengesScreen = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (user) {
      fetchChallenges();
    }
  }, [user, filter]);

  const fetchChallenges = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/challenges?status=${filter}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setChallenges(response.data.challenges);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      Alert.alert('Error', 'Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const fetchChallengeDetails = async (challengeId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/challenges/${challengeId}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setSelectedChallenge(response.data.challenge);
      setLeaderboard(response.data.leaderboard);
      setShowDetails(true);
    } catch (error) {
      console.error('Error fetching challenge details:', error);
      Alert.alert('Error', 'Failed to load challenge details');
    }
  };

  const handleJoinChallenge = async (challengeId) => {
    try {
      await axios.post(
        `${API_URL}/api/challenges/${challengeId}/join`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      Alert.alert('Success', 'Successfully joined the challenge! 🎉');
      fetchChallenges();
      if (selectedChallenge?.id === challengeId) {
        fetchChallengeDetails(challengeId);
      }
    } catch (error) {
      console.error('Error joining challenge:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to join challenge');
    }
  };

  const handleLeaveChallenge = (challengeId) => {
    Alert.alert(
      'Leave Challenge',
      'Are you sure you want to leave this challenge?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.post(
                `${API_URL}/api/challenges/${challengeId}/leave`,
                {},
                { headers: { Authorization: `Bearer ${user.token}` } }
              );
              Alert.alert('Success', 'Left the challenge');
              fetchChallenges();
              setShowDetails(false);
              setSelectedChallenge(null);
            } catch (error) {
              console.error('Error leaving challenge:', error);
              Alert.alert('Error', 'Failed to leave challenge');
            }
          },
        },
      ]
    );
  };

  const getChallengeIcon = (type) => {
    const icons = {
      books: '📚',
      pages: '📄',
      genres: '🎭',
      minutes: '⏱️',
    };
    return icons[type] || '🏆';
  };

  const getDaysRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const getRankEmoji = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  const renderChallengeCard = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.challengeCard,
        item.is_participant && styles.challengeCardJoined,
      ]}
      onPress={() => fetchChallengeDetails(item.id)}
    >
      <View style={styles.challengeHeader}>
        <Text style={styles.challengeIcon}>{getChallengeIcon(item.challenge_type)}</Text>
        <View style={styles.challengeInfo}>
          <Text style={styles.challengeTitle}>{item.title}</Text>
          {item.is_participant && (
            <View style={styles.badgeJoined}>
              <Text style={styles.badgeJoinedText}>Joined ✓</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.challengeDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.challengeMeta}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Target</Text>
          <Text style={styles.metaValue}>{item.target_value}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Participants</Text>
          <Text style={styles.metaValue}>{item.participant_count}</Text>
        </View>
        {item.status === 'active' && (
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Days left</Text>
            <Text style={[styles.metaValue, styles.metaValueDays]}>
              {getDaysRemaining(item.end_date)}
            </Text>
          </View>
        )}
      </View>

      {item.prize && (
        <View style={styles.prizeBadge}>
          <Text style={styles.prizeText}>🎁 Prize: {item.prize}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderLeaderboardEntry = ({ item, index }) => (
    <View
      style={[
        styles.leaderboardEntry,
        item.user_id === user.id && styles.leaderboardEntryCurrentUser,
        index < 3 && styles[`leaderboardEntryRank${index + 1}`],
      ]}
    >
      <Text style={styles.entryRank}>{getRankEmoji(index)}</Text>
      <View style={styles.entryUser}>
        <Text style={styles.entryUserName}>
          {item.display_name || item.email}
        </Text>
        {item.user_id === user.id && (
          <View style={styles.youBadge}>
            <Text style={styles.youBadgeText}>You</Text>
          </View>
        )}
      </View>
      <View style={styles.entryStats}>
        <Text style={styles.entryProgress}>
          {item.progress} / {selectedChallenge.target_value}
        </Text>
        <Text style={styles.entryPercentage}>
          {Math.round((item.progress / selectedChallenge.target_value) * 100)}%
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading challenges...</Text>
      </View>
    );
  }

  if (showDetails && selectedChallenge) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowDetails(false)}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {selectedChallenge.title}
          </Text>
          {selectedChallenge.is_participant ? (
            <TouchableOpacity
              style={styles.btnLeave}
              onPress={() => handleLeaveChallenge(selectedChallenge.id)}
            >
              <Text style={styles.btnLeaveText}>Leave</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.btnJoin,
                selectedChallenge.status !== 'active' && styles.btnJoinDisabled,
              ]}
              onPress={() => handleJoinChallenge(selectedChallenge.id)}
              disabled={selectedChallenge.status !== 'active'}
            >
              <Text style={styles.btnJoinText}>
                {selectedChallenge.status === 'active' ? 'Join' : 'Ended'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.detailsContent}>
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.detailsDescription}>
              {selectedChallenge.description}
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Target</Text>
              <Text style={styles.statValue}>{selectedChallenge.target_value}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Participants</Text>
              <Text style={styles.statValue}>
                {selectedChallenge.participant_count}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Status</Text>
              <Text style={[styles.statValue, styles.statValueStatus]}>
                {selectedChallenge.status}
              </Text>
            </View>
          </View>

          <View style={styles.leaderboardSection}>
            <Text style={styles.sectionTitle}>🏆 Leaderboard</Text>
            {leaderboard.length === 0 ? (
              <View style={styles.emptyLeaderboard}>
                <Text style={styles.emptyText}>
                  No participants yet. Be the first to join!
                </Text>
              </View>
            ) : (
              <FlatList
                data={leaderboard}
                renderItem={renderLeaderboardEntry}
                keyExtractor={(item) => item.user_id}
                scrollEnabled={false}
              />
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Challenges</Text>
      </View>

      <View style={styles.filterContainer}>
        {['active', 'upcoming', 'completed'].map((filterOption) => (
          <TouchableOpacity
            key={filterOption}
            style={[
              styles.filterBtn,
              filter === filterOption && styles.filterBtnActive,
            ]}
            onPress={() => setFilter(filterOption)}
          >
            <Text
              style={[
                styles.filterBtnText,
                filter === filterOption && styles.filterBtnTextActive,
              ]}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {challenges.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No {filter} challenges available</Text>
        </View>
      ) : (
        <FlatList
          data={challenges}
          renderItem={renderChallengeCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    flex: 1,
    marginHorizontal: 12,
  },
  backButton: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  btnJoin: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnJoinDisabled: {
    backgroundColor: '#d1d5db',
  },
  btnJoinText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  btnLeave: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnLeaveText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#6366f1',
  },
  filterBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterBtnTextActive: {
    color: 'white',
  },
  listContent: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  challengeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  challengeCardJoined: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  badgeJoined: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeJoinedText: {
    fontSize: 12,
    color: '#065f46',
    fontWeight: '600',
  },
  challengeDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  challengeMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    color: '#9ca3af',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 16,
    color: '#1a1a2e',
    fontWeight: '700',
  },
  metaValueDays: {
    color: '#f59e0b',
  },
  prizeBadge: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  prizeText: {
    color: '#92400e',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsContent: {
    flex: 1,
    padding: 16,
  },
  detailsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  detailsDescription: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    color: '#1a1a2e',
    fontWeight: 'bold',
  },
  statValueStatus: {
    textTransform: 'capitalize',
  },
  leaderboardSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  emptyLeaderboard: {
    padding: 40,
    alignItems: 'center',
  },
  leaderboardEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  leaderboardEntryCurrentUser: {
    backgroundColor: '#ede9fe',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  leaderboardEntryRank1: {
    backgroundColor: '#fef3c7',
  },
  leaderboardEntryRank2: {
    backgroundColor: '#e5e7eb',
  },
  leaderboardEntryRank3: {
    backgroundColor: '#fed7aa',
  },
  entryRank: {
    fontSize: 18,
    fontWeight: 'bold',
    width: 40,
    textAlign: 'center',
  },
  entryUser: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  youBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  youBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  entryStats: {
    alignItems: 'flex-end',
  },
  entryProgress: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  entryPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366f1',
  },
});

export default ChallengesScreen;
