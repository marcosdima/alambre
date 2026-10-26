import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useLightDark } from '../../providers/theme';
import {
  AppTitle,
  AppText,
  AppCard,
  AppTabs,
  AppSkeleton,
  AppButton,
  AppSwitch,
  type AppTabItem,
} from 'alambre/ui';

export default function KineticTabsSkeletonTestbed() {
  const { theme } = useLightDark();
  const [activeTab, setActiveTab] = useState('feed');
  const [variant, setVariant] = useState<'pill' | 'segmented'>('pill');
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const tabs: AppTabItem[] = [
    {
      id: 'feed',
      label: 'Feed',
      badge: 3,
      badgeTone: 'primary',
      content: (
        <View style={styles.feedContent}>
          <AppCard variant="outlined" style={[styles.card, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <View style={styles.userRow}>
              <AppSkeleton variant="circle" width={48} height={48} active={!isPaused} />
              <View style={styles.userMeta}>
                <AppSkeleton variant="text" width="60%" height={16} active={!isPaused} />
                <AppSkeleton variant="text" width="40%" height={12} active={!isPaused} />
              </View>
            </View>
            <AppSkeleton variant="rect" height={120} active={!isPaused} style={styles.cardImage} />
            <AppSkeleton variant="text" width="90%" height={14} active={!isPaused} />
            <AppSkeleton variant="text" width="75%" height={14} active={!isPaused} />
          </AppCard>
        </View>
      ),
    },
    {
      id: 'profile',
      label: 'Profile',
      content: (
        <View style={styles.profileContent}>
          <AppCard variant="elevated" style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.profileHeader}>
              <AppSkeleton variant="circle" width={64} height={64} active={!isPaused} />
              <AppTitle level={3}>Developer Profile</AppTitle>
              <AppText variant="muted">Synchronous Single-Clock Lifecycle</AppText>
              <View style={styles.pillRow}>
                <AppSkeleton variant="pill" width={70} height={24} active={!isPaused} />
                <AppSkeleton variant="pill" width={90} height={24} active={!isPaused} />
                <AppSkeleton variant="pill" width={60} height={24} active={!isPaused} />
              </View>
            </View>
          </AppCard>
        </View>
      ),
    },
    {
      id: 'settings',
      label: 'Metrics',
      badge: 'NEW',
      badgeTone: 'success',
      content: (
        <View style={styles.settingsContent}>
          <AppCard variant="outlined" style={[styles.card, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <AppTitle level={3}>Performance Overhead</AppTitle>
            <AppText variant="muted">
              All 10+ skeletons above run on a single shared $O(1)$ loop clock on the UI thread.
            </AppText>
            <View style={styles.metricsRow}>
              <AppSkeleton variant="rect" width="48%" height={70} active={!isPaused} />
              <AppSkeleton variant="rect" width="48%" height={70} active={!isPaused} />
            </View>
          </AppCard>
        </View>
      ),
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={[styles.controlPanel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <AppTitle level={2}>Kinetic Tabs & Skeletons</AppTitle>
        <AppText variant="muted">
          Tactile pill indicator physics paired with single-clock accessible skeleton loaders.
        </AppText>

        <View style={styles.switchesRow}>
          <View style={styles.switchGroup}>
            <AppText variant="body">Variant: {variant.toUpperCase()}</AppText>
            <AppButton
              size="sm"
              variant="outline"
              onPress={() => setVariant((v) => (v === 'pill' ? 'segmented' : 'pill'))}
            >
              Toggle Style
            </AppButton>
          </View>

          <View style={styles.switchGroup}>
            <AppText variant="body">Reduced Motion</AppText>
            <AppSwitch checked={isReducedMotion} onChange={setIsReducedMotion} />
          </View>

          <View style={styles.switchGroup}>
            <AppText variant="body">Paused Clock</AppText>
            <AppSwitch checked={isPaused} onChange={setIsPaused} />
          </View>
        </View>
      </View>

      <AppTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant={variant}
        forceReducedMotion={isReducedMotion}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    gap: 16,
    paddingBottom: 40,
  },
  controlPanel: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  switchesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    gap: 12,
  },
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedContent: {
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userMeta: {
    flex: 1,
    gap: 6,
  },
  cardImage: {
    marginVertical: 4,
  },
  profileContent: {
    gap: 12,
  },
  profileHeader: {
    alignItems: 'center',
    gap: 8,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  settingsContent: {
    gap: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});
