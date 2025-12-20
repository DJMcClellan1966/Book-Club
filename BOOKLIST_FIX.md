# Fix for Booklist Features Not Showing on iPhone

## Problem
The booklist features weren't showing on your iPhone because all the screens were using hardcoded `localhost:5000` URLs, which don't work on physical devices (localhost points to the device itself, not your development server).

## What Was Fixed
I've updated all these screens to use the `API_URL` constant from [mobile/src/constants/index.js](mobile/src/constants/index.js):

1. ✅ **BooklistScreen.js** - Fixed 6 hardcoded URLs
   - `loadBooklist()` - loads booklist data
   - `loadStats()` - loads statistics
   - `toggleFavorite()` - favorite/unfavorite books
   - `removeBook()` - remove from booklist
   - `loadCommunityReviews()` - load reviews

2. ✅ **AddBookScreen.js** - Fixed 3 hardcoded URLs
   - `handleSearch()` - search for books
   - `searchByImage()` - scan book covers
   - `addBook()` - add manual entries

3. ✅ **AddToBooklistScreen.js** - Fixed 3 hardcoded URLs
   - `loadCommunityReviews()` - load reviews
   - `generateSummary()` - AI review summary
   - `handleSubmit()` - add book to booklist

4. ✅ **DiaryScreen.js** - Fixed 4 hardcoded URLs
   - `loadUsage()` - load diary usage stats
   - `loadEntries()` - load diary entries
   - `handleDeleteEntry()` - delete entries
   - `generateAIInsights()` - AI analysis

5. ✅ **AddDiaryEntryScreen.js** - Fixed 2 hardcoded URLs
   - `handleSave()` - save/update entries

6. ✅ **TwoFactorSetupScreen.js** - Fixed 1 hardcoded URL
   - `sendPhoneVerification()` - send SMS codes

## Next Step: Update API_URL

Since you're running in GitHub Codespaces and testing on your iPhone, you need to update the `API_URL` in [mobile/src/constants/index.js](mobile/src/constants/index.js#L17):

### How to Get Your Codespaces URL:

1. **Open the Ports tab** in VS Code (bottom panel, next to Terminal)
2. **Find port 5000** in the list
3. **Right-click** on the port 5000 row
4. **Select "Copy Local Address"** or **"Copy Forwarded Address"**
5. The URL will look like: `https://fuzzy-space-acorn-abc123-5000.app.github.dev`

### Update the constant:

Open [mobile/src/constants/index.js](mobile/src/constants/index.js) and change line 17:

```javascript
// Change from:
export const API_URL = __DEV__ 
  ? 'http://localhost:5000/api'
  : 'https://your-production-api.com/api';

// To (using your actual Codespaces URL):
export const API_URL = __DEV__ 
  ? 'https://YOUR-CODESPACE-NAME-5000.app.github.dev/api'
  : 'https://your-production-api.com/api';
```

**IMPORTANT:** 
- Add `/api` to the end of the URL
- Use `https://` not `http://` for Codespaces URLs
- Make sure the port visibility is set to "Public" in the Ports tab

### After updating:

1. Save the file
2. The Expo app should reload automatically on your iPhone
3. Try navigating to Profile → My Booklist
4. The features should now work!

## Testing

Once updated, test these features:
- ✅ View your booklist (Profile → My Booklist)
- ✅ Add a book (Profile → My Booklist → + button)
- ✅ Add to booklist with rating
- ✅ View diary entries
- ✅ Add diary entries
- ✅ Community reviews

## Troubleshooting

If it still doesn't work:

1. **Check the Ports tab** - ensure port 5000 is running and Public
2. **Check the backend** - make sure `node server.js` is running
3. **Check the Expo console** - look for network errors
4. **Test the URL** - try opening it in Safari on your iPhone: `https://YOUR-CODESPACE-5000.app.github.dev/api/books`

If you see JSON data, the backend is accessible!
