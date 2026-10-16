import React from 'react';
import { StyleSheet, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSpatialFlip } from 'alambre';
import { PlayingCard, type PlayingCardProps } from './PlayingCard';

const CARD_SIZES = {
  sm: { width: 54, height: 78 },
  md: { width: 76, height: 110 },
  lg: { width: 98, height: 142 },
};

export interface FlipCardProps extends Omit<PlayingCardProps, 'style'> {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  interactive?: boolean;
  springDamping?: number;
  springStiffness?: number;
}

export function FlipCard({
  suit,
  rank,
  faceUp = true,
  selected = false,
  size = 'md',
  onPress,
  style,
  interactive = true,
  springDamping = 14,
  springStiffness = 110,
}: FlipCardProps) {
  const cardDim = CARD_SIZES[size];

  const { frontAnimatedStyle, backAnimatedStyle, containerAnimatedStyle } = useSpatialFlip({
    flipped: !faceUp,
    liftHeight: 22,
    peakScale: 1.08,
    springConfig: {
      damping: springDamping,
      stiffness: springStiffness,
      mass: 0.8,
    },
  });

  return (
    <Pressable
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${rank} of ${suit}, ${faceUp ? 'face up' : 'face down'}`}
      accessibilityHint={interactive ? 'Double tap to flip card' : undefined}
      accessibilityState={{ expanded: faceUp }}
      onPress={interactive ? onPress : undefined}
      disabled={!interactive || !onPress}
      style={[
        styles.container,
        { width: cardDim.width, height: cardDim.height },
        style,
      ]}
    >
      <Animated.View style={[{ width: cardDim.width, height: cardDim.height }, containerAnimatedStyle]}>
        {/* Front Face */}
        <Animated.View style={[styles.cardLayer, frontAnimatedStyle]}>
          <PlayingCard
            suit={suit}
            rank={rank}
            faceUp={true}
            selected={selected}
            size={size}
          />
        </Animated.View>

        {/* Back Face */}
        <Animated.View style={[styles.cardLayer, backAnimatedStyle]}>
          <PlayingCard
            suit={suit}
            rank={rank}
            faceUp={false}
            selected={selected}
            size={size}
          />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    backfaceVisibility: 'hidden',
  },
});
