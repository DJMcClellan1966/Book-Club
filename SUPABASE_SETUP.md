# Supabase Migration Guide for Book Club App

This guide will walk you through setting up Supabase as your database and authentication provider.

## Why Supabase?

- **PostgreSQL**: More powerful than MongoDB with better relationships and queries
- **Built-in Auth**: Email/password, OAuth, magic links out of the box
- **Real-time**: WebSocket subscriptions built-in (no need for Socket.io)
- **Row Level Security**: Secure data access at the database level
- **File Storage**: Built-in storage for avatars, book covers, video avatars
- **Edge Functions**: Serverless functions for AI processing
- **Better Mobile Support**: Official React Native library with offline support

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: Book Club
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users
6. Click "Create new project"
7. Wait 2-3 minutes for setup

## Step 2: Get Your Credentials

1. In your project dashboard, click the ⚙️ Settings icon
2. Go to **API** section
3. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Long JWT token (safe for mobile/web)
   - **service_role key**: Admin key (NEVER expose in frontend)

## Step 3: Set Up Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy the entire contents of `backend/supabase-schema.sql`
4. Paste into the SQL editor
5. Click **Run** (or press Ctrl+Enter)
6. Verify tables were created in **Table Editor**

You should see these tables:
- profiles
- books
- reviews
- reading_lists
- forums
- forum_posts
- spaces
- space_messages
- subscriptions
- payments
- ai_chats
- chat_messages
- affiliate_clicks

## Step 4: Configure Backend

1. Copy `.env.supabase` to `.env`:
   ```bash
   cd backend
   cp .env.supabase .env
   ```

2. Edit `.env` with your credentials:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   
   PORT=5000
   NODE_ENV=development
   
   # Add your API keys
   OPENAI_API_KEY=your-openai-key
   STRIPE_SECRET_KEY=your-stripe-key
   ```

## Step 5: Update Backend Server

Replace your current authentication and database code with Supabase versions:

```bash
# The new files are already created:
# - config/supabase.js
# - middleware/auth.supabase.js
# - routes/auth.supabase.js
```

You'll need to update your `server.js` to use the new auth routes:

```javascript
const authRoutes = require('./routes/auth.supabase');
app.use('/api/auth', authRoutes);
```

## Step 6: Create Test Users

You can create test users directly in Supabase:

1. Go to **Authentication** > **Users** in Supabase dashboard
2. Click **Add user** > **Create new user**
3. Enter email and password
4. User will be created in `auth.users`
5. A profile will be auto-created via trigger

Or use the Auth API to register programmatically.

## Step 7: Configure Mobile App

1. Install Supabase client in mobile app:
   ```bash
   cd mobile
   npm install @supabase/supabase-js @react-native-async-storage/async-storage
   npx expo install @react-native-async-storage/async-storage
   ```

2. Update `mobile/src/constants/index.js`:
   ```javascript
   export const SUPABASE_URL = 'https://your-project.supabase.co';
   export const SUPABASE_ANON_KEY = 'your-anon-key';
   ```

3. Replace API client with Supabase client (I'll create this next)

## Step 8: Enable Realtime (Optional)

For real-time forums and spaces:

1. Go to **Database** > **Replication** in Supabase
2. Enable replication for these tables:
   - forum_posts
   - space_messages
   - chat_messages
3. Update your frontend to subscribe to changes

## Step 9: Set Up Storage (For Video Avatars)

1. Go to **Storage** in Supabase dashboard
2. Create buckets:
   - `avatars` (public)
   - `book-covers` (public)
   - `video-avatars` (private, premium/pro only)
3. Set up storage policies for access control

## Step 10: Test Everything

1. Start backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start mobile app:
   ```bash
   cd mobile
   npm start
   ```

3. Test user registration and login
4. Test creating books, reviews, forums
5. Test real-time updates

## Migration from MongoDB

If you have existing data in MongoDB:

1. Export data from MongoDB:
   ```bash
   mongoexport --db bookclub --collection users --out users.json
   mongoexport --db bookclub --collection books --out books.json
   ```

2. Transform data to match PostgreSQL schema
3. Import via SQL or Supabase API

## Benefits You'll Get

✅ **Better Performance**: PostgreSQL is faster for complex queries
✅ **Real-time Built-in**: No need for Socket.io server
✅ **Better Auth**: Email verification, password reset, OAuth included
✅ **File Storage**: Upload avatars and video avatars directly
✅ **Type Safety**: Use with Prisma or Supabase CLI for types
✅ **Offline Support**: Better mobile offline experience
✅ **Scalability**: Auto-scaling database
✅ **Backups**: Automatic daily backups
✅ **Dashboard**: Visual database editor and logs

## Common Issues

### Issue: "relation does not exist"
- Solution: Make sure you ran the schema SQL in Step 3

### Issue: "JWT expired"
- Solution: Implement token refresh in mobile app

### Issue: "RLS policy violation"
- Solution: Check Row Level Security policies in SQL Editor

### Issue: Can't insert data
- Solution: Use `supabaseAdmin` for server-side operations that bypass RLS

## Next Steps

1. ✅ Set up Supabase project
2. ✅ Import schema
3. ✅ Configure environment variables
4. ✅ Update backend routes
5. ✅ Update mobile app
6. 🔄 Migrate existing data (if any)
7. 🔄 Test all features
8. 🔄 Deploy to production

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase React Native Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime Subscriptions](https://supabase.com/docs/guides/realtime)

## Support

Need help? Check:
- Supabase Discord: [https://discord.supabase.com](https://discord.supabase.com)
- Supabase GitHub Discussions
- Stack Overflow (tag: supabase)
