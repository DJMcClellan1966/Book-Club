import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext.supabase';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../constants';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const handleAIChatsPress = () => {
    try {
      navigation.navigate('AIChats');
    } catch (error) {
      console.log('Navigation error, trying alternate route');
      // Fallback: navigate via parent navigator
      navigation.getParent()?.navigate('AIChats');
    }
  };

  const menuItems = [
    { icon: 'person-outline', title: 'Edit Profile', onPress: () => {} },
    { icon: 'list-outline', title: 'My Reading List', onPress: () => {} },
    { icon: 'shield-checkmark-outline', title: 'Two-Factor Authentication', onPress: () => navigation.navigate('TwoFactorSetup'), badge: user?.two_factor_enabled ? '✓ Enabled' : null },
    { icon: 'sparkles-outline', title: 'AI Chats', onPress: handleAIChatsPress },
    { icon: 'card-outline', title: 'Subscription', onPress: () => navigation.navigate('Pricing') },
    { icon: 'settings-outline', title: 'Settings', onPress: () => {} },
    { icon: 'log-out-outline', title: 'Logout', onPress: handleLogout, color: COLORS.danger },
  ];

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={COLORS.gradient.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.avatar}>
          <Ionicons name="person" size={48} color={COLORS.white} />
        </View>
        <Text style={styles.username}>{user?.username}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.badge}>
          <Ionicons name="star" size={18} color={COLORS.warning} />
          <Text style={styles.badgeText}>{user?.subscription?.tier || 'Free'} Member</Text>
        </View>
      </LinearGradient>

      <View style={styles.menu}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <Ionicons name={item.icon} size={24} color={item.color || COLORS.text} />
            <Text style={[styles.menuText, item.color && { color: item.color }]}>
              {item.title}
            </Text>
            {item.badge && (
              <Text style={styles.menuBadge}>{item.badge}</Text>
            )}
            <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { alignItems: 'center', padding: SPACING.xl, paddingTop: SPACING.xxl, paddingBottom: SPACING.xxl },
  avatar: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: 'rgba(255,255,255,0.3)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: SPACING.md,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  username: { ...TYPOGRAPHY.h2, color: COLORS.white, marginBottom: SPACING.xs, fontWeight: '800', fontSize: 28 },
  email: { ...TYPOGRAPHY.body, color: COLORS.white, opacity: 0.9, marginBottom: SPACING.md, fontSize: 16 },
  badge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.25)', 
    paddingHorizontal: SPACING.md + 4, 
    paddingVertical: SPACING.sm, 
    borderRadius: 20,
    ...SHADOWS.md,
  },
  badgeText: { color: COLORS.white, marginLeft: SPACING.xs, fontWeight: '700', fontSize: 15 },
  menu: { marginTop: SPACING.md, paddingHorizontal: SPACING.md },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.white, 
    padding: SPACING.lg, 
    marginBottom: SPACING.sm, 
    borderRadius: 12,
    ...SHADOWS.sm,
  },
  menuText: { flex: 1, marginLeft: SPACING.md, ...TYPOGRAPHY.body, fontWeight: '500', fontSize: 16 },
  menuBadge: { fontSize: 13, color: COLORS.success, fontWeight: '700', marginRight: SPACING.sm },
});

export default ProfileScreen;
