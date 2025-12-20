# 🚀 Deployment Guide - Phase 1 Features

## Overview
This guide walks you through deploying the reading goals, challenges, achievements, and streak tracking features.

---

## Prerequisites

✅ Node.js 14+ installed  
✅ PostgreSQL/Supabase database access  
✅ Git repository access  
✅ Environment variables configured  

---

## Step 1: Database Migration

### Option A: Using Supabase Dashboard (Recommended)

1. Log into your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `backend/feature-enhancements-migration.sql`
5. Paste into the SQL editor
6. Click **Run** to execute
7. Verify success - should create 32 new tables

### Option B: Using psql Command Line

```bash
# Get your connection string from Supabase dashboard
# Format: postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres

psql "postgresql://postgres:your-password@db.xxx.supabase.co:5432/postgres" \
  < backend/feature-enhancements-migration.sql
```

### Verify Migration Success

Run this query to check tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'reading_goals',
  'community_challenges',
  'challenge_participants',
  'reading_achievements',
  'user_achievements',
  'reading_streaks'
);
```

You should see 6 tables returned.

---

## Step 2: Backend Deployment

### Install Dependencies

```bash
cd backend
npm install
```

No new packages needed - all features use existing dependencies!

### Verify Route Files Exist

```bash
ls -la routes/
# Should see:
# - readingGoals.js
# - challenges.js
# - achievements.js
# - streaks.js
```

### Update Environment Variables

Make sure your `.env` file has:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
PORT=5000
JWT_SECRET=your-secret
```

### Test Backend

```bash
# Start the server
node server.js

# Should see:
# ✅ Server is running on port 5000
# ✅ Supabase connected
```

### Test API Endpoints

```bash
# Test goals endpoint (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/reading-goals/my-goals

# Test challenges endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/challenges

# Test achievements catalog
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/achievements/catalog

# Test streak
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/streaks/my-streak
```

---

## Step 3: Frontend Deployment

### Install Dependencies

```bash
cd frontend
npm install
```

### Verify Component Files

```bash
ls -la src/components/
# Should see:
# - GoalsDashboard.js + .css
# - ChallengesPage.js + .css
# - AchievementsPage.js + .css
# - StreakWidget.js + .css
```

### Update App.js Routes

Add these imports to `src/App.js`:

```javascript
import GoalsDashboard from './components/GoalsDashboard';
import ChallengesPage from './components/ChallengesPage';
import AchievementsPage from './components/AchievementsPage';
import StreakWidget from './components/StreakWidget';
```

Add routes to your Router:

```javascript
<Route path="/goals" element={<GoalsDashboard />} />
<Route path="/challenges" element={<ChallengesPage />} />
<Route path="/achievements" element={<AchievementsPage />} />
```

Add StreakWidget to your Dashboard:

```javascript
// In your Dashboard or Home component
<StreakWidget />
```

### Update Navigation

Add menu items to your navigation component:

```javascript
<NavLink to="/goals">Goals</NavLink>
<NavLink to="/challenges">Challenges</NavLink>
<NavLink to="/achievements">Achievements</NavLink>
```

### Configure Environment

Create/update `.env`:

```env
REACT_APP_API_URL=http://localhost:5000
# Or for production:
REACT_APP_API_URL=https://your-api-domain.com
```

### Build and Test

```bash
# Development mode
npm start

# Production build
npm run build
```

Visit:
- `http://localhost:3000/goals`
- `http://localhost:3000/challenges`
- `http://localhost:3000/achievements`

---

## Step 4: Mobile Deployment

### Install Dependencies

```bash
cd mobile
npm install
```

### Verify Screen Files

```bash
ls -la src/screens/
# Should see:
# - GoalsScreen.js
# - ChallengesScreen.js
```

### Update Navigation

Add screens to your navigator (e.g., `src/navigation/AppNavigator.js`):

```javascript
import GoalsScreen from '../screens/GoalsScreen';
import ChallengesScreen from '../screens/ChallengesScreen';

// In your Stack or Tab Navigator:
<Stack.Screen 
  name="Goals" 
  component={GoalsScreen}
  options={{ title: 'Reading Goals' }}
/>
<Stack.Screen 
  name="Challenges" 
  component={ChallengesScreen}
  options={{ title: 'Challenges' }}
/>
```

### Update API URL

In both screen files, update the API_URL constant:

```javascript
// For local development (iOS simulator)
const API_URL = 'http://localhost:5000';

// For local development (Android emulator)
const API_URL = 'http://10.0.2.2:5000';

// For production
const API_URL = 'https://your-api-domain.com';
```

### Test on Device/Simulator

```bash
# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

---

## Step 5: Seed Initial Data

### Create Predefined Achievements

Run this SQL to populate the achievements catalog:

```sql
-- Insert the 12 predefined achievements
INSERT INTO reading_achievements (code, title, description, icon, category, criteria) VALUES
('first_book', 'First Chapter', 'Finish your first book', '📖', 'milestone', '{"books": 1}'),
('book_collector', 'Book Collector', 'Finish 10 books', '📚', 'milestone', '{"books": 10}'),
('bibliophile', 'Bibliophile', 'Finish 50 books', '📚', 'milestone', '{"books": 50}'),
('speed_reader', 'Speed Reader', 'Read 100 pages in one day', '⚡', 'speed', '{"pages_per_day": 100}'),
('consistent', 'Consistent Reader', 'Maintain a 7-day streak', '🔥', 'consistency', '{"streak": 7}'),
('week_warrior', 'Week Warrior', 'Maintain a 7-day streak', '🔥', 'consistency', '{"streak": 7}'),
('monthly_master', 'Monthly Master', 'Maintain a 30-day streak', '🔥', 'consistency', '{"streak": 30}'),
('centurion', 'Centurion', 'Maintain a 100-day streak', '🏆', 'consistency', '{"streak": 100}'),
('year_champion', 'Year Champion', 'Maintain a 365-day streak', '👑', 'consistency', '{"streak": 365}'),
('genre_explorer', 'Genre Explorer', 'Read books from 5 different genres', '🎭', 'variety', '{"genres": 5}'),
('social_butterfly', 'Social Butterfly', 'Join 3 book clubs', '👥', 'social', '{"clubs": 3}'),
('review_master', 'Review Master', 'Write 25 book reviews', '✍️', 'social', '{"reviews": 25}');
```

### Create Sample Challenges

```sql
-- Create a sample monthly reading challenge
INSERT INTO community_challenges (
  title, 
  description, 
  challenge_type, 
  target_value, 
  start_date, 
  end_date, 
  status,
  prize
) VALUES (
  'December Reading Challenge',
  'Read 5 books before the end of December!',
  'books',
  5,
  '2024-12-01',
  '2024-12-31',
  'active',
  'Digital badge and bragging rights!'
);

-- Create a speed reading challenge
INSERT INTO community_challenges (
  title, 
  description, 
  challenge_type, 
  target_value, 
  start_date, 
  end_date, 
  status
) VALUES (
  'Page Turner Challenge',
  'Read 1000 pages this month',
  'pages',
  1000,
  '2024-12-01',
  '2024-12-31',
  'active'
);
```

---

## Step 6: Integration with Existing Features

### A. Connect Goals to Book Completion

Edit `backend/routes/booklist.js` and add this after a book is marked as finished:

```javascript
// After updating booklist, add:
if (finishedDate && data.books) {
  // Update reading goals
  const { data: goals } = await supabase
    .from('reading_goals')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('status', 'active');

  for (const goal of goals || []) {
    if (goal.goal_type === 'books') {
      const newProgress = goal.current_progress + 1;
      const percentage = Math.round((newProgress / goal.target_value) * 100);
      
      await supabase
        .from('reading_goals')
        .update({
          current_progress: newProgress,
          percentage: percentage,
          status: percentage >= 100 ? 'completed' : 'active'
        })
        .eq('id', goal.id);
    }
  }
}
```

See `GOAL_INTEGRATION_GUIDE.md` for complete integration code.

### B. Connect Diary to Goals

Edit `backend/routes/diary.js` to update page/minute goals when diary entries are created.

### C. Add Streak Widget to Dashboard

In your main dashboard component:

```javascript
import StreakWidget from './components/StreakWidget';

// In your render:
<div className="dashboard-widgets">
  <StreakWidget />
  {/* Other widgets */}
</div>
```

---

## Step 7: Testing

### Test Checklist

- [ ] User can create a reading goal
- [ ] Goal displays with correct progress bar
- [ ] User can delete a goal
- [ ] User can browse active challenges
- [ ] User can join a challenge
- [ ] Leaderboard shows correct rankings
- [ ] User can leave a challenge
- [ ] Achievements page shows earned badges
- [ ] Locked achievements show as ???
- [ ] Streak widget displays current streak
- [ ] "Log Today" button updates streak
- [ ] Marking book as read updates goal progress
- [ ] Completing goal awards achievement
- [ ] 7-day streak awards achievement
- [ ] Mobile screens work on iOS
- [ ] Mobile screens work on Android

### Manual Testing Flow

1. **Create a Goal**
   - Go to `/goals`
   - Click "New Goal"
   - Create: "Read 5 books this month"
   - Verify it appears with 0/5 progress

2. **Test Goal Progress**
   - Go to your booklist
   - Mark a book as finished
   - Return to `/goals`
   - Verify progress shows 1/5 (20%)

3. **Test Challenges**
   - Go to `/challenges`
   - Click on a challenge
   - Click "Join Challenge"
   - Verify leaderboard appears
   - Mark another book as read
   - Check if leaderboard updates

4. **Test Achievements**
   - Go to `/achievements`
   - Verify "First Chapter" is unlocked after finishing 1 book
   - Check that locked achievements show 🔒

5. **Test Streak**
   - Find StreakWidget on dashboard
   - Click "Log Today's Reading"
   - Verify streak increments to 1
   - Check again tomorrow to see if it continues

---

## Step 8: Production Deployment

### Backend (Node.js)

#### Using Heroku:
```bash
cd backend
git init
heroku create your-app-name
git add .
git commit -m "Deploy Phase 1 features"
git push heroku main
```

#### Using Railway:
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

#### Using DigitalOcean App Platform:
1. Connect your GitHub repo
2. Select backend folder
3. Set build command: `npm install`
4. Set run command: `node server.js`
5. Add environment variables
6. Deploy

### Frontend (React)

#### Using Vercel:
```bash
cd frontend
npm i -g vercel
vercel --prod
```

#### Using Netlify:
```bash
cd frontend
npm run build
netlify deploy --prod --dir=build
```

### Mobile (React Native)

#### Build for iOS:
```bash
cd mobile
eas build --platform ios
```

#### Build for Android:
```bash
cd mobile
eas build --platform android
```

---

## Step 9: Monitor & Optimize

### Database Indexes
The migration already includes optimal indexes, but monitor query performance:

```sql
-- Check slow queries
SELECT * FROM pg_stat_statements 
ORDER BY total_exec_time DESC 
LIMIT 10;
```

### API Performance
Monitor endpoint response times:
- Goals endpoints: < 200ms
- Challenges with leaderboard: < 500ms
- Achievements catalog: < 100ms

### User Metrics
Track in your analytics:
- Goal creation rate
- Goal completion rate
- Challenge participation rate
- Average streak length
- Achievement unlock rate

---

## Troubleshooting

### Issue: Routes return 404

**Solution**: Verify routes are registered in `server.js`:

```javascript
app.use('/api/reading-goals', readingGoalsRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/streaks', streaksRoutes);
```

### Issue: Database connection fails

**Solution**: Check environment variables:

```bash
# Test connection
psql "$DATABASE_URL"
```

### Issue: Goals not updating automatically

**Solution**: Check integration code in `booklist.js` - ensure the update function is being called.

### Issue: Mobile screens show white screen

**Solution**: 
1. Check API_URL is correct for your platform
2. Verify auth context is working
3. Check console for errors: `npx react-native log-ios`

### Issue: Achievements not awarding

**Solution**: Verify achievements table has data:

```sql
SELECT * FROM reading_achievements;
```

Should return 12 rows.

---

## Rollback Plan

If you need to rollback:

### Database:
```sql
-- Drop all Phase 1 tables
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS reading_achievements CASCADE;
DROP TABLE IF EXISTS challenge_participants CASCADE;
DROP TABLE IF EXISTS community_challenges CASCADE;
DROP TABLE IF EXISTS reading_goals CASCADE;
DROP TABLE IF EXISTS reading_streaks CASCADE;
```

### Backend:
```bash
git revert <commit-hash>
git push
```

### Frontend:
Remove the new routes from `App.js` and redeploy.

---

## Next Steps

After Phase 1 is stable:

1. **Gather User Feedback** - Survey users about goals/challenges
2. **Monitor Metrics** - Track engagement with new features
3. **Iterate** - Fix bugs, add requested features
4. **Plan Phase 2** - Book Clubs implementation
5. **Consider A/B Testing** - Test different goal types

---

## Support

Need help? Check:
- `PHASE1_IMPLEMENTATION_COMPLETE.md` - Feature documentation
- `GOAL_INTEGRATION_GUIDE.md` - Integration examples
- `READING_CHALLENGES_SPEC.md` - Technical specifications
- `IMPLEMENTATION_ROADMAP.md` - Full roadmap

---

## Success! 🎉

When you see:
- ✅ Users creating and tracking goals
- ✅ Challenge leaderboards populating
- ✅ Achievements being unlocked
- ✅ Streaks building daily

You're ready for Phase 2! Let's build something amazing! 🚀
