# Notifications & Communication - Technical Specification

## Overview
Comprehensive push notification system, in-app notifications, email digests, and real-time communication features.

---

## Database Schema

### 1. `notifications` Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- 'achievement', 'goal', 'friend', 'club', 'challenge', 'social', 'reminder', 'system'
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  action_type VARCHAR(50), -- 'view_book', 'view_profile', 'join_club', 'view_challenge', etc.
  action_data JSONB,
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  category VARCHAR(50), -- 'engagement', 'social', 'milestone', 'reminder'
  icon_name VARCHAR(50),
  image_url TEXT,
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  sent_via JSONB DEFAULT '{"push": false, "email": false, "in_app": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_expires ON notifications(expires_at);
```

### 2. `notification_preferences` Table
```sql
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Push notification preferences
  push_enabled BOOLEAN DEFAULT true,
  push_achievements BOOLEAN DEFAULT true,
  push_goals BOOLEAN DEFAULT true,
  push_friends BOOLEAN DEFAULT true,
  push_clubs BOOLEAN DEFAULT true,
  push_challenges BOOLEAN DEFAULT true,
  push_reminders BOOLEAN DEFAULT true,
  push_social BOOLEAN DEFAULT true,
  
  -- Email preferences
  email_enabled BOOLEAN DEFAULT true,
  email_daily_digest BOOLEAN DEFAULT true,
  email_weekly_summary BOOLEAN DEFAULT true,
  email_achievements BOOLEAN DEFAULT true,
  email_friend_activity BOOLEAN DEFAULT true,
  email_club_updates BOOLEAN DEFAULT true,
  email_marketing BOOLEAN DEFAULT false,
  
  -- In-app preferences
  in_app_enabled BOOLEAN DEFAULT true,
  in_app_sound BOOLEAN DEFAULT true,
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone VARCHAR(50) DEFAULT 'UTC',
  
  -- Digest timing
  digest_time TIME DEFAULT '09:00',
  weekly_digest_day VARCHAR(20) DEFAULT 'sunday',
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. `push_tokens` Table
```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL,
  device_type VARCHAR(20) NOT NULL, -- 'ios', 'android', 'web'
  device_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, device_token)
);

CREATE INDEX idx_tokens_user ON push_tokens(user_id, is_active);
```

### 4. `email_queue` Table
```sql
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type VARCHAR(50) NOT NULL, -- 'daily_digest', 'weekly_summary', 'achievement', 'custom'
  subject VARCHAR(200) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  send_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_email_queue_status ON email_queue(status, send_at);
CREATE INDEX idx_email_queue_user ON email_queue(user_id);
```

### 5. `notification_batches` Table
```sql
CREATE TABLE notification_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_type VARCHAR(50) NOT NULL, -- 'daily_digest', 'weekly_summary', 'challenge_update'
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_ids JSONB NOT NULL, -- Array of notification IDs
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_batches_user ON notification_batches(user_id, batch_type);
```

---

## API Endpoints

### Notifications

#### **GET /api/notifications**
Get user's notifications
```javascript
Query: ?is_read=false&type=achievement&limit=50&offset=0
Response: {
  notifications: [
    {
      id: "uuid",
      type: "achievement",
      title: "Achievement Unlocked!",
      message: "You've unlocked 'Week Warrior' - 7-day reading streak",
      icon_name: "trophy",
      action_url: "/achievements",
      action_data: {
        achievement_id: "uuid"
      },
      is_read: false,
      created_at: "2025-12-20T10:00:00Z",
      priority: "high"
    },
    {
      type: "friend",
      title: "New Follower",
      message: "bookworm23 started following you",
      icon_name: "user-plus",
      action_url: "/profile/bookworm23",
      is_read: false,
      created_at: "2025-12-20T09:30:00Z"
    },
    {
      type: "goal",
      title: "Goal Progress",
      message: "You're 80% to your monthly reading goal! Just 2 more books!",
      icon_name: "target",
      action_url: "/goals",
      is_read: true,
      created_at: "2025-12-19T18:00:00Z"
    }
  ],
  unread_count: 12,
  total: 156
}
```

#### **GET /api/notifications/unread-count**
Get count of unread notifications
```javascript
Response: {
  unread_count: 12,
  by_type: {
    achievement: 2,
    friend: 5,
    goal: 3,
    club: 2
  }
}
```

#### **PUT /api/notifications/:notificationId/read**
Mark notification as read

#### **PUT /api/notifications/mark-all-read**
Mark all notifications as read

#### **DELETE /api/notifications/:notificationId**
Delete notification

#### **PUT /api/notifications/:notificationId/archive**
Archive notification

---

### Notification Preferences

#### **GET /api/notifications/preferences**
Get user's notification preferences
```javascript
Response: {
  preferences: {
    push_enabled: true,
    push_achievements: true,
    push_goals: true,
    email_enabled: true,
    email_daily_digest: true,
    quiet_hours_enabled: true,
    quiet_hours_start: "22:00",
    quiet_hours_end: "08:00",
    digest_time: "09:00",
    timezone: "America/New_York"
  }
}
```

#### **PUT /api/notifications/preferences**
Update notification preferences
```javascript
Request: {
  push_achievements: false,
  email_weekly_summary: true,
  quiet_hours_enabled: true,
  quiet_hours_start: "22:00",
  quiet_hours_end: "08:00"
}
Response: {
  message: "Preferences updated",
  preferences: {...}
}
```

---

### Push Tokens

#### **POST /api/push-tokens**
Register device for push notifications
```javascript
Request: {
  device_token: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  device_type: "ios",
  device_name: "iPhone 13"
}
Response: {
  message: "Device registered for push notifications"
}
```

#### **DELETE /api/push-tokens/:token**
Unregister device

---

### Email Subscriptions

#### **POST /api/notifications/test-email**
Send test email to verify setup

#### **GET /api/notifications/digest-preview**
Preview daily/weekly digest
```javascript
Query: ?type=daily
Response: {
  subject: "Your Daily Reading Digest - Dec 20, 2025",
  preview_html: "<html>...",
  notifications_included: 8,
  highlights: [
    "3 friends finished books today",
    "You're 2 books from your goal",
    "New club discussion: Chapter 10"
  ]
}
```

---

## Notification Types & Templates

### Achievement Notifications
```javascript
{
  type: "achievement",
  title: "Achievement Unlocked! 🏆",
  message: "You've unlocked '{achievement_name}' - {achievement_description}",
  action_url: "/achievements",
  priority: "high",
  icon_name: "trophy"
}
```

### Goal Progress Notifications
```javascript
{
  type: "goal",
  title: "Goal Progress 🎯",
  message: "You're {percentage}% to your {period} goal! Just {remaining} more!",
  action_url: "/goals",
  priority: "normal",
  icon_name: "target"
}
```

### Friend Activity Notifications
```javascript
{
  type: "friend",
  title: "{username} finished a book",
  message: "{username} finished '{book_title}' and rated it {rating}⭐",
  action_url: "/books/{book_id}",
  priority: "low",
  icon_name: "book"
}
```

### Club Notifications
```javascript
{
  type: "club",
  title: "New club discussion",
  message: "12 new comments in {club_name} - {checkpoint_name}",
  action_url: "/clubs/{club_id}/checkpoints/{checkpoint_id}",
  priority: "normal",
  icon_name: "message-circle"
}
```

### Reading Reminders
```javascript
{
  type: "reminder",
  title: "Time to read! 📚",
  message: "You usually read at this time. Start a session?",
  action_url: "/reading-session/start",
  priority: "low",
  icon_name: "clock"
}
```

### Streak Reminders
```javascript
{
  type: "reminder",
  title: "Don't break your streak! 🔥",
  message: "Your {streak_days}-day reading streak ends today. Log an entry!",
  action_url: "/diary/add",
  priority: "high",
  icon_name: "flame"
}
```

---

## Push Notification Service

### Expo Push Notifications (Mobile)
```javascript
const { Expo } = require('expo-server-sdk');
const expo = new Expo();

async function sendPushNotification(userId, notification) {
  // Get user's active device tokens
  const tokens = await db.push_tokens
    .where({ user_id: userId, is_active: true })
    .select('device_token');
  
  // Check quiet hours
  const preferences = await getUserPreferences(userId);
  if (isQuietHours(preferences)) {
    return; // Don't send during quiet hours
  }
  
  // Check if this notification type is enabled
  if (!preferences[`push_${notification.type}`]) {
    return; // User disabled this type
  }
  
  // Prepare messages
  const messages = tokens.map(({ device_token }) => ({
    to: device_token,
    sound: 'default',
    title: notification.title,
    body: notification.message,
    data: {
      notification_id: notification.id,
      action_url: notification.action_url,
      action_data: notification.action_data
    },
    badge: await getUnreadCount(userId),
    priority: notification.priority === 'high' ? 'high' : 'normal'
  }));
  
  // Send notifications
  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error('Push notification error:', error);
    }
  }
}
```

### Web Push Notifications
```javascript
const webpush = require('web-push');

async function sendWebPush(userId, notification) {
  const subscriptions = await db.push_tokens
    .where({ user_id: userId, device_type: 'web', is_active: true })
    .select('device_token');
  
  const payload = JSON.stringify({
    title: notification.title,
    body: notification.message,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: {
      url: notification.action_url
    }
  });
  
  for (const { device_token } of subscriptions) {
    try {
      await webpush.sendNotification(JSON.parse(device_token), payload);
    } catch (error) {
      if (error.statusCode === 410) {
        // Token expired, mark as inactive
        await db.push_tokens
          .where({ device_token })
          .update({ is_active: false });
      }
    }
  }
}
```

---

## Email Digest Service

### Daily Digest
```javascript
async function generateDailyDigest(userId) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const data = {
    friend_activity: await getFriendActivity(userId, yesterday),
    club_updates: await getClubUpdates(userId, yesterday),
    goal_progress: await getGoalProgress(userId),
    recommendations: await getRecommendations(userId, 3),
    stats: await getDailyStats(userId, yesterday),
    unread_notifications: await getUnreadCount(userId)
  };
  
  const html = await renderTemplate('daily-digest', data);
  
  return {
    subject: `Your Daily Reading Digest - ${formatDate(new Date())}`,
    html,
    text: await htmlToText(html)
  };
}
```

### Weekly Summary
```javascript
async function generateWeeklySummary(userId) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const data = {
    books_completed: await getBooksCompleted(userId, weekAgo),
    pages_read: await getPagesRead(userId, weekAgo),
    reading_time: await getReadingTime(userId, weekAgo),
    achievements_unlocked: await getAchievements(userId, weekAgo),
    top_friends: await getTopFriends(userId, weekAgo),
    next_week_goals: await getUpcomingGoals(userId),
    trending_books: await getTrendingBooks(5),
    challenge_updates: await getChallengeUpdates(userId)
  };
  
  const html = await renderTemplate('weekly-summary', data);
  
  return {
    subject: `Your Week in Reading - ${formatWeek(new Date())}`,
    html,
    text: await htmlToText(html)
  };
}
```

---

## Notification Triggers

### Automatic Triggers
```javascript
const NOTIFICATION_TRIGGERS = {
  // Achievement unlocked
  'achievement.unlocked': async (userId, achievementId) => {
    const achievement = await getAchievement(achievementId);
    return {
      type: 'achievement',
      title: 'Achievement Unlocked! 🏆',
      message: `You've unlocked '${achievement.title}' - ${achievement.description}`,
      action_url: '/achievements',
      priority: 'high'
    };
  },
  
  // Goal milestone
  'goal.milestone': async (userId, goalId, percentage) => {
    const goal = await getGoal(goalId);
    return {
      type: 'goal',
      title: 'Goal Progress 🎯',
      message: `You're ${percentage}% to your ${goal.time_period} goal!`,
      action_url: '/goals',
      priority: 'normal'
    };
  },
  
  // New follower
  'user.followed': async (userId, followerId) => {
    const follower = await getUser(followerId);
    return {
      type: 'friend',
      title: 'New Follower',
      message: `${follower.username} started following you`,
      action_url: `/profile/${follower.username}`,
      priority: 'low'
    };
  },
  
  // Friend finished book
  'friend.book_finished': async (userId, friendId, bookId) => {
    const friend = await getUser(friendId);
    const book = await getBook(bookId);
    return {
      type: 'friend',
      title: `${friend.username} finished a book`,
      message: `${friend.username} finished '${book.title}'`,
      action_url: `/books/${bookId}`,
      priority: 'low'
    };
  },
  
  // Club discussion
  'club.new_discussion': async (userId, clubId, checkpointId) => {
    const club = await getClub(clubId);
    const checkpoint = await getCheckpoint(checkpointId);
    return {
      type: 'club',
      title: 'New club discussion',
      message: `New comments in ${club.name} - ${checkpoint.name}`,
      action_url: `/clubs/${clubId}/checkpoints/${checkpointId}`,
      priority: 'normal'
    };
  },
  
  // Streak reminder
  'streak.reminder': async (userId, streakDays) => {
    return {
      type: 'reminder',
      title: "Don't break your streak! 🔥",
      message: `Your ${streakDays}-day reading streak ends today. Log an entry!`,
      action_url: '/diary/add',
      priority: 'high'
    };
  },
  
  // Meeting reminder
  'club.meeting_reminder': async (userId, meetingId, hoursUntil) => {
    const meeting = await getMeeting(meetingId);
    return {
      type: 'club',
      title: 'Club meeting soon',
      message: `${meeting.club_name} meeting in ${hoursUntil} hour(s)`,
      action_url: `/meetings/${meetingId}`,
      priority: 'high'
    };
  }
};
```

---

## Notification Scheduling

### Background Jobs (using node-cron or Bull)
```javascript
const cron = require('node-cron');

// Daily digest at 9 AM for each user (based on their timezone)
cron.schedule('0 * * * *', async () => {
  const usersToNotify = await db.notification_preferences
    .where({ email_daily_digest: true })
    .whereRaw("EXTRACT(HOUR FROM (NOW() AT TIME ZONE timezone)) = EXTRACT(HOUR FROM digest_time)");
  
  for (const user of usersToNotify) {
    const digest = await generateDailyDigest(user.user_id);
    await queueEmail(user.user_id, 'daily_digest', digest);
  }
});

// Streak reminders at 8 PM
cron.schedule('0 20 * * *', async () => {
  const usersWithStreaks = await db.reading_streaks
    .where('current_streak', '>', 0)
    .whereRaw("last_reading_date < CURRENT_DATE");
  
  for (const { user_id, current_streak } of usersWithStreaks) {
    await createNotification(user_id, 'streak.reminder', current_streak);
  }
});

// Club meeting reminders (1 hour before)
cron.schedule('*/15 * * * *', async () => {
  const upcomingMeetings = await db.club_meetings
    .where('meeting_date', '>=', new Date())
    .where('meeting_date', '<=', new Date(Date.now() + 75 * 60 * 1000));
  
  for (const meeting of upcomingMeetings) {
    const members = await getClubMembers(meeting.club_id);
    for (const member of members) {
      await createNotification(member.user_id, 'club.meeting_reminder', meeting.id, 1);
    }
  }
});
```

---

## Frontend Components

### React Components
1. **NotificationBell.js** - Icon with unread count badge
2. **NotificationDropdown.js** - Dropdown list of recent notifications
3. **NotificationList.js** - Full notification list page
4. **NotificationItem.js** - Individual notification card
5. **NotificationPreferences.js** - Settings page
6. **DigestPreview.js** - Preview email digests
7. **QuietHoursSelector.js** - Time range picker

### Mobile Screens
1. **NotificationsScreen.js** - All notifications
2. **NotificationPreferencesScreen.js** - Settings
3. **NotificationDetail.js** - Expanded notification

---

## Push Notification Best Practices

### Batching
- Group similar notifications (e.g., "3 friends finished books" instead of 3 separate)
- Send digest once daily instead of many small notifications

### Timing
- Respect quiet hours
- Send reminders at optimal times based on user behavior
- Don't spam during active app usage

### Personalization
- Use user's name
- Reference specific books/friends
- Contextual messages based on activity

### Action-Oriented
- Every notification should have a clear action
- Deep link directly to relevant screen
- Include "Mark as read" action

---

## Success Metrics

- **Notification Engagement**: Click-through rate
- **Opt-Out Rate**: % of users disabling notifications
- **Open Rate**: App opens from push notifications
- **Digest Engagement**: Email open and click rates
- **Response Time**: Time from notification to action
- **Conversion**: Notifications leading to desired actions

---

## Implementation Priority

### Phase 1 (Week 1-2)
- Basic notification system
- Push token registration
- Achievement and goal notifications

### Phase 2 (Week 3-4)
- Friend and social notifications
- Notification preferences
- Quiet hours

### Phase 3 (Week 5-6)
- Email digests
- Weekly summaries
- Notification batching

### Phase 4 (Week 7-8)
- Advanced scheduling
- Optimization
- Analytics and A/B testing
