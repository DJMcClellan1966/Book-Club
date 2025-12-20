# Book Diary Feature

## Overview
Users can now maintain private, long-form reading diaries for books in their booklist. Each book can have multiple diary entries over time, with timestamps automatically saved. The diary includes AI-powered insights that analyze entries and provide thoughtful observations about the reader's journey.

## Features

### 📔 Private Diary Entries
- **Long-form writing**: Write detailed thoughts, reflections, and observations
- **Multiple entries per book**: Track your reading journey over time
- **Timestamps**: Each entry automatically saves creation and edit times
- **Edit & Delete**: Full control over your diary entries
- **Private only**: Entries are strictly private (RLS enforced), never shared publicly

### 🌟 Public Ratings vs Private Diary
- **Ratings**: Public and visible to all users
- **Reviews**: Public book reviews with AI summaries
- **Diary**: Completely private, for personal reflection only

### 🤖 AI-Powered Insights
- **Analyze reading journey**: AI reviews all your diary entries for a book
- **Thoughtful observations**: Identifies themes, emotional arcs, and reading patterns
- **Encouraging feedback**: Warm, supportive analysis from AI literary companion
- **Pattern recognition**: Notices changes in perspective over time

## User Flow

### Accessing the Diary
1. Go to your **Booklist**
2. Tap on any book
3. Choose from:
   - **View Details**: See book information
   - **📔 Open Diary**: View all diary entries for this book
   - **✍️ Add Diary Entry**: Write a new entry immediately

### Writing Diary Entries
1. Tap "Add Diary Entry" or the ✍️ FAB button in the diary
2. Write your thoughts (minimum 10 characters, max 5000)
3. See helpful writing prompts:
   - What are you enjoying or struggling with?
   - Which characters or themes resonate with you?
   - How does this book make you feel?
   - Any predictions or questions?
4. **Save** to record your entry with current date/time

### Viewing Diary
- **Chronological list**: Newest entries first
- **Entry numbers**: Each entry numbered for reference
- **Full timestamps**: Shows creation date/time and edit status
- **Edit/Delete**: Quick access buttons on each entry
- **Pull to refresh**: Update list after adding entries

### Getting AI Insights
1. Open diary for any book with entries
2. Tap **✨ Get AI Insights** button
3. AI analyzes all entries and provides:
   - **Summary**: 2-3 sentence overview of your reading journey
   - **Insights**: 3-5 observations about thoughts, emotions, patterns
   - **Themes**: Notable themes or perspective changes
   - **Stats**: Entry count and date range
4. Review insights in beautiful modal display

## Technical Details

### Database Schema
```sql
user_book_diary table:
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- book_id: UUID (foreign key to books)
- entry_text: TEXT (diary content)
- created_at: TIMESTAMP (auto-generated)
- updated_at: TIMESTAMP (auto-updated on edit)

RLS Policies: User can only view/edit/delete their own entries
```

### API Endpoints
```
GET    /api/diary/book/:bookId      - List all entries for a book
GET    /api/diary/:id                - Get single entry
POST   /api/diary                    - Create new entry
PUT    /api/diary/:id                - Update entry
DELETE /api/diary/:id                - Delete entry
POST   /api/diary/summarize/:bookId  - Generate AI insights
```

### Mobile Screens
- **DiaryScreen.js**: View all diary entries for a book
  - List view with timestamps
  - Edit/delete actions
  - AI insights modal
  - FAB for quick entry creation
  
- **AddDiaryEntryScreen.js**: Write/edit diary entries
  - Long-form text input (5000 char limit)
  - Character counter
  - Writing tips
  - Timestamp display
  - Unsaved changes warning

### Security & Privacy
- **Row Level Security (RLS)**: Database-level privacy enforcement
- **Authentication required**: All endpoints require valid JWT token
- **User validation**: Backend verifies user owns the book in their booklist
- **Private by default**: No API endpoint exposes other users' diary entries

## AI Analysis Details

### OpenAI Integration
- **Model**: GPT-3.5-turbo
- **Temperature**: 0.7 (balanced creativity/accuracy)
- **Max tokens**: 500
- **System prompt**: Acts as "thoughtful literary companion"
- **Output format**: JSON with summary, insights, themes

### Analysis Request
Sends to AI:
- All diary entries with timestamps
- Book title and author
- Request for: summary, insights, themes

### Fallback Behavior
If OpenAI API key not configured:
- Returns basic summary with entry count and date range
- Still functional, just less insightful
- No error to user, graceful degradation

## Setup Instructions

### 1. Database Setup
Run the schema file:
```bash
psql -d your_database < backend/user-book-diary-schema.sql
```

Or in Supabase SQL Editor:
```sql
-- Copy contents of user-book-diary-schema.sql
```

### 2. Backend Configuration
The diary routes are already integrated in `backend/server.js`:
```javascript
app.use('/api/diary', diaryRoutes);
```

### 3. Optional: OpenAI API Key
For full AI insights (not required for basic functionality):
```bash
# Add to backend/.env
OPENAI_API_KEY=sk-your-api-key-here
```

Get an API key from: https://platform.openai.com/api-keys

### 4. Mobile App
No additional setup needed - screens are integrated into navigation.

## Usage Guidelines

### Best Practices
- **Write regularly**: Document thoughts as you read
- **Be honest**: Private space for authentic reactions
- **Track progress**: Note page numbers or chapters
- **Ask questions**: Record predictions and mysteries
- **Emotional tracking**: How does the book make you feel?

### Writing Prompts
- First impressions after starting
- Character analysis and development
- Plot predictions and theories
- Emotional reactions to events
- Connections to personal experiences
- Questions for discussion
- Memorable quotes and passages
- Reading pace and engagement level

### AI Insights Tips
- Write at least 3-4 entries for meaningful analysis
- Include variety: emotions, thoughts, predictions
- Be descriptive for better AI understanding
- Update entries throughout your reading journey
- Generate insights after finishing for full picture

## Privacy Notes

### What's Private
- ✅ Diary entries (completely private)
- ✅ Diary entry count
- ✅ Diary timestamps
- ✅ AI insights

### What's Public
- ❌ Book ratings (visible to all)
- ❌ Book reviews (visible to all)
- ❌ That you have a book in your booklist

## Feature Comparison

| Feature | Ratings | Reviews | Diary |
|---------|---------|---------|-------|
| Privacy | Public | Public | Private |
| Length | Single choice | Medium | Long-form |
| Multiple entries | No | No | Yes |
| AI Summary | No | Yes | Yes (insights) |
| Timestamps | No | Single | Multiple |
| Edit | Yes | No | Yes |
| Purpose | Share opinion | Public feedback | Personal reflection |

## Future Enhancements (Potential)

- 📊 Personal reading statistics from diary
- 🏷️ Tags/categories for diary entries
- 🔍 Search within diary entries
- 📤 Export diary as PDF/markdown
- 📈 Emotional arc visualization
- 🎨 Rich text formatting
- 📷 Attach images to entries
- 🔗 Link entries to specific pages/chapters
- ⚡ Quick notes vs full entries
- 🌙 Dark mode optimized reading

## Troubleshooting

### "Failed to create diary entry"
- Ensure book is in your booklist first
- Check entry is at least 10 characters
- Verify authentication token is valid

### "No AI insights generated"
- Write at least one diary entry
- Check OpenAI API key if configured
- Fallback summary will still work

### "Entry not saving"
- Check internet connection
- Verify entry length (10-5000 chars)
- Try again after brief wait

### RLS Errors
- Database permissions properly set
- User is authenticated
- Run schema file if newly deployed
