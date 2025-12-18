# Testing Guide - Book Club App on iPhone

## 📱 Quick Setup for iPhone Testing

### Prerequisites
1. **Install Expo Go app** on your iPhone from the App Store
2. **Connect to same WiFi** network as your development machine
3. **Backend server running** on your development machine

---

## 🚀 Step-by-Step Testing Instructions

### Step 1: Start the Backend Server
```bash
cd /workspaces/Book-Club/backend
npm run dev
```

Server should start on `http://localhost:5000`

### Step 2: Start the Mobile App
```bash
cd /workspaces/Book-Club/mobile
npm start
```

### Step 3: Connect iPhone to Expo
1. **Open Expo Go** app on your iPhone
2. **Scan QR code** displayed in your terminal
3. App will load on your iPhone

**Note:** If you get connection errors:
- Make sure both devices are on the same WiFi
- Check your firewall settings
- Try using tunnel mode: `npm start -- --tunnel`

---

## 👥 Test User Accounts

### Test Users with Passwords

| Username | Email | Password | Tier | Features |
|----------|-------|----------|------|----------|
| **testfree** | testfree@bookclub.dev | `Test1234!` | Free | Basic features, 2 AI chats, 20 messages/day |
| **testpremium** | testpremium@bookclub.dev | `Test1234!` | Premium | 10 AI chats, 100 messages/day, video avatars |
| **testpro** | testpro@bookclub.dev | `Test1234!` | Pro | Unlimited AI chats, unlimited messages, video avatars |

**All passwords:** `Test1234!`

---

## 🧪 Testing Checklist

### 1. Authentication Testing

#### Test Registration
- [ ] Tap "Sign Up" on login screen
- [ ] Enter new credentials:
  - Username: `testuser1`
  - Email: `testuser1@test.com`
  - Password: `Test1234!`
- [ ] Verify successful registration
- [ ] Check profile created with free tier

#### Test Login
- [ ] Use test account: `testfree@bookclub.dev` / `Test1234!`
- [ ] Verify successful login
- [ ] Check dashboard loads correctly

#### Test Logout
- [ ] Navigate to Profile tab
- [ ] Tap "Logout" button
- [ ] Verify redirected to login screen

---

### 2. Book Features Testing

#### Browse Books
- [ ] Navigate to "Books" tab
- [ ] Scroll through book list
- [ ] Verify book covers load
- [ ] Check ratings display correctly

#### Search Books
- [ ] Tap search bar
- [ ] Search for "Harry Potter"
- [ ] Verify search results appear
- [ ] Tap a book to view details

#### Book Details
- [ ] View book details page
- [ ] Check all information displays:
  - [ ] Cover image
  - [ ] Title, author, description
  - [ ] Average rating
  - [ ] Reviews list

#### Reading List
- [ ] On book details, tap "Add to Reading List"
- [ ] Select status: "Want to Read"
- [ ] Navigate to Profile → Reading List
- [ ] Verify book appears in list
- [ ] Change status to "Currently Reading"
- [ ] Verify status updates

---

### 3. Review Testing

#### Create Review
- [ ] Go to book details page
- [ ] Tap "Write Review" button
- [ ] Enter review details:
  - Title: "Great book!"
  - Rating: 5 stars
  - Content: "I loved this book because..."
- [ ] Submit review
- [ ] Verify review appears on book page

#### Edit Review
- [ ] Find your review
- [ ] Tap "Edit" icon
- [ ] Update rating to 4 stars
- [ ] Save changes
- [ ] Verify changes saved

#### Like Review
- [ ] Find another user's review
- [ ] Tap "Like" button
- [ ] Verify like count increases

---

### 4. Forum Testing

#### Browse Forums
- [ ] Navigate to "Forums" tab
- [ ] Scroll through forum list
- [ ] Tap a forum to open

#### Create Forum
- [ ] Tap "Create Forum" button
- [ ] Enter forum details:
  - Title: "Harry Potter Discussion"
  - Description: "Discuss all HP books"
  - Category: "Book Discussion"
- [ ] Select book: "Harry Potter"
- [ ] Create forum
- [ ] Verify forum appears in list

#### Post in Forum
- [ ] Open a forum
- [ ] Tap "New Post" button
- [ ] Write message: "Who's your favorite character?"
- [ ] Submit post
- [ ] Verify post appears

#### Real-time Updates
- [ ] Keep forum open
- [ ] (On another device/account) Post a new message
- [ ] Verify new message appears automatically
- [ ] Check no page refresh needed

---

### 5. Spaces (Chat Rooms) Testing

#### Browse Spaces
- [ ] Navigate to "Spaces" tab
- [ ] View available spaces
- [ ] Check space details (public/private, video enabled)

#### Create Space
- [ ] Tap "Create Space" button
- [ ] Enter space details:
  - Name: "Book Club Meetup"
  - Description: "Let's discuss our current reads"
  - Public: Yes
  - Video: No (for free tier)
- [ ] Create space
- [ ] Verify space created

#### Chat in Space
- [ ] Join a space
- [ ] Send message: "Hello everyone!"
- [ ] Verify message appears
- [ ] Test real-time: Have another user send message
- [ ] Verify instant delivery

#### Video Chat (Premium/Pro only)
- [ ] Login with testpremium or testpro
- [ ] Create space with video enabled
- [ ] Join space
- [ ] Test video functionality
- [ ] Verify video/audio works

---

### 6. AI Chat Testing

#### View AI Chats
- [ ] Navigate to "AI" tab
- [ ] View list of available AI personalities

#### Create AI Chat
- [ ] Tap "New Chat" button
- [ ] Select character type: "Author"
- [ ] Enter character name: "J.K. Rowling"
- [ ] Select book: "Harry Potter"
- [ ] Create chat

#### Chat with AI
- [ ] Send message: "What inspired Harry Potter?"
- [ ] Verify AI response appears
- [ ] Continue conversation
- [ ] Check message history saves

#### Test Limits (Free Tier)
- [ ] Login as testfree
- [ ] Create 2 AI chats (free tier limit)
- [ ] Try to create 3rd chat
- [ ] Verify upgrade prompt appears

---

### 7. Subscription Testing

#### View Current Plan
- [ ] Go to Profile tab
- [ ] Tap "Subscription"
- [ ] Verify current tier displays

#### Compare Plans
- [ ] View subscription page
- [ ] Check all 3 tiers displayed:
  - [ ] Free: $0/month
  - [ ] Premium: $9.99/month
  - [ ] Pro: $19.99/month
- [ ] Verify features listed correctly

#### Test Upgrade Flow
- [ ] Login as testfree
- [ ] Tap "Upgrade to Premium"
- [ ] (Stripe test mode) Enter test card:
  - Number: `4242 4242 4242 4242`
  - Expiry: Any future date
  - CVC: Any 3 digits
- [ ] Complete payment
- [ ] Verify upgrade successful
- [ ] Check new features unlocked

---

### 8. Profile Testing

#### View Profile
- [ ] Navigate to Profile tab
- [ ] Verify information displays:
  - [ ] Username
  - [ ] Email
  - [ ] Bio
  - [ ] Avatar
  - [ ] Subscription tier

#### Edit Profile
- [ ] Tap "Edit Profile"
- [ ] Update bio: "I love reading fantasy books!"
- [ ] Save changes
- [ ] Verify changes saved

#### Upload Avatar
- [ ] Tap "Edit Profile"
- [ ] Tap avatar placeholder
- [ ] Choose photo from library
- [ ] Save profile
- [ ] Verify avatar displays

---

### 9. Performance Testing

#### Offline Mode
- [ ] Turn on Airplane Mode
- [ ] Browse previously loaded books
- [ ] Verify cached data displays
- [ ] Try to create review
- [ ] Verify queued for later
- [ ] Turn off Airplane Mode
- [ ] Verify queued action executes

#### Cache Testing
- [ ] Load book list
- [ ] Note load time (~2-3 seconds)
- [ ] Navigate away and back
- [ ] Note faster load time (~0.5 seconds)
- [ ] Verify cache working

#### Real-time Reconnection
- [ ] Open a forum
- [ ] Disconnect WiFi briefly
- [ ] Reconnect WiFi
- [ ] Verify real-time connection restores
- [ ] Post new message to confirm

---

### 10. Error Handling Testing

#### Network Errors
- [ ] Turn on Airplane Mode
- [ ] Try to login
- [ ] Verify friendly error message
- [ ] Verify retry option available

#### Invalid Login
- [ ] Enter wrong password
- [ ] Verify error message: "Invalid credentials"
- [ ] Verify can try again

#### Form Validation
- [ ] Try to create review with empty title
- [ ] Verify validation error
- [ ] Try to register with weak password
- [ ] Verify password requirements shown

---

## 🐛 Common Issues & Solutions

### Issue: "Unable to connect to backend"
**Solution:**
1. Check backend is running: `curl http://localhost:5000/health`
2. Get your development machine's IP:
   - Mac: `ifconfig | grep "inet "` 
   - Linux: `hostname -I`
3. Update `mobile/src/constants/index.js`:
   ```javascript
   export const API_URL = 'http://YOUR-IP:5000';
   ```
4. Restart mobile app

### Issue: "QR code won't scan"
**Solution:**
- Use tunnel mode: `npm start -- --tunnel`
- Or manually enter URL in Expo Go app

### Issue: "Real-time features not working"
**Solution:**
1. Check Socket.io connection in backend logs
2. Verify CORS settings in backend
3. Check firewall allows WebSocket connections

### Issue: "Images not loading"
**Solution:**
1. Check internet connection
2. Verify Google Books API key in backend `.env`
3. Try clearing app cache: Delete app and reinstall

---

## 📊 Test Results Template

Use this template to track your testing:

```
Testing Date: ___________
Tester: ___________
Device: iPhone ___________
iOS Version: ___________

Authentication: ✅ / ❌
Books: ✅ / ❌
Reviews: ✅ / ❌
Forums: ✅ / ❌
Spaces: ✅ / ❌
AI Chats: ✅ / ❌
Subscriptions: ✅ / ❌
Profile: ✅ / ❌
Performance: ✅ / ❌
Error Handling: ✅ / ❌

Issues Found:
1. _____________________
2. _____________________

Notes:
_____________________
```

---

## 🎯 Quick Test (5 minutes)

If you're short on time, test these critical paths:

1. **Login** with `testfree@bookclub.dev` / `Test1234!`
2. **Browse** books and tap one to view details
3. **Create** a review with 5 stars
4. **Join** a forum and post a message
5. **Navigate** to AI chats tab
6. **Verify** subscription tier shows "Free"

If all these work, your core functionality is operational! ✅

---

## 📞 Need Help?

If you encounter issues not covered here:
1. Check backend logs: `tail -f /workspaces/Book-Club/backend/logs/app.log`
2. Check mobile logs: In Expo, press `Shift + M` to open menu, then "Show logs"
3. Review [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for database issues
4. Review [PERFORMANCE_OPTIMIZATIONS.md](PERFORMANCE_OPTIMIZATIONS.md) for slow performance

Happy Testing! 🚀
