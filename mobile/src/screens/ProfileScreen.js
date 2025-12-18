import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';

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

  const menuItems = [
    { icon: 'person-outline', title: 'Edit Profile', onPress: () => {} },
    { icon: 'list-outline', title: 'My Reading List', onPress: () => {} },
    { icon: 'sparkles-outline', title: 'AI Chats', onPress: () => navigation.navigate('AIChats') },
    { icon: 'card-outline', title: 'Subscription', onPress: () => navigation.navigate('Pricing') },
    { icon: 'settings-outline', title: 'Settings', onPress: () => {} },
    { icon: 'log-out-outline', title: 'Logout', onPress: handleLogout, color: COLORS.danger },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color={COLORS.white} />
        </View>
        <Text style={styles.username}>{user?.username}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.badge}>
          <Ionicons name="star" size={16} color={COLORS.warning} />
          <Text style={styles.badgeText}>{user?.subscription?.tier || 'Free'} Member</Text>
        </View>
      </View>

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
            <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, alignItems: 'center', padding: SPACING.xl },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  username: { ...TYPOGRAPHY.h2, color: COLORS.white, marginBottom: SPACING.xs },
  email: { ...TYPOGRAPHY.body, color: COLORS.white, opacity: 0.8, marginBottom: SPACING.md },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: 16 },
  badgeText: { color: COLORS.white, marginLeft: SPACING.xs, fontWeight: '600' },
  menu: { marginTop: SPACING.md },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: SPACING.lg, marginBottom: 1 },
  menuText: { flex: 1, marginLeft: SPACING.md, ...TYPOGRAPHY.body },
});

export default ProfileScreen;
