import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { useNavigator, useStagger } from 'alambre';
import { useLightDark } from '../../providers/theme';
import { AppTitle, AppText, AppCard, AppBadge } from 'alambre/ui';

export default () => {
  const { theme } = useLightDark();
  const { navigate } = useNavigator();
  const { getDelay } = useStagger({ initialDelay: 80, staggerMs: 60 });

  const navItems = [
    {
      key: 'roomRelayWeb',
      title: 'Relay Web & Mensajería',
      description:
        'Conexión cliente a cliente en tiempo real mediante PartyKit / WebSocket web con inspector de paquetes en vivo.',
      badge: 'ROOM-RELAY',
      badgeTone: 'success' as const,
      onPress: () => navigate('roomRelayWeb'),
    },
  ];

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <Animated.View
        entering={FadeInDown.duration(300).delay(getDelay(0)).easing(Easing.out(Easing.cubic))}
      >
        <View style={[styles.headerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <AppTitle level={2}>Alambre Playground</AppTitle>
          <AppText variant="muted">Laboratorio interactivo de físicas y conexiones cinéticas</AppText>
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
                  Abrir Testbed ➔
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
