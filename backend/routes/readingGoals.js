const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth.supabase');

// Get all goals for current user
router.get('/my-goals', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reading_goals')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate percentage for each goal
    const goalsWithPercentage = data.map(goal => ({
      ...goal,
      percentage: goal.target_value > 0 
        ? Math.round((goal.current_progress / goal.target_value) * 100) 
        : 0
    }));

    res.json({ goals: goalsWithPercentage });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ message: 'Failed to get goals' });
  }
});

// Create new reading goal
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { goal_type, target_value, time_period } = req.body;

    if (!goal_type || !target_value || !time_period) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Calculate start and end dates based on time period
    const now = new Date();
    let start_date, end_date;

    switch (time_period) {
      case 'daily':
        start_date = new Date(now.setHours(0, 0, 0, 0));
        end_date = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'weekly':
        const dayOfWeek = now.getDay();
        start_date = new Date(now.setDate(now.getDate() - dayOfWeek));
        start_date.setHours(0, 0, 0, 0);
        end_date = new Date(start_date);
        end_date.setDate(end_date.getDate() + 6);
        end_date.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        start_date = new Date(now.getFullYear(), now.getMonth(), 1);
        end_date = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'yearly':
        start_date = new Date(now.getFullYear(), 0, 1);
        end_date = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        return res.status(400).json({ message: 'Invalid time period' });
    }

    const { data, error } = await supabase
      .from('reading_goals')
      .insert({
        user_id: req.user.id,
        goal_type,
        target_value,
        time_period,
        start_date,
        end_date,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ 
      goal: data, 
      message: 'Goal created successfully' 
    });
  } catch (error) {
    console.error('Create goal error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ message: 'You already have this goal for this period' });
    }
    res.status(500).json({ message: 'Failed to create goal' });
  }
});

// Update goal progress
router.put('/:goalId', authenticateUser, async (req, res) => {
  try {
    const { goalId } = req.params;
    const { current_progress } = req.body;

    // Get current goal
    const { data: goal, error: fetchError } = await supabase
      .from('reading_goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Check if goal is completed
    const completed = current_progress >= goal.target_value;
    const updates = {
      current_progress,
      updated_at: new Date().toISOString()
    };

    if (completed && goal.status !== 'completed') {
      updates.status = 'completed';
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('reading_goals')
      .update(updates)
      .eq('id', goalId)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    // Check for achievements if goal completed
    let achievement_unlocked = null;
    if (completed && goal.status !== 'completed') {
      achievement_unlocked = await checkGoalAchievements(req.user.id, goal);
    }

    res.json({
      goal: data,
      completed,
      achievement_unlocked
    });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ message: 'Failed to update goal' });
  }
});

// Delete goal
router.delete('/:goalId', authenticateUser, async (req, res) => {
  try {
    const { goalId } = req.params;

    const { error } = await supabase
      .from('reading_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ message: 'Failed to delete goal' });
  }
});

// Helper function to check for achievements
async function checkGoalAchievements(userId, goal) {
  try {
    // Count total completed goals
    const { count } = await supabase
      .from('reading_goals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');

    // Check for milestone achievements
    const achievementCodes = [];
    if (count === 1) achievementCodes.push('FIRST_GOAL');
    if (count === 10) achievementCodes.push('GOAL_SETTER');
    if (count === 50) achievementCodes.push('GOAL_MASTER');

    if (achievementCodes.length > 0) {
      // Get achievement definitions
      const { data: achievements } = await supabase
        .from('reading_achievements')
        .select('*')
        .in('code', achievementCodes);

      if (achievements && achievements.length > 0) {
        // Award first achievement
        const achievement = achievements[0];
        
        // Check if not already earned
        const { data: existing } = await supabase
          .from('user_achievements')
          .select('id')
          .eq('user_id', userId)
          .eq('achievement_id', achievement.id)
          .maybeSingle();

        if (!existing) {
          await supabase
            .from('user_achievements')
            .insert({
              user_id: userId,
              achievement_id: achievement.id,
              is_new: true
            });

          return achievement;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Check achievements error:', error);
    return null;
  }
}

module.exports = router;
