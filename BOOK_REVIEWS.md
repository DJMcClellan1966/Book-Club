# Book Review Feature

## Overview
Users can now write reviews for books in their booklist and get AI-powered summaries of their reviews.

## How It Works

### Adding a Book with Review
1. **Search for a book**: Use the Add Book screen to search by title, ISBN, or scan with camera
2. **Select the book**: Tap on a search result
3. **Rate & Review**: You'll be taken to the rating screen where you can:
   - Select a rating (5 options):
     - 🌙 Stayed Up All Night
     - 🔁 Would Read Again
     - ✅ Once Was Enough
     - 🤔 Might Come Back Later
     - 😐 Meh
   - Write a detailed review (optional)
   - Mark as favorite
   - Add finished date
4. **AI Summary**: If your review is 50+ characters, click "Generate AI Summary" to get a concise 1-2 sentence summary
5. **Save**: Add the book to your booklist with your rating, review, and summary

### Viewing Reviews
- **Booklist Screen**: Books display:
  - Rating badge with emoji and label
  - AI-generated summary (if available) in purple/blue italic text with 💭 emoji
  - Or original review text (if no summary generated)
  - Finished date
  - Favorite status

### AI Summarization
- **Backend**: Uses OpenAI GPT-3.5-turbo API
- **Fallback**: If API key not configured, creates simple truncated summary
- **Requirements**: Review must be at least 50 characters long
- **Output**: 1-2 sentence summary that captures the essence of your review
- **Regenerate**: Can regenerate summary if you're not satisfied

## Technical Details

### Database Schema
```sql
-- user_booklist table columns:
- rating: Text (stayed-up-all-night, would-read-again, etc.)
- review_text: Text (full user review)
- review_summary: Text (AI-generated summary)
- is_favorite: Boolean
- finished_date: Date
```

### API Endpoints
```
POST /api/booklist/summarize-review
Body: { reviewText: string }
Returns: { summary: string }
```

### Mobile Screens
- **AddToBooklistScreen**: New screen for rating and reviewing books
- **BooklistScreen**: Updated to display AI summaries
- **AddBookScreen**: Modified to navigate to rating screen after book selection

## Setup (Development)

### Optional: Configure OpenAI API
If you want real AI-powered summaries (not just truncation):

1. Get an OpenAI API key from https://platform.openai.com/api-keys
2. Add to `backend/.env`:
```
OPENAI_API_KEY=sk-your-api-key-here
```
3. Restart backend server

Without an API key, the system will use a fallback that creates a simple truncated version of the review.

## User Experience Flow

```
Search Book → Select → Rate & Review Screen
                           ↓
              Write Review (50+ chars)
                           ↓
              Generate AI Summary Button
                           ↓
              Review Summary Displayed
                           ↓
              Submit to Booklist
                           ↓
              View in Booklist with Summary
```

## Features
- ✅ 5 fun rating options with emojis
- ✅ Optional written reviews
- ✅ AI-powered review summarization
- ✅ Regenerate summary option
- ✅ Favorite toggle
- ✅ Finished date tracking
- ✅ Display summaries in booklist
- ✅ Fallback for when AI unavailable
