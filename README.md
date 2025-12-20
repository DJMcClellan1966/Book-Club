# Community Hub Application

A comprehensive full-stack application for people to connect, share reviews, participate in discussions, and engage in video chats. Available on **Web**, **iOS**, and **Android**.

## 🌟 Features

### ✍️ Reviews & Ratings
- **Write Reviews**: Share detailed reviews with ratings (1-5 stars)
- **Read Reviews**: Browse reviews from other community members
- **Like & Comment**: Engage with reviews through likes and comments

### 💬 Discussion Forums
- **Create Forums**: Start topic-specific discussion forums
- **Forum Categories**: Organize discussions by topics of interest
- **Post & Reply**: Share thoughts and reply to other members' posts
- **Like Posts**: Show appreciation for valuable contributions

### 🏠 Spaces (Discussion Rooms)
- **Create Spaces**: Build temporary or permanent discussion spaces
- **Text Chat**: Real-time messaging using Socket.io
- **Video Chat**: WebRTC-powered video conversations with multiple participants
- **Public/Private**: Control space visibility and access
- **Auto-expire**: Temporary spaces automatically expire after 7 days

### 👤 User Profiles
- **Personal Profile**: Customize your profile with bio and avatar
- **Follow System**: Follow other members and build your network
- **Activity Tracking**: View your activity and review contributions
- **Dashboard**: Centralized view of your activities

### 🔐 Authentication & Security
- **Multiple Login Methods**: Login with email, username, or phone number
- **Phone Authentication**: SMS verification for phone-based accounts
- **Country Code Auto-Detection**: Automatic country code selection based on location
- **Password Strength Requirements**: Enforced strong password policies
- **Account Recovery**: Forgot password and username recovery options
- **2FA Support**: Two-factor authentication for enhanced security

### 🤖 AI-Powered Features
- **Content Moderation**: Automatic AI moderation of forum posts and space messages to maintain community standards
<<<<<<< HEAD
- **Severity Detection**: Multi-level moderation with warnings for borderline content and blocks for severe violations
- **AI Character & Author Chats**: Have conversations with AI-powered characters
- **Personality Simulation**: AI creates authentic personalities for engaging discussions
- **Video Avatars**: Animated video responses for Premium/Pro subscribers (coming soon)
=======
- **Smart Book Recommendations**: Personalized book suggestions based on your reading history using AI
- **Reading Insights**: AI-generated insights about your reading habits and preferences
- **Sentiment Analysis**: Analyze emotional tone and opinions in book reviews with detailed aspect-based insights
- **Topic Tagging**: Automatic categorization of books and discussions with relevant topic tags
- **Smart Summarization**: AI-generated concise summaries for books, reviews, and discussions
- **Discussion Summarizer**: Automatic summaries of forum threads highlighting key points and consensus
- **Personalized Notifications**: AI-generated engaging notification content for recommendations and updates
- **AI Character & Author Chats**: Have conversations with your favorite authors and book characters
- **Personality Simulation**: AI creates authentic character/author personalities for engaging discussions
- **Severity Detection**: Multi-level moderation with warnings for borderline content and blocks for severe violations
- **Speech-to-Text** (coming soon): Submit voice reviews converted to text
- **OCR for Books** (coming soon): Extract text from scanned book pages and images
- **Video Avatars** (coming soon): Animated video responses for Premium/Pro subscribers
>>>>>>> e017b52cde761d61a8c9efe59435bc763abc5ef5

### 💰 Monetization Features
- **Subscription Tiers**: Free, Premium ($9.99/mo), and Pro ($19.99/mo) plans
  - Free: 2 AI chats, 20 messages/day
  - Premium: 10 AI chats, 100 messages/day, video avatars
  - Pro: Unlimited AI chats and messages, video avatars
- **Stripe Integration**: Secure payment processing with 7-day free trials
- **Feature Gates**: Premium features like ad-free experience, enhanced AI
- **Billing Portal**: Self-service subscription management for users
- **Webhook Automation**: Automated subscription lifecycle handling

## 🛠️ Technology Stack

### Backend
- **Node.js** & **Express**: RESTful API server
- **MongoDB** & **Mongoose**: Database and ODM
- **Socket.io**: Real-time WebSocket communication
- **JWT**: Secure authentication
- **bcryptjs**: Password hashing
- **OpenAI API**: AI-powered content moderation and chat features
- **Stripe**: Payment processing and subscription management

### Frontend
- **React 18**: UI framework
- **React Router**: Client-side routing
- **Socket.io-client**: Real-time communication
- **Simple Peer**: WebRTC video chat implementation
- **Axios**: HTTP client
- **Context API**: State management
- **Stripe.js & React Stripe**: Payment UI components

## 📋 Prerequisites

### For Web Application
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager
- Modern web browser with WebRTC support

### For Mobile Apps (Optional)
- Node.js (v14 or higher)
- Expo CLI: `npm install -g expo-cli`
- For iOS: macOS with Xcode, Apple Developer Account
- For Android: Android Studio, Google Play Developer Account
- Physical device or emulator for testing

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Book-Club
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
# Required variables:
# - MONGODB_URI (your MongoDB connection string)
# - JWT_SECRET (generate a secure random string)
# - PORT (default: 5000)
# - CLIENT_URL (default: http://localhost:3000)
# - FRONTEND_URL (default: http://localhost:3000)
# - GOOGLE_BOOKS_API_KEY (optional, for enhanced book search)
# - OPENAI_API_KEY (optional but recommended, for AI moderation and recommendations)
# - STRIPE_SECRET_KEY (optional, for payment processing)
# - STRIPE_WEBHOOK_SECRET (optional, for webhook verification)
# - STRIPE_PREMIUM_PRICE_ID (optional, for premium subscription)
# - STRIPE_PRO_PRICE_ID (optional, for pro subscription)
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
# Required variables:
# - REACT_APP_API_URL=http://localhost:5000/api
# - REACT_APP_SOCKET_URL=http://localhost:5000
# - REACT_APP_STRIPE_PUBLISHABLE_KEY (optional, for payment UI)
```

### 4. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# Using MongoDB service
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 5. Run the Application

**Terminal 1 - Start Backend:**
```bash
cd backend
npm run dev
# Server will run on http://localhost:5000
```

**Terminal 2 - Start Web Frontend:**
```bash
cd frontend
npm start
# App will open at http://localhost:3000
```

**Terminal 3 - Start Mobile App (Optional):**
```bash
cd mobile
npm start
# Follow instructions to run on iOS/Android
# See mobile/README.md for detailed instructions
```

## 📱 Usage Guide

### Getting Started

1. **Register**: Create a new account on the registration page
2. **Login**: Sign in with your credentials
3. **Explore**: Browse books, forums, and spaces

### Writing Reviews

1. Navigate to the reviews section
2. Click **Write a Review**
3. Select a rating (1-5 stars)
4. Write your review title and content
5. Submit your review

### Participating in Forums

1. Navigate to **Forums** page
2. Click **Create Forum** to start a new discussion
3. Click on any forum to view posts
4. Click **Join Forum** to become a member
5. Add posts and replies

### Using Spaces

1. Navigate to **Spaces** page
2. Click **Create Space** to start a new space
3. Choose space type (permanent/temporary) and visibility
4. Enable video chat if needed
5. Join a space to participate in text or video discussions

### Managing Subscriptions

1. Navigate to **Pricing** page to view subscription options
2. Select a plan (Premium or Pro) and click upgrade
3. Enter payment details at checkout
4. Start your 7-day free trial
5. Manage subscription in **Billing** page:
   - View current plan and features
   - Update payment method
   - Cancel or reactivate subscription
   - View payment history

### Video Chat

1. Join a space with video enabled
2. Click **Join Video Chat**
3. Allow browser permissions for camera and microphone
4. Use controls to toggle video/audio or leave the call

### AI Character Chats

1. Navigate to **AI Chats** page
2. Click the **+** button to create a new chat
3. Select chat type:
   - **Author**: Chat with famous authors
   - **Character**: Talk to characters
4. Enter the character/author name
5. (Optional) Add book title for more context
6. (Premium/Pro) Enable video avatar for animated responses
7. Start chatting! The AI will respond in character
8. View usage limits in the sidebar (upgrade for more)

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Reviews
- `GET /api/reviews/user/:userId` - Get user reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `POST /api/reviews/:id/like` - Like review

### Forums
- `GET /api/forums` - Get all forums
- `GET /api/forums/:id` - Get forum details
- `POST /api/forums` - Create forum
- `POST /api/forums/:id/join` - Join forum
- `POST /api/forums/:id/posts` - Add post

### Spaces
- `GET /api/spaces` - Get all spaces
- `GET /api/spaces/:id` - Get space details
- `POST /api/spaces` - Create space
- `POST /api/spaces/:id/join` - Join space
- `POST /api/spaces/:id/messages` - Send message

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/:id/follow` - Follow user

### Payments & Subscriptions
- `GET /api/payments/pricing` - Get subscription pricing tiers
- `GET /api/payments/subscription` - Get current user subscription
- `POST /api/payments/subscribe` - Create new subscription
- `POST /api/payments/cancel` - Cancel subscription
- `POST /api/payments/reactivate` - Reactivate subscription
- `POST /api/payments/update-tier` - Change subscription tier
- `GET /api/payments/payments` - Get payment history
- `POST /api/payments/portal` - Create billing portal session
- `POST /api/payments/webhook` - Stripe webhook handler

### AI Character Chats
- `GET /api/aichats/my-chats` - Get all user's AI chat sessions
- `POST /api/aichats/create` - Create new AI character/author chat
- `POST /api/aichats/:chatId/message` - Send message to AI character
- `DELETE /api/aichats/:chatId` - Delete AI chat session
- `GET /api/aichats/limits/current` - Get current usage and tier limits

### AI Features
- `GET /api/ai/status` - Check AI service status and available features
- `POST /api/ai/sentiment` - Analyze sentiment of text
- `GET /api/ai/review-sentiment/:reviewId` - Get sentiment analysis for a review
- `GET /api/ai/book-sentiment/:bookId` - Get aggregate sentiment for all reviews of a book
- `POST /api/ai/generate-tags` - Generate topic tags for text
- `GET /api/ai/book-tags/:bookId` - Generate tags for a book
- `POST /api/ai/summarize` - Generate summary of text
- `GET /api/ai/book-summary/:bookId` - Get AI-generated book summary
- `GET /api/ai/discussion-summary/:forumId` - Generate summary of forum discussion
- `POST /api/ai/transcribe` - Transcribe speech to text (placeholder)
- `POST /api/ai/ocr` - Extract text from image (placeholder)
- `POST /api/ai/notification` - Generate personalized notification

## 🎨 Project Structure

```
Book-Club/
├── backend/             # Node.js/Express API server
│   ├── models/          # MongoDB schemas
│   │   ├── User.js
│   │   ├── Review.js
│   │   ├── Forum.js
│   │   ├── Space.js
│   │   ├── Subscription.js
│   │   ├── Payment.js
│   │   ├── AIChat.js
│   │   └── ChatMessage.js
│   ├── routes/          # API routes
│   │   ├── auth.js
│   │   ├── reviews.js
│   │   ├── forums.js
│   │   ├── spaces.js
│   │   ├── users.js
│   │   ├── payments.js
│   │   └── aichats.js
│   ├── middleware/      # Custom middleware
│   │   ├── auth.js
│   │   └── subscription.js
│   ├── services/        # Business logic services
│   │   ├── aiService.js
│   │   └── stripeService.js
│   ├── server.js        # Express server & Socket.io
│   └── package.json
│
├── frontend/            # React web application
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   │   ├── Navbar.js
│   │   │   ├── VideoChat.js
│   │   │   └── ChatInterface.js
│   │   ├── pages/       # Page components
│   │   │   ├── Home.js
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Forums.js
│   │   │   ├── ForumDetail.js
│   │   │   ├── Spaces.js
│   │   │   ├── SpaceDetail.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Profile.js
│   │   │   ├── Pricing.js
│   │   │   ├── Checkout.js
│   │   │   ├── Billing.js
│   │   │   └── AIChats.js
│   │   ├── context/     # React Context
│   │   │   ├── AuthContext.js
│   │   │   └── SocketContext.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
└── mobile/              # React Native mobile apps (iOS & Android)
    ├── src/
    │   ├── screens/     # Mobile screens
    │   │   ├── auth/    # Login, Register
    │   │   ├── HomeScreen.js
    │   │   ├── ForumsScreen.js
    │   │   ├── SpacesScreen.js
    │   │   ├── ProfileScreen.js
    │   │   └── AIChatsScreen.js
    │   ├── components/  # Reusable mobile components
    │   ├── navigation/  # React Navigation setup
    │   ├── context/     # Auth context
    │   ├── services/    # API & Socket services
    │   ├── constants/   # Colors, spacing, config
    │   └── utils/       # Helper functions
    ├── app.json         # Expo configuration
    ├── eas.json         # Build configuration
    ├── App.js           # Entry point
    └── package.json
    │   ├── App.js
    │   └── index.js
    └── package.json
```

## 🔐 Security Features

- Password hashing with bcryptjs
- JWT-based authentication
- Protected routes and API endpoints
- Input validation
- Secure WebSocket connections
- AI-powered content moderation to prevent inappropriate content

## 🎥 WebRTC Video Chat

The application uses Simple Peer library for WebRTC peer-to-peer video connections:
- Multiple participants support
- Camera and microphone toggle
- Automatic peer connection handling
- Socket.io signaling server

## 🌐 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/communityhub
JWT_SECRET=your_secure_random_string_here
CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
OPENAI_API_KEY=your_openai_api_key_for_ai_features

# Payment Processing (Optional - for monetization)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PREMIUM_PRICE_ID=price_premium_id_from_stripe
STRIPE_PRO_PRICE_ID=price_pro_id_from_stripe
```

**Notes:**
- **AI Features**: App works without OpenAI API key, but AI moderation and chat features will be disabled
- **Stripe**: Required only if you want to enable paid subscriptions
- See [MONETIZATION.md](MONETIZATION.md) for detailed payment setup instructions

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `sudo systemctl status mongod`
- Check connection string in `.env`
- Verify MongoDB port (default: 27017)

### WebRTC/Video Issues
- Allow browser permissions for camera/microphone
- Ensure HTTPS in production (required for WebRTC)
- Check firewall settings for WebRTC ports

### Socket.io Connection Issues
- Verify `REACT_APP_SOCKET_URL` matches backend URL
- Check CORS configuration in backend
- Ensure WebSocket support in your network

### AI Features Not Working
- Verify `OPENAI_API_KEY` is set in backend `.env`
- Check API key has sufficient credits and permissions
- Review backend logs for AI service errors
- App continues to work without AI, providing default recommendations

### Payment/Subscription Issues
- Verify Stripe API keys are correct (test vs production)
- Check webhook endpoint is accessible
- Use Stripe test cards for development
- Review Stripe dashboard for payment errors
- See [MONETIZATION.md](MONETIZATION.md) for detailed troubleshooting

### AI Chat Issues
- Check OpenAI API key is valid and has credits
- Verify subscription tier allows AI chats
- Check daily message limit hasn't been exceeded
- Review character/author name spelling
- For video avatars, ensure Premium or Pro tier is active

## 📝 Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Building for Production

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve the build folder with a static server
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 📚 Additional Documentation

- **[AI_SETUP.md](AI_SETUP.md)** - **NEW!** Comprehensive setup guide for all AI features including sentiment analysis, topic tagging, summarization, and more
- **[AI_FEATURES.md](AI_FEATURES.md)** - Detailed documentation on AI moderation and recommendations
- **[AI_CHAT_GUIDE.md](AI_CHAT_GUIDE.md)** - Complete guide to AI character and author chat feature
- **[mobile/README.md](mobile/README.md)** - Complete guide to building and deploying mobile apps
- **[MONETIZATION.md](MONETIZATION.md)** - Complete guide to payment processing, subscriptions, and affiliate links

## 📱 Mobile Applications

The Community Hub app is available as native iOS and Android applications built with React Native and Expo.

### Features
- ✅ Full authentication (login/register)
- ✅ Access forums and discussions
- ✅ Join spaces and chat
- ✅ AI character conversations
- ✅ Profile management
- ✅ Subscription management
- ✅ Native mobile UI/UX
- ✅ Offline capabilities
- ✅ Push notifications (configurable)

### Quick Start (Mobile)

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Start development server
npm start

# Run on iOS simulator (macOS only)
npm run ios

# Run on Android emulator
npm run android

# For physical devices, scan QR code with Expo Go app
```

### Production Builds

See [mobile/README.md](mobile/README.md) for detailed instructions on:
- Building production APK/AAB for Android
- Building production IPA for iOS
- Submitting to Google Play Store
- Submitting to Apple App Store
- Required assets and configurations
- Testing and deployment strategies

## 🙏 Acknowledgments

- Socket.io for real-time communication
- Simple Peer for WebRTC implementation
- MongoDB and Mongoose for database management
- React and the React community
- React Native and Expo for mobile development
- Stripe for payment processing infrastructure
- OpenAI for AI-powered features

## 📧 Support

For support, please open an issue in the repository or contact the development team.

---

**Welcome to the Community! 🎉**
A place where people can connect and engage in meaningful discussions
