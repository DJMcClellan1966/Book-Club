# Book Diary Subscription Limits & Storage Options

## Overview
Book diaries now have subscription-based limits and flexible storage options. Users can choose between cloud-synced diaries (with limits based on tier) or unlimited local-only diaries stored on their device.

## Subscription Tiers & Limits

### 📊 Diary Limits by Tier

| Tier | Cloud Diary Books | Local Diary Books | AI Insights |
|------|------------------|-------------------|-------------|
| **Free** | 2 books | Unlimited | Cloud only |
| **Premium** | 10 books | Unlimited | Cloud only |
| **Pro** | Unlimited | Unlimited | Cloud only |

**Note**: "Diary Books" means unique books with diary entries. Each book can have unlimited entries, but Free users can only have diaries for 2 different books in the cloud.

## Storage Options

### ☁️ Cloud Synced Storage
- **Synced online**: Access from any device
- **AI Insights available**: Get thoughtful analysis of your reading journey
- **Subject to limits**: Based on subscription tier
- **Backed up**: Data stored securely in database
- **Requires internet**: Need connection to save/sync

### 📱 Local Only Storage
- **Device only**: Saved on your phone/tablet
- **Unlimited**: No subscription limits
- **Offline access**: Works without internet
- **No AI Insights**: AI features require cloud storage
- **No sync**: Not accessible from other devices
- **Privacy**: Data never leaves your device

## How It Works

### Choosing Storage Type

#### In Diary Screen
1. Open any book's diary
2. See storage toggle at top: `☁️ Cloud Synced` or `📱 Local Only`
3. Toggle switch to change storage type
4. Entries are separated by storage type

#### From Booklist
1. Tap any book
2. Choose:
   - **📔 Open Diary** - View and switch storage types
   - **✏️ Quick Entry (Cloud)** - Write directly to cloud
   - **📱 Quick Entry (Local)** - Write directly to local storage

### Usage Tracking

Cloud diaries show usage in the diary screen:
```
🔒 Private Diary     2/2 books
```

- Shows current usage vs limit
- Only counts unique books with entries
- Multiple entries per book = 1 book

### Limit Enforcement

When creating the **first entry** for a new book in cloud storage:
1. System checks current diary book count
2. Compares against subscription tier limit
3. If at limit, shows upgrade prompt
4. Suggests using local storage as alternative

Example error message:
```
You've reached your diary limit of 2 books. 
Upgrade to add more!

Tip: You can use Local storage for unlimited 
diaries on this device.
```

## User Workflows

### Scenario 1: Free User with 2 Cloud Diaries
**User**: Sarah (Free tier)
**Status**: Has diaries for "Pride & Prejudice" and "1984"

1. Tries to create entry for "The Hobbit" (cloud)
2. Gets limit error message
3. **Options**:
   - Switch to local storage (unlimited)
   - Upgrade to Premium (10 books)
   - Delete a cloud diary for another book

### Scenario 2: Premium User with Mix of Storage
**User**: Mike (Premium tier)
**Status**: 8 cloud diaries, 5 local diaries

- Cloud diaries: Synced across devices, AI insights available
- Local diaries: Only on phone, but unlimited
- Can have up to 10 cloud diaries total
- No limit on local diaries

### Scenario 3: Pro User
**User**: Alex (Pro tier)
**Status**: Unlimited everything

- Can create unlimited cloud diaries
- Can create unlimited local diaries
- Full access to AI insights
- All features unlocked

## Technical Details

### Backend Limits

#### Tier Configuration (`backend/middleware/subscription.js`)
```javascript
const TIER_LIMITS = {
  free: { diaryBooks: 2 },
  premium: { diaryBooks: 10 },
  pro: { diaryBooks: Infinity }
};
```

#### API Endpoints

**GET /api/diary/usage**
Returns current usage and limits:
```json
{
  "tier": "free",
  "currentUsage": 2,
  "limit": 2,
  "remaining": 0,
  "canAddMore": false
}
```

**POST /api/diary** (with limit check)
- Checks if first entry for book
- Gets user's subscription tier
- Counts current diary books
- Enforces limit or allows creation

### Mobile App Storage

#### Local Storage (`mobile/src/services/localDiaryService.js`)
- Uses `AsyncStorage` for device-only storage
- Methods: `createEntry()`, `updateEntry()`, `deleteEntry()`, `getEntriesForBook()`
- Generates local IDs: `local_${timestamp}_${random}`
- No sync, no server communication
- Export/import for backup

#### Cloud Storage
- Standard API calls to backend
- Requires authentication
- Subject to subscription limits
- Supports AI insights

## Switching Storage Types

### What Happens When You Switch?

**Important**: Entries are **not** deleted or moved when switching storage types.

1. **Cloud → Local**: Cloud entries remain in cloud, now viewing local entries
2. **Local → Cloud**: Local entries stay local, now viewing cloud entries
3. **Warning shown** if switching with existing entries
4. Switch back anytime to see previous entries

### Migration (Not Automatic)

To move entries between storage types:
1. Manually copy/paste entry text
2. Create new entry in target storage
3. Delete old entry if desired

**Future feature**: One-click migration tool

## Upgrade Prompts

### When Shown
- User at diary limit tries to create entry for new book
- Only shown for cloud storage
- Includes helpful tip about local storage

### Prompt Actions
- **Upgrade**: Navigate to pricing screen
- **OK**: Dismiss and stay on current screen
- **Try Local**: Suggestion in message text

## Best Practices

### For Users

**Choose Cloud When**:
- You want AI insights
- You use multiple devices
- You want automatic backups
- You're within your tier limit

**Choose Local When**:
- You've reached cloud limit
- You want unlimited diaries
- You prefer offline-first
- You value device-only privacy
- You don't need AI features

### For Developers

**Subscription Changes**:
- Update `TIER_LIMITS` in `subscription.js`
- Limits apply to **book count**, not entry count
- Check only on first entry for a book

**Adding Storage Types**:
- Both storage types use same UI components
- Pass `storageType` prop through navigation
- Handle errors differently (upgrade vs offline)

## Troubleshooting

### "Reached diary limit" error
- **Solution**: Switch to local storage or upgrade subscription
- **Check**: How many unique books have cloud diaries
- **Workaround**: Delete diary for a book you no longer need

### Can't find my entries after switching storage
- **Not a bug**: Entries are separated by storage type
- **Solution**: Switch back to original storage type
- **Remember**: Cloud entries in cloud, local entries local

### AI Insights not working for local diaries
- **Expected behavior**: AI only available for cloud
- **Reason**: AI analysis requires server-side processing
- **Solution**: Switch to cloud storage for that book

### Local entries disappeared after app reinstall
- **Expected behavior**: Local storage cleared on uninstall
- **Prevention**: Export local diaries before uninstalling
- **Solution**: Use cloud storage for important diaries

## Privacy & Data

### Cloud Storage
- Stored in PostgreSQL database
- Row-level security enforced
- Only user can access their entries
- Backed up with database backups
- Used for AI analysis (private, not shared)

### Local Storage
- Stored in device AsyncStorage
- Never sent to server
- Not accessible by other apps (sandboxed)
- Cleared on app uninstall
- No backup unless user exports

## Future Enhancements

### Planned Features
- 📤 One-click sync: Migrate local → cloud (within limits)
- 📥 Batch export/import for local diaries
- ☁️ Selective sync: Choose which local diaries to sync
- 📊 Storage usage dashboard
- 🔄 Auto-upgrade prompt when limit reached
- 💾 Local AI insights (offline ML model)
- 🔐 Encrypted local storage option

### Requested Features
- Family sharing plans with shared limits
- Book sharing (keep diaries private)
- Temporary cloud storage boost
- Grace period after downgrade
- Archive old diaries (free up slots)

## Pricing Strategy

### Why Limits?

**Purpose**: 
- Encourage engagement (2 books enough to try feature)
- Drive conversions (users outgrow free tier)
- Balance server costs (cloud storage & AI processing)
- Offer flexibility (unlimited local as alternative)

**Fair Use**:
- Local storage always unlimited
- Generous limits (2/10/unlimited)
- No limits on entries per book
- No limits on booklist size

### Upgrade Path

**Free → Premium**: $4.99/month
- 2 → 10 cloud diary books
- More AI chats, larger booklist

**Premium → Pro**: $9.99/month
- 10 → Unlimited diary books
- Unlimited everything

## Summary

✅ **Free users**: 2 cloud diary books + unlimited local
✅ **Premium users**: 10 cloud diary books + unlimited local
✅ **Pro users**: Unlimited cloud + unlimited local
✅ **Cloud storage**: Synced, AI insights, subscription limits
✅ **Local storage**: Device-only, unlimited, no AI
✅ **Flexible**: Switch storage types anytime
✅ **Fair**: Generous limits with unlimited fallback
