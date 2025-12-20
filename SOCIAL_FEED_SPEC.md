# Social Feed & Discovery - Technical Specification

## Overview
Real-time activity feed showing friend activity, trending books, reading streaks, and personalized discovery features.

---

## Database Schema

### 1. `user_follows` Table
```sql
CREATE TABLE user_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_follows_following ON user_follows(following_id);
```

### 2. `activity_feed` Table
```sql
CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'book_added', 'book_finished', 'review_posted', 'goal_completed', 'achievement_unlocked', 'joined_club', 'streak_milestone'
  entity_type VARCHAR(50), -- 'book', 'review', 'goal', 'achievement', 'club'
  entity_id UUID,
  metadata JSONB, -- Activity-specific data
  visibility VARCHAR(20) DEFAULT 'public', -- 'public', 'friends', 'private'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_user ON activity_feed(user_id);
CREATE INDEX idx_activity_type ON activity_feed(activity_type);
CREATE INDEX idx_activity_created ON activity_feed(created_at DESC);
CREATE INDEX idx_activity_visibility ON activity_feed(visibility, created_at DESC);
```

### 3. `trending_books` Table (Cached)
```sql
CREATE TABLE trending_books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  trend_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'network'
  rank INTEGER NOT NULL,
  score NUMERIC(10,2) NOT NULL, -- Trending score
  added_to_list_count INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  discussion_count INTEGER DEFAULT 0,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(book_id, trend_type)
);

CREATE INDEX idx_trending_type ON trending_books(trend_type, rank);
CREATE INDEX idx_trending_score ON trending_books(trend_type, score DESC);
```

### 4. `reading_recommendations` Table
```sql
CREATE TABLE reading_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  recommendation_source VARCHAR(50) NOT NULL, -- 'ai_based', 'friend_based', 'trending', 'similar_books', 'genre_match'
  score NUMERIC(5,2) NOT NULL,
  reason TEXT,
  source_book_id UUID REFERENCES books(id), -- If based on similar book
  source_friend_id UUID REFERENCES auth.users(id), -- If friend recommendation
  dismissed BOOLEAN DEFAULT false,
  clicked BOOLEAN DEFAULT false,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_recommendations_user ON reading_recommendations(user_id, dismissed, score DESC);
CREATE INDEX idx_recommendations_expires ON reading_recommendations(expires_at);
```

### 5. `friend_reading_status` Table (Materialized View)
```sql
CREATE TABLE friend_reading_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL, -- 'reading', 'completed'
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id, book_id)
);

CREATE INDEX idx_friend_status_user ON friend_reading_status(user_id);
```

### 6. `book_similarities` Table (Precomputed)
```sql
CREATE TABLE book_similarities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  similar_book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  similarity_score NUMERIC(5,2) NOT NULL,
  similarity_reasons JSONB, -- ['same_author', 'similar_genre', 'theme_match', 'reader_overlap']
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(book_id, similar_book_id)
);

CREATE INDEX idx_similarities_book ON book_similarities(book_id, similarity_score DESC);
```

### 7. `user_preferences` Table
```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  favorite_genres JSONB DEFAULT '[]', -- Array of genre names
  disliked_genres JSONB DEFAULT '[]',
  preferred_book_length VARCHAR(20), -- 'short', 'medium', 'long', 'any'
  reading_pace VARCHAR(20), -- 'slow', 'moderate', 'fast'
  content_warnings JSONB DEFAULT '[]', -- Topics to avoid
  discovery_settings JSONB DEFAULT '{"show_trending": true, "show_friend_recs": true, "show_ai_recs": true}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## API Endpoints

### Social Feed

#### **GET /api/feed**
Get personalized activity feed
```javascript
Query: ?type=all&limit=50&offset=0
Types: 'all', 'friends', 'trending', 'following'
Response: {
  activities: [
    {
      id: "uuid",
      user: {
        id: "uuid",
        username: "bookworm23",
        avatar_url: "..."
      },
      activity_type: "book_finished",
      timestamp: "2025-12-20T10:30:00Z",
      data: {
        book: {
          id: "uuid",
          title: "The Silent Patient",
          author: "Alex Michaelides",
          cover_url: "..."
        },
        rating: 5,
        review_excerpt: "Absolutely gripping thriller..."
      },
      engagement: {
        likes_count: 12,
        comments_count: 3,
        user_liked: false
      }
    },
    {
      activity_type: "achievement_unlocked",
      data: {
        achievement: {
          title: "Week Warrior",
          description: "7-day reading streak",
          icon: "🔥"
        }
      }
    },
    {
      activity_type: "joined_club",
      data: {
        club: {
          id: "uuid",
          name: "Mystery Lovers",
          member_count: 43
        }
      }
    }
  ],
  has_more: true
}
```

#### **POST /api/feed/activity**
Create feed activity (usually automatic)
```javascript
Request: {
  activity_type: "book_finished",
  entity_type: "book",
  entity_id: "uuid",
  metadata: {
    rating: 5,
    review_excerpt: "..."
  },
  visibility: "public"
}
```

#### **POST /api/feed/activity/:activityId/like**
Like an activity

#### **POST /api/feed/activity/:activityId/comment**
Comment on activity

---

### Friend System

#### **GET /api/users/search**
Search for users to follow
```javascript
Query: ?q=bookworm&limit=20
Response: {
  users: [
    {
      id: "uuid",
      username: "bookworm23",
      display_name: "Book Worm",
      avatar_url: "...",
      bio: "Avid reader and mystery lover",
      stats: {
        books_read: 156,
        reviews_written: 89,
        followers_count: 234
      },
      is_following: false,
      is_followed_by: true,
      mutual_friends_count: 5
    }
  ]
}
```

#### **POST /api/users/:userId/follow**
Follow a user
```javascript
Response: { 
  message: "Now following bookworm23",
  relationship: {
    following: true,
    followed_by: false
  }
}
```

#### **DELETE /api/users/:userId/follow**
Unfollow a user

#### **GET /api/users/:userId/followers**
Get user's followers list

#### **GET /api/users/:userId/following**
Get users this user follows

#### **GET /api/users/:userId/mutual-friends**
Get mutual friends

---

### Trending & Discovery

#### **GET /api/trending/books**
Get trending books
```javascript
Query: ?period=weekly&limit=20&genre=mystery
Response: {
  trending_books: [
    {
      rank: 1,
      book: {
        id: "uuid",
        title: "The Silent Patient",
        author: "Alex Michaelides",
        cover_url: "...",
        genre: "Mystery"
      },
      trend_score: 98.5,
      stats: {
        added_this_week: 234,
        reviews_this_week: 89,
        avg_rating: 4.5
      },
      trending_reason: "234 readers added this week"
    }
  ],
  period: "weekly",
  updated_at: "2025-12-20T00:00:00Z"
}
```

#### **GET /api/trending/genres**
Get trending genres this week

#### **GET /api/discover/recommendations**
Get personalized recommendations
```javascript
Response: {
  recommendations: [
    {
      id: "uuid",
      book: {...},
      recommendation_source: "friend_based",
      reason: "3 friends loved this book",
      score: 95.5,
      friends: [
        {
          username: "bookworm23",
          rating: 5,
          review_excerpt: "Amazing read!"
        }
      ]
    },
    {
      book: {...},
      recommendation_source: "similar_books",
      reason: "Similar to 'The Silent Patient'",
      source_book: {
        title: "The Silent Patient",
        cover_url: "..."
      }
    },
    {
      book: {...},
      recommendation_source: "ai_based",
      reason: "Based on your love for psychological thrillers"
    }
  ]
}
```

#### **POST /api/discover/recommendations/:recommendationId/dismiss**
Dismiss a recommendation

#### **POST /api/discover/refresh**
Generate new AI recommendations

---

### Similar Books

#### **GET /api/books/:bookId/similar**
Get similar books
```javascript
Response: {
  book: {
    id: "uuid",
    title: "The Silent Patient"
  },
  similar_books: [
    {
      book: {...},
      similarity_score: 92.5,
      reasons: [
        "Psychological thriller genre",
        "Similar writing style",
        "42% reader overlap"
      ],
      friends_who_read: [
        { username: "bookworm23", rating: 5 }
      ]
    }
  ]
}
```

---

### Friend Activity

#### **GET /api/friends/currently-reading**
See what friends are currently reading
```javascript
Response: {
  friends_reading: [
    {
      friend: {
        id: "uuid",
        username: "bookworm23",
        avatar_url: "..."
      },
      book: {
        id: "uuid",
        title: "The Silent Patient",
        cover_url: "...",
        author: "Alex Michaelides"
      },
      progress: {
        current_page: 175,
        total_pages: 400,
        percentage: 43.75
      },
      started_reading: "2025-12-15T00:00:00Z"
    }
  ]
}
```

#### **GET /api/friends/recent-reviews**
Get recent reviews from friends

#### **GET /api/books/:bookId/friends-who-read**
Get friends who read a specific book
```javascript
Response: {
  book: {...},
  friends: [
    {
      user_id: "uuid",
      username: "bookworm23",
      rating: 5,
      review: "Amazing psychological thriller...",
      read_date: "2025-12-01"
    }
  ],
  total_friends: 5,
  average_rating: 4.6
}
```

---

### User Preferences

#### **GET /api/preferences**
Get user's reading preferences

#### **PUT /api/preferences**
Update reading preferences
```javascript
Request: {
  favorite_genres: ["Mystery", "Thriller", "Sci-Fi"],
  disliked_genres: ["Romance"],
  preferred_book_length: "medium",
  reading_pace: "moderate",
  content_warnings: ["violence", "sexual_content"],
  discovery_settings: {
    show_trending: true,
    show_friend_recs: true,
    show_ai_recs: true
  }
}
```

---

## Recommendation Algorithm

### Friend-Based Recommendations
```javascript
// Find books that friends loved but user hasn't read
function getFriendRecommendations(userId) {
  const friendBooks = db.query(`
    SELECT DISTINCT b.*, COUNT(*) as friend_count, AVG(ub.rating) as avg_rating
    FROM user_booklist ub
    JOIN books b ON b.id = ub.book_id
    WHERE ub.user_id IN (SELECT following_id FROM user_follows WHERE follower_id = ?)
    AND ub.rating >= 4
    AND ub.book_id NOT IN (SELECT book_id FROM user_booklist WHERE user_id = ?)
    GROUP BY b.id
    HAVING friend_count >= 2
    ORDER BY friend_count DESC, avg_rating DESC
    LIMIT 20
  `, [userId, userId]);
  
  return friendBooks.map(book => ({
    book,
    score: calculateScore(book.friend_count, book.avg_rating),
    reason: `${book.friend_count} friends loved this book`
  }));
}
```

### AI-Based Recommendations
```javascript
async function getAIRecommendations(userId) {
  const userBooks = await getUserBooks(userId);
  const userPreferences = await getUserPreferences(userId);
  
  const prompt = `User has read: ${userBooks.map(b => b.title).join(', ')}
    Favorite genres: ${userPreferences.favorite_genres.join(', ')}
    Recommend 10 books they would love and explain why.`;
  
  const aiResponse = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }]
  });
  
  return parseRecommendations(aiResponse);
}
```

### Trending Score Calculation
```javascript
function calculateTrendingScore(book, period) {
  const weights = {
    added_to_list: 2.0,
    reviews_written: 3.0,
    discussions_started: 1.5,
    avg_rating: 10.0
  };
  
  const recency_factor = calculateRecencyFactor(book.activity_dates);
  const velocity = calculateVelocity(book.activity_counts, period);
  
  return (
    (book.added_count * weights.added_to_list) +
    (book.review_count * weights.reviews_written) +
    (book.discussion_count * weights.discussions_started) +
    (book.avg_rating * weights.avg_rating)
  ) * recency_factor * velocity;
}
```

---

## Automatic Feed Generation

### Activity Events That Create Feed Items
```javascript
const FEED_EVENTS = {
  'book_added': { visibility: 'public', priority: 1 },
  'book_finished': { visibility: 'public', priority: 3 },
  'review_posted': { visibility: 'public', priority: 4 },
  'goal_completed': { visibility: 'public', priority: 2 },
  'achievement_unlocked': { visibility: 'public', priority: 2 },
  'joined_club': { visibility: 'public', priority: 1 },
  'streak_milestone': { visibility: 'public', priority: 3 },
  'challenge_completed': { visibility: 'public', priority: 4 }
};

// Trigger example
async function onBookFinished(userId, bookId, rating) {
  await db.activity_feed.insert({
    user_id: userId,
    activity_type: 'book_finished',
    entity_type: 'book',
    entity_id: bookId,
    metadata: { rating },
    visibility: 'public'
  });
  
  // Notify followers
  await notifyFollowers(userId, 'book_finished', { bookId, rating });
}
```

---

## Frontend Components

### React Components
1. **FeedPage.js** - Main social feed
2. **ActivityCard.js** - Individual activity item
3. **TrendingBooksWidget.js** - Trending books sidebar
4. **RecommendationsWidget.js** - Personalized recommendations
5. **FriendsReadingWidget.js** - What friends are reading
6. **UserSearchModal.js** - Search and follow users
7. **FollowButton.js** - Follow/unfollow button
8. **SimilarBooksPanel.js** - Similar books section
9. **PreferencesModal.js** - Edit reading preferences
10. **MutualFriendsTooltip.js** - Show mutual friends

### Mobile Screens
1. **FeedScreen.js** - Activity feed
2. **DiscoverScreen.js** - Browse recommendations
3. **TrendingScreen.js** - Trending books
4. **FriendsListScreen.js** - Followers/following
5. **UserSearchScreen.js** - Find users
6. **ProfileScreen.js** - User profile with follow button
7. **PreferencesScreen.js** - Reading preferences

---

## Push Notifications

1. **New Follower**: "bookworm23 started following you"
2. **Friend Finished Book**: "Sarah finished 'The Silent Patient' and rated it ⭐⭐⭐⭐⭐"
3. **Friend Recommendation**: "3 friends loved 'The Midnight Library'"
4. **Trending Book**: "'The Silent Patient' is trending in your network"
5. **Similar Book**: "Found 5 books similar to ones you loved"
6. **Friend Achievement**: "bookworm23 unlocked 'Century Club' - 100 books read!"
7. **Mutual Friend**: "bookworm23 also follows speedreader - follow them too?"

---

## Performance Optimizations

### Feed Caching
- Cache user feeds for 5 minutes
- Pre-generate feeds for active users
- Use Redis for fast feed delivery

### Trending Calculation
- Update trending books every 4 hours
- Use background jobs for calculation
- Store in cached table

### Recommendation Generation
- Generate recommendations daily
- Cache for 24 hours
- Refresh on user action (book added/finished)

### Database Indexes
- Critical for feed queries with date sorting
- Index on (user_id, created_at DESC)
- Composite index on (visibility, created_at)

---

## Privacy Controls

Users can control:
- Who sees their activity (public/friends/private)
- Hide specific books from feed
- Disable activity sharing entirely
- Block specific users
- Hide reading status from non-friends

---

## Success Metrics

- **Feed Engagement**: Click-through rate on feed items
- **Follow Activity**: Average followers per user
- **Recommendation Success**: % of recommended books added to list
- **Trending Impact**: Conversion from trending to added
- **Friend Discovery**: % of users finding and following friends
- **Content Creation**: % of activities that generate engagement

---

## Implementation Priority

### Phase 1 (Week 1-2)
- User follow system
- Basic activity feed
- Friend recommendations

### Phase 2 (Week 3-4)
- Trending books calculation
- AI recommendations
- Similar books engine

### Phase 3 (Week 5-6)
- Feed optimization
- Recommendation refinement
- User preferences

### Phase 4 (Week 7-8)
- Push notifications
- Analytics
- Polish and testing
