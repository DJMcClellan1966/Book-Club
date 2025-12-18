import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import BooksScreen from '../screens/BooksScreen';
import BookDetailScreen from '../screens/BookDetailScreen';
import ForumsScreen from '../screens/ForumsScreen';
import ForumDetailScreen from '../screens/ForumDetailScreen';
import SpacesScreen from '../screens/SpacesScreen';
import SpaceDetailScreen from '../screens/SpaceDetailScreen';
import AIChatsScreen from '../screens/AIChatsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PricingScreen from '../screens/PricingScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack
const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: COLORS.primary,
      },
      headerTintColor: COLORS.white,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="Login" 
      component={LoginScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="Register" 
      component={RegisterScreen}
      options={{ title: 'Create Account' }}
    />
  </Stack.Navigator>
);

// Home Stack
const HomeStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: COLORS.primary,
      },
      headerTintColor: COLORS.white,
    }}
  >
    <Stack.Screen 
      name="HomeMain" 
      component={HomeScreen}
      options={{ title: 'Book Club' }}
    />
    <Stack.Screen 
      name="BookDetail" 
      component={BookDetailScreen}
      options={{ title: 'Book Details' }}
    />
  </Stack.Navigator>
);

// Books Stack
const BooksStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: COLORS.primary,
      },
      headerTintColor: COLORS.white,
    }}
  >
    <Stack.Screen 
      name="BooksList" 
      component={BooksScreen}
      options={{ title: 'Browse Books' }}
    />
    <Stack.Screen 
      name="BookDetail" 
      component={BookDetailScreen}
      options={{ title: 'Book Details' }}
    />
  </Stack.Navigator>
);

// Forums Stack
const ForumsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: COLORS.primary,
      },
      headerTintColor: COLORS.white,
    }}
  >
    <Stack.Screen 
      name="ForumsList" 
      component={ForumsScreen}
      options={{ title: 'Forums' }}
    />
    <Stack.Screen 
      name="ForumDetail" 
      component={ForumDetailScreen}
      options={{ title: 'Forum Discussion' }}
    />
  </Stack.Navigator>
);

// Spaces Stack
const SpacesStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: COLORS.primary,
      },
      headerTintColor: COLORS.white,
    }}
  >
    <Stack.Screen 
      name="SpacesList" 
      component={SpacesScreen}
      options={{ title: 'Spaces' }}
    />
    <Stack.Screen 
      name="SpaceDetail" 
      component={SpaceDetailScreen}
      options={{ title: 'Space Details' }}
    />
  </Stack.Navigator>
);

// Profile Stack
const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: COLORS.primary,
      },
      headerTintColor: COLORS.white,
    }}
  >
    <Stack.Screen 
      name="ProfileMain" 
      component={ProfileScreen}
      options={{ title: 'My Profile' }}
    />
    <Stack.Screen 
      name="Pricing" 
      component={PricingScreen}
      options={{ title: 'Upgrade Plan' }}
    />
    <Stack.Screen 
      name="AIChats" 
      component={AIChatsScreen}
      options={{ title: 'AI Chats' }}
    />
  </Stack.Navigator>
);

// Main Tab Navigator
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Home') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Books') {
          iconName = focused ? 'book' : 'book-outline';
        } else if (route.name === 'Forums') {
          iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
        } else if (route.name === 'Spaces') {
          iconName = focused ? 'people' : 'people-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textSecondary,
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={HomeStack} />
    <Tab.Screen name="Books" component={BooksStack} />
    <Tab.Screen name="Forums" component={ForumsStack} />
    <Tab.Screen name="Spaces" component={SpacesStack} />
    <Tab.Screen name="Profile" component={ProfileStack} />
  </Tab.Navigator>
);

// Root Navigator
const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null; // Could show a splash screen here
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
