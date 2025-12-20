# Reading Challenges & Goals - Technical Specification

## Overview
Gamified reading system with personal goals, community challenges, achievements, and leaderboards to increase user engagement and retention.

---

## Database Schema

### 1. `reading_goals` Table
```sql
CREATE TABLE reading_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type VARCHAR(50) NOT NULL, -- 'books', 'pages', 'minutes', 'genres'
  target_value INTEGER NOT NULL,
  current_progress INTEGER DEFAULT 0,
  time_period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'failed', 'abandoned'
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, goal_type, time_period, start_date)
);

CREATE INDEX idx_reading_goals_user ON reading_goals(user_id);
CREATE INDEX idx_reading_goals_status ON reading_goals(status);
CREATE INDEX idx_reading_goals_period ON reading_goals(time_period, end_date);
```

### 2. `community_challenges` Table
```sql
CREATE TABLE community_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  challenge_type VARCHAR(50) NOT NULL, -- 'book_count', 'page_count', 'genre_explorer', 'reading_streak', 'series_complete'
  target_value INTEGER NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  is_global BOOLEAN DEFAULT false,
  difficulty VARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard', 'extreme'
  reward_points INTEGER DEFAULT 100,
  banner_image_url TEXT,
  rules JSONB, -- Additional challenge-specific rules
  status VARCHAR(20) DEFAULT 'upcoming', -- 'upcoming', 'active', 'completed', 'archived'
  participant_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_challenges_status ON community_challenges(status);
CREATE INDEX idx_challenges_dates ON community_challenges(start_date, end_date);
```

### 3. `challenge_participants` Table
```sql
CREATE TABLE challenge_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID REFERENCES community_challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  rank INTEGER,
  points_earned INTEGER DEFAULT 0,
  UNIQUE(challenge_id, user_id)
);

CREATE INDEX idx_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX idx_participants_user ON challenge_participants(user_id);
CREATE INDEX idx_participants_rank ON challenge_participants(challenge_id, rank);
```

### 4. `reading_achievements` Table
```sql
CREATE TABLE reading_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  icon_name VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'reading', 'social', 'reviewing', 'streaks', 'milestones'
  tier VARCHAR(20) DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum'
  points INTEGER DEFAULT 10,
  requirement_value INTEGER,
  requirement_type VARCHAR(50), -- 'books_read', 'pages_read', 'days_streak', 'reviews_written', etc.
  is_secret BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_achievements_category ON reading_achievements(category);
```

### 5. `user_achievements` Table
```sql
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES reading_achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  is_new BOOLEAN DEFAULT true,
  displayed BOOLEAN DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_new ON user_achievements(user_id, is_new);
```

### 6. `reading_streaks` Table
```sql
CREATE TABLE reading_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_reading_date DATE,
  streak_started_at DATE,
  total_reading_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_streaks_user ON reading_streaks(user_id);
CREATE INDEX idx_streaks_longest ON reading_streaks(longest_streak DESC);
```

### 7. `leaderboards` Table (Cached/Materialized View)
```sql
CREATE TABLE leaderboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leaderboard_type VARCHAR(50) NOT NULL, -- 'books_month', 'pages_year', 'streak_current', 'points_total'
  time_period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly', 'all_time'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  rankings JSONB NOT NULL, -- Array of {user_id, username, value, rank}
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(leaderboard_type, time_period, period_start)
);

CREATE INDEX idx_leaderboards_type ON leaderboards(leaderboard_type, time_period);
```

---

## API Endpoints

### Reading Goals

#### **GET /api/reading-goals/my-goals**
Get all goals for current user
```javascript
Response: {
  goals: [
    {
      id: "uuid",
      goal_type: "books",
      target_value: 52,
      current_progress: 23,
      time_period: "yearly",
      start_date: "2025-01-01",
      end_date: "2025-12-31",
      status: "active",
      percentage: 44.2
    }
  ]
}
```

#### **POST /api/reading-goals**
Create new reading goal
```javascript
Request: {
  goal_type: "books", // 'books', 'pages', 'minutes', 'genres'
  target_value: 52,
  time_period: "yearly" // 'daily', 'weekly', 'monthly', 'yearly'
}
Response: { goal: {...}, message: "Goal created successfully" }
```

#### **PUT /api/reading-goals/:goalId**
Update goal progress (auto-triggered by reading activity)
```javascript
Request: {
  current_progress: 24
}
Response: { 
  goal: {...}, 
  completed: false,
  achievement_unlocked: null
}
```

#### **DELETE /api/reading-goals/:goalId**
Delete/abandon goal

---

### Community Challenges

#### **GET /api/challenges**
Get all active and upcoming challenges
```javascript
Query: ?status=active&difficulty=medium&limit=20
Response: {
  challenges: [
    {
      id: "uuid",
      title: "2025 Reading Challenge",
      description: "Read 52 books in 2025",
      challenge_type: "book_count",
      target_value: 52,
      start_date: "2025-01-01",
      end_date: "2025-12-31",
      difficulty: "hard",
      reward_points: 500,
      participant_count: 15420,
      is_participating: true,
      my_progress: 23
    }
  ]
}
```

#### **GET /api/challenges/:challengeId**
Get challenge details with leaderboard
```javascript
Response: {
  challenge: {...},
  leaderboard: [
    {
      rank: 1,
      user_id: "uuid",
      username: "bookworm23",
      progress: 45,
      points_earned: 450
    }
  ],
  my_participation: {
    progress: 23,
    rank: 456,
    completed: false
  }
}
```

#### **POST /api/challenges/:challengeId/join**
Join a challenge
```javascript
Response: { message: "Successfully joined challenge", participation: {...} }
```

#### **POST /api/challenges/:challengeId/leave**
Leave a challenge

#### **POST /api/challenges** (Admin/Premium Users)
Create custom challenge
```javascript
Request: {
  title: "Fantasy Reading Month",
  description: "Read 5 fantasy books in January",
  challenge_type: "genre_explorer",
  target_value: 5,
  start_date: "2025-01-01",
  end_date: "2025-01-31",
  difficulty: "medium",
  rules: { genre: "fantasy" }
}
```

---

### Achievements

#### **GET /api/achievements/catalog**
Get all available achievements
```javascript
Response: {
  achievements: [
    {
      id: "uuid",
      code: "FIRST_BOOK",
      title: "First Chapter",
      description: "Complete your first book",
      icon_name: "book-open",
      category: "milestones",
      tier: "bronze",
      points: 10,
      earned: true,
      earned_at: "2025-01-15"
    }
  ]
}
```

#### **GET /api/achievements/my-achievements**
Get user's earned achievements
```javascript
Response: {
  achievements: [...],
  total_points: 1250,
  new_achievements_count: 3
}
```

#### **POST /api/achievements/:achievementId/mark-displayed**
Mark achievement notification as seen

---

### Streaks

#### **GET /api/streaks/my-streak**
Get current user's reading streak
```javascript
Response: {
  current_streak: 15,
  longest_streak: 42,
  last_reading_date: "2025-12-20",
  streak_started_at: "2025-12-05",
  total_reading_days: 180
}
```

#### **POST /api/streaks/update**
Update streak (called when user adds diary entry or marks book progress)

---

### Leaderboards

#### **GET /api/leaderboards/:type**
Get leaderboard
```javascript
Params: type = 'books_month' | 'pages_year' | 'streak_current' | 'points_total'
Query: ?period=monthly&limit=100
Response: {
  leaderboard_type: "books_month",
  period: "December 2025",
  my_rank: 23,
  my_value: 8,
  rankings: [
    {
      rank: 1,
      user_id: "uuid",
      username: "speedreader",
      avatar_url: "...",
      value: 25,
      is_me: false
    }
  ]
}
```

---

## Automatic Progress Tracking

### Triggers for Goal/Challenge Progress Updates

1. **Book Completed** (status changed to 'read')
   - Increment book_count goals
   - Update relevant challenges
   - Check for achievements
   - Update streak if diary entry exists

2. **Diary Entry Created**
   - Update reading streak
   - Estimate pages read (if duration tracked)
   - Check for writing achievements

3. **Reading Session Logged**
   - Update minutes_read goals
   - Update page_count goals
   - Refresh leaderboards

### Achievement Trigger System
```javascript
// Automatic achievement checking
const ACHIEVEMENT_TRIGGERS = {
  'FIRST_BOOK': { type: 'books_read', value: 1 },
  'BIBLIOPHILE': { type: 'books_read', value: 50 },
  'CENTURION': { type: 'books_read', value: 100 },
  'WEEK_WARRIOR': { type: 'days_streak', value: 7 },
  'MONTH_MASTER': { type: 'days_streak', value: 30 },
  'YEAR_LEGEND': { type: 'days_streak', value: 365 },
  'GENRE_EXPLORER': { type: 'unique_genres', value: 10 },
  'SPEED_READER': { type: 'books_in_week', value: 5 },
  'NIGHT_OWL': { type: 'late_night_reads', value: 10 },
  'EARLY_BIRD': { type: 'morning_reads', value: 10 },
  'SOCIAL_BUTTERFLY': { type: 'forum_posts', value: 50 },
  'HELPFUL_REVIEWER': { type: 'review_likes', value: 100 }
};
```

---

## Frontend Components

### React Components Needed

1. **GoalsDashboard.js** - Display all user goals with progress bars
2. **GoalCreateModal.js** - Create new goals
3. **ChallengesPage.js** - Browse and join challenges
4. **ChallengeCard.js** - Individual challenge display
5. **LeaderboardView.js** - Show rankings
6. **AchievementsGallery.js** - Display earned/locked achievements
7. **AchievementToast.js** - Popup when achievement earned
8. **StreakWidget.js** - Show current streak with flame icon
9. **ProgressBar.js** - Reusable progress indicator
10. **RankBadge.js** - User rank display

### Mobile Screens Needed

1. **GoalsScreen.js** - Goals management
2. **ChallengesScreen.js** - Browse challenges
3. **ChallengeDetailScreen.js** - Challenge details + leaderboard
4. **AchievementsScreen.js** - Achievement gallery
5. **LeaderboardScreen.js** - Leaderboard view
6. **StreakScreen.js** - Detailed streak statistics

---

## Push Notification Events

1. **Goal Progress**: "You're 80% to your monthly goal! Just 2 more books!"
2. **Goal Completed**: "🎉 Goal achieved! You read 12 books this month!"
3. **Challenge Milestone**: "You're in the top 10% of the 2025 Reading Challenge!"
4. **Achievement Unlocked**: "Achievement Unlocked: Week Warrior 🔥"
5. **Streak Reminder**: "Don't break your 15-day streak! Log today's reading."
6. **Streak Milestone**: "🔥 30-day reading streak! You're on fire!"
7. **Rank Change**: "You moved up to #15 on the monthly leaderboard!"
8. **Friend Achievement**: "Sarah just unlocked Bibliophile! Send congrats 👏"

---

## Gamification Point System

### Points Earned
- Complete a book: **10 points**
- Write a review: **5 points**
- Add diary entry: **2 points**
- Maintain 7-day streak: **15 points**
- Complete a challenge: **Challenge reward_points**
- Earn achievement: **Achievement points**
- Help others (forum post liked): **1 point per like**

### Points Used For
- Leaderboard rankings
- Unlock special badges
- Premium features (future: redeem points)
- Bragging rights

---

## Implementation Priority

### Phase 1 (Week 1-2)
1. Database schema creation
2. Basic goal CRUD APIs
3. Goal progress tracking
4. Simple streak system

### Phase 2 (Week 3-4)
1. Community challenges
2. Leaderboards
3. Frontend goal dashboard
4. Mobile goals screen

### Phase 3 (Week 5-6)
1. Achievement system
2. Achievement notifications
3. Achievement gallery UI
4. Automated achievement detection

### Phase 4 (Week 7-8)
1. Push notifications
2. Social sharing
3. Challenge creation
4. Polish and testing

---

## Performance Considerations

1. **Leaderboard Caching**: Refresh every 15 minutes, not real-time
2. **Achievement Checking**: Use background jobs, not on every request
3. **Streak Calculation**: Calculate once daily at midnight
4. **Goal Progress**: Update immediately for user, batch for challenges
5. **Database Indexing**: Essential for fast leaderboard queries

---

## Success Metrics

- **Engagement**: % users with active goals
- **Retention**: 7-day, 30-day retention for users with vs without goals
- **Challenge Participation**: % of active users joining challenges
- **Achievement Collection**: Avg achievements per user
- **Streak Length**: Average current streak length
- **Social Sharing**: % of achievements shared
