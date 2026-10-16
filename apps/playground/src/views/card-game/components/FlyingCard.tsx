import React from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFlightTrajectory } from 'alambre';
import { PlayingCard } from './PlayingCard';
import type { PlayingCardData } from '../types';

export interface FlyingCardProps {
  card: PlayingCardData;
  from: { x: number; y: number };
  to: { x: number; y: number };
  fromRotation?: number;
  targetRotation?: number;
  flipOnFly?: boolean;
  durationMs?: number;
  onComplete: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function FlyingCard({
  card,
  from,
  to,
  fromRotation = 0,
  targetRotation = 0,
  flipOnFly = false,
  durationMs = 400,
  onComplete,
  size = 'md',
}: FlyingCardProps) {
  const { animatedStyle, frontAnimatedStyle, backAnimatedStyle } = useFlightTrajectory({
    from,
    to,
    fromRotation,
    targetRotation,
    flipOnFly,
    durationMs: Math.max(260, durationMs),
    liftHeight: 55,
    peakScale: 1.15,
    startScale: 0.9,
    endScale: 1.0,
    onComplete,
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.flyingWrapper, animatedStyle]}
    >
      {/* Front Face */}
      <Animated.View style={[styles.cardLayer, frontAnimatedStyle]}>
        <PlayingCard
          suit={card.suit}
          rank={card.rank}
          faceUp={true}
          size={size}
        />
      </Animated.View>

      {/* Back Face (visible during first half of flight if flipOnFly) */}
      {flipOnFly && (
        <Animated.View style={[styles.cardLayer, backAnimatedStyle]}>
          <PlayingCard
            suit={card.suit}
            rank={card.rank}
            faceUp={false}
            size={size}
          />
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flyingWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    elevation: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
  },
  cardLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    backfaceVisibility: 'hidden',
  },
});
