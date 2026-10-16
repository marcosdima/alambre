import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
  runOnJS,
  Extrapolation,
} from 'react-native-reanimated';
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
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(
      1,
      {
        duration: Math.max(260, durationMs),
        easing: Easing.bezier(0.22, 1, 0.36, 1), // Snappy launch with smooth decelerating landing
      },
      (finished) => {
        'worklet';
        if (finished) {
          runOnJS(onComplete)();
        }
      },
    );
  }, [durationMs, onComplete, progress, from.x, from.y, to.x, to.y]);

  const containerAnimatedStyle = useAnimatedStyle(() => {
    const curX = interpolate(progress.value, [0, 1], [from.x, to.x]);
    // Parabolic mid-flight arc: lifts upward in Y
    const arcLift = -Math.sin(progress.value * Math.PI) * 55;
    const curY = interpolate(progress.value, [0, 1], [from.y, to.y]) + arcLift;

    const curRot = interpolate(progress.value, [0, 1], [fromRotation, targetRotation]);
    const scale = interpolate(
      progress.value,
      [0, 0.5, 1],
      [0.9, 1.15, 1],
      Extrapolation.CLAMP,
    );

    return {
      transform: [
        { perspective: 1000 },
        { translateX: curX },
        { translateY: curY },
        { rotate: `${curRot}deg` },
        { scale },
      ],
      zIndex: 9999,
    };
  });

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = flipOnFly
      ? interpolate(progress.value, [0, 1], [180, 0], Extrapolation.CLAMP)
      : 0;
    const opacity = flipOnFly && progress.value < 0.5 ? 0 : 1;
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      opacity,
      zIndex: progress.value >= 0.5 ? 2 : 1,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    if (!flipOnFly) return { opacity: 0 };
    const rotateY = interpolate(progress.value, [0, 1], [360, 180], Extrapolation.CLAMP);
    const opacity = progress.value >= 0.5 ? 0 : 1;
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      opacity,
      zIndex: progress.value < 0.5 ? 2 : 1,
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.flyingWrapper, containerAnimatedStyle]}
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
