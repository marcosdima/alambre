import React from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useCascadeFlightItem } from 'alambre';
import { PlayingCard } from './PlayingCard';
import type { CardSize } from '../types';
import type { DealFlightSpec } from '../engine/deal-cascade';

export interface CascadeFlightItemProps {
  spec: DealFlightSpec;
  onComplete: () => void;
  size?: CardSize;
}

export function CascadeFlightItem({
  spec,
  onComplete,
  size = 'md',
}: CascadeFlightItemProps) {
  const { animatedStyle, frontLayerStyle, backLayerStyle } = useCascadeFlightItem({
    spec,
    onComplete,
    perspective: 1000,
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.flightWrapper, animatedStyle, { zIndex: 1000 + spec.index }]}
    >
      {/* Front Face */}
      <Animated.View style={[styles.cardLayer, frontLayerStyle]}>
        <PlayingCard
          suit={spec.card.suit}
          rank={spec.card.rank}
          faceUp={true}
          size={size}
          accessible={false}
        />
      </Animated.View>

      {/* Back Face (visible during 180° inverted flip) */}
      {spec.flipOnFly && (
        <Animated.View style={[styles.cardLayer, backLayerStyle]}>
          <PlayingCard
            suit={spec.card.suit}
            rank={spec.card.rank}
            faceUp={false}
            size={size}
            accessible={false}
          />
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flightWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 20,
  },
  cardLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
