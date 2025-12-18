# MongoDB to Supabase Migration Checklist

## ✅ Completed Setup Files

- [x] Created `backend/supabase-schema.sql` - Complete PostgreSQL schema
- [x] Created `backend/.env.supabase` - Environment template
- [x] Created `backend/config/supabase.js` - Supabase client configuration
- [x] Created `backend/middleware/auth.supabase.js` - Authentication middleware
- [x] Created `backend/routes/auth.supabase.js` - Auth routes with Supabase
- [x] Created `mobile/src/services/supabase.js` - Mobile API client
- [x] Created `mobile/src/context/AuthContext.supabase.js` - Auth context with Supabase
- [x] Installed `@supabase/supabase-js` in backend
- [x] Created `SUPABASE_SETUP.md` - Detailed setup guide
- [x] Created `SUPABASE_QUICK_START.md` - Quick reference guide

## 📋 Your Migration Steps

### Step 1: Create Supabase Project (5 minutes)
- [ ] Go to https://supabase.com
- [ ] Create account or sign in
- [ ] Click "New Project"
- [ ] Name: "Book Club"
- [ ] Choose region closest to you
- [ ] Set strong database password (save it!)
- [ ] Wait 2-3 minutes for provisioning

### Step 2: Get Credentials (2 minutes)
- [ ] In project dashboard, click Settings (⚙️)
- [ ] Go to API section
- [ ] Copy **Project URL** (https://xxxxx.supabase.co)
- [ ] Copy **anon public** key
- [ ] Copy **service_role** key (keep secret!)

### Step 3: Set Up Database (3 minutes)
- [ ] In Supabase, go to SQL Editor
- [ ] Click "New query"
- [ ] Open `backend/supabase-schema.sql` in your editor
- [ ] Copy entire contents
- [ ] Paste into Supabase SQL Editor
- [ ] Click "Run" (or Ctrl+Enter)
- [ ] Verify success message
- [ ] Check Table Editor - should see 13 tables

### Step 4: Configure Backend (2 minutes)
- [ ] Navigate to backend folder: `cd backend`
- [ ] Copy template: `cp .env.supabase .env`
- [ ] Edit `.env` file:
  ```env
  SUPABASE_URL=https://YOUR-PROJECT.supabase.co
  SUPABASE_ANON_KEY=your-anon-key-here
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
  ```
- [ ] Save file

### Step 5: Configure Mobile App (2 minutes)
- [ ] Open `mobile/src/services/supabase.js`
- [ ] Line 4: Replace with your Supabase URL
- [ ] Line 5: Replace with your anon key
- [ ] Save file

### Step 6: Install Mobile Dependencies (1 minute)
- [ ] Run: `cd mobile`
- [ ] Run: `npm install @supabase/supabase-js @react-native-async-storage/async-storage`
- [ ] Wait for installation

### Step 7: Update Backend Routes (5 minutes)
- [ ] Open `backend/server.js` or `backend/app.js`
- [ ] Find the auth routes import (probably line with `require('./routes/auth')`)
- [ ] Replace with:
  ```javascript
  const authRoutes = require('./routes/auth.supabase');
  ```
- [ ] Find auth middleware import
- [ ] Replace with:
  ```javascript
  const { authenticateUser } = require('./middleware/auth.supabase');
  ```
- [ ] Save file

### Step 8: Update Mobile App Files (10 minutes)

**Option A: Rename files (recommended)**
- [ ] Backup originals: `cd mobile/src`
- [ ] Rename: `mv context/AuthContext.js context/AuthContext.mongodb.js`
- [ ] Rename: `mv services/api.js services/api.mongodb.js`
- [ ] Rename: `mv context/AuthContext.supabase.js context/AuthContext.js`
- [ ] All imports will still work!

**Option B: Update imports manually**
- [ ] Find all files importing from `../context/AuthContext`
- [ ] Change to: `../context/AuthContext.supabase`
- [ ] Find all files importing from `../services/api`
- [ ] Change to: `../services/supabase`

Files to update (if Option B):
- [ ] `mobile/App.js`
- [ ] `mobile/src/navigation/AppNavigator.js`
- [ ] `mobile/src/screens/auth/LoginScreen.js`
- [ ] `mobile/src/screens/auth/RegisterScreen.js`
- [ ] `mobile/src/screens/ProfileScreen.js`
- [ ] `mobile/src/screens/HomeScreen.js`
- [ ] `mobile/src/screens/BooksScreen.js`
- [ ] `mobile/src/screens/BookDetailScreen.js`

### Step 9: Test Backend (2 minutes)
- [ ] Start backend: `cd backend && npm run dev`
- [ ] Should see: "Server running on port 5000"
- [ ] No MongoDB connection errors
- [ ] Test health endpoint: `curl http://localhost:5000/api/health`

### Step 10: Test Mobile App (5 minutes)
- [ ] Start mobile: `cd mobile && npm start`
- [ ] Scan QR code with Expo Go
- [ ] Try to register new user
- [ ] Check Supabase dashboard → Authentication → Users
- [ ] Should see new user created!
- [ ] Try to login with same credentials
- [ ] Should see home screen

### Step 11: Test Features (10 minutes)
- [ ] Browse books
- [ ] Create a review
- [ ] Add book to reading list
- [ ] View profile
- [ ] Test logout/login again
- [ ] Check Supabase Tables to see data

### Step 12: Set Up Real-time (Optional, 5 minutes)
- [ ] In Supabase, go to Database → Replication
- [ ] Enable replication for:
  - [ ] forum_posts
  - [ ] space_messages
  - [ ] chat_messages
- [ ] Test real-time in forums/spaces

### Step 13: Set Up Storage (Optional, 5 minutes)
- [ ] In Supabase, go to Storage
- [ ] Create bucket: `avatars` (public)
- [ ] Create bucket: `book-covers` (public)
- [ ] Create bucket: `video-avatars` (private)
- [ ] Set RLS policies for video-avatars (Premium/Pro only)

## 🎉 Migration Complete!

### What Changed:
- ❌ MongoDB → ✅ PostgreSQL
- ❌ Mongoose models → ✅ SQL schema
- ❌ Socket.io → ✅ Supabase Realtime
- ❌ Custom auth → ✅ Supabase Auth
- ❌ Separate file storage → ✅ Supabase Storage

### Benefits You Now Have:
- ✅ Real-time subscriptions built-in
- ✅ Email verification & password reset
- ✅ OAuth (Google, GitHub, etc.) ready
- ✅ File storage included
- ✅ Better mobile performance
- ✅ Row Level Security
- ✅ Automatic backups
- ✅ Better scalability

## 🔧 Troubleshooting

### Error: "relation does not exist"
→ You didn't run the schema SQL. Go back to Step 3.

### Error: "Invalid API key"
→ Check your .env files have correct SUPABASE_URL and keys.

### Error: "Username already taken"
→ User already exists. Try different username or email.

### Error: JWT expired
→ Implement token refresh (already built-in with Supabase client).

### Mobile app won't connect
→ Make sure you updated the URLs in `mobile/src/services/supabase.js`.

## 📚 Resources

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Detailed guide
- [SUPABASE_QUICK_START.md](./SUPABASE_QUICK_START.md) - Quick reference
- [Supabase Docs](https://supabase.com/docs)
- [Supabase React Native](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)

## 🚀 Next Steps After Migration

1. **Add OAuth Login**
   - Enable providers in Supabase → Authentication → Providers
   - Add social login buttons in mobile app

2. **Implement Video Avatars**
   - Upload videos to `video-avatars` bucket
   - Serve via Supabase Storage URLs

3. **Set Up Push Notifications**
   - Use Expo push notifications
   - Trigger from Supabase Edge Functions

4. **Deploy Backend**
   - Deploy to Vercel/Railway/Render
   - Update mobile app API URLs

5. **Publish Mobile Apps**
   - Build with EAS: `eas build --platform all`
   - Submit to App Store and Play Store

---

**Need help?** Check the troubleshooting section or Supabase Discord!
