# AI Character Chat - Quick Setup Guide

## Prerequisites
- Supabase account with PostgreSQL database
- OpenAI API key (for fine-tuning)
- Backend server running
- Mobile app (React Native/Expo)

## Setup Steps

### 1. Database Setup

Run the SQL schema to create the necessary tables:

```bash
# Connect to your Supabase PostgreSQL instance
psql -h your-supabase-host -d postgres -f backend/fine-tuned-models-schema.sql
```

Or paste the contents of `backend/fine-tuned-models-schema.sql` into Supabase SQL Editor and execute.

### 2. Backend Configuration

Add OpenAI API key to your `.env` file:

```bash
# backend/.env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

The fine-tuning routes are already integrated into `server.js`:
```javascript
const fineTuneRoutes = require('./routes/fineTune');
app.use('/api/fine-tune', fineTuneRoutes);
```

### 3. Mobile Navigation Setup

Add the new screens to your app navigator:

```javascript
// mobile/src/navigation/AppNavigator.js
import CharacterChatScreen from '../screens/CharacterChatScreen';
import AIModelsScreen from '../screens/AIModelsScreen';

// Inside your Stack.Navigator:
<Stack.Screen 
  name="AIModels" 
  component={AIModelsScreen}
  options={{ title: 'AI Characters & Authors' }}
/>

<Stack.Screen 
  name="CharacterChat" 
  component={CharacterChatScreen}
  options={{ headerShown: true }}
/>
```

### 4. Add Navigation Links

Add buttons to access the AI features from existing screens:

#### In Book Detail Screen
```javascript
import QuickFineTuneButton from '../components/QuickFineTuneButton';

// Inside BookDetailScreen render:
<QuickFineTuneButton
  type="author"
  entityName={book.author}
  description={book.description}
  bookInfo={{
    title: book.title,
    author: book.author,
    description: book.description,
    bookId: book.id
  }}
  onSuccess={(model) => navigation.navigate('CharacterChat', {
    modelId: model.id,
    entityName: model.entity_name,
    entityType: 'author',
    bookTitle: book.title
  })}
/>
```

#### In Main Navigation (Bottom Tab or Drawer)
```javascript
<Tab.Screen
  name="AIModels"
  component={AIModelsScreen}
  options={{
    title: 'AI Chat',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="sparkles" size={size} color={color} />
    ),
  }}
/>
```

### 5. Environment Check

Verify your setup:

**Backend Health Check:**
```bash
curl http://localhost:5000/health
```

**Test Fine-Tune Endpoint:**
```bash
curl -X POST http://localhost:5000/api/fine-tune/quick \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "type": "character",
    "entityName": "Sherlock Holmes",
    "description": "Brilliant detective",
    "bookInfo": {
      "title": "A Study in Scarlet",
      "author": "Arthur Conan Doyle"
    },
    "bookId": "test_book_123"
  }'
```

### 6. Test the Feature

1. **Start backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Start mobile app:**
   ```bash
   cd mobile
   npm start
   ```

3. **Create your first AI model:**
   - Open the app
   - Go to a book detail page
   - Tap "Create AI Author" or "Create AI Character"
   - Wait 5-10 minutes for training
   - Start chatting!

## Quick Integration Examples

### Add to BookDetailScreen

```javascript
// After book title and author display:
<View style={styles.aiSection}>
  <Text style={styles.sectionTitle}>Chat with AI</Text>
  
  <QuickFineTuneButton
    type="author"
    entityName={book.author}
    description={book.description}
    bookInfo={{
      title: book.title,
      author: book.author,
      bookId: book.id
    }}
    onSuccess={(model) => navigation.navigate('CharacterChat', {
      modelId: model.id,
      entityName: model.entity_name,
      entityType: 'author',
      bookTitle: book.title
    })}
    style={{ marginBottom: 10 }}
  />
  
  <TouchableOpacity
    style={styles.viewModelsButton}
    onPress={() => navigation.navigate('AIModels', {
      filter: 'author',
      bookId: book.id
    })}
  >
    <Text>View All AI Models</Text>
  </TouchableOpacity>
</View>
```

### Add to Character List

```javascript
const renderCharacter = (character) => (
  <View style={styles.characterCard}>
    <Text style={styles.characterName}>{character.name}</Text>
    
    <QuickFineTuneIconButton
      type="character"
      entityName={character.name}
      description={character.description}
      bookInfo={{
        title: book.title,
        author: book.author,
        bookId: book.id
      }}
      onSuccess={(model) => navigation.navigate('CharacterChat', {
        modelId: model.id,
        entityName: model.entity_name,
        entityType: 'character',
        bookTitle: book.title
      })}
    />
  </View>
);
```

### Add to Dashboard

```javascript
<TouchableOpacity
  style={styles.featureCard}
  onPress={() => navigation.navigate('AIModels')}
>
  <Ionicons name="sparkles" size={32} color={COLORS.accent} />
  <Text style={styles.featureTitle}>AI Chat</Text>
  <Text style={styles.featureDescription}>
    Chat with authors and characters
  </Text>
</TouchableOpacity>
```

## Testing Checklist

- [ ] Database tables created successfully
- [ ] OpenAI API key configured
- [ ] Backend routes accessible
- [ ] Mobile screens load without errors
- [ ] Can create a quick fine-tune model
- [ ] Training status updates correctly
- [ ] Can send chat messages
- [ ] Conversation history persists
- [ ] Fallback mode works without OpenAI key
- [ ] RLS policies prevent unauthorized access

## Troubleshooting

### "OpenAI API key not configured"
- Add `OPENAI_API_KEY` to backend `.env` file
- Restart backend server
- Feature will use fallback mode (general GPT) without key

### "Model not found" error
- Check model was created successfully in database
- Verify `modelId` parameter is correct
- Check RLS policies allow access

### Training stuck at "pending"
- Check OpenAI API key is valid
- Verify OpenAI account has fine-tuning enabled
- Check OpenAI dashboard for job status
- System will work with fallback mode if training fails

### Chat not responding
- Verify model status is 'completed' or 'ready'
- Check internet connection
- Test with fallback mode (without fine-tuning)
- Check backend logs for errors

## Optional Enhancements

### Add Menu Option in Book Detail
```javascript
const menuOptions = [
  { label: '📚 Add to Booklist', onPress: handleAddToBooklist },
  { label: '📝 Write Review', onPress: handleWriteReview },
  { label: '💬 Chat with Author', onPress: handleChatWithAuthor }, // NEW
  { label: '🎭 Chat with Characters', onPress: handleCharacterChat }, // NEW
];
```

### Add AI Badge to Books with Models
```javascript
// In BookCard.js
{hasAIModel && (
  <View style={styles.aiBadge}>
    <Ionicons name="sparkles" size={16} color={COLORS.accent} />
    <Text style={styles.aiBadgeText}>AI Chat</Text>
  </View>
)}
```

### Add Notification When Training Complete
```javascript
// Poll for training completion
useEffect(() => {
  if (modelStatus?.status === 'training') {
    const interval = setInterval(checkModelStatus, 10000);
    return () => clearInterval(interval);
  }
}, [modelStatus]);

// Show notification when ready
if (previousStatus === 'training' && modelStatus?.status === 'completed') {
  Alert.alert(
    'AI Model Ready!',
    `${entityName} is ready to chat.`,
    [
      { text: 'Later' },
      { text: 'Chat Now', onPress: openChat }
    ]
  );
}
```

## Next Steps

1. ✅ Complete setup steps above
2. Test creating an author AI
3. Test creating a character AI
4. Try the quick fine-tune feature
5. Explore the AI Models browser
6. Integrate buttons into your existing screens
7. Customize the styling to match your app
8. Read full documentation in `AI_CHARACTER_CHAT.md`

## Support

- Full documentation: `AI_CHARACTER_CHAT.md`
- Database schema: `backend/fine-tuned-models-schema.sql`
- Service code: `backend/services/fineTuningService.js`
- API routes: `backend/routes/fineTune.js`
- UI components: `mobile/src/screens/CharacterChatScreen.js`

Happy chatting! 🎭✨
