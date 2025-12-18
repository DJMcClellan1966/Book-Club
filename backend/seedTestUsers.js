require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Subscription = require('./models/Subscription');

const testUsers = [
  {
    username: 'testfree',
    email: 'testfree@bookclub.dev',
    password: 'Test1234!',
    tier: 'free',
    bio: 'Free tier test account'
  },
  {
    username: 'testpremium',
    email: 'testpremium@bookclub.dev',
    password: 'Test1234!',
    tier: 'premium',
    bio: 'Premium tier test account'
  },
  {
    username: 'testpro',
    email: 'testpro@bookclub.dev',
    password: 'Test1234!',
    tier: 'pro',
    bio: 'Pro tier test account'
  }
];

async function seedTestUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const userData of testUsers) {
      // Check if user exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`User ${userData.username} already exists, skipping...`);
        continue;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create user
      const user = await User.create({
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        bio: userData.bio
      });

      // Create subscription
      const subscription = await Subscription.create({
        user: user._id,
        tier: userData.tier,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      });

      user.subscription = subscription._id;
      await user.save();

      console.log(`✅ Created ${userData.tier} test user: ${userData.username}`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   Password: ${userData.password}`);
    }

    console.log('\n🎉 Test users created successfully!');
    console.log('\nLogin credentials:');
    console.log('==================');
    testUsers.forEach(user => {
      console.log(`\n${user.tier.toUpperCase()} Tier:`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding test users:', error);
    process.exit(1);
  }
}

seedTestUsers();
