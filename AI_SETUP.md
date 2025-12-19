# AI Features Setup Guide

This guide covers all AI-powered features in the Book Club application and how to set them up.

## 🎯 Overview

The Book Club application includes comprehensive AI capabilities powered by OpenAI's GPT models. These features enhance user experience through intelligent content analysis, recommendations, and automation.

## 🚀 Available AI Features

### ✅ Fully Implemented Features

1. **Content Moderation** - Automatic filtering of inappropriate content in forums and spaces
2. **Book Recommendations** - Personalized suggestions based on reading history
3. **Reading Insights** - AI-generated analysis of reading habits
4. **AI Character & Author Chats** - Conversations with book characters and authors
5. **Sentiment Analysis** - Analyze emotions and opinions in reviews
6. **Topic Tagging** - Automatic categorization of books and discussions
7. **Text Summarization** - Generate concise summaries of books and discussions
8. **Personalized Notifications** - AI-generated notification content

### 🔧 Placeholder Features (Ready for Integration)

9. **Speech-to-Text** - Voice review submission (requires Whisper API integration)
10. **OCR** - Extract text from book images (requires Vision API or Tesseract integration)

## 📋 Prerequisites

### Required
- Node.js (v14 or higher)
- OpenAI API account
- Active OpenAI API key with credits

### Optional
- OpenAI Whisper API access (for speech-to-text)
- OpenAI GPT-4 Vision API or Google Cloud Vision (for OCR)
- Tesseract.js (alternative for OCR)

## 🔑 API Key Setup

### Step 1: Get OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the key (you won't be able to see it again!)

### Step 2: Configure Environment

Add the API key to your backend `.env` file:

```env
# Required for AI features
OPENAI_API_KEY=sk-your-api-key-here

# Optional: Configure for production
NODE_ENV=production
```

### Step 3: Verify Configuration

Start the backend server and check the AI status endpoint:

```bash
cd backend
npm run dev
```

Test the endpoint:
```bash
curl http://localhost:5000/api/ai/status
```

Expected response:
```json
{
  "configured": true,
  "features": {
    "contentModeration": true,
    "recommendations": true,
    "sentimentAnalysis": true,
    "topicTagging": true,
    "summarization": true,
    "aiChats": true,
    "speechToText": false,
    "ocr": false,
    "notifications": true
  }
}
```

## 📚 Feature Documentation

### 1. Sentiment Analysis

**Purpose**: Analyze the emotional tone and sentiment of book reviews.

**API Endpoints**:
```
POST /api/ai/sentiment
GET /api/ai/review-sentiment/:reviewId
GET /api/ai/book-sentiment/:bookId
```

**Example Usage**:
```javascript
// Analyze custom text
const response = await axios.post('/api/ai/sentiment', {
  text: "This book was absolutely amazing! The characters were so well developed."
});
// Returns: { sentiment: "positive", score: 0.85, aspects: {...} }

// Get sentiment for a specific review
const reviewSentiment = await axios.get('/api/ai/review-sentiment/123');

// Get aggregate sentiment for all reviews of a book
const bookSentiment = await axios.get('/api/ai/book-sentiment/456');
```

**Response Format**:
```json
{
  "sentiment": "positive|negative|neutral",
  "score": 0.85,
  "aspects": {
    "plot": 0.9,
    "characters": 0.8,
    "writing": 0.7
  }
}
```

### 2. Topic Tagging

**Purpose**: Automatically generate relevant topic tags for books and discussions.

**API Endpoints**:
```
POST /api/ai/generate-tags
GET /api/ai/book-tags/:bookId
```

**Example Usage**:
```javascript
// Generate tags for custom text
const response = await axios.post('/api/ai/generate-tags', {
  text: "A thrilling mystery set in Victorian London...",
  title: "The Mystery of Baker Street"
});
// Returns: { tags: ["mystery", "historical", "thriller", "Victorian", "London"] }

// Get tags for a book
const bookTags = await axios.get('/api/ai/book-tags/789');
```

**Use Cases**:
- Automatic book categorization
- Forum topic classification
- Search optimization
- Recommendation filtering

### 3. Book Summary Generator

**Purpose**: Create concise summaries of books, reviews, or long text content.

**API Endpoints**:
```
POST /api/ai/summarize
GET /api/ai/book-summary/:bookId
```

**Example Usage**:
```javascript
// Summarize custom text
const response = await axios.post('/api/ai/summarize', {
  text: "Long book description or review...",
  maxLength: 100 // Optional, defaults to 100 words
});

// Get AI-generated book summary
const summary = await axios.get('/api/ai/book-summary/789');
```

**Configuration**:
- Default max length: 100 words
- Adjustable via `maxLength` parameter
- Falls back to truncation if API unavailable

### 4. Discussion Summarizer

**Purpose**: Generate summaries of forum discussions and threads.

**API Endpoints**:
```
GET /api/ai/discussion-summary/:forumId
```

**Example Usage**:
```javascript
const summary = await axios.get('/api/ai/discussion-summary/101');
// Returns: { forumId, forumTitle, summary: "The discussion focused on..." }
```

**Features**:
- Identifies main discussion points
- Captures different perspectives
- Highlights consensus or conclusions
- Keeps summaries under 150 words

### 5. Personalized Notifications

**Purpose**: Generate engaging, personalized notification content.

**API Endpoints**:
```
POST /api/ai/notification
```

**Example Usage**:
```javascript
const notification = await axios.post('/api/ai/notification', {
  type: 'recommendation',
  context: {
    bookTitle: "The Midnight Library",
    reason: "Based on your reading of fantasy novels"
  }
});
// Returns: { title: "New Book for You!", message: "Check out The Midnight Library..." }
```

**Notification Types**:
- `recommendation` - Book suggestions
- `discussion` - Forum activity updates
- `trend` - Popular books or trending topics

### 6. Speech-to-Text (Placeholder)

**Status**: Requires Whisper API integration

**Planned Endpoint**:
```
POST /api/ai/transcribe
```

**Integration Steps**:
1. Enable Whisper API in OpenAI dashboard
2. Install file upload middleware (multer)
3. Update `transcribeSpeech()` in aiService.js
4. Add audio file validation

**Future Implementation**:
```javascript
// Planned usage
const response = await axios.post('/api/ai/transcribe', {
  audioFile: formData // Audio file upload
});
```

### 7. OCR for Book Images (Placeholder)

**Status**: Requires Vision API or Tesseract integration

**Planned Endpoint**:
```
POST /api/ai/ocr
```

**Integration Options**:

**Option A: GPT-4 Vision API**
- Best for complex layouts
- Requires GPT-4 Vision access
- Higher cost per request

**Option B: Tesseract.js**
- Open source, free
- Good for printed text
- Lower accuracy on complex layouts

**Option C: Google Cloud Vision**
- High accuracy
- Separate API key required
- Pay per use pricing

**Integration Steps** (Tesseract.js):
```bash
npm install tesseract.js
```

Update in aiService.js:
```javascript
const Tesseract = require('tesseract.js');

async extractTextFromImage(imageData) {
  const { data: { text } } = await Tesseract.recognize(imageData, 'eng');
  return text;
}
```

## 💰 Cost Estimation

### OpenAI API Costs (as of 2024)

**GPT-3.5-turbo** (most features):
- Input: $0.0015 per 1K tokens
- Output: $0.002 per 1K tokens

**Estimated Monthly Costs** (1000 active users):

| Feature | Requests/Month | Est. Cost |
|---------|----------------|-----------|
| Content Moderation | 10,000 | $15-20 |
| Recommendations | 5,000 | $10-15 |
| Sentiment Analysis | 3,000 | $5-10 |
| Summarization | 2,000 | $5-8 |
| Topic Tagging | 2,000 | $3-5 |
| AI Chats | 15,000 | $30-45 |
| **Total** | **37,000** | **$68-103** |

**Cost Optimization Tips**:
1. Implement caching for frequently requested analyses
2. Use rate limiting per user
3. Batch similar requests
4. Cache topic tags and summaries
5. Set up usage alerts in OpenAI dashboard

## 🔒 Security & Privacy

### Data Sent to OpenAI

**Sent**:
- Review text content
- Book descriptions
- Forum post content
- Discussion messages
- Book titles and metadata

**NOT Sent**:
- User passwords
- Email addresses
- Payment information
- Private user data
- Session tokens

### Data Retention

- **OpenAI**: 30 days (per their policy)
- **Your Database**: As per your retention policy
- **Training**: Data is NOT used to train OpenAI models (per API terms)

### Best Practices

1. ✅ Use environment variables for API keys
2. ✅ Never commit API keys to git
3. ✅ Rotate API keys periodically
4. ✅ Set up usage limits in OpenAI dashboard
5. ✅ Monitor API usage and costs
6. ✅ Implement rate limiting
7. ✅ Log API errors but not sensitive data

## 🎛️ Configuration Options

### Environment Variables

```env
# Required
OPENAI_API_KEY=sk-your-key-here

# Optional - AI Service Configuration
AI_MODERATION_ENABLED=true          # Enable/disable content moderation
AI_RECOMMENDATIONS_ENABLED=true     # Enable/disable recommendations
AI_MAX_RETRIES=3                    # Retry failed API calls
AI_TIMEOUT=30000                    # API timeout in milliseconds
AI_CACHE_ENABLED=true               # Enable response caching
AI_CACHE_TTL=3600                   # Cache TTL in seconds

# Optional - Feature-specific
AI_SUMMARY_MAX_LENGTH=100           # Default summary length
AI_TAGS_MAX_COUNT=7                 # Maximum tags per item
AI_SENTIMENT_CACHE_TTL=86400        # Cache sentiment for 24 hours
```

### Runtime Configuration

Modify `aiService.js` to adjust:
- Model selection (gpt-3.5-turbo vs gpt-4)
- Temperature settings (creativity vs consistency)
- Token limits (response length)
- Timeout values

## 🧪 Testing

### Manual Testing

```bash
# Check AI service status
curl http://localhost:5000/api/ai/status

# Test sentiment analysis
curl -X POST http://localhost:5000/api/ai/sentiment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"text": "This book was amazing!"}'

# Test topic tagging
curl -X POST http://localhost:5000/api/ai/generate-tags \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"text": "A thrilling mystery novel", "title": "The Detective"}'
```

### Automated Tests

Create test files in `backend/tests/ai.test.js`:

```javascript
const aiService = require('../services/aiService');

describe('AI Service', () => {
  test('Sentiment analysis returns valid results', async () => {
    const result = await aiService.analyzeSentiment('Great book!');
    expect(result.sentiment).toBeDefined();
    expect(result.score).toBeGreaterThanOrEqual(-1);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});
```

## 📊 Monitoring & Analytics

### Metrics to Track

1. **API Usage**
   - Requests per feature
   - Success/failure rates
   - Average response time
   - Token usage

2. **User Engagement**
   - Feature adoption rates
   - User satisfaction scores
   - Feature interaction frequency

3. **Cost Metrics**
   - Daily/monthly API costs
   - Cost per user
   - Cost per feature

### Logging

Enable detailed logging:

```javascript
// In aiService.js
console.log('[AI Service] Sentiment analysis request:', { userId, textLength });
console.log('[AI Service] Response time:', duration, 'ms');
console.log('[AI Service] Tokens used:', tokensUsed);
```

## 🐛 Troubleshooting

### Common Issues

**"AI features not working"**
- ✓ Verify `OPENAI_API_KEY` is set in `.env`
- ✓ Check API key has sufficient credits
- ✓ Verify key hasn't expired
- ✓ Check OpenAI service status

**"Rate limit exceeded"**
- ✓ Check OpenAI dashboard for limits
- ✓ Implement request queuing
- ✓ Add user-level rate limiting
- ✓ Consider upgrading OpenAI plan

**"Slow response times"**
- ✓ Enable response caching
- ✓ Reduce token limits
- ✓ Use async processing for non-critical features
- ✓ Implement request timeouts

**"High API costs"**
- ✓ Enable aggressive caching
- ✓ Reduce max_tokens in requests
- ✓ Batch similar requests
- ✓ Set up budget alerts

### Debug Mode

Enable debug logging:

```javascript
// In aiService.js
const DEBUG = process.env.AI_DEBUG === 'true';

if (DEBUG) {
  console.log('Request:', requestData);
  console.log('Response:', responseData);
}
```

## 🚀 Advanced Features

### Caching Implementation

```javascript
// Simple in-memory cache
const cache = new Map();

async function getCachedSentiment(text) {
  const key = `sentiment:${text.substring(0, 100)}`;
  if (cache.has(key)) {
    return cache.get(key);
  }
  const result = await aiService.analyzeSentiment(text);
  cache.set(key, result);
  setTimeout(() => cache.delete(key), 3600000); // 1 hour TTL
  return result;
}
```

### Batch Processing

```javascript
// Process multiple items efficiently
async function batchAnalyzeSentiment(reviews) {
  const batchSize = 5;
  const results = [];
  
  for (let i = 0; i < reviews.length; i += batchSize) {
    const batch = reviews.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(review => aiService.analyzeSentiment(review.content))
    );
    results.push(...batchResults);
  }
  
  return results;
}
```

## 📚 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [OpenAI Best Practices](https://platform.openai.com/docs/guides/production-best-practices)
- [Rate Limits Guide](https://platform.openai.com/docs/guides/rate-limits)
- [GPT-3.5 vs GPT-4 Comparison](https://platform.openai.com/docs/models)

## 🆘 Support

For issues with AI features:

1. Check the logs in backend console
2. Verify API key configuration
3. Test with OpenAI Playground
4. Review OpenAI status page
5. Contact support with error details

---

**Last Updated**: December 2024  
**Version**: 2.0  
**API Model**: GPT-3.5-turbo (primary)
