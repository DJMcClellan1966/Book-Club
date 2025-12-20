const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth.supabase');

// Get all available achievements
router.get('/catalog', async (req, res) => {
  try {
    const userId = req.user?.id;

    // Get all achievements
    const { data: achievements, error } = await supabase
      .from('reading_achievements')
      .select('*')
      .order('category', { ascending: true })
      .order('tier', { ascending: true });

    if (error) throw error;

    // If user is logged in, check which they've earned
    if (userId) {
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id, earned_at')
        .eq('user_id', userId);

      const earnedMap = {};
      userAchievements?.forEach(ua => {
        earnedMap[ua.achievement_id] = ua.earned_at;
      });

      achievements.forEach(achievement => {
        achievement.earned = !!earnedMap[achievement.id];
        achievement.earned_at = earnedMap[achievement.id] || null;
      });
    } else {
      achievements.forEach(achievement => {
        achievement.earned = false;
        achievement.earned_at = null;
      });
    }

    res.json({ achievements });
  } catch (error) {
    console.error('Get achievements catalog error:', error);
    res.status(500).json({ message: 'Failed to get achievements' });
  }
});

// Get user's earned achievements
router.get('/my-achievements', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievement_id (
          code,
          title,
          description,
          icon_name,
          category,
          tier,
          points
        )
      `)
      .eq('user_id', req.user.id)
      .order('earned_at', { ascending: false });

    if (error) throw error;

    // Calculate total points
    const total_points = data.reduce((sum, ua) => sum + (ua.achievement?.points || 0), 0);

    // Count new achievements
    const new_achievements_count = data.filter(ua => ua.is_new).length;

    res.json({
      achievements: data,
      total_points,
      new_achievements_count
    });
  } catch (error) {
    console.error('Get my achievements error:', error);
    res.status(500).json({ message: 'Failed to get your achievements' });
  }
});

// Mark achievement as displayed (notification seen)
router.post('/:achievementId/mark-displayed', authenticateUser, async (req, res) => {
  try {
    const { achievementId } = req.params;

    const { error } = await supabase
      .from('user_achievements')
      .update({ 
        is_new: false,
        displayed: true 
      })
      .eq('achievement_id', achievementId)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({ message: 'Achievement marked as displayed' });
  } catch (error) {
    console.error('Mark achievement displayed error:', error);
    res.status(500).json({ message: 'Failed to update achievement' });
  }
});

// Check and award achievements (internal function called by other routes)
router.post('/check', authenticateUser, async (req, res) => {
  try {
    const { trigger_type, value } = req.body;

    const newAchievements = await checkAndAwardAchievements(req.user.id, trigger_type, value);

    res.json({ 
      achievements_unlocked: newAchievements,
      count: newAchievements.length 
    });
  } catch (error) {
    console.error('Check achievements error:', error);
    res.status(500).json({ message: 'Failed to check achievements' });
  }
});

// Helper function to check and award achievements
async function checkAndAwardAchievements(userId, triggerType, currentValue) {
  try {
    // Get relevant achievement definitions
    const { data: achievements } = await supabase
      .from('reading_achievements')
      .select('*')
      .eq('requirement_type', triggerType);

    if (!achievements || achievements.length === 0) {
      return [];
    }

    const newAchievements = [];

    for (const achievement of achievements) {
      // Check if achievement requirement is met
      if (currentValue >= achievement.requirement_value) {
        // Check if not already earned
        const { data: existing } = await supabase
          .from('user_achievements')
          .select('id')
          .eq('user_id', userId)
          .eq('achievement_id', achievement.id)
          .maybeSingle();

        if (!existing) {
          // Award achievement
          const { data: newAchievement, error } = await supabase
            .from('user_achievements')
            .insert({
              user_id: userId,
              achievement_id: achievement.id,
              is_new: true,
              progress: currentValue
            })
            .select(`
              *,
              achievement:achievement_id (*)
            `)
            .single();

          if (!error && newAchievement) {
            newAchievements.push(newAchievement);

            // Create notification
            await createAchievementNotification(userId, newAchievement.achievement);
          }
        }
      }
    }

    return newAchievements;
  } catch (error) {
    console.error('Check and award achievements error:', error);
    return [];
  }
}

// Helper function to create achievement notification
async function createAchievementNotification(userId, achievement) {
  try {
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        notification_type: 'achievement',
        title: 'Achievement Unlocked! 🏆',
        message: `You've unlocked '${achievement.title}' - ${achievement.description}`,
        action_url: '/achievements',
        action_type: 'view_achievements',
        action_data: { achievement_id: achievement.id },
        priority: 'high',
        icon_name: 'trophy'
      });
  } catch (error) {
    console.error('Create achievement notification error:', error);
  }
}

// Export helper function for use in other routes
router.checkAndAwardAchievements = checkAndAwardAchievements;

module.exports = router;
