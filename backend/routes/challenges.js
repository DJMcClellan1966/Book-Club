const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser, optionalAuth } = require('../middleware/auth.supabase');

// Get all challenges
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status = 'active', difficulty, limit = 20 } = req.query;
    const userId = req.user?.id;
    
    // Enforce max limit to prevent large result sets
    const maxLimit = Math.min(parseInt(limit) || 20, 100);

    let query = supabase
      .from('community_challenges')
      .select('*')
      .order('start_date', { ascending: false })
      .limit(maxLimit);

    if (status) {
      query = query.eq('status', status);
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data: challenges, error } = await query;

    if (error) throw error;

    // If user is logged in, check participation status
    if (userId) {
      const challengeIds = challenges.map(c => c.id);
      const { data: participations } = await supabase
        .from('challenge_participants')
        .select('challenge_id, current_progress')
        .eq('user_id', userId)
        .in('challenge_id', challengeIds);

      const participationMap = {};
      participations?.forEach(p => {
        participationMap[p.challenge_id] = p;
      });

      challenges.forEach(challenge => {
        const participation = participationMap[challenge.id];
        challenge.is_participating = !!participation;
        challenge.my_progress = participation?.current_progress || 0;
      });
    }

    res.json({ challenges });
  } catch (error) {
    console.error('Get challenges error:', error);
    res.status(500).json({ message: 'Failed to get challenges' });
  }
});

// Get challenge details with leaderboard
router.get('/:challengeId', optionalAuth, async (req, res) => {
  try {
    const { challengeId } = req.params;
    const userId = req.user?.id;

    // Get challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('community_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (challengeError || !challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Get leaderboard (top 100)
    const { data: leaderboard, error: leaderboardError } = await supabase
      .from('challenge_participants')
      .select(`
        rank,
        current_progress,
        points_earned,
        user_id,
        profiles:user_id (username, avatar_url)
      `)
      .eq('challenge_id', challengeId)
      .order('current_progress', { ascending: false })
      .limit(100);

    if (leaderboardError) throw leaderboardError;

    // Format leaderboard
    const formattedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      user_id: entry.user_id,
      username: entry.profiles?.username || 'Anonymous',
      avatar_url: entry.profiles?.avatar_url,
      progress: entry.current_progress,
      points_earned: entry.points_earned
    }));

    // Get user's participation if logged in
    let my_participation = null;
    if (userId) {
      const { data: participation } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .maybeSingle();

      if (participation) {
        my_participation = {
          progress: participation.current_progress,
          rank: participation.rank || formattedLeaderboard.findIndex(l => l.user_id === userId) + 1,
          completed: participation.completed
        };
      }
    }

    res.json({
      challenge,
      leaderboard: formattedLeaderboard,
      my_participation
    });
  } catch (error) {
    console.error('Get challenge details error:', error);
    res.status(500).json({ message: 'Failed to get challenge details' });
  }
});

// Join a challenge
router.post('/:challengeId/join', authenticateUser, async (req, res) => {
  try {
    const { challengeId } = req.params;

    // Check if challenge exists
    const { data: challenge, error: challengeError } = await supabase
      .from('community_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (challengeError || !challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Check if already participating
    const { data: existing } = await supabase
      .from('challenge_participants')
      .select('id')
      .eq('challenge_id', challengeId)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ message: 'Already participating in this challenge' });
    }

    // Join challenge
    const { data, error } = await supabase
      .from('challenge_participants')
      .insert({
        challenge_id: challengeId,
        user_id: req.user.id,
        current_progress: 0
      })
      .select()
      .single();

    if (error) throw error;

    // Update participant count
    await supabase
      .from('community_challenges')
      .update({ 
        participant_count: challenge.participant_count + 1 
      })
      .eq('id', challengeId);

    res.json({ 
      message: 'Successfully joined challenge',
      participation: data 
    });
  } catch (error) {
    console.error('Join challenge error:', error);
    res.status(500).json({ message: 'Failed to join challenge' });
  }
});

// Leave a challenge
router.post('/:challengeId/leave', authenticateUser, async (req, res) => {
  try {
    const { challengeId } = req.params;

    const { error } = await supabase
      .from('challenge_participants')
      .delete()
      .eq('challenge_id', challengeId)
      .eq('user_id', req.user.id);

    if (error) throw error;

    // Update participant count
    await supabase.rpc('decrement_challenge_participants', { challenge_id: challengeId });

    res.json({ message: 'Successfully left challenge' });
  } catch (error) {
    console.error('Leave challenge error:', error);
    res.status(500).json({ message: 'Failed to leave challenge' });
  }
});

// Create challenge (admin or premium users)
router.post('/', authenticateUser, async (req, res) => {
  try {
    const {
      title,
      description,
      challenge_type,
      target_value,
      start_date,
      end_date,
      difficulty = 'medium',
      rules
    } = req.body;

    if (!title || !description || !challenge_type || !target_value || !start_date || !end_date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check user tier (for now, allow all authenticated users)
    // In production, check if user has permission to create challenges

    const { data, error } = await supabase
      .from('community_challenges')
      .insert({
        title,
        description,
        challenge_type,
        target_value,
        start_date,
        end_date,
        difficulty,
        rules,
        created_by: req.user.id,
        is_global: false,
        status: new Date(start_date) > new Date() ? 'upcoming' : 'active'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ 
      challenge: data,
      message: 'Challenge created successfully' 
    });
  } catch (error) {
    console.error('Create challenge error:', error);
    res.status(500).json({ message: 'Failed to create challenge' });
  }
});

// Update challenge progress (called automatically when user completes books)
router.put('/:challengeId/progress', authenticateUser, async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { progress } = req.body;

    // Get challenge
    const { data: challenge } = await supabase
      .from('community_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Update progress
    const completed = progress >= challenge.target_value;
    const updates = {
      current_progress: progress,
      completed,
      points_earned: completed ? challenge.reward_points : Math.floor((progress / challenge.target_value) * challenge.reward_points)
    };

    if (completed) {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('challenge_participants')
      .update(updates)
      .eq('challenge_id', challengeId)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    // Update leaderboard ranks
    await updateLeaderboardRanks(challengeId);

    res.json({ 
      participation: data,
      message: completed ? 'Challenge completed!' : 'Progress updated'
    });
  } catch (error) {
    console.error('Update challenge progress error:', error);
    res.status(500).json({ message: 'Failed to update progress' });
  }
});

// Helper function to update leaderboard ranks
async function updateLeaderboardRanks(challengeId) {
  try {
    const { data: participants } = await supabase
      .from('challenge_participants')
      .select('id, current_progress')
      .eq('challenge_id', challengeId)
      .order('current_progress', { ascending: false });

    if (participants) {
      for (let i = 0; i < participants.length; i++) {
        await supabase
          .from('challenge_participants')
          .update({ rank: i + 1 })
          .eq('id', participants[i].id);
      }
    }
  } catch (error) {
    console.error('Update ranks error:', error);
  }
}

module.exports = router;
