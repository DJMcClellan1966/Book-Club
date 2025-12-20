# Book Clubs & Group Reading - Technical Specification

## Overview
Structured book clubs with reading schedules, chapter discussions, spoiler protection, and synchronized reading progress tracking.

---

## Database Schema

### 1. `book_clubs` Table
```sql
CREATE TABLE book_clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  current_book_id UUID REFERENCES books(id),
  club_type VARCHAR(20) DEFAULT 'open', -- 'open', 'private', 'invite_only'
  max_members INTEGER DEFAULT 50,
  member_count INTEGER DEFAULT 0,
  cover_image_url TEXT,
  rules TEXT,
  meeting_frequency VARCHAR(50), -- 'weekly', 'biweekly', 'monthly'
  meeting_day VARCHAR(20), -- 'monday', 'tuesday', etc.
  meeting_time TIME,
  timezone VARCHAR(50) DEFAULT 'UTC',
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'archived'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_book_clubs_type ON book_clubs(club_type, status);
CREATE INDEX idx_book_clubs_creator ON book_clubs(creator_id);
```

### 2. `club_members` Table
```sql
CREATE TABLE club_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES book_clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- 'owner', 'moderator', 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE,
  notification_preferences JSONB DEFAULT '{"new_book": true, "discussion": true, "meeting_reminder": true}',
  is_muted BOOLEAN DEFAULT false,
  UNIQUE(club_id, user_id)
);

CREATE INDEX idx_club_members_club ON club_members(club_id);
CREATE INDEX idx_club_members_user ON club_members(user_id);
CREATE INDEX idx_club_members_role ON club_members(club_id, role);
```

### 3. `club_reading_schedule` Table
```sql
CREATE TABLE club_reading_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES book_clubs(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_pages INTEGER,
  status VARCHAR(20) DEFAULT 'upcoming', -- 'upcoming', 'in_progress', 'completed'
  reading_pace VARCHAR(20) DEFAULT 'moderate', -- 'relaxed', 'moderate', 'fast'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_schedule_club ON club_reading_schedule(club_id);
CREATE INDEX idx_schedule_dates ON club_reading_schedule(start_date, end_date);
```

### 4. `reading_checkpoints` Table
```sql
CREATE TABLE reading_checkpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID REFERENCES club_reading_schedule(id) ON DELETE CASCADE,
  checkpoint_name VARCHAR(200) NOT NULL, -- "Chapter 1-5", "Part 1", "Pages 1-100"
  start_page INTEGER,
  end_page INTEGER,
  chapter_start VARCHAR(50),
  chapter_end VARCHAR(50),
  target_date DATE NOT NULL,
  discussion_topic TEXT,
  ai_generated_questions JSONB, -- Array of discussion questions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_checkpoints_schedule ON reading_checkpoints(schedule_id);
CREATE INDEX idx_checkpoints_date ON reading_checkpoints(target_date);
```

### 5. `member_reading_progress` Table
```sql
CREATE TABLE member_reading_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES book_clubs(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES club_reading_schedule(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_page INTEGER DEFAULT 0,
  current_chapter VARCHAR(50),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'reading', -- 'not_started', 'reading', 'completed', 'dnf'
  percentage_complete NUMERIC(5,2) DEFAULT 0.00,
  is_ahead BOOLEAN DEFAULT false,
  is_behind BOOLEAN DEFAULT false,
  UNIQUE(club_id, schedule_id, user_id)
);

CREATE INDEX idx_progress_club ON member_reading_progress(club_id, schedule_id);
CREATE INDEX idx_progress_user ON member_reading_progress(user_id);
```

### 6. `checkpoint_discussions` Table
```sql
CREATE TABLE checkpoint_discussions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checkpoint_id UUID REFERENCES reading_checkpoints(id) ON DELETE CASCADE,
  club_id UUID REFERENCES book_clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_spoiler BOOLEAN DEFAULT false,
  spoiler_level INTEGER, -- Page/chapter number this spoils up to
  parent_id UUID REFERENCES checkpoint_discussions(id) ON DELETE CASCADE,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_discussions_checkpoint ON checkpoint_discussions(checkpoint_id);
CREATE INDEX idx_discussions_parent ON checkpoint_discussions(parent_id);
CREATE INDEX idx_discussions_club ON checkpoint_discussions(club_id);
```

### 7. `club_meetings` Table
```sql
CREATE TABLE club_meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES book_clubs(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES club_reading_schedule(id),
  checkpoint_id UUID REFERENCES reading_checkpoints(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  meeting_url TEXT, -- Video chat link
  meeting_type VARCHAR(20) DEFAULT 'discussion', -- 'discussion', 'social', 'author_qa'
  agenda TEXT,
  notes TEXT,
  recording_url TEXT,
  attendee_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_meetings_club ON club_meetings(club_id);
CREATE INDEX idx_meetings_date ON club_meetings(meeting_date);
```

### 8. `club_invitations` Table
```sql
CREATE TABLE club_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES book_clubs(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email VARCHAR(255),
  invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invitation_code VARCHAR(50) UNIQUE,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired'
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invitations_club ON club_invitations(club_id);
CREATE INDEX idx_invitations_code ON club_invitations(invitation_code);
```

---

## API Endpoints

### Book Clubs

#### **GET /api/book-clubs**
List all public book clubs
```javascript
Query: ?search=mystery&status=active&sort=member_count&limit=20
Response: {
  clubs: [
    {
      id: "uuid",
      name: "Mystery Lovers",
      description: "We read mystery and thriller novels",
      club_type: "open",
      member_count: 42,
      current_book: {
        id: "uuid",
        title: "The Silent Patient",
        author: "Alex Michaelides",
        cover_url: "..."
      },
      meeting_frequency: "weekly",
      creator_username: "bookworm23",
      is_member: false
    }
  ],
  total: 156
}
```

#### **GET /api/book-clubs/my-clubs**
Get clubs user is a member of

#### **GET /api/book-clubs/:clubId**
Get club details
```javascript
Response: {
  club: {
    id: "uuid",
    name: "Mystery Lovers",
    description: "...",
    current_book: {...},
    next_meeting: {
      date: "2025-12-25T19:00:00Z",
      title: "Chapter 10-15 Discussion",
      meeting_url: "..."
    },
    member_count: 42,
    role: "member", // User's role if member
    reading_schedule: {
      book: {...},
      start_date: "2025-12-01",
      end_date: "2025-12-31",
      current_checkpoint: {
        name: "Chapters 10-15",
        target_date: "2025-12-25",
        end_page: 250
      }
    }
  },
  members: [
    {
      user_id: "uuid",
      username: "bookworm23",
      role: "owner",
      progress_percentage: 75.5
    }
  ]
}
```

#### **POST /api/book-clubs**
Create new book club
```javascript
Request: {
  name: "Mystery Lovers",
  description: "We read mystery and thriller novels",
  club_type: "open",
  max_members: 50,
  meeting_frequency: "weekly",
  meeting_day: "thursday",
  meeting_time: "19:00",
  timezone: "America/New_York"
}
Response: { club: {...}, invitation_code: "MYSTERY2025" }
```

#### **PUT /api/book-clubs/:clubId**
Update club details (owner/moderator only)

#### **DELETE /api/book-clubs/:clubId**
Delete club (owner only)

---

### Club Membership

#### **POST /api/book-clubs/:clubId/join**
Join a book club
```javascript
Request: { invitation_code: "MYSTERY2025" } // Optional, required for private clubs
Response: { message: "Successfully joined", membership: {...} }
```

#### **POST /api/book-clubs/:clubId/leave**
Leave a book club

#### **POST /api/book-clubs/:clubId/invite**
Invite user to club
```javascript
Request: {
  user_id: "uuid", // OR
  email: "friend@example.com"
}
Response: { invitation: {...}, invitation_link: "..." }
```

#### **PUT /api/book-clubs/:clubId/members/:userId/role**
Update member role (owner/moderator only)
```javascript
Request: { role: "moderator" }
```

#### **DELETE /api/book-clubs/:clubId/members/:userId**
Remove member (owner/moderator only)

---

### Reading Schedule

#### **GET /api/book-clubs/:clubId/schedule**
Get current reading schedule with checkpoints
```javascript
Response: {
  schedule: {
    book: {...},
    start_date: "2025-12-01",
    end_date: "2025-12-31",
    total_pages: 400,
    reading_pace: "moderate"
  },
  checkpoints: [
    {
      id: "uuid",
      name: "Chapters 1-5",
      start_page: 1,
      end_page: 100,
      target_date: "2025-12-10",
      is_current: false,
      is_completed: true,
      discussion_count: 24
    },
    {
      id: "uuid",
      name: "Chapters 6-10",
      start_page: 101,
      end_page: 200,
      target_date: "2025-12-20",
      is_current: true,
      is_completed: false,
      discussion_count: 8
    }
  ],
  my_progress: {
    current_page: 175,
    percentage_complete: 43.75,
    is_ahead: true,
    is_behind: false
  }
}
```

#### **POST /api/book-clubs/:clubId/schedule**
Create reading schedule (owner/moderator only)
```javascript
Request: {
  book_id: "uuid",
  start_date: "2025-12-01",
  end_date: "2025-12-31",
  reading_pace: "moderate", // 'relaxed', 'moderate', 'fast'
  generate_checkpoints: true // AI generates checkpoint suggestions
}
Response: { 
  schedule: {...}, 
  checkpoints: [...],
  message: "Reading schedule created"
}
```

#### **PUT /api/book-clubs/:clubId/schedule/:scheduleId/checkpoints**
Update checkpoints

---

### Reading Progress

#### **GET /api/book-clubs/:clubId/progress**
Get all members' progress
```javascript
Query: ?sort_by=page&order=desc
Response: {
  members_progress: [
    {
      user_id: "uuid",
      username: "speedreader",
      current_page: 350,
      percentage_complete: 87.5,
      status: "reading",
      is_ahead: true,
      last_updated: "2025-12-20T10:30:00Z"
    }
  ],
  average_progress: 65.3,
  members_completed: 5
}
```

#### **POST /api/book-clubs/:clubId/progress**
Update user's reading progress
```javascript
Request: {
  current_page: 175,
  current_chapter: "10"
}
Response: { 
  progress: {...}, 
  spoiler_safe_level: 175, // Can see discussions up to page 175
  unlocked_checkpoints: [...] // Checkpoints now visible
}
```

---

### Discussions

#### **GET /api/book-clubs/:clubId/checkpoints/:checkpointId/discussions**
Get checkpoint discussions with spoiler protection
```javascript
Query: ?spoiler_filter=175 // Only show discussions up to page 175
Response: {
  checkpoint: {
    name: "Chapters 6-10",
    end_page: 200,
    discussion_questions: [
      "What motivated the protagonist's decision?",
      "How does this chapter change your perception?"
    ]
  },
  discussions: [
    {
      id: "uuid",
      user_id: "uuid",
      username: "bookworm",
      content: "I loved how the author revealed...",
      is_spoiler: false,
      like_count: 12,
      replies_count: 3,
      created_at: "2025-12-20T15:00:00Z",
      is_visible: true // Based on spoiler_filter
    },
    {
      id: "uuid",
      content: "The twist in chapter 15 was...",
      is_spoiler: true,
      spoiler_level: 250,
      is_visible: false // Hidden due to spoiler
    }
  ]
}
```

#### **POST /api/book-clubs/:clubId/checkpoints/:checkpointId/discussions**
Post discussion comment
```javascript
Request: {
  content: "Great chapter! The character development...",
  is_spoiler: false,
  spoiler_level: 150, // If contains spoilers, specify page
  parent_id: "uuid" // Optional, for replies
}
Response: { discussion: {...} }
```

---

### Club Meetings

#### **GET /api/book-clubs/:clubId/meetings**
Get upcoming and past meetings

#### **GET /api/book-clubs/:clubId/meetings/:meetingId**
Get meeting details

#### **POST /api/book-clubs/:clubId/meetings**
Schedule new meeting (owner/moderator only)
```javascript
Request: {
  title: "Chapter 10-15 Discussion",
  description: "Let's discuss the major plot twist",
  meeting_date: "2025-12-25T19:00:00Z",
  duration_minutes: 90,
  checkpoint_id: "uuid",
  agenda: "1. Introduction\n2. Key themes\n3. Predictions"
}
Response: { 
  meeting: {...}, 
  meeting_url: "https://meet.bookclub.com/abc123",
  calendar_invite: "..." // ICS format
}
```

#### **POST /api/book-clubs/:clubId/meetings/:meetingId/attend**
Mark attendance for meeting

---

## Automatic Features

### AI-Generated Discussion Questions
When creating checkpoints, AI analyzes the book and generates questions:
```javascript
{
  questions: [
    "How does the author use foreshadowing in these chapters?",
    "What motivated the protagonist's decision to...?",
    "How do you interpret the symbolism of...?",
    "What predictions do you have for the next section?"
  ]
}
```

### Spoiler Protection System
```javascript
// When user updates progress to page 175
spoiler_safe_level = 175

// In discussions query
discussions.filter(d => 
  !d.is_spoiler || 
  d.spoiler_level <= user_progress.current_page
)

// UI shows:
// ✅ Visible: Discussions for pages 1-175
// 🔒 Hidden: "12 more discussions (contains spoilers)"
```

### Progress Status Calculation
```javascript
function calculateProgressStatus(userProgress, checkpointDate, totalPages) {
  const expectedPage = calculateExpectedPage(checkpointDate, totalPages);
  const currentPage = userProgress.current_page;
  
  if (currentPage > expectedPage + 20) {
    return { is_ahead: true, is_behind: false };
  } else if (currentPage < expectedPage - 20) {
    return { is_ahead: false, is_behind: true };
  }
  return { is_ahead: false, is_behind: false };
}
```

### Meeting Reminders
- 24 hours before: "Tomorrow at 7pm: Mystery Lovers meeting"
- 1 hour before: "Mystery Lovers meeting starts in 1 hour"
- Meeting start: "Mystery Lovers meeting is starting now! Join here: [link]"

---

## Frontend Components

### React Components
1. **BookClubsPage.js** - Browse all clubs
2. **ClubDetailPage.js** - Club dashboard
3. **ClubCreateModal.js** - Create club form
4. **ReadingScheduleView.js** - Timeline of checkpoints
5. **ProgressTracker.js** - Update reading progress
6. **MembersProgressList.js** - See all members' progress
7. **CheckpointDiscussions.js** - Discussion threads with spoiler protection
8. **SpoilerWarning.js** - Blurred spoiler content
9. **MeetingScheduler.js** - Schedule meetings
10. **ClubSettings.js** - Manage club settings

### Mobile Screens
1. **BookClubsScreen.js** - Browse clubs
2. **ClubDetailScreen.js** - Club home
3. **ReadingProgressScreen.js** - Update progress
4. **CheckpointDiscussionScreen.js** - Discussions
5. **ClubMembersScreen.js** - Member list
6. **MeetingDetailScreen.js** - Meeting info

---

## Push Notifications

1. **New Book Selected**: "Mystery Lovers selected a new book: The Silent Patient"
2. **Reading Checkpoint**: "Time to read Chapters 6-10 for Thursday's discussion"
3. **Behind Schedule**: "You're 30 pages behind the club schedule. Catch up today!"
4. **Meeting Reminder**: "Mystery Lovers meeting in 1 hour!"
5. **New Discussion**: "5 new comments on Chapter 10 discussion"
6. **Member Milestone**: "Sarah finished the book! Be the next to complete it."
7. **Club Invitation**: "bookworm23 invited you to join Mystery Lovers"

---

## Success Metrics

- **Club Creation Rate**: New clubs per week
- **Member Engagement**: % of members who update progress weekly
- **Discussion Activity**: Comments per checkpoint
- **Meeting Attendance**: % of members attending meetings
- **Completion Rate**: % of members finishing club books
- **Retention**: 30-day retention for club members vs non-members

---

## Implementation Priority

### Phase 1 (Week 1-2)
- Database schema
- Basic club CRUD
- Join/leave functionality
- Member management

### Phase 2 (Week 3-4)
- Reading schedule creation
- Progress tracking
- Checkpoint system
- Progress visibility

### Phase 3 (Week 5-6)
- Discussions with spoiler protection
- AI question generation
- Meeting scheduler
- Calendar integration

### Phase 4 (Week 7-8)
- Push notifications
- Mobile app integration
- Video meeting integration
- Polish and testing
