# Goal Progress Integration Guide

## Automatic Goal Updates When Books Are Completed

To automatically update reading goals when users finish books, integrate the goal update logic into your existing booklist routes.

## Integration Points

### 1. Book Completion (booklist.js)

When a user marks a book as finished, update their reading goals:

```javascript
// In backend/routes/booklist.js

// Import at the top of the file
const axios = require('axios');

// In the PUT '/:id' route (around line 183)
// After successfully updating the booklist:

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, reviewText, finishedDate, isFavorite } = req.body;

    const updates = {};
    if (rating) {
      const validRatings = ['stayed-up-all-night', 'would-read-again', 'once-was-enough', 'might-come-back-later', 'meh'];
      if (!validRatings.includes(rating)) {
        return res.status(400).json({ message: 'Invalid rating' });
      }
      updates.rating = rating;
    }
    if (reviewText !== undefined) updates.review_text = reviewText;
    if (finishedDate !== undefined) updates.finished_date = finishedDate;
    if (isFavorite !== undefined) updates.is_favorite = isFavorite;

    const { data, error } = await supabase
      .from('user_booklist')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select(`
        *,
        books (
          id,
          title,
          author,
          cover_url,
          description,
          genre
        )
      `)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Book not found in booklist' });
    }

    // ✨ NEW: Update reading goals when book is finished
    if (finishedDate && data.books) {
      await updateReadingGoals(req.user.id, {
        books_completed: 1,
        genre: data.books.genre
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Update booklist error:', error);
    res.status(500).json({ message: 'Failed to update booklist' });
  }
});

// ✨ NEW: Helper function to update goals
async function updateReadingGoals(userId, progressData) {
  try {
    // Get all active goals for this user
    const { data: goals, error } = await supabase
      .from('reading_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error || !goals || goals.length === 0) return;

    // Update each relevant goal
    for (const goal of goals) {
      let newProgress = goal.current_progress;

      // Update based on goal type
      if (goal.goal_type === 'books' && progressData.books_completed) {
        newProgress += progressData.books_completed;
      } else if (goal.goal_type === 'genres' && progressData.genre) {
        // For genre goals, count unique genres
        const genreSet = new Set(goal.progress_details?.genres || []);
        genreSet.add(progressData.genre);
        newProgress = genreSet.size;
      }

      // Update the goal
      if (newProgress !== goal.current_progress) {
        const percentage = Math.round((newProgress / goal.target_value) * 100);
        const status = percentage >= 100 ? 'completed' : 'active';

        await supabase
          .from('reading_goals')
          .update({
            current_progress: newProgress,
            percentage: percentage,
            status: status,
            completed_date: status === 'completed' ? new Date().toISOString() : null,
            progress_details: goal.goal_type === 'genres' 
              ? { genres: Array.from(new Set([...(goal.progress_details?.genres || []), progressData.genre])) }
              : goal.progress_details
          })
          .eq('id', goal.id);

        // Check if goal just completed - award achievement
        if (status === 'completed' && goal.status === 'active') {
          await checkGoalCompletionAchievement(userId);
        }
      }
    }
  } catch (error) {
    console.error('Error updating reading goals:', error);
    // Don't throw - this is a background update
  }
}

// ✨ NEW: Award achievement for completing a goal
async function checkGoalCompletionAchievement(userId) {
  try {
    const { data: completedGoals } = await supabase
      .from('reading_goals')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'completed');

    const goalCount = completedGoals?.length || 0;

    // Award achievement based on number of completed goals
    const achievementMap = {
      1: 'goal_setter',       // Complete your first goal
      5: 'goal_crusher',      // Complete 5 goals
      10: 'goal_master'       // Complete 10 goals
    };

    const achievementCode = achievementMap[goalCount];
    if (achievementCode) {
      // Get achievement ID
      const { data: achievement } = await supabase
        .from('reading_achievements')
        .select('id')
        .eq('code', achievementCode)
        .single();

      if (achievement) {
        // Check if user already has this achievement
        const { data: existing } = await supabase
          .from('user_achievements')
          .select('id')
          .eq('user_id', userId)
          .eq('achievement_id', achievement.id)
          .single();

        if (!existing) {
          // Award the achievement
          await supabase
            .from('user_achievements')
            .insert({
              user_id: userId,
              achievement_id: achievement.id,
              earned_date: new Date().toISOString()
            });

          console.log(`Achievement ${achievementCode} awarded to user ${userId}`);
        }
      }
    }
  } catch (error) {
    console.error('Error checking goal completion achievement:', error);
  }
}
```

### 2. Diary Entry Integration (diary.js)

Update page and minute goals when diary entries are created:

```javascript
// In backend/routes/diary.js

// In the POST '/' route (create diary entry)
// After successfully creating the diary entry:

router.post('/', authenticateToken, async (req, res) => {
  try {
    // ... existing diary creation code ...

    // ✨ NEW: Update reading goals
    if (data) {
      await updateReadingGoalsFromDiary(req.user.id, {
        pages_read: req.body.pages_read || 0,
        minutes_read: req.body.reading_minutes || 0
      });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Create diary entry error:', error);
    res.status(500).json({ message: 'Failed to create diary entry' });
  }
});

// ✨ NEW: Helper function
async function updateReadingGoalsFromDiary(userId, progressData) {
  try {
    const { data: goals, error } = await supabase
      .from('reading_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error || !goals || goals.length === 0) return;

    for (const goal of goals) {
      let newProgress = goal.current_progress;

      // Update based on goal type
      if (goal.goal_type === 'pages' && progressData.pages_read) {
        newProgress += progressData.pages_read;
      } else if (goal.goal_type === 'minutes' && progressData.minutes_read) {
        newProgress += progressData.minutes_read;
      } else {
        continue; // Skip this goal
      }

      // Update the goal
      const percentage = Math.round((newProgress / goal.target_value) * 100);
      const status = percentage >= 100 ? 'completed' : 'active';

      await supabase
        .from('reading_goals')
        .update({
          current_progress: newProgress,
          percentage: percentage,
          status: status,
          completed_date: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', goal.id);
    }
  } catch (error) {
    console.error('Error updating reading goals from diary:', error);
  }
}
```

### 3. Challenge Progress Integration

When users complete books, also update their challenge progress:

```javascript
// Add to booklist.js after updating goals

async function updateChallengeProgress(userId, bookData) {
  try {
    // Get active challenges user is participating in
    const { data: participations, error } = await supabase
      .from('challenge_participants')
      .select(`
        id,
        progress,
        community_challenges (
          id,
          challenge_type,
          target_value,
          status
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error || !participations) return;

    for (const participation of participations) {
      const challenge = participation.community_challenges;
      
      // Only update if challenge is active
      if (challenge.status !== 'active') continue;

      let newProgress = participation.progress;

      // Update based on challenge type
      if (challenge.challenge_type === 'books') {
        newProgress += 1;
      } else if (challenge.challenge_type === 'genres' && bookData.genre) {
        // For genre challenges, increment for each book in a different genre
        newProgress += 1;
      }

      // Update participant progress
      if (newProgress !== participation.progress) {
        await supabase
          .from('challenge_participants')
          .update({
            progress: newProgress,
            status: newProgress >= challenge.target_value ? 'completed' : 'active'
          })
          .eq('id', participation.id);
      }
    }
  } catch (error) {
    console.error('Error updating challenge progress:', error);
  }
}

// Call this in your booklist update route:
if (finishedDate && data.books) {
  await updateReadingGoals(req.user.id, {
    books_completed: 1,
    genre: data.books.genre
  });
  await updateChallengeProgress(req.user.id, data.books);
}
```

### 4. Streak Tracking

Update daily reading streak from diary entries:

```javascript
// In backend/routes/diary.js
// After creating diary entry:

async function updateReadingStreak(userId) {
  try {
    // Get or create streak record
    let { data: streak, error } = await supabase
      .from('reading_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !streak) {
      // Create new streak
      const { data: newStreak } = await supabase
        .from('reading_streaks')
        .insert({
          user_id: userId,
          current_streak: 1,
          longest_streak: 1,
          last_read_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();
      
      return newStreak;
    }

    // Check if this is today's first entry
    const today = new Date().toISOString().split('T')[0];
    const lastRead = new Date(streak.last_read_date).toISOString().split('T')[0];

    if (lastRead === today) {
      // Already logged today, no streak update needed
      return streak;
    }

    // Check if streak continues or breaks
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = streak.current_streak;
    if (lastRead === yesterdayStr) {
      // Streak continues!
      newStreak += 1;
    } else {
      // Streak broke, start over
      newStreak = 1;
    }

    // Update streak
    const longestStreak = Math.max(streak.longest_streak, newStreak);
    
    await supabase
      .from('reading_streaks')
      .update({
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_read_date: today
      })
      .eq('user_id', userId);

    // Check for streak milestones
    const milestones = [7, 30, 100, 365];
    if (milestones.includes(newStreak)) {
      await awardStreakAchievement(userId, newStreak);
    }

  } catch (error) {
    console.error('Error updating reading streak:', error);
  }
}

async function awardStreakAchievement(userId, streakDays) {
  const achievementCodes = {
    7: 'week_warrior',
    30: 'monthly_master',
    100: 'centurion',
    365: 'year_champion'
  };

  const code = achievementCodes[streakDays];
  if (!code) return;

  try {
    const { data: achievement } = await supabase
      .from('reading_achievements')
      .select('id')
      .eq('code', code)
      .single();

    if (achievement) {
      const { data: existing } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_id', achievement.id)
        .single();

      if (!existing) {
        await supabase
          .from('user_achievements')
          .insert({
            user_id: userId,
            achievement_id: achievement.id,
            earned_date: new Date().toISOString()
          });
      }
    }
  } catch (error) {
    console.error('Error awarding streak achievement:', error);
  }
}

// Call in diary POST route:
await updateReadingStreak(req.user.id);
```

## Summary of Changes Needed

### Files to Modify:

1. **`backend/routes/booklist.js`**
   - Add `updateReadingGoals()` function
   - Add `updateChallengeProgress()` function
   - Add `checkGoalCompletionAchievement()` function
   - Call these functions in PUT '/:id' route when book is finished

2. **`backend/routes/diary.js`**
   - Add `updateReadingGoalsFromDiary()` function
   - Add `updateReadingStreak()` function
   - Add `awardStreakAchievement()` function
   - Call these functions in POST '/' route after diary entry created

### Testing the Integration

1. Create a reading goal: "Read 5 books this month"
2. Mark a book as finished in your booklist
3. Verify the goal progress increments automatically
4. Create a diary entry with pages read
5. Verify page goals update
6. Complete a goal and verify achievement is awarded
7. Log reading for 7 consecutive days
8. Verify streak achievement is awarded

### Database Triggers (Optional Advanced)

For even more automatic updates, you could create PostgreSQL triggers:

```sql
-- Trigger to auto-update goals when booklist changes
CREATE OR REPLACE FUNCTION update_goals_on_book_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.finished_date IS NOT NULL AND OLD.finished_date IS NULL THEN
    -- Book just marked as finished
    UPDATE reading_goals
    SET current_progress = current_progress + 1,
        percentage = ROUND(((current_progress + 1)::numeric / target_value::numeric) * 100),
        status = CASE 
          WHEN current_progress + 1 >= target_value THEN 'completed'
          ELSE 'active'
        END
    WHERE user_id = NEW.user_id
      AND goal_type = 'books'
      AND status = 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booklist_update_goals
  AFTER UPDATE ON user_booklist
  FOR EACH ROW
  EXECUTE FUNCTION update_goals_on_book_completion();
```

This makes the system fully automatic without needing JavaScript logic!
