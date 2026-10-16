import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useLightDark } from '../../../providers/theme';
import AppBadge from '../../../components/AppBadge';
import { AppText } from '../../../components/AppTitle';
import { PlayingCard, CardBackPattern } from './PlayingCard';
import type { PlayingCardData } from '../types';

export interface CardTableProps {
  deckCount: number;
  playedCards: (PlayingCardData & { rotation?: number })[];
  onDrawCard: () => void;
  onTablePress?: () => void;
  activePrompt?: string;
  opponent?: {
    name: string;
    cardCount: number;
    isTurn?: boolean;
  };
  onMatLayout?: (layout: { x: number; y: number; width: number; height: number }) => void;
  onDeckLayout?: (layout: { x: number; y: number; width: number; height: number }) => void;
  onPlayZoneLayout?: (layout: { x: number; y: number; width: number; height: number }) => void;
  onOpponentLayout?: (layout: { x: number; y: number; width: number; height: number }) => void;
}

export function CardTable({
  deckCount,
  playedCards,
  onDrawCard,
  onTablePress,
  activePrompt = 'Tap deck to draw, or select a card to play',
  opponent,
  onMatLayout,
  onDeckLayout,
  onPlayZoneLayout,
  onOpponentLayout,
}: CardTableProps) {
  const { theme } = useLightDark();

  return (
    <View
      onLayout={(e) => onMatLayout?.(e.nativeEvent.layout)}
      style={[styles.tableMat, { borderColor: theme.border }]}
    >
      {/* Table Inner Border & Felt Pattern */}
      <View style={styles.feltBorder} />

      {/* Opponent Zone Header */}
      {opponent && (
        <View
          onLayout={(e) => onOpponentLayout?.(e.nativeEvent.layout)}
          style={styles.opponentRow}
        >
          <View style={styles.opponentInfo}>
            <AppBadge
              label={`${opponent.name} (${opponent.cardCount} cards)`}
              tone={opponent.isTurn ? 'warning' : 'neutral'}
              variant={opponent.isTurn ? 'solid' : 'soft'}
              size="sm"
            />
            {opponent.isTurn && (
              <AppBadge
                label="THINKING..."
                tone="warning"
                variant="solid"
                size="sm"
              />
            )}
          </View>
          <View style={styles.miniCardStack}>
            {Array.from({ length: Math.min(6, opponent.cardCount) }).map((_, i) => (
              <View key={i} style={[styles.miniCard, { marginLeft: i > 0 ? -12 : 0 }]}>
                <CardBackPattern width={24} height={34} radius={3} />
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Table Status / Prompt */}
      <View style={styles.promptBadgeWrapper}>
        <AppBadge
          label={activePrompt}
          tone="success"
          variant="solid"
          size="md"
        />
      </View>

      <View style={styles.zonesRow}>

        {/* Draw Deck Zone */}
        <Pressable
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Draw deck, ${deckCount} cards remaining`}
          accessibilityHint="Double tap to draw a card to your hand"
          onPress={onDrawCard}
          onLayout={(e) => onDeckLayout?.(e.nativeEvent.layout)}
          disabled={deckCount === 0}
          style={({ pressed }) => [
            styles.deckZone,
            pressed && styles.deckPressed,
            deckCount === 0 && styles.deckDisabled,
          ]}
        >
          {deckCount > 0 ? (
            <View style={styles.deckStack}>
              {/* Fake 3D Stack Depth Layers */}
              {deckCount > 2 && <View style={[styles.deckDepthLayer, styles.deckLayer2]} />}
              {deckCount > 1 && <View style={[styles.deckDepthLayer, styles.deckLayer1]} />}
              <View style={styles.deckTopCard}>
                <CardBackPattern width={64} height={92} radius={7} />
              </View>
              <View style={styles.counterBadgeWrapper}>
                <AppBadge
                  label={`${deckCount}`}
                  tone="primary"
                  variant="solid"
                  size="sm"
                />
              </View>
            </View>
          ) : (
            <View style={styles.emptySlot}>
              <AppText variant="muted" style={styles.emptyText}>Empty</AppText>
            </View>
          )}
          <AppText style={styles.zoneLabel}>DRAW DECK</AppText>
        </Pressable>

        {/* Center Play / Discard Zone */}
        <Pressable
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Table center pile, ${playedCards.length} cards played`}
          accessibilityHint="Double tap to play selected card to table"
          onPress={onTablePress}
          onLayout={(e) => onPlayZoneLayout?.(e.nativeEvent.layout)}
          style={styles.playZone}
        >
          <View style={styles.playZoneSlot}>
            {playedCards.length === 0 ? (
              <View style={styles.dropZonePlaceholder}>
                <AppText style={styles.dropZoneText}>PLAY ZONE</AppText>
                <AppText variant="muted" style={styles.dropZoneSubtext}>Drop / Play here</AppText>
              </View>
            ) : (
              <View style={styles.playedCardsStack}>
                {/* Render last 4 cards for tactile layered pile effect */}
                {playedCards.slice(-4).map((card) => {
                  const rot = card.rotation ?? 0;
                  return (
                    <Animated.View
                      key={card.id}
                      entering={FadeIn.duration(80)}
                      style={[
                        styles.playedCardWrapper,
                        { transform: [{ rotate: `${rot}deg` }] },
                      ]}
                    >
                      <PlayingCard
                        suit={card.suit}
                        rank={card.rank}
                        faceUp={true}
                        size="md"
                      />
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </View>
          <AppText style={styles.zoneLabel}>
            TABLE PILE {playedCards.length > 0 ? `(${playedCards.length})` : ''}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tableMat: {
    backgroundColor: '#1B382B', // Casino green felt
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: '#2D5A45',
    minHeight: 210,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  feltBorder: {
    ...StyleSheet.absoluteFill,
    margin: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    pointerEvents: 'none',
  },
  opponentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  opponentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniCardStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniCard: {
    borderRadius: 3,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  promptBadgeWrapper: {
    alignSelf: 'center',
    marginBottom: 12,
  },

  zonesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  deckZone: {
    alignItems: 'center',
    gap: 8,
  },
  deckPressed: {
    transform: [{ scale: 0.96 }],
  },
  deckDisabled: {
    opacity: 0.5,
  },
  deckStack: {
    width: 64,
    height: 92,
    position: 'relative',
  },
  deckTopCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 64,
    height: 92,
    borderRadius: 7,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#38BDF8',
    elevation: 4,
  },
  deckDepthLayer: {
    position: 'absolute',
    width: 64,
    height: 92,
    borderRadius: 7,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  deckLayer1: {
    top: 2,
    left: 2,
  },
  deckLayer2: {
    top: 4,
    left: 4,
  },
  counterBadgeWrapper: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    elevation: 6,
  },
  emptySlot: {
    width: 64,
    height: 92,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
  },
  playZone: {
    alignItems: 'center',
    gap: 8,
  },
  playZoneSlot: {
    width: 100,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dropZonePlaceholder: {
    width: 90,
    height: 116,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dropZoneText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dropZoneSubtext: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 9,
  },
  playedCardsStack: {
    position: 'relative',
    width: 76,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playedCardWrapper: {
    position: 'absolute',
  },
  zoneLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
});
