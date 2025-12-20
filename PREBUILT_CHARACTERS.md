# Pre-built AI Characters Feature

## Overview
Pre-built AI characters allow users to instantly chat with famous literary characters without needing to create or train custom AI models. These characters are powered by GPT-3.5-turbo with carefully crafted system prompts that embody each character's personality, speaking style, and background.

## Features

### 8 Pre-built Characters
1. **Sherlock Holmes** 🔍 - The world's greatest detective
2. **Elizabeth Bennet** 👗 - Witty heroine from Pride and Prejudice
3. **Gandalf the Grey** 🧙‍♂️ - Wise wizard from Middle-earth
4. **Atticus Finch** ⚖️ - Moral compass from To Kill a Mockingbird
5. **Hermione Granger** 📚 - Brilliant witch from Harry Potter
6. **Jay Gatsby** 🎩 - Mysterious millionaire from The Great Gatsby
7. **Jane Eyre** 🕊️ - Independent governess
8. **Holden Caulfield** 🎓 - Cynical teenager from Catcher in the Rye

### Key Benefits
- **Instant Access**: No waiting for model training (20-40 minutes)
- **Always Available**: Characters are ready 24/7
- **High Quality**: Carefully crafted prompts ensure authentic personalities
- **Conversation Memory**: Each character remembers your conversation history
- **Easy to Use**: Just tap and start chatting

## Architecture

### Backend Components

#### 1. Character Configuration
**File**: `backend/config/prebuiltCharacters.js`

Each character has:
- `id`: Unique identifier (e.g., 'sherlock-holmes')
- `name`: Display name
- `type`: Always 'character'
- `book`: Source book title
- `author`: Book author
- `avatar`: Emoji representation
- `description`: Short character summary
- `personality`: Detailed personality traits
- `background`: Character history
- `speakingStyle`: How they talk
- `systemPrompt`: Detailed GPT prompt (kept server-side for security)

#### 2. API Routes
**File**: `backend/routes/prebuiltCharacters.js`

Endpoints:
- `GET /api/prebuilt-characters` - List all pre-built characters
- `GET /api/prebuilt-characters/:characterId` - Get specific character details
- `POST /api/prebuilt-characters/:characterId/chat` - Chat with character
- `GET /api/prebuilt-characters/:characterId/conversations` - Get conversation history
- `DELETE /api/prebuilt-characters/conversations/:conversationId` - Delete conversation

#### 3. Database Schema
**File**: `backend/prebuilt-characters-schema.sql`

Table: `prebuilt_character_chats`
- Stores conversation history with pre-built characters
- RLS policies ensure users only see their own conversations
- JSONB field for flexible message storage

### Mobile Components

#### 1. PrebuiltCharacterChatScreen
**File**: `mobile/src/screens/PrebuiltCharacterChatScreen.js`

Features:
- Message bubbles with character avatars
- Starter prompts for easy conversation beginning
- Real-time typing indicator
- Auto-scrolling to latest message
- Conversation persistence

#### 2. Updated AIModelsScreen
**File**: `mobile/src/screens/AIModelsScreen.js`

New features:
- "Pre-built" filter tab (✨ Pre-built)
- Displays pre-built characters alongside custom models
- Different card styling for pre-built vs custom
- "Ready" badge on all pre-built characters

## Usage

### For Users

#### Mobile App
1. Open app and navigate to **Profile** tab
2. Tap **AI Chats**
3. Tap **✨ Pre-built** filter
4. Browse available characters
5. Tap any character to start chatting
6. Use starter prompts or type your own message

#### Example Conversations

**With Sherlock Holmes:**
```
You: Tell me about yourself
Sherlock: Ah, my dear fellow, I observe that you are curious about 
my methods. I am a consulting detective - the world's only one, 
I might add. I reside at 221B Baker Street where I receive clients 
with problems that baffle Scotland Yard...
```

**With Hermione Granger:**
```
You: What's your favorite spell?
Hermione: Honestly, that's like asking which book is my favorite! 
But if I had to choose, I'd say Accio is incredibly practical. 
Though I'm quite proud of my Patronus charm - it's an otter, by 
the way...
```

### For Developers

#### Adding New Characters

1. Edit `backend/config/prebuiltCharacters.js`:
```javascript
{
  id: 'new-character',
  name: 'Character Name',
  type: 'character',
  book: 'Book Title',
  author: 'Author Name',
  avatar: '🎭',
  description: 'Short description',
  personality: 'Detailed traits',
  background: 'Character history',
  speakingStyle: 'How they talk',
  systemPrompt: `Detailed GPT prompt...`
}
```

2. Character will automatically appear in the app

#### API Integration

**Get all characters:**
```javascript
const response = await fetch(`${API_URL}/prebuilt-characters`);
const characters = await response.json();
```

**Chat with character:**
```javascript
const response = await fetch(
  `${API_URL}/prebuilt-characters/sherlock-holmes/chat`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      message: 'Tell me about yourself',
      conversationId: existingConversationId // optional
    })
  }
);
const data = await response.json();
// Returns: { conversationId, message, character }
```

## Database Setup

Run the schema file to create the required table:

```bash
# Connect to Supabase
psql "postgresql://..."

# Run schema
\i backend/prebuilt-characters-schema.sql
```

Or execute via Supabase dashboard SQL editor.

## Configuration

### Environment Variables
No additional environment variables needed - uses existing `OPENAI_API_KEY`.

### Costs
Each message costs ~$0.002 (GPT-3.5-turbo pricing):
- User message tokens
- System prompt tokens (~500-800 per character)
- Conversation history tokens
- Response tokens

Typical conversation: $0.01-0.05 for 10-20 messages.

## Comparison: Pre-built vs Custom Fine-tuned

| Feature | Pre-built Characters | Custom Fine-tuned |
|---------|---------------------|-------------------|
| Setup Time | Instant | 20-40 minutes |
| Training Cost | None | $0.50-2.00 per model |
| Per-message Cost | ~$0.002 | ~$0.002 |
| Quality | High (with good prompts) | Very High (trained) |
| Customization | Limited | Full control |
| Use Case | Popular characters | Your own books/characters |

## Best Practices

### Character Design
1. **Rich System Prompts**: Include personality, speaking style, background
2. **Specific Examples**: Show exactly how character speaks
3. **Context Boundaries**: Remind AI to stay in character
4. **Fallback Handling**: Handle out-of-character requests gracefully

### Conversation Management
1. **Limit History**: Send last 10-20 messages to control costs
2. **Session Timeout**: Clear old conversations after 30 days
3. **Error Handling**: Gracefully handle API failures
4. **Rate Limiting**: Prevent abuse with rate limits

## Troubleshooting

### Character Not Responding in Character
- Review system prompt for clarity
- Add more specific speaking style examples
- Include phrases/words they commonly use

### High API Costs
- Limit conversation history sent to API
- Implement conversation summaries for long chats
- Set max_tokens limit on responses

### Slow Response Time
- Usually 2-5 seconds with GPT-3.5-turbo
- If slower, check network latency
- Consider caching common responses

## Future Enhancements

### Potential Features
1. **Voice Chat**: Add text-to-speech for character voices
2. **More Characters**: Expand to 20-50 famous characters
3. **Character Collections**: Group by genre, era, etc.
4. **Multi-character Conversations**: Characters talking to each other
5. **Custom Scenarios**: Drop characters into specific situations
6. **Character Polls**: Let users vote on new characters to add

### Advanced Features
1. **Image Generation**: Character portraits with DALL-E
2. **Memory System**: Long-term memory across sessions
3. **Personality Quizzes**: "Which character are you?"
4. **Writing Prompts**: Characters give creative writing prompts

## Testing

### Manual Testing
1. Chat with each character
2. Verify personality consistency
3. Test conversation history
4. Check error handling

### Automated Testing
```bash
# Test character listing
curl ${API_URL}/prebuilt-characters

# Test chat (requires auth token)
curl -X POST ${API_URL}/prebuilt-characters/sherlock-holmes/chat \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Sherlock"}'
```

## Support

For issues or questions:
1. Check conversation logs in database
2. Review OpenAI API logs
3. Test with different prompts
4. Verify authentication tokens

## License & Attribution

Characters are from public domain or fair use for educational purposes:
- Sherlock Holmes: Public domain
- Elizabeth Bennet: Public domain
- Gandalf: Fair use (educational)
- Atticus Finch: Fair use (educational)
- Hermione Granger: Fair use (educational)
- Jay Gatsby: Public domain
- Jane Eyre: Public domain
- Holden Caulfield: Fair use (educational)

**Note**: This is for educational/personal use. For commercial use, verify copyright status.
