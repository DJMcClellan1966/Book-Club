import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';

const PricingScreen = () => {
  const plans = [
    { name: 'Free', price: '$0', features: ['2 AI Chats', '20 Messages/day', 'Basic Features'] },
    { name: 'Premium', price: '$9.99', features: ['10 AI Chats', '100 Messages/day', 'Video Avatars', 'Priority Support'], popular: true },
    { name: 'Pro', price: '$19.99', features: ['Unlimited Chats', 'Unlimited Messages', 'All Features', '24/7 Support'] },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Choose Your Plan</Text>
      <Text style={styles.subtitle}>Upgrade to unlock premium features</Text>

      {plans.map((plan, index) => (
        <View key={index} style={[styles.planCard, plan.popular && styles.popularCard]}>
          {plan.popular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>MOST POPULAR</Text>
            </View>
          )}
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planPrice}>{plan.price}/month</Text>
          <View style={styles.features}>
            {plan.features.map((feature, i) => (
              <View key={i} style={styles.feature}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={[styles.button, plan.popular && styles.buttonPrimary]}>
            <Text style={[styles.buttonText, plan.popular && styles.buttonTextPrimary]}>
              {plan.name === 'Free' ? 'Current Plan' : 'Upgrade'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  title: { ...TYPOGRAPHY.h1, textAlign: 'center', marginBottom: SPACING.xs },
  subtitle: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl },
  planCard: { backgroundColor: COLORS.white, padding: SPACING.lg, borderRadius: 12, marginBottom: SPACING.md, borderWidth: 2, borderColor: COLORS.border },
  popularCard: { borderColor: COLORS.primary, transform: [{ scale: 1.02 }] },
  popularBadge: { backgroundColor: COLORS.primary, alignSelf: 'flex-start', paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: 16, marginBottom: SPACING.md },
  popularText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
  planName: { ...TYPOGRAPHY.h2, marginBottom: SPACING.xs },
  planPrice: { ...TYPOGRAPHY.h1, color: COLORS.primary, marginBottom: SPACING.md },
  features: { marginBottom: SPACING.lg },
  feature: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  featureText: { ...TYPOGRAPHY.body, marginLeft: SPACING.sm },
  button: { backgroundColor: COLORS.light, padding: SPACING.md, borderRadius: 8, alignItems: 'center' },
  buttonPrimary: { backgroundColor: COLORS.primary },
  buttonText: { color: COLORS.text, fontWeight: '600' },
  buttonTextPrimary: { color: COLORS.white },
});

export default PricingScreen;
