# Supabase Migration - Quick Reference

## Setup Instructions

### 1. Create Supabase Project
Visit https://supabase.com → Create new project → Copy credentials

### 2. Run Database Schema
```sql
-- In Supabase SQL Editor, run: backend/supabase-schema.sql
```

### 3. Configure Backend
```bash
cd backend
cp .env.supabase .env
# Edit .env with your Supabase credentials
```

### 4. Configure Mobile App
Edit `mobile/src/services/supabase.js`:
```javascript
const supabaseUrl = 'https://YOUR-PROJECT.supabase.co';
const supabaseAnonKey = 'YOUR-ANON-KEY';
```

### 5. Install Dependencies

**Backend:**
```bash
cd backend
npm install @supabase/supabase-js
```

**Mobile:**
```bash
cd mobile
npm install @supabase/supabase-js @react-native-async-storage/async-storage
```

### 6. Update Your Code

**Replace these files with Supabase versions:**

Backend:
- Use `routes/auth.supabase.js` instead of `routes/auth.js`
- Use `middleware/auth.supabase.js` instead of `middleware/auth.js`

Mobile:
- Use `services/supabase.js` instead of `services/api.js`
- Use `context/AuthContext.supabase.js` instead of `context/AuthContext.js`

**Update imports in files that use them:**
```javascript
// Old
import { api } from './services/api';

// New
import { booksAPI, forumsAPI } from './services/supabase';
```

## Key Benefits

✅ **No more Socket.io** - Built-in real-time subscriptions
✅ **Better Auth** - Email verification, OAuth, password reset included
✅ **File Storage** - Upload avatars and videos directly
✅ **Better Security** - Row Level Security at database level
✅ **PostgreSQL** - More powerful queries and relationships
✅ **Auto Backups** - Daily automatic backups
✅ **Better Mobile** - Offline support, better performance

## Real-time Example

```javascript
// Subscribe to forum posts
const channel = forumsAPI.subscribeToPosts(forumId, (payload) => {
  console.log('New post:', payload.new);
  // Update your state
});

// Unsubscribe when done
channel.unsubscribe();
```

## File Upload Example

```javascript
// Upload avatar
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}.jpg`, file);

const publicUrl = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}.jpg`).data.publicUrl;
```

## Testing

1. Register a new user in mobile app
2. Check Supabase dashboard → Authentication → Users
3. Verify profile created in Tables → profiles
4. Test creating books, reviews, forums
5. Test real-time updates in forums/spaces

## Migration from MongoDB

No need to migrate data if starting fresh! Just use Supabase from now on.

If you have existing MongoDB data, export and import it using the schema mapping in `supabase-schema.sql`.

## Quick Commands

```bash
# Start backend with Supabase
cd backend
npm run dev

# Start mobile app
cd mobile  
npm start

# View Supabase logs
# Go to Supabase dashboard → Logs
```

## Need Help?

Check `SUPABASE_SETUP.md` for detailed guide!
