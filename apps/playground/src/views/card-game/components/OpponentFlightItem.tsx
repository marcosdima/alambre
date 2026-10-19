import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useKineticChoreography } from 'alambre';
import { PlayingCard } from './PlayingCard';
import type { CardSize, PlayingCardData, Point2D } from '../types';

export interface OpponentFlightItemProps {
  card: PlayingCardData;
  from: Point2D;
  to: Point2D;
  targetRotation: number;
  durationMs?: number;
  liftHeight?: number;
  peakScale?: number;
  onComplete: () => void;
  size?: CardSize;
}

export function OpponentFlightItem({
  card,
  from,
  to,
  targetRotation,
  durationMs = 380,
  liftHeight = 50,
  peakScale = 1.12,
  onComplete,
  size = 'md',
}: OpponentFlightItemProps) {
  const choreo = useKineticChoreography({
    initial: {
      x: from.x,
      y: from.y,
      rotateDeg: 0,
      rotateYDeg: 0,
      scale: 0.88,
      opacity: 1,
    },
    perspective: 1000,
  });

  useEffect(() => {
    choreo.transitionTo({
      to: {
        x: to.x,
        y: to.y,
        rotateDeg: targetRotation,
        rotateYDeg: 0,
        scale: 1.0,
      },
      driver: 'timing',
      duration: durationMs,
      trajectory: {
        type: 'parabolic',
        liftHeight,
        peakScale,
      },
      onStepComplete: onComplete,
    });

    return () => {
      choreo.cancel();
    };
  }, [choreo, to.x, to.y, targetRotation, durationMs, liftHeight, peakScale, onComplete]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.flightWrapper, choreo.animatedStyle]}
    >
      <PlayingCard
        suit={card.suit}
        rank={card.rank}
        faceUp={true}
        size={size}
        accessible={false}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flightWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 25,
  },
});
