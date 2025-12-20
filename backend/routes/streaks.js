const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth.supabase');

// Get user's reading streak
router.get('/my-streak', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reading_streaks')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      // Create initial streak record
      const { data: newStreak, error: createError } = await supabase
        .from('reading_streaks')
        .insert({
          user_id: req.user.id,
          current_streak: 0,
          longest_streak: 0,
          total_reading_days: 0
        })
        .select()
        .single();

      if (createError) throw createError;
      return res.json(newStreak);
    }

    // Check if streak is still valid
    const today = new Date().toISOString().split('T')[0];
    const lastReadingDate = data.last_reading_date;

    if (lastReadingDate) {
      const daysSinceLastReading = Math.floor(
        (new Date(today) - new Date(lastReadingDate)) / (1000 * 60 * 60 * 24)
      );

      // If more than 1 day has passed, streak is broken
      if (daysSinceLastReading > 1) {
        const { data: updated } = await supabase
          .from('reading_streaks')
          .update({
            current_streak: 0,
            streak_started_at: null
          })
          .eq('user_id', req.user.id)
          .select()
          .single();

        return res.json(updated || data);
      }
    }

    res.json(data);
  } catch (error) {
    console.error('Get streak error:', error);
    res.status(500).json({ message: 'Failed to get streak' });
  }
});

// Update streak (called when user adds diary entry or completes reading session)
router.post('/update', authenticateUser, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get current streak
    let { data: streak } = await supabase
      .from('reading_streaks')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!streak) {
      // Create new streak
      const { data: newStreak, error: createError } = await supabase
        .from('reading_streaks')
        .insert({
          user_id: req.user.id,
          current_streak: 1,
          longest_streak: 1,
          last_reading_date: today,
          streak_started_at: today,
          total_reading_days: 1
        })
        .select()
        .single();

      if (createError) throw createError;

      // Check for first day achievement
      await checkStreakAchievements(req.user.id, 1);

      return res.json({
        streak: newStreak,
        message: 'Streak started! 🔥',
        is_new_day: true
      });
    }

    // Check if already read today
    if (streak.last_reading_date === today) {
      return res.json({
        streak,
        message: 'Already logged reading for today',
        is_new_day: false
      });
    }

    // Calculate days since last reading
    const daysSinceLastReading = Math.floor(
      (new Date(today) - new Date(streak.last_reading_date)) / (1000 * 60 * 60 * 24)
    );

    let newCurrentStreak;
    let streakStartedAt = streak.streak_started_at;

    if (daysSinceLastReading === 1) {
      // Continue streak
      newCurrentStreak = streak.current_streak + 1;
    } else if (daysSinceLastReading > 1) {
      // Streak broken, start new
      newCurrentStreak = 1;
      streakStartedAt = today;
    } else {
      // Same day (shouldn't happen)
      return res.json({ streak, is_new_day: false });
    }

    // Update streak
    const newLongestStreak = Math.max(newCurrentStreak, streak.longest_streak);

    const { data: updated, error: updateError } = await supabase
      .from('reading_streaks')
      .update({
        current_streak: newCurrentStreak,
        longest_streak: newLongestStreak,
        last_reading_date: today,
        streak_started_at: streakStartedAt,
        total_reading_days: streak.total_reading_days + 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Check for streak achievements
    await checkStreakAchievements(req.user.id, newCurrentStreak);

    // Create notification for milestones
    if (newCurrentStreak % 7 === 0 && newCurrentStreak > 0) {
      await createStreakNotification(req.user.id, newCurrentStreak);
    }

    res.json({
      streak: updated,
      message: `${newCurrentStreak}-day streak! 🔥`,
      is_new_day: true,
      milestone: newCurrentStreak % 7 === 0
    });
  } catch (error) {
    console.error('Update streak error:', error);
    res.status(500).json({ message: 'Failed to update streak' });
  }
});

// Helper function to check streak achievements
async function checkStreakAchievements(userId, streakDays) {
  try {
    const achievementMap = {
      7: 'WEEK_WARRIOR',
      30: 'MONTH_MASTER',
      365: 'YEAR_LEGEND'
    };

    const achievementCode = achievementMap[streakDays];
    if (!achievementCode) return;

    // Get achievement
    const { data: achievement } = await supabase
      .from('reading_achievements')
      .select('*')
      .eq('code', achievementCode)
      .single();

    if (!achievement) return;

    // Check if already earned
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_id', achievement.id)
      .maybeSingle();

    if (!existing) {
      // Award achievement
      await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
          is_new: true
        });

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          notification_type: 'achievement',
          title: 'Achievement Unlocked! 🏆',
          message: `You've unlocked '${achievement.title}' - ${achievement.description}`,
          action_url: '/achievements',
          priority: 'high',
          icon_name: 'trophy'
        });
    }
  } catch (error) {
    console.error('Check streak achievements error:', error);
  }
}

// Helper function to create streak milestone notification
async function createStreakNotification(userId, streakDays) {
  try {
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        notification_type: 'streak',
        title: `${streakDays}-day Streak! 🔥`,
        message: `You're on fire! Keep your reading streak going!`,
        action_url: '/goals',
        priority: 'normal',
        icon_name: 'flame'
      });
  } catch (error) {
    console.error('Create streak notification error:', error);
  }
}

module.exports = router;
