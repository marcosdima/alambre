import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useDeckSwipe3D } from 'alambre';
import {
  AppTitle,
  AppText,
  AppCard,
  AppButton,
  AppBadge,
  AppSlider,
} from 'alambre/ui';
import { useLightDark } from '../../providers/theme';
import { TestStage } from '../../components/test-utils';

interface StoryCard {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  badgeTone: 'primary' | 'success' | 'warning' | 'danger';
  quote: string;
  accentColor: string;
}

const INITIAL_STORIES: StoryCard[] = [
  {
    id: 'story_1',
    title: 'Quantum Entanglement',
    subtitle: 'Kinetics & Non-locality',
    category: 'PHYSICS',
    badgeTone: 'primary',
    quote: 'Spooky action at a distance made tactile with 60 FPS spring worklets.',
    accentColor: '#3b82f6',
  },
  {
    id: 'story_2',
    title: 'Superconducting Maglev',
    subtitle: 'Zero Resistance Friction',
    category: 'PROPULSION',
    badgeTone: 'success',
    quote: 'Hovering above electromagnetic guide-ways with critical damping.',
    accentColor: '#10b981',
  },
  {
    id: 'story_3',
    title: 'Gravitational Wavefront',
    subtitle: 'Spacetime Curvature Ripple',
    category: 'ASTRO',
    badgeTone: 'warning',
    quote: 'Staggered wave cascades propagating through multidimensional coordinates.',
    accentColor: '#f59e0b',
  },
  {
    id: 'story_4',
    title: 'Hyper-Dimensional Tesseract',
    subtitle: '4D Spatial Projection',
    category: 'GEOMETRY',
    badgeTone: 'danger',
    quote: 'Morphing cross-container layout bounds without Android HWUI clipping.',
    accentColor: '#ec4899',
  },
  {
    id: 'story_5',
    title: 'Cybernetic Neural Link',
    subtitle: 'Direct Bio-Feedback',
    category: 'NEURO',
    badgeTone: 'primary',
    quote: 'Sensory inflection cues fired precisely at 90° rotational midpoints.',
    accentColor: '#8b5cf6',
  },
];

const CARD_WIDTH = 270;
const CARD_HEIGHT = 180;
const ARENA_FIXED_HEIGHT = 330;

export default function DeckSwipeSimulation() {
  const { theme } = useLightDark();

  const [threshold, setThreshold] = useState(110);
  const [maxTilt, setMaxTilt] = useState(22);
  const [stiffness, setStiffness] = useState(260);
  const [damping, setDamping] = useState(34);

  // Turnkey 3D Kinetic Deck from alambre
  const deck = useDeckSwipe3D<StoryCard>({
    initialCards: INITIAL_STORIES,
    threshold,
    maxTilt,
    stiffness,
    damping,
  });

  const {
    cards,
    history,
    topCard,
    secondCard,
    thirdCard,
    isDismissing,
    panGesture,
    topCardStyle,
    secondCardStyle,
    thirdCardStyle,
    sheenStyle,
    rightBadgeStyle,
    leftBadgeStyle,
    upBadgeStyle,
    telemetry,
    triggerDismiss,
    undo,
    reset,
  } = deck;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={[styles.headerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.headerRow}>
          <AppTitle level={2}>3D Kinetic Deck Swiping</AppTitle>
          <AppBadge tone="primary" variant="soft" size="md">
            ALAMBRE DECK 3D
          </AppBadge>
        </View>
        <AppText variant="muted">
          Stacked 3D card deck powered by alambre/useDeckSwipe3D. Authentic perspective projection,
          multi-axis tilt, specular sheen, dynamic stack elevation, and non-blocking dismissals.
        </AppText>
      </View>

      <TestStage
        title="Interactive 3D Swiping Stage"
        badge={{
          label: `${cards.length} Cards Left`,
          tone: cards.length > 0 ? 'primary' : 'neutral',
        }}
        arenaHeight={ARENA_FIXED_HEIGHT}
        onReset={reset}
        resetLabel="Reset Deck"
      >
        <View style={styles.deckArena}>
          {/* Third Card Underneath (Dynamic Depth Elevation) */}
          {thirdCard && (
            <Animated.View
              style={[
                styles.storyCard,
                thirdCardStyle,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <AppBadge tone="neutral" size="sm">
                  {thirdCard.category}
                </AppBadge>
                <AppText variant="muted" style={{ fontSize: 10 }}>
                  QUEUE
                </AppText>
              </View>
              <AppTitle level={3} style={{ fontSize: 15, opacity: 0.6 }}>
                {thirdCard.title}
              </AppTitle>
            </Animated.View>
          )}

          {/* Second Card Underneath (Continuous Spring Elevation) */}
          {secondCard && (
            <Animated.View
              style={[
                styles.storyCard,
                secondCardStyle,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <AppBadge tone={secondCard.badgeTone} size="sm">
                  {secondCard.category}
                </AppBadge>
                <AppText style={{ fontSize: 11, fontWeight: '700', color: secondCard.accentColor }}>
                  NEXT
                </AppText>
              </View>
              <AppTitle level={3} style={{ fontSize: 16 }}>
                {secondCard.title}
              </AppTitle>
              <AppText variant="muted" style={{ fontSize: 12 }}>
                {secondCard.quote}
              </AppText>
            </Animated.View>
          )}

          {/* Active Top Card with 3D Tilt Gesture & Dynamic Overlays */}
          {topCard ? (
            <GestureDetector gesture={panGesture}>
              <Animated.View
                style={[
                  styles.storyCard,
                  topCardStyle,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                {/* Specular 3D Sheen Highlight */}
                <Animated.View style={[styles.sheenOverlay, sheenStyle]} pointerEvents="none" />

                {/* Keep (Right) Dynamic Badge */}
                <Animated.View style={[styles.badgeOverlay, styles.rightBadge, rightBadgeStyle]}>
                  <AppText style={styles.badgeTextGreen}>KEEP ✓</AppText>
                </Animated.View>

                {/* Pass (Left) Dynamic Badge */}
                <Animated.View style={[styles.badgeOverlay, styles.leftBadge, leftBadgeStyle]}>
                  <AppText style={styles.badgeTextRed}>PASS ✕</AppText>
                </Animated.View>

                {/* Boost (Up) Dynamic Badge */}
                <Animated.View style={[styles.badgeOverlay, styles.upBadge, upBadgeStyle]}>
                  <AppText style={styles.badgeTextBlue}>BOOST ★</AppText>
                </Animated.View>

                <View style={styles.cardHeader}>
                  <AppBadge tone={topCard.badgeTone} size="sm">
                    {topCard.category}
                  </AppBadge>
                  <AppText style={{ fontSize: 11, fontWeight: '700', color: topCard.accentColor }}>
                    ACTIVE
                  </AppText>
                </View>

                <AppTitle level={3} style={{ fontSize: 17 }}>
                  {topCard.title}
                </AppTitle>
                <AppText variant="subtitle" style={{ fontSize: 12, color: theme.muted }}>
                  {topCard.subtitle}
                </AppText>

                <View style={styles.quoteBox}>
                  <AppText variant="body" style={{ fontSize: 12, fontStyle: 'italic' }}>
                    "{topCard.quote}"
                  </AppText>
                </View>
              </Animated.View>
            </GestureDetector>
          ) : (
            <View style={styles.emptyContainer}>
              <AppText style={{ fontSize: 32 }}>🎉</AppText>
              <AppText variant="subtitle">Deck Fully Completed!</AppText>
              <AppButton variant="solid" tone="primary" size="sm" onPress={reset}>
                Reset Deck
              </AppButton>
            </View>
          )}
        </View>
      </TestStage>

      {/* Programmatic Swipe Triggers */}
      <View style={styles.actionGrid}>
        <AppButton
          variant="soft"
          tone="danger"
          onPress={() => triggerDismiss('left')}
          disabled={!topCard || isDismissing}
        >
          Pass (Left)
        </AppButton>

        <AppButton
          variant="soft"
          tone="primary"
          onPress={() => triggerDismiss('up')}
          disabled={!topCard || isDismissing}
        >
          Boost (Up)
        </AppButton>

        <AppButton
          variant="soft"
          tone="success"
          onPress={() => triggerDismiss('right')}
          disabled={!topCard || isDismissing}
        >
          Keep (Right)
        </AppButton>

        <AppButton
          variant="outline"
          tone="neutral"
          onPress={undo}
          disabled={history.length === 0 || isDismissing}
        >
          Undo ({history.length})
        </AppButton>
      </View>

      {/* Live Telemetry Display */}
      <AppCard variant="outlined" style={[styles.telemetryCard, { borderColor: theme.border }]}>
        <AppTitle level={3}>Spatial 3D Telemetry</AppTitle>
        <View style={styles.telemetryGrid}>
          <View style={styles.telemetryItem}>
            <AppText variant="muted" style={styles.telemetryLabel}>
              Status
            </AppText>
            <AppText style={styles.telemetryVal}>{telemetry.lastAction}</AppText>
          </View>
          <View style={styles.telemetryItem}>
            <AppText variant="muted" style={styles.telemetryLabel}>
              Trajectory Direction
            </AppText>
            <AppText style={styles.telemetryVal}>{telemetry.direction}</AppText>
          </View>
          <View style={styles.telemetryItem}>
            <AppText variant="muted" style={styles.telemetryLabel}>
              Displacement (ΔX, ΔY)
            </AppText>
            <AppText style={styles.telemetryVal}>
              {telemetry.swipeDx}px, {telemetry.swipeDy}px
            </AppText>
          </View>
        </View>
      </AppCard>

      {/* Physics & 3D Calibration Tuning */}
      <AppCard variant="outlined" style={[styles.controlCard, { borderColor: theme.border }]}>
        <AppTitle level={3}>3D Physics Calibration</AppTitle>
        <AppSlider
          label="Flick Threshold"
          value={threshold}
          min={60}
          max={180}
          step={5}
          unit="px"
          onChange={setThreshold}
        />
        <AppSlider
          label="Max 3D Tilt Angle"
          value={maxTilt}
          min={10}
          max={40}
          step={2}
          unit="°"
          onChange={setMaxTilt}
        />
        <AppSlider
          label="Snap Stiffness"
          value={stiffness}
          min={140}
          max={340}
          step={10}
          onChange={setStiffness}
        />
        <AppSlider
          label="Snap Damping"
          value={damping}
          min={16}
          max={36}
          step={1}
          onChange={setDamping}
        />
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 48,
  },
  headerCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  deckArena: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  storyCard: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteBox: {
    borderLeftWidth: 2,
    borderLeftColor: '#3b82f6',
    paddingLeft: 8,
  },
  sheenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    zIndex: 15,
  },
  badgeOverlay: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    zIndex: 20,
  },
  rightBadge: {
    top: 14,
    left: 14,
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    transform: [{ rotate: '-12deg' }],
  },
  leftBadge: {
    top: 14,
    right: 14,
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    transform: [{ rotate: '12deg' }],
  },
  upBadge: {
    bottom: 14,
    alignSelf: 'center',
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  badgeTextGreen: {
    color: '#10b981',
    fontWeight: '900',
    fontSize: 14,
  },
  badgeTextRed: {
    color: '#ef4444',
    fontWeight: '900',
    fontSize: 14,
  },
  badgeTextBlue: {
    color: '#3b82f6',
    fontWeight: '900',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  telemetryCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  telemetryItem: {
    flex: 1,
    minWidth: 100,
    gap: 2,
  },
  telemetryLabel: {
    fontSize: 11,
  },
  telemetryVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  controlCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
});
