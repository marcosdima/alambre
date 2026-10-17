import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Animated, { runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useKineticPipeline, type KineticPipelineStage } from 'alambre';
import { useLightDark } from '../../../providers/theme';
import AppCard from '../../../components/AppCard';
import AppButton from '../../../components/AppButton';
import AppBadge from '../../../components/AppBadge';
import AppTitle, { AppText } from '../../../components/AppTitle';
import { PlayingCard } from './PlayingCard';
import type { CardPhysicsConfig } from '../CardGameTestbed';
import type { Suit, Rank } from '../types';
import type { BadgeTone } from '../../../components/AppBadge';

const DROP_TARGET = { x: 0, y: -70 };
const ORIGIN_TARGET = { x: 0, y: 70 };

export function KineticPipelineScenario({ physics }: { physics: CardPhysicsConfig }) {
  const { theme } = useLightDark();

  const [activeCard, setActiveCard] = useState<{ suit: Suit; rank: Rank }>({ suit: 'hearts', rank: 'A' });
  const [pipelineLog, setPipelineLog] = useState<string>('Pipeline idle. Drag card or launch flight.');

  const handleStageChange = useCallback((toStage: KineticPipelineStage, fromStage: KineticPipelineStage) => {
    setPipelineLog(`Stage handoff: ${fromStage} ➔ ${toStage}`);
  }, []);

  const handleFlightComplete = useCallback(() => {
    setPipelineLog('Flight & landing impact complete. Settled on surface.');
  }, []);

  const pipeline = useKineticPipeline<KineticPipelineStage>({
    initialStage: 'idle',
    flightDuration: physics.flightDuration,
    liftHeight: 50,
    peakScale: 1.15,
    onStageChange: handleStageChange,
    onComplete: handleFlightComplete,
  });

  const { updatePosition, transitionToFlight, transitionTo } = pipeline;

  const handleDragBegin = useCallback(() => {
    transitionTo('drag');
  }, [transitionTo]);

  const handleFlightEnd = useCallback(
    (e: { velocityX: number; velocityY: number; translationY: number }) => {
      const isFlickUp = e.velocityY < -300 || e.translationY < -40;
      const target = isFlickUp ? DROP_TARGET : ORIGIN_TARGET;
      const targetRot = isFlickUp ? (e.velocityX > 0 ? 8 : -8) : 0;

      transitionToFlight({
        to: target,
        targetRotation: targetRot,
        initialVelocity: { vx: e.velocityX, vy: e.velocityY },
        durationMs: physics.flightDuration,
      });
    },
    [physics.flightDuration, transitionToFlight],
  );

  // Pan gesture with live position updates and velocity handoff
  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .onBegin(() => {
        'worklet';
        runOnJS(handleDragBegin)();
      })
      .onUpdate((e) => {
        'worklet';
        updatePosition(
          e.translationX,
          ORIGIN_TARGET.y + e.translationY,
          e.translationX * 0.1,
          1.06,
        );
      })
      .onEnd((e) => {
        'worklet';
        runOnJS(handleFlightEnd)({
          velocityX: e.velocityX,
          velocityY: e.velocityY,
          translationY: e.translationY,
        });
      });
  }, [handleDragBegin, handleFlightEnd, updatePosition]);

  const handleLaunchFlight = () => {
    pipeline.transitionToFlight({
      to: DROP_TARGET,
      targetRotation: -6,
      durationMs: physics.flightDuration,
    });
  };

  const handleSequentialDealQueue = () => {
    const queueCards: { suit: Suit; rank: Rank; to: { x: number; y: number }; rot: number }[] = [
      { suit: 'spades', rank: 'K', to: { x: -80, y: -70 }, rot: -10 },
      { suit: 'diamonds', rank: 'Q', to: { x: 0, y: -70 }, rot: 0 },
      { suit: 'clubs', rank: 'J', to: { x: 80, y: -70 }, rot: 10 },
    ];

    setActiveCard({ suit: 'spades', rank: 'K' });

    pipeline.reset({ x: ORIGIN_TARGET.x, y: ORIGIN_TARGET.y, rotation: 0, scale: 1 });

    pipeline.enqueueBatch(
      queueCards.map((c, i) => ({
        id: `deal_${i}`,
        options: {
          to: c.to,
          targetRotation: c.rot,
          durationMs: Math.max(220, physics.flightDuration * 0.75),
          onLanding: () => {
            setActiveCard({ suit: c.suit, rank: c.rank });
          },
        },
      })),
    );
  };

  const handleReset = () => {
    pipeline.clearQueue();
    pipeline.reset({ x: ORIGIN_TARGET.x, y: ORIGIN_TARGET.y, rotation: 0, scale: 1 });
    setActiveCard({ suit: 'hearts', rank: 'A' });
    setPipelineLog('Pipeline reset to idle.');
  };

  const stageBadgeTone = (st: string): BadgeTone => {
    switch (st) {
      case 'idle':
        return 'neutral';
      case 'drag':
        return 'warning';
      case 'flight':
        return 'primary';
      case 'landing':
        return 'warning';
      case 'settled':
        return 'success';
      default:
        return 'neutral';
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <AppCard variant="outlined" style={styles.card}>
        <AppTitle level={3}>Kinetic Pipeline & Stage Coordinator</AppTitle>
        <AppText variant="muted">
          Unified state machine (<AppText style={styles.inlineCode}>Drag ➔ Flight ➔ Landing ➔ Settled</AppText>) with zero-flash continuous coordinates, release velocity preservation, and FIFO sequence queue.
        </AppText>

        {/* Live Status Bar */}
        <View style={[styles.statusBar, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <View style={styles.statusRow}>
            <AppText style={styles.statusLabel}>Stage:</AppText>
            <AppBadge
              label={pipeline.stage.toUpperCase()}
              tone={stageBadgeTone(pipeline.stage)}
              variant="solid"
              size="sm"
            />
            {pipeline.queueLength > 0 && (
              <AppBadge
                label={`Queue: ${pipeline.queueLength}`}
                tone="primary"
                variant="soft"
                size="sm"
              />
            )}
          </View>
          <AppText style={[styles.statusLog, { color: theme.muted }]}>
            {pipelineLog}
          </AppText>
        </View>

        {/* Kinetic Canvas */}
        <View style={[styles.canvas, { backgroundColor: '#1A3323', borderColor: theme.border }]}>
          {/* Target Drop Zone */}
          <View style={[styles.zone, styles.dropZone, { borderColor: 'rgba(255,255,255,0.35)' }]}>
            <AppText style={styles.zoneText}>DROP / FELT ZONE</AppText>
          </View>

          {/* Starting Origin Zone */}
          <View style={[styles.zone, styles.originZone, { borderColor: 'rgba(255,255,255,0.2)' }]}>
            <AppText style={styles.zoneSubText}>DECK / DRAG ORIGIN</AppText>
          </View>

          {/* Kinetic Pipeline Animated Card */}
          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[styles.cardContainer, pipeline.animatedStyle]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`${activeCard.rank} of ${activeCard.suit}, kinetic pipeline stage ${pipeline.stage}`}
              accessibilityHint="Drag card or flick upward into drop zone"
            >
              <PlayingCard
                suit={activeCard.suit}
                rank={activeCard.rank}
                faceUp={true}
                size="md"
                accessible={false}
              />
            </Animated.View>
          </GestureDetector>
        </View>

        {/* Controls */}
        <View style={styles.controlsRow}>
          <AppButton
            variant="solid"
            tone="primary"
            size="sm"
            label="Launch Flight ➔"
            onPress={handleLaunchFlight}
            disabled={pipeline.isTransitioning}
          />
          <AppButton
            variant="solid"
            tone="neutral"
            size="sm"
            label="Batch Deal (3 Cards)"
            onPress={handleSequentialDealQueue}
            disabled={pipeline.isTransitioning}
          />
          <AppButton
            variant="outline"
            tone="neutral"
            size="sm"
            label="Reset"
            onPress={handleReset}
          />
        </View>
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    gap: 12,
  },
  inlineCode: {
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  statusBar: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    fontWeight: '600',
    fontSize: 13,
  },
  statusLog: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  canvas: {
    height: 290,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  zone: {
    position: 'absolute',
    width: 90,
    height: 126,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  dropZone: {
    top: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  originZone: {
    bottom: 20,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  zoneText: {
    fontSize: 10,
    color: '#E0E8E2',
    fontWeight: '700',
    textAlign: 'center',
  },
  zoneSubText: {
    fontSize: 9,
    color: '#B0C2B5',
    textAlign: 'center',
  },
  cardContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },
  controlsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
});
