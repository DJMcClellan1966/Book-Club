# AI API Examples

Quick reference guide for using the AI features API endpoints.

## Authentication

Most AI endpoints require authentication. Include the JWT token in the Authorization header:

```javascript
const config = {
  headers: {
    'Authorization': `Bearer ${token}`
  }
};
```

## 1. Sentiment Analysis

### Analyze Custom Text

```javascript
const response = await axios.post('/api/ai/sentiment', {
  text: "This book was absolutely amazing! The plot was engaging and the characters were well-developed."
}, config);

console.log(response.data);
// {
//   sentiment: "positive",
//   score: 0.85,
//   aspects: {
//     plot: 0.9,
//     characters: 0.8,
//     writing: 0.7
//   }
// }
```

### Get Review Sentiment

```javascript
const response = await axios.get('/api/ai/review-sentiment/60f7b3b3b3b3b3b3b3b3b3b3');

console.log(response.data);
// {
//   reviewId: "60f7b3b3b3b3b3b3b3b3b3b3",
//   sentiment: "positive",
//   score: 0.75,
//   aspects: { ... }
// }
```

### Get Aggregate Book Sentiment

```javascript
const response = await axios.get('/api/ai/book-sentiment/60f7b3b3b3b3b3b3b3b3b3b3');

console.log(response.data);
// {
//   bookId: "60f7b3b3b3b3b3b3b3b3b3b3",
//   averageSentiment: "positive",
//   averageScore: 0.72,
//   reviewCount: 15,
//   analyzedCount: 15
// }
```

### Frontend Integration Example

```javascript
// In a React component
import { useState, useEffect } from 'react';
import axios from 'axios';

function ReviewSentiment({ reviewId }) {
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSentiment = async () => {
      try {
        const response = await axios.get(`/api/ai/review-sentiment/${reviewId}`);
        setSentiment(response.data);
      } catch (error) {
        console.error('Error fetching sentiment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSentiment();
  }, [reviewId]);

  if (loading) return <div>Analyzing sentiment...</div>;
  if (!sentiment) return null;

  return (
    <div className="sentiment-badge">
      <span className={`badge ${sentiment.sentiment}`}>
        {sentiment.sentiment === 'positive' ? '😊' : 
         sentiment.sentiment === 'negative' ? '😞' : '😐'}
        {' '}{sentiment.sentiment}
      </span>
      <div className="sentiment-score">
        Score: {(sentiment.score * 100).toFixed(0)}%
      </div>
    </div>
  );
}
```

## 2. Topic Tagging

### Generate Tags for Custom Text

```javascript
const response = await axios.post('/api/ai/generate-tags', {
  text: "A thrilling mystery novel set in Victorian London, featuring a brilliant detective and complex murder cases.",
  title: "The Mystery of Baker Street"
}, config);

console.log(response.data);
// {
//   tags: ["mystery", "historical", "thriller", "Victorian", "detective", "London", "crime"]
// }
```

### Get Book Tags

```javascript
const response = await axios.get('/api/ai/book-tags/60f7b3b3b3b3b3b3b3b3b3b3');

console.log(response.data);
// {
//   bookId: "60f7b3b3b3b3b3b3b3b3b3b3",
//   tags: ["fantasy", "adventure", "young-adult", "magic", "quest"]
// }
```

### Frontend Integration Example

```javascript
function BookTags({ bookId }) {
  const [tags, setTags] = useState([]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await axios.get(`/api/ai/book-tags/${bookId}`);
        setTags(response.data.tags);
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };

    fetchTags();
  }, [bookId]);

  return (
    <div className="tag-cloud">
      {tags.map(tag => (
        <span key={tag} className="tag">
          {tag}
        </span>
      ))}
    </div>
  );
}
```

## 3. Summarization

### Summarize Custom Text

```javascript
const response = await axios.post('/api/ai/summarize', {
  text: "Long book description or review text goes here...",
  maxLength: 100 // Optional, defaults to 100 words
}, config);

console.log(response.data);
// {
//   summary: "A concise summary of the text in approximately 100 words..."
// }
```

### Get Book Summary

```javascript
const response = await axios.get('/api/ai/book-summary/60f7b3b3b3b3b3b3b3b3b3b3');

console.log(response.data);
// {
//   bookId: "60f7b3b3b3b3b3b3b3b3b3b3",
//   title: "The Great Gatsby",
//   summary: "A classic tale of wealth, love, and the American Dream..."
// }
```

### Frontend Integration Example

```javascript
function BookSummary({ bookId }) {
  const [summary, setSummary] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      const response = await axios.get(`/api/ai/book-summary/${bookId}`);
      setSummary(response.data);
    };

    fetchSummary();
  }, [bookId]);

  if (!summary) return <div>Loading summary...</div>;

  return (
    <div className="book-summary">
      <h3>AI Summary</h3>
      <p className={isExpanded ? '' : 'collapsed'}>
        {summary.summary}
      </p>
      <button onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? 'Show Less' : 'Show More'}
      </button>
    </div>
  );
}
```

## 4. Discussion Summarizer

### Get Forum Discussion Summary

```javascript
const response = await axios.get('/api/ai/discussion-summary/60f7b3b3b3b3b3b3b3b3b3b3', config);

console.log(response.data);
// {
//   forumId: "60f7b3b3b3b3b3b3b3b3b3b3",
//   forumTitle: "Discussion of The Great Gatsby",
//   summary: "Participants discussed themes of wealth and moral decay. Most agreed..."
// }
```

### Frontend Integration Example

```javascript
function DiscussionSummary({ forumId }) {
  const [summary, setSummary] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const token = localStorage.getItem('token');

  const generateSummary = async () => {
    try {
      const response = await axios.get(`/api/ai/discussion-summary/${forumId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(response.data);
      setShowSummary(true);
    } catch (error) {
      console.error('Error generating summary:', error);
    }
  };

  return (
    <div className="discussion-summary">
      <button onClick={generateSummary} className="btn-primary">
        📝 Generate Discussion Summary
      </button>
      
      {showSummary && summary && (
        <div className="summary-card">
          <h4>{summary.forumTitle}</h4>
          <p>{summary.summary}</p>
        </div>
      )}
    </div>
  );
}
```

## 5. Personalized Notifications

### Generate Notification Content

```javascript
const response = await axios.post('/api/ai/notification', {
  type: 'recommendation',
  context: {
    bookTitle: "The Midnight Library",
    authorName: "Matt Haig",
    reason: "Based on your interest in philosophical fiction"
  }
}, config);

console.log(response.data);
// {
//   title: "New Book Recommendation!",
//   message: "Discover 'The Midnight Library' by Matt Haig - perfect for fans of philosophical fiction!"
// }
```

### Notification Types

```javascript
// Recommendation notification
await axios.post('/api/ai/notification', {
  type: 'recommendation',
  context: { bookTitle: "...", reason: "..." }
}, config);

// Discussion notification
await axios.post('/api/ai/notification', {
  type: 'discussion',
  context: { forumTitle: "...", newPosts: 5 }
}, config);

// Trend notification
await axios.post('/api/ai/notification', {
  type: 'trend',
  context: { trendingBooks: [...], genre: "fantasy" }
}, config);
```

### Frontend Integration Example

```javascript
function NotificationGenerator({ userId }) {
  const sendNotification = async (type, context) => {
    try {
      const notificationData = await axios.post('/api/ai/notification', 
        { type, context },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Send to notification service
      await axios.post('/api/notifications/send', {
        userId,
        ...notificationData.data
      });

      console.log('Notification sent:', notificationData.data);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  return sendNotification;
}
```

## 6. Check AI Service Status

### Get Service Configuration

```javascript
const response = await axios.get('/api/ai/status');

console.log(response.data);
// {
//   configured: true,
//   features: {
//     contentModeration: true,
//     recommendations: true,
//     sentimentAnalysis: true,
//     topicTagging: true,
//     summarization: true,
//     aiChats: true,
//     speechToText: false,
//     ocr: false,
//     notifications: true
//   }
// }
```

### Use Status to Conditionally Enable Features

```javascript
function AIFeatureManager() {
  const [aiStatus, setAiStatus] = useState(null);

  useEffect(() => {
    const checkAIStatus = async () => {
      const response = await axios.get('/api/ai/status');
      setAiStatus(response.data);
    };

    checkAIStatus();
  }, []);

  if (!aiStatus || !aiStatus.configured) {
    return <div>AI features are currently unavailable</div>;
  }

  return (
    <div className="ai-features">
      {aiStatus.features.sentimentAnalysis && (
        <SentimentAnalysisFeature />
      )}
      {aiStatus.features.topicTagging && (
        <TopicTaggingFeature />
      )}
      {aiStatus.features.summarization && (
        <SummarizationFeature />
      )}
    </div>
  );
}
```

## 7. Placeholder Features

### Speech-to-Text (Coming Soon)

```javascript
// This will be available after Whisper API integration
const formData = new FormData();
formData.append('audio', audioFile);

const response = await axios.post('/api/ai/transcribe', 
  { audioFilePath: '/path/to/audio.mp3' },
  config
);

console.log(response.data);
// { transcription: "Transcribed text from audio..." }
```

### OCR (Coming Soon)

```javascript
// This will be available after Vision API or Tesseract integration
const response = await axios.post('/api/ai/ocr', 
  { imageData: base64ImageData },
  config
);

console.log(response.data);
// { text: "Extracted text from image..." }
```

## Error Handling Best Practices

### Handle API Errors Gracefully

```javascript
async function safeAIRequest(endpoint, data, config) {
  try {
    const response = await axios.post(endpoint, data, config);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`AI request failed for ${endpoint}:`, error);
    
    if (error.response?.status === 429) {
      return { 
        success: false, 
        error: 'Rate limit exceeded. Please try again later.' 
      };
    }
    
    if (error.response?.status === 401) {
      return { 
        success: false, 
        error: 'Authentication required.' 
      };
    }
    
    return { 
      success: false, 
      error: 'An error occurred. Please try again.' 
    };
  }
}

// Usage
const result = await safeAIRequest('/api/ai/sentiment', { text }, config);
if (result.success) {
  console.log('Sentiment:', result.data);
} else {
  console.error('Error:', result.error);
}
```

## Rate Limiting Considerations

The API has rate limiting in place. For optimal performance:

1. **Cache Results**: Store sentiment analysis and summaries locally
2. **Batch Requests**: Group similar operations together
3. **Debounce User Input**: Wait for user to finish typing before analyzing
4. **Show Loading States**: Indicate to users when AI is processing

```javascript
// Example: Debounced sentiment analysis
import { debounce } from 'lodash';

const debouncedAnalyze = debounce(async (text) => {
  const response = await axios.post('/api/ai/sentiment', { text }, config);
  setSentiment(response.data);
}, 1000); // Wait 1 second after user stops typing

// In component
useEffect(() => {
  if (reviewText.length > 50) {
    debouncedAnalyze(reviewText);
  }
}, [reviewText]);
```

## Testing

### Test with Sample Data

```javascript
// Test sentiment analysis
const testReview = "This book exceeded all my expectations! The storytelling was masterful.";
const sentiment = await axios.post('/api/ai/sentiment', { text: testReview }, config);
console.assert(sentiment.data.sentiment === 'positive', 'Expected positive sentiment');

// Test topic tagging
const testText = "A fantasy adventure with dragons and magic";
const tags = await axios.post('/api/ai/generate-tags', { text: testText }, config);
console.assert(tags.data.tags.includes('fantasy'), 'Expected fantasy tag');
```

## Production Considerations

### 1. Implement Caching

```javascript
// Simple cache implementation
const cache = new Map();

async function getCachedSentiment(reviewId) {
  const cacheKey = `sentiment:${reviewId}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const response = await axios.get(`/api/ai/review-sentiment/${reviewId}`);
  cache.set(cacheKey, response.data);
  
  // Clear cache after 1 hour
  setTimeout(() => cache.delete(cacheKey), 3600000);
  
  return response.data;
}
```

### 2. Add Loading States

```javascript
function ReviewWithSentiment({ review }) {
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const analyze = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/ai/review-sentiment/${review.id}`);
        setSentiment(response.data);
      } catch (err) {
        setError('Unable to analyze sentiment');
      } finally {
        setLoading(false);
      }
    };

    analyze();
  }, [review.id]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!sentiment) return null;

  return <SentimentDisplay sentiment={sentiment} />;
}
```

### 3. Monitor Performance

```javascript
async function monitoredAIRequest(endpoint, data, config) {
  const startTime = Date.now();
  
  try {
    const response = await axios.post(endpoint, data, config);
    const duration = Date.now() - startTime;
    
    // Log performance metrics
    console.log(`AI Request to ${endpoint} took ${duration}ms`);
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`AI Request failed after ${duration}ms:`, error);
    throw error;
  }
}
```

## Support

For issues or questions:
- Check [AI_SETUP.md](AI_SETUP.md) for detailed setup instructions
- Review backend logs for error details
- Verify OpenAI API key is configured correctly
- Test with the `/api/ai/status` endpoint first

---

**Last Updated**: December 2024  
**API Version**: v1.0  
**Base URL**: `/api/ai`
