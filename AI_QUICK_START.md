# AI Features Quick Start Guide

Get the new AI features up and running in 5 minutes!

## 🚀 Quick Setup

### 1. Get Your OpenAI API Key (2 minutes)

1. Go to https://platform.openai.com/
2. Sign up or log in
3. Click on your profile → "API keys"
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)

### 2. Configure Your Backend (1 minute)

```bash
cd backend
```

Add to your `.env` file:
```env
OPENAI_API_KEY=sk-your-api-key-here
```

### 3. Start the Server (1 minute)

```bash
npm run dev
```

You should see:
```
Server running on port 5000
MongoDB connected successfully
```

### 4. Verify It's Working (1 minute)

Test the AI status endpoint:
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

## ✅ You're Ready!

All AI features are now active. Here's what you can do:

### Try Sentiment Analysis

```bash
curl -X POST http://localhost:5000/api/ai/sentiment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"text": "This book was absolutely amazing!"}'
```

### Try Topic Tagging

```bash
curl -X POST http://localhost:5000/api/ai/generate-tags \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"text": "A fantasy adventure with dragons and magic"}'
```

### Try Summarization

```bash
curl -X POST http://localhost:5000/api/ai/summarize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"text": "Your long text here...", "maxLength": 100}'
```

## 🎯 What's Available

### Sentiment Analysis
- Analyze emotional tone of reviews
- Get aspect-based insights (plot, characters, writing)
- Calculate aggregate sentiment for books

**Endpoints:**
- `POST /api/ai/sentiment`
- `GET /api/ai/review-sentiment/:reviewId`
- `GET /api/ai/book-sentiment/:bookId`

### Topic Tagging
- Auto-generate relevant tags
- Categorize books and discussions
- Improve search and discovery

**Endpoints:**
- `POST /api/ai/generate-tags`
- `GET /api/ai/book-tags/:bookId`

### Summarization
- Generate book summaries
- Summarize long reviews
- Create discussion summaries

**Endpoints:**
- `POST /api/ai/summarize`
- `GET /api/ai/book-summary/:bookId`
- `GET /api/ai/discussion-summary/:forumId`

### Personalized Notifications
- AI-generated notification content
- Context-aware messaging
- Multiple notification types

**Endpoint:**
- `POST /api/ai/notification`

## 📚 Next Steps

### For Developers
1. Read [AI_API_EXAMPLES.md](AI_API_EXAMPLES.md) for integration examples
2. Check [AI_SETUP.md](AI_SETUP.md) for detailed configuration
3. Review [AI_IMPLEMENTATION_SUMMARY.md](AI_IMPLEMENTATION_SUMMARY.md) for architecture

### For Users
- Features work automatically in the background
- Sentiment badges appear on reviews
- Tags help with book discovery
- Summaries appear on book pages
- Notifications are more engaging

## 💡 Tips

### Cost Management
- Monthly cost: ~$15-30 for 1,000 users
- Rate limited to 20 requests per 15 minutes
- Implement caching to reduce costs by 50-70%

### Without API Key
All features gracefully degrade:
- Sentiment: Returns neutral
- Tags: Returns generic tags
- Summary: Returns truncated text
- Notifications: Returns default messages

### Troubleshooting

**Features not working?**
```bash
# Check if API key is set
echo $OPENAI_API_KEY

# Test the status endpoint
curl http://localhost:5000/api/ai/status

# Check backend logs
npm run dev
```

**Rate limited?**
- Wait 15 minutes
- Implement caching (see AI_SETUP.md)
- Upgrade OpenAI plan if needed

## 🎉 That's It!

You now have 5 powerful AI features running in your Book Club application!

For more details:
- **Setup Guide**: [AI_SETUP.md](AI_SETUP.md)
- **API Examples**: [AI_API_EXAMPLES.md](AI_API_EXAMPLES.md)
- **Implementation Details**: [AI_IMPLEMENTATION_SUMMARY.md](AI_IMPLEMENTATION_SUMMARY.md)
- **Main Docs**: [README.md](README.md)

---

**Need Help?** Check the troubleshooting sections in the full documentation.
