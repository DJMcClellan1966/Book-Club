# Fine-Tuned AI Models for Authors & Characters

## Overview
This feature allows users to create and chat with fine-tuned AI models that emulate the voice and personality of authors and characters from their favorite books.

## Features

### 1. **Author AI Chat**
- Create AI models trained on an author's writing style
- Ask about their creative process, inspirations, and themes
- Get responses that reflect the author's voice and perspective

### 2. **Character AI Chat**
- Create AI models for book characters
- Chat with characters as if they're real people
- Explore their motivations, relationships, and story arcs

### 3. **Quick Fine-Tune**
- Simplified training process for rapid deployment
- 5-10 minute training time vs 20-40 minutes for full fine-tune
- Minimal training data (5-10 examples vs 20-30)
- Perfect for testing or casual use

### 4. **Model Management**
- Browse all available AI models
- Filter by type (author/character)
- Track training status
- View usage statistics (chat count, last used)

### 5. **Privacy Controls**
- Models can be public or private
- RLS policies ensure users control their own models
- View public models created by other users

## Technical Architecture

### Database Schema

#### `fine_tuned_models` Table
```sql
- id (uuid)
- type (author | character)
- entity_name (text)
- entity_id (uuid, optional)
- book_id (text)
- openai_model_id (text) - Fine-tuned model ID from OpenAI
- openai_job_id (text) - Training job ID
- base_model (text) - e.g., 'gpt-3.5-turbo'
- status (pending | training | completed | failed | ready)
- training_file_id (text)
- training_data_summary (text)
- training_tokens (integer)
- style_description (text) - System prompt
- sample_text (text)
- chat_count (integer)
- is_public (boolean)
- created_by (uuid)
- timestamps (created_at, training_started_at, training_completed_at, last_used_at)
```

#### `fine_tuned_chats` Table
```sql
- id (uuid)
- model_id (uuid) - Foreign key to fine_tuned_models
- user_id (uuid)
- conversation_id (text) - Groups messages into conversations
- user_message (text)
- ai_response (text)
- tokens_used (integer)
- response_time_ms (integer)
- message_order (integer)
- created_at (timestamp)
```

### API Endpoints

#### Fine-Tuning Endpoints

**Create Author Fine-Tune**
```
POST /api/fine-tune/author
Body: {
  authorName: string,
  bookId: string,
  bookInfo: {
    title: string,
    description: string,
    genre: string
  }
}
Response: {
  success: boolean,
  model: FineTunedModel,
  jobInfo: { jobId, estimatedTime },
  estimatedTime: string
}
```

**Create Character Fine-Tune**
```
POST /api/fine-tune/character
Body: {
  characterName: string,
  characterDescription: string,
  bookId: string,
  bookInfo: {
    title: string,
    author: string
  }
}
Response: {
  success: boolean,
  model: FineTunedModel,
  jobInfo: { jobId, estimatedTime }
}
```

**Quick Fine-Tune** (Simplified & Faster)
```
POST /api/fine-tune/quick
Body: {
  type: 'author' | 'character',
  entityName: string,
  description: string,
  bookInfo: { title, author, description },
  bookId: string
}
Response: {
  success: boolean,
  model: FineTunedModel,
  quickTune: true,
  estimatedTime: string
}
```

**Check Training Status**
```
GET /api/fine-tune/status/:modelId
Response: {
  status: 'pending' | 'training' | 'completed' | 'ready' | 'failed',
  model: FineTunedModel,
  ready: boolean
}
```

**Get All Models**
```
GET /api/fine-tune/models?type=author&bookId=123
Response: {
  success: boolean,
  models: FineTunedModel[]
}
```

**Delete Model**
```
DELETE /api/fine-tune/:modelId
Response: {
  success: boolean,
  message: string
}
```

#### Chat Endpoints

**Chat with Model**
```
POST /api/fine-tune/chat/:modelId
Body: {
  message: string,
  conversationId?: string (optional)
}
Response: {
  success: boolean,
  response: string,
  conversationId: string,
  tokensUsed: number,
  usingFallback: boolean
}
```

**Get Conversation History**
```
GET /api/fine-tune/conversations/:modelId
Response: {
  success: boolean,
  conversations: [{
    conversationId: string,
    startedAt: timestamp,
    messages: [{
      user: string,
      assistant: string,
      timestamp: timestamp
    }]
  }]
}
```

### Service Layer

#### `fineTuningService.js`

**Key Methods:**
- `generateAuthorTrainingData(authorName, bookInfo)` - Creates 20-30 conversation examples for author
- `generateCharacterTrainingData(characterName, characterInfo, bookContext)` - Creates training data for character
- `quickFineTune(type, entityName, contextInfo)` - Fast training with 5-10 examples
- `createAuthorStyleGuide(authorName, bookInfo)` - Generates system prompt for author personality
- `createCharacterStyleGuide(characterName, characterInfo, bookContext)` - System prompt for character
- `startFineTuning(trainingData, baseModel)` - Initiates OpenAI fine-tuning job
- `checkFineTuningStatus(jobId)` - Polls training status
- `chatWithModel(modelId, messages, systemPrompt)` - Sends chat messages to fine-tuned model
- `fallbackChat(messages, systemPrompt)` - Uses regular GPT with strong system prompts if fine-tuning unavailable

## Mobile UI Components

### Screens

#### `CharacterChatScreen.js`
- Full chat interface with message bubbles
- Training status banner
- Starter prompts for new conversations
- Real-time messaging with fine-tuned AI
- Conversation history loading
- Status indicators (training, ready, failed)

#### `AIModelsScreen.js`
- Browse all available models (yours + public)
- Filter by type (all/author/character)
- Model cards showing:
  - Entity name and book
  - Training status
  - Chat count
  - Quick access to chat
- Pull-to-refresh
- FAB for creating new models

### Components

#### `QuickFineTuneButton.js`
- Full button for prominent placement
- Icon button variant for compact use
- Shows "Creating..." state during training
- Handles "already exists" scenario
- Success callback for navigation

**Usage Example:**
```jsx
<QuickFineTuneButton
  type="character"
  entityName="Sherlock Holmes"
  description="Brilliant detective with deductive reasoning"
  bookInfo={{
    title: "The Hound of the Baskervilles",
    author: "Arthur Conan Doyle",
    bookId: "book_123"
  }}
  onSuccess={(model) => navigation.navigate('CharacterChat', { modelId: model.id })}
/>
```

## Training Data Generation

### Author Training Examples
Generates conversations about:
- Writing inspiration and process
- Themes and messages
- Character development techniques
- Title and plot origins
- Influences and advice

### Character Training Examples
Generates conversations exploring:
- Character identity and background
- Desires and fears
- Relationships
- Story events and perspectives
- Emotions and motivations

### Quick vs Full Fine-Tune

| Feature | Quick Fine-Tune | Full Fine-Tune |
|---------|----------------|----------------|
| Training Examples | 5-10 | 20-30 |
| Estimated Time | 5-10 minutes | 20-40 minutes |
| Quality | Good for testing | Higher quality |
| Use Case | Rapid deployment | Production use |
| API Endpoint | `/quick` | `/author` or `/character` |

## Fallback System

If OpenAI fine-tuning is unavailable (no API key, failed training, etc.):
1. System automatically falls back to regular GPT-3.5-turbo
2. Uses strong system prompts to emulate personality
3. Response includes `usingFallback: true` flag
4. UI shows "⚠️ Using general AI" indicator

This ensures the feature always works, even without fine-tuning.

## Setup Requirements

### Environment Variables
```bash
# Backend .env
OPENAI_API_KEY=your_openai_api_key_here
```

### Database Migration
Run the SQL schema:
```bash
psql -h your_supabase_host -d postgres -f backend/fine-tuned-models-schema.sql
```

### Navigation Setup
Add routes to mobile app navigator:
```jsx
<Stack.Screen name="AIModels" component={AIModelsScreen} />
<Stack.Screen name="CharacterChat" component={CharacterChatScreen} />
```

## Usage Flow

### Creating an Author AI

1. **Navigate to book details**
2. **Tap "Chat with Author" button** (or use Quick Fine-Tune button)
3. **Confirm creation** - "Create AI Author? Training takes 5-10 minutes"
4. **Wait for training** - Status banner shows progress
5. **Start chatting** - Ask about their writing process

### Creating a Character AI

1. **Add character to database** (from book details or character list)
2. **Tap "Create AI Character" button** (Quick Fine-Tune)
3. **Automatic training** - Character AI trains in background
4. **Chat when ready** - Explore character's personality

### Chatting with AI Models

1. **Browse models** - Go to AI Models screen
2. **Select model** - Tap on author/character card
3. **Send message** - Type your question
4. **Get response** - AI responds in character voice
5. **Continue conversation** - Context is preserved

## Best Practices

### Training Data Quality
- Include diverse conversation topics
- Vary question complexity
- Maintain consistent personality
- Use specific examples from the book

### System Prompts
- Be specific about character traits
- Include contextual information (setting, relationships)
- Define tone and speaking style
- Reference key plot points

### Chat UX
- Show training status clearly
- Provide starter prompts
- Handle slow responses gracefully
- Save conversation history

### Performance
- Cache model status to reduce API calls
- Batch conversation history requests
- Use pull-to-refresh instead of auto-refresh
- Implement optimistic UI updates

## Limitations

1. **Training Time**: 5-40 minutes depending on quick vs full fine-tune
2. **API Costs**: OpenAI fine-tuning incurs costs per training and per token
3. **Quality**: Quick fine-tune provides lower quality than full training
4. **Context**: Limited to information provided in training data
5. **OpenAI Dependency**: Requires OpenAI API and paid account

## Future Enhancements

- [ ] Support for other LLM providers (Anthropic, Cohere)
- [ ] Batch training for multiple characters
- [ ] User-provided training examples
- [ ] Voice chat with synthesized voices
- [ ] Group chats with multiple characters
- [ ] Export conversation transcripts
- [ ] Analytics dashboard (popular models, usage trends)
- [ ] Model sharing marketplace
- [ ] Advanced customization (temperature, max tokens)
- [ ] Integration with book reader (chat while reading)

## Troubleshooting

### Training Stuck
- Check OpenAI API key is valid
- Verify training data format
- Check OpenAI dashboard for job status
- Fallback to general AI if training fails

### Chat Not Working
- Verify model status is 'completed' or 'ready'
- Check token limits not exceeded
- Ensure conversation ID is valid
- Test with fallback mode

### Slow Responses
- Optimize training data size
- Use streaming responses (future enhancement)
- Cache frequent questions
- Implement response timeouts

## Security Considerations

- RLS policies prevent unauthorized access to private models
- Users can only delete their own models
- Chat history is private to the user
- Public models are read-only for non-owners
- API keys stored securely in environment variables
- Input validation on all endpoints

## Cost Estimation

### OpenAI Pricing (approximate)
- **Training**: $0.008 per 1K tokens
- **Quick Fine-Tune**: ~$0.05 per model (500 tokens)
- **Full Fine-Tune**: ~$0.20 per model (2,500 tokens)
- **Chat Usage**: $0.002 per 1K tokens (fine-tuned model)

### Cost Management
- Set max training tokens limit
- Implement usage quotas per user
- Monitor and alert on high usage
- Consider subscription tiers for unlimited models
