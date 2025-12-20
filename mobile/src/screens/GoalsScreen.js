import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = 'http://localhost:5000'; // Update with your API URL

const GoalsScreen = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goal_type: 'books',
    target_value: '',
    time_period: 'monthly',
  });

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/reading-goals/my-goals`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setGoals(response.data.goals);
    } catch (error) {
      console.error('Error fetching goals:', error);
      Alert.alert('Error', 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!newGoal.target_value) {
      Alert.alert('Error', 'Please enter a target value');
      return;
    }

    try {
      await axios.post(`${API_URL}/api/reading-goals`, newGoal, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      setShowCreateModal(false);
      setNewGoal({ goal_type: 'books', target_value: '', time_period: 'monthly' });
      fetchGoals();
      Alert.alert('Success', 'Goal created successfully! 🎯');
    } catch (error) {
      console.error('Error creating goal:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create goal');
    }
  };

  const handleDeleteGoal = (goalId) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/api/reading-goals/${goalId}`, {
                headers: { Authorization: `Bearer ${user.token}` },
              });
              fetchGoals();
            } catch (error) {
              console.error('Error deleting goal:', error);
              Alert.alert('Error', 'Failed to delete goal');
            }
          },
        },
      ]
    );
  };

  const getGoalIcon = (type) => {
    const icons = {
      books: '📚',
      pages: '📄',
      minutes: '⏱️',
      genres: '🎭',
    };
    return icons[type] || '🎯';
  };

  const getGoalLabel = (type) => {
    const labels = {
      books: 'Books',
      pages: 'Pages',
      minutes: 'Minutes',
      genres: 'Genres',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading goals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📖 My Reading Goals</Text>
        <TouchableOpacity
          style={styles.btnCreate}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.btnCreateText}>+ New Goal</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {goals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No goals yet</Text>
            <Text style={styles.emptySubtext}>Create your first reading goal!</Text>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.btnPrimaryText}>Create Goal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          goals.map((goal) => (
            <View
              key={goal.id}
              style={[
                styles.goalCard,
                goal.status === 'completed' && styles.goalCardCompleted,
              ]}
            >
              <View style={styles.goalHeader}>
                <Text style={styles.goalIcon}>{getGoalIcon(goal.goal_type)}</Text>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalTitle}>{getGoalLabel(goal.goal_type)}</Text>
                  <View style={styles.goalPeriodBadge}>
                    <Text style={styles.goalPeriodText}>{goal.time_period}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteGoal(goal.id)}
                  style={styles.btnDelete}
                >
                  <Text style={styles.btnDeleteText}>×</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(goal.percentage, 100)}%` },
                      goal.status === 'completed' && styles.progressFillCompleted,
                    ]}
                  />
                </View>
                <View style={styles.progressText}>
                  <Text style={styles.progressCurrent}>{goal.current_progress}</Text>
                  <Text style={styles.progressSeparator}> / </Text>
                  <Text style={styles.progressTarget}>{goal.target_value}</Text>
                  <Text style={styles.progressPercentage}>({goal.percentage}%)</Text>
                </View>
              </View>

              {goal.status === 'completed' && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>✅ Completed! 🎉</Text>
                </View>
              )}

              {goal.status === 'active' && goal.percentage >= 80 && (
                <View style={styles.almostBadge}>
                  <Text style={styles.almostText}>
                    🔥 Almost there! Just {goal.target_value - goal.current_progress} more!
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Create Goal Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Reading Goal</Text>

            <Text style={styles.label}>Goal Type</Text>
            <View style={styles.pickerContainer}>
              {['books', 'pages', 'minutes', 'genres'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.pickerOption,
                    newGoal.goal_type === type && styles.pickerOptionSelected,
                  ]}
                  onPress={() => setNewGoal({ ...newGoal, goal_type: type })}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      newGoal.goal_type === type && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {getGoalLabel(type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Target</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 12"
              keyboardType="numeric"
              value={newGoal.target_value}
              onChangeText={(text) =>
                setNewGoal({ ...newGoal, target_value: text })
              }
            />

            <Text style={styles.label}>Time Period</Text>
            <View style={styles.pickerContainer}>
              {['daily', 'weekly', 'monthly', 'yearly'].map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.pickerOption,
                    newGoal.time_period === period && styles.pickerOptionSelected,
                  ]}
                  onPress={() => setNewGoal({ ...newGoal, time_period: period })}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      newGoal.time_period === period && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={handleCreateGoal}
              >
                <Text style={styles.btnPrimaryText}>Create Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  btnCreate: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnCreateText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 20,
  },
  goalCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalCardCompleted: {
    borderWidth: 2,
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  goalPeriodBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  goalPeriodText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  btnDelete: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  btnDeleteText: {
    fontSize: 28,
    color: '#9ca3af',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 6,
  },
  progressFillCompleted: {
    backgroundColor: '#10b981',
  },
  progressText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCurrent: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  progressSeparator: {
    fontSize: 16,
    color: '#9ca3af',
  },
  progressTarget: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  progressPercentage: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 'auto',
  },
  completedBadge: {
    padding: 12,
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    alignItems: 'center',
  },
  completedText: {
    color: '#065f46',
    fontWeight: '600',
    fontSize: 16,
  },
  almostBadge: {
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    alignItems: 'center',
  },
  almostText: {
    color: '#92400e',
    fontWeight: '500',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
  },
  pickerOptionSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  pickerOptionText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  pickerOptionTextSelected: {
    color: 'white',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: '#6366f1',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GoalsScreen;
