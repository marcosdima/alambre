import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { useNavigator, useStagger } from 'alambre';
import { useLightDark } from '../../providers/theme';
import { AppTitle, AppText, AppBadge, AppCard } from '@some-alambre/ui';

export default () => {
  const { theme } = useLightDark();
  const { navigate } = useNavigator();
  const { getDelay } = useStagger({ initialDelay: 80, staggerMs: 60 });

  const navItems = [
    {
      key: 'cardArrival',
      title: 'Card Arrival Simulation',
      description: 'Continuous parabolic trajectory from deck to hand slot without center snap (useHandArrival & predictHandArrivalSlot).',
      badge: 'FIXED MOTION',
      badgeTone: 'primary' as const,
      onPress: () => navigate('cardArrival'),
    },
    {
      key: 'cardGame',
      title: 'Card Game Arena',
      description: 'Multi-card cascade dealing, spring toss physics, and live Room Relay multiplayer synchronization.',
      badge: 'MULTIPLAYER',
      badgeTone: 'neutral' as const,
      onPress: () => navigate('cardGame'),
    },
    {
      key: 'typography',
      title: 'Typography & Android Defense',
      description: 'Android typeface fallback defense: variant mapping, fontWeight sanitization, and kinetic text verification.',
      badge: 'TOKEN AUDIT',
      badgeTone: 'warning' as const,
      onPress: () => navigate('typography'),
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View
        entering={FadeInDown.duration(300).delay(getDelay(0)).easing(Easing.out(Easing.cubic))}
      >
        <View style={[styles.headerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <AppTitle level={2}>Alambre Showcase</AppTitle>
          <AppText variant="muted">Interactive Physics & System Testbeds</AppText>
        </View>
      </Animated.View>

      {navItems.map((item, index) => (
        <Animated.View
          key={item.key}
          entering={FadeInDown.duration(280).delay(getDelay(index + 1)).easing(Easing.out(Easing.cubic))}
        >
          <Pressable onPress={item.onPress} accessibilityRole="button">
            <AppCard
              variant="outlined"
              style={[styles.itemCard, { borderColor: theme.border, backgroundColor: theme.surface }]}
            >
              <View style={styles.itemHeader}>
                <AppTitle level={3} style={{ flex: 1 }}>{item.title}</AppTitle>
                <AppBadge tone={item.badgeTone} variant="soft" size="sm">
                  {item.badge}
                </AppBadge>
              </View>
              <AppText variant="muted">{item.description}</AppText>
              <View style={styles.actionPrompt}>
                <AppText variant="subtitle" style={{ color: theme.primary, fontWeight: '600', fontSize: 13 }}>
                  Launch Simulator ➔
                </AppText>
              </View>
            </AppCard>
          </Pressable>
        </Animated.View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  headerCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 18,
    gap: 8,
  },
  itemCard: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  actionPrompt: {
    marginTop: 6,
    alignItems: 'flex-start',
  },
});
