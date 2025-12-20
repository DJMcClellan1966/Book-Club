# Enhanced Reading Experience - Technical Specification

## Overview
Advanced reading tracking with chapter-level progress, time tracking, voice notes, quote collections, annotations, and reading statistics.

---

## Database Schema

### 1. `reading_sessions` Table
```sql
CREATE TABLE reading_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  start_page INTEGER,
  end_page INTEGER,
  pages_read INTEGER,
  start_chapter VARCHAR(50),
  end_chapter VARCHAR(50),
  location TEXT, -- 'home', 'commute', 'coffee_shop', etc.
  mood_before VARCHAR(50),
  mood_after VARCHAR(50),
  device_type VARCHAR(20), -- 'mobile', 'web', 'ebook_reader'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON reading_sessions(user_id, start_time DESC);
CREATE INDEX idx_sessions_book ON reading_sessions(book_id);
CREATE INDEX idx_sessions_duration ON reading_sessions(user_id, duration_minutes);
```

### 2. `book_progress` Table
```sql
CREATE TABLE book_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  current_page INTEGER DEFAULT 0,
  total_pages INTEGER NOT NULL,
  current_chapter VARCHAR(50),
  current_chapter_number INTEGER,
  percentage_complete NUMERIC(5,2) DEFAULT 0.00,
  estimated_time_remaining INTEGER, -- minutes
  reading_speed_ppm INTEGER, -- pages per minute
  last_read_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'not_started', -- 'not_started', 'reading', 'completed', 'paused', 'dnf'
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

CREATE INDEX idx_progress_user ON book_progress(user_id);
CREATE INDEX idx_progress_status ON book_progress(user_id, status);
```

### 3. `book_quotes` Table
```sql
CREATE TABLE book_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  quote_text TEXT NOT NULL,
  page_number INTEGER,
  chapter VARCHAR(50),
  context TEXT, -- Why this quote is meaningful
  tags JSONB DEFAULT '[]', -- ['inspirational', 'character_development', etc.]
  is_favorite BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false, -- Share with community
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_quotes_user ON book_quotes(user_id);
CREATE INDEX idx_quotes_book ON book_quotes(book_id);
CREATE INDEX idx_quotes_favorite ON book_quotes(user_id, is_favorite);
CREATE INDEX idx_quotes_public ON book_quotes(is_public, like_count DESC);
```

### 4. `reading_notes` Table
```sql
CREATE TABLE reading_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  note_type VARCHAR(20) DEFAULT 'text', -- 'text', 'voice', 'photo'
  content TEXT, -- For text notes
  audio_url TEXT, -- For voice notes
  audio_duration INTEGER, -- seconds
  transcription TEXT, -- Speech-to-text of voice notes
  image_url TEXT, -- For photo notes
  page_number INTEGER,
  chapter VARCHAR(50),
  highlight_color VARCHAR(20), -- 'yellow', 'green', 'blue', 'pink', 'purple'
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notes_user ON reading_notes(user_id);
CREATE INDEX idx_notes_book ON reading_notes(book_id, page_number);
CREATE INDEX idx_notes_type ON reading_notes(note_type);
```

### 5. `reading_statistics` Table
```sql
CREATE TABLE reading_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stat_period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  books_completed INTEGER DEFAULT 0,
  pages_read INTEGER DEFAULT 0,
  minutes_read INTEGER DEFAULT 0,
  avg_reading_speed_ppm NUMERIC(5,2),
  favorite_genre VARCHAR(100),
  reading_streak_days INTEGER DEFAULT 0,
  most_productive_time VARCHAR(20), -- 'morning', 'afternoon', 'evening', 'night'
  most_common_location VARCHAR(50),
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, stat_period, period_start)
);

CREATE INDEX idx_stats_user ON reading_statistics(user_id, stat_period, period_start DESC);
```

### 6. `chapter_structure` Table
```sql
CREATE TABLE chapter_structure (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  chapter_title VARCHAR(200),
  start_page INTEGER NOT NULL,
  end_page INTEGER,
  page_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(book_id, chapter_number)
);

CREATE INDEX idx_chapters_book ON chapter_structure(book_id, chapter_number);
```

### 7. `reading_goals_progress` Table (Extended)
```sql
ALTER TABLE reading_goals ADD COLUMN IF NOT EXISTS sessions_count INTEGER DEFAULT 0;
ALTER TABLE reading_goals ADD COLUMN IF NOT EXISTS total_minutes INTEGER DEFAULT 0;
ALTER TABLE reading_goals ADD COLUMN IF NOT EXISTS milestone_notifications JSONB DEFAULT '[]';
```

---

## API Endpoints

### Reading Sessions

#### **POST /api/reading-sessions/start**
Start a reading session
```javascript
Request: {
  book_id: "uuid",
  start_page: 150,
  start_chapter: "Chapter 10",
  mood_before: "relaxed",
  location: "home"
}
Response: {
  session: {
    id: "uuid",
    book_id: "uuid",
    start_time: "2025-12-20T19:00:00Z",
    start_page: 150
  }
}
```

#### **POST /api/reading-sessions/:sessionId/end**
End a reading session
```javascript
Request: {
  end_page: 175,
  end_chapter: "Chapter 11",
  mood_after: "inspired"
}
Response: {
  session: {
    id: "uuid",
    duration_minutes: 45,
    pages_read: 25,
    reading_speed_ppm: 0.56,
    start_time: "2025-12-20T19:00:00Z",
    end_time: "2025-12-20T19:45:00Z"
  },
  statistics: {
    total_pages_today: 67,
    total_minutes_today: 120,
    goal_progress: {
      daily_pages_goal: 50,
      current_progress: 67,
      percentage: 134
    }
  },
  achievements_unlocked: [
    {
      code: "SPEED_READER",
      title: "Speed Reader",
      description: "Read 100 pages in a day"
    }
  ]
}
```

#### **GET /api/reading-sessions/my-sessions**
Get user's reading sessions
```javascript
Query: ?book_id=uuid&start_date=2025-12-01&end_date=2025-12-31&limit=50
Response: {
  sessions: [
    {
      id: "uuid",
      book: {
        id: "uuid",
        title: "The Silent Patient",
        cover_url: "..."
      },
      start_time: "2025-12-20T19:00:00Z",
      duration_minutes: 45,
      pages_read: 25,
      location: "home",
      mood_after: "inspired"
    }
  ],
  total_sessions: 156,
  total_minutes: 7830,
  total_pages: 4200
}
```

---

### Book Progress

#### **GET /api/books/:bookId/progress**
Get reading progress for a book
```javascript
Response: {
  progress: {
    current_page: 175,
    total_pages: 400,
    percentage_complete: 43.75,
    current_chapter: "Chapter 11",
    pages_remaining: 225,
    estimated_time_remaining: 240, // minutes
    reading_speed_ppm: 0.56,
    last_read_at: "2025-12-20T19:45:00Z",
    days_reading: 5
  }
}
```

#### **PUT /api/books/:bookId/progress**
Update reading progress
```javascript
Request: {
  current_page: 200,
  current_chapter: "Chapter 13"
}
Response: {
  progress: {...},
  percentage_increase: 6.25,
  message: "Progress updated! You're 50% through the book."
}
```

#### **POST /api/books/:bookId/progress/photo**
Update progress via photo (OCR page number)
```javascript
Request: {
  image: "base64_encoded_image"
}
Response: {
  detected_page: 200,
  progress_updated: true,
  confidence: 0.95
}
```

---

### Quotes

#### **GET /api/quotes/my-quotes**
Get user's saved quotes
```javascript
Query: ?book_id=uuid&is_favorite=true&tag=inspirational&limit=50
Response: {
  quotes: [
    {
      id: "uuid",
      book: {
        title: "The Silent Patient",
        author: "Alex Michaelides"
      },
      quote_text: "Alicia Berenson was thirty-three years old when she killed her husband.",
      page_number: 1,
      chapter: "Prologue",
      context: "Powerful opening line",
      tags: ["memorable", "opening_line"],
      is_favorite: true,
      created_at: "2025-12-15T10:00:00Z"
    }
  ]
}
```

#### **POST /api/quotes**
Save a quote
```javascript
Request: {
  book_id: "uuid",
  quote_text: "...",
  page_number: 175,
  chapter: "Chapter 11",
  context: "This quote resonated because...",
  tags: ["inspirational", "character_development"],
  is_favorite: true,
  is_public: true
}
Response: { quote: {...} }
```

#### **GET /api/quotes/public**
Get public quotes from community
```javascript
Query: ?book_id=uuid&sort=popular&limit=20
Response: {
  quotes: [
    {
      quote_text: "...",
      book: {...},
      user: {
        username: "bookworm23",
        avatar_url: "..."
      },
      like_count: 45,
      user_liked: false
    }
  ]
}
```

#### **POST /api/quotes/:quoteId/like**
Like a public quote

#### **GET /api/quotes/export**
Export all quotes as PDF/Markdown
```javascript
Query: ?book_id=uuid&format=pdf
Response: PDF file download
```

---

### Reading Notes

#### **GET /api/notes/my-notes**
Get user's reading notes
```javascript
Query: ?book_id=uuid&note_type=voice&page_number=175
Response: {
  notes: [
    {
      id: "uuid",
      book: {...},
      note_type: "voice",
      audio_url: "...",
      audio_duration: 45,
      transcription: "This chapter was really interesting because...",
      page_number: 175,
      created_at: "2025-12-20T19:45:00Z"
    },
    {
      note_type: "text",
      content: "Character development is really strong here",
      highlight_color: "yellow",
      page_number: 180
    }
  ]
}
```

#### **POST /api/notes**
Create a note
```javascript
Request: {
  book_id: "uuid",
  note_type: "text",
  content: "Great character development",
  page_number: 175,
  chapter: "Chapter 11",
  highlight_color: "yellow",
  tags: ["character_analysis"]
}
Response: { note: {...} }
```

#### **POST /api/notes/voice**
Create voice note with speech-to-text
```javascript
Request: {
  book_id: "uuid",
  audio_file: FormData,
  page_number: 175,
  chapter: "Chapter 11"
}
Response: {
  note: {
    id: "uuid",
    audio_url: "...",
    audio_duration: 45,
    transcription: "This chapter was amazing...",
    transcription_confidence: 0.95
  }
}
```

---

### Reading Statistics

#### **GET /api/statistics/dashboard**
Get comprehensive reading statistics
```javascript
Query: ?period=monthly
Response: {
  current_period: {
    books_completed: 5,
    pages_read: 1234,
    minutes_read: 1860,
    avg_reading_speed_ppm: 0.66,
    reading_streak_days: 15,
    favorite_genre: "Mystery"
  },
  comparison: {
    vs_last_period: {
      books: "+2",
      pages: "+345",
      percentage_increase: 28.7
    },
    vs_average: {
      books: "+1",
      pages: "+234"
    }
  },
  charts: {
    daily_pages: [
      { date: "2025-12-01", pages: 50 },
      { date: "2025-12-02", pages: 75 }
    ],
    reading_times: {
      morning: 20,
      afternoon: 15,
      evening: 45,
      night: 20
    },
    genre_distribution: {
      "Mystery": 40,
      "Thriller": 30,
      "Sci-Fi": 20,
      "Fantasy": 10
    }
  },
  milestones: [
    {
      type: "pages",
      value: 1000,
      achieved_at: "2025-12-15",
      message: "You've read 1,000 pages this month! 🎉"
    }
  ],
  insights: [
    "You read 35% faster in the evenings",
    "Your longest reading streak was 42 days",
    "You've completed 85% of books you started"
  ]
}
```

#### **GET /api/statistics/yearly-wrapped**
Get annual reading wrapped
```javascript
Response: {
  year: 2025,
  books_completed: 52,
  pages_read: 15840,
  hours_read: 264,
  favorite_book: {
    title: "The Silent Patient",
    rating: 5
  },
  top_genre: "Mystery",
  longest_book: {
    title: "...",
    pages: 1200
  },
  fastest_read: {
    title: "...",
    duration_days: 2
  },
  reading_personality: "Marathon Reader",
  achievements_unlocked: 15,
  global_rank: "Top 5%",
  unique_authors: 38,
  favorite_author: "Agatha Christie",
  reading_streak_record: 42,
  share_card_url: "..." // Shareable image
}
```

---

## Automatic Features

### Reading Speed Calculation
```javascript
function calculateReadingSpeed(pagesRead, durationMinutes) {
  return pagesRead / durationMinutes; // pages per minute
}

function estimateTimeRemaining(pagesRemaining, avgSpeedPPM) {
  return Math.ceil(pagesRemaining / avgSpeedPPM); // minutes
}
```

### Progress Auto-Update
When user ends a session:
1. Update `book_progress` table
2. Create entry in `reading_sessions`
3. Update reading goals progress
4. Check for achievements
5. Update streak
6. Recalculate statistics
7. Trigger notifications if milestones reached

### Voice Note Transcription
```javascript
async function transcribeVoiceNote(audioFile) {
  const formData = new FormData();
  formData.append('file', audioFile);
  formData.append('model', 'whisper-1');
  
  const response = await openai.audio.transcriptions.create(formData);
  
  return {
    transcription: response.text,
    confidence: response.confidence || 0.95,
    duration: response.duration
  };
}
```

### Photo OCR for Progress
```javascript
async function detectPageNumber(imageBase64) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: 'Extract the page number from this book page image. Return only the number.' },
        { type: 'image_url', image_url: { url: imageBase64 } }
      ]
    }]
  });
  
  return parseInt(response.choices[0].message.content);
}
```

---

## Frontend Components

### React Components
1. **ReadingSessionTimer.js** - Active session timer
2. **ProgressTracker.js** - Update progress widget
3. **QuickProgressButtons.js** - "Add 10 pages", "Add 1 chapter"
4. **QuoteCapture.js** - Save quotes with context
5. **VoiceNoteRecorder.js** - Record voice notes
6. **AnnotationPanel.js** - View/edit notes
7. **StatisticsDashboard.js** - Reading stats visualization
8. **YearlyWrapped.js** - Annual summary
9. **ProgressChart.js** - Visual progress charts
10. **ReadingInsights.js** - AI-generated insights

### Mobile Screens
1. **ReadingSessionScreen.js** - Active reading session
2. **ProgressUpdateScreen.js** - Quick progress update
3. **QuotesScreen.js** - Browse saved quotes
4. **NotesScreen.js** - View/edit notes
5. **VoiceNoteScreen.js** - Record voice notes
6. **StatisticsScreen.js** - Reading statistics
7. **YearlyWrappedScreen.js** - Sharable annual summary

---

## Mobile-Specific Features

### Reading Timer Widget
- Home screen widget showing active session
- Quick access to timer start/stop
- Today's reading time display

### Quick Progress Update
- Shake phone to capture current page via camera
- Voice command: "Update progress to page 175"
- Widget for one-tap progress update

### Voice Notes
- Hands-free note-taking while reading
- Automatic transcription
- Sync across devices

---

## Push Notifications

1. **Session Reminder**: "Time to read! You haven't logged a session today."
2. **Progress Milestone**: "You're 50% through The Silent Patient! 📖"
3. **Daily Goal**: "Read 20 more pages to hit your daily goal!"
4. **Speed Record**: "New record! You read 50 pages in 30 minutes."
5. **Quote Liked**: "bookworm23 liked your quote from The Silent Patient"
6. **Weekly Summary**: "You read 5 hours this week - 2 hours more than last week! 📈"
7. **Time Reminder**: "You usually read at 7pm. Start a session?"

---

## Export Features

### Export Quotes
- PDF with beautiful formatting
- Markdown file
- CSV for import to other apps
- Shareable image cards

### Export Notes
- Organized by book
- Include annotations and highlights
- Study guide format

### Export Statistics
- CSV data export
- Shareable infographic
- Annual report PDF

---

## Success Metrics

- **Session Completion**: % of started sessions that are completed
- **Progress Update Frequency**: Average days between updates
- **Quote Collection**: Average quotes saved per book
- **Voice Note Usage**: % of users recording voice notes
- **Statistics Engagement**: % of users viewing stats dashboard
- **Export Rate**: % of users exporting quotes/notes
- **Reading Speed Improvement**: Track speed increase over time

---

## Implementation Priority

### Phase 1 (Week 1-2)
- Reading sessions API
- Progress tracking
- Basic statistics

### Phase 2 (Week 3-4)
- Quote collection
- Text notes
- Progress photos (OCR)

### Phase 3 (Week 5-6)
- Voice notes
- Statistics dashboard
- Export features

### Phase 4 (Week 7-8)
- Yearly wrapped
- Advanced insights
- Mobile widgets
- Polish and testing
