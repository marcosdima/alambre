import React, { useEffect } from 'react';
import { StyleSheet, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
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
  // 0 = faceUp (front), 1 = faceDown (back)
  const flipProgress = useSharedValue(faceUp ? 0 : 1);

  useEffect(() => {
    flipProgress.value = withSpring(faceUp ? 0 : 1, {
      damping: springDamping,
      stiffness: springStiffness,
      mass: 0.8,
    });
  }, [faceUp, flipProgress, springDamping, springStiffness]);

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 1], [0, 180], Extrapolation.CLAMP);
    const opacity = flipProgress.value > 0.5 ? 0 : 1;
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      opacity,
      zIndex: flipProgress.value < 0.5 ? 2 : 1,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 1], [180, 360], Extrapolation.CLAMP);
    const opacity = flipProgress.value <= 0.5 ? 0 : 1;
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      opacity,
      zIndex: flipProgress.value >= 0.5 ? 2 : 1,
    };
  });

  const containerAnimatedStyle = useAnimatedStyle(() => {
    // Parabolic lift during the flip: peaks at midpoint (progress 0.5)
    const liftY = interpolate(
      flipProgress.value,
      [0, 0.5, 1],
      [0, -22, 0],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      flipProgress.value,
      [0, 0.5, 1],
      [1, 1.08, 1],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ translateY: liftY }, { scale }],
    };
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
