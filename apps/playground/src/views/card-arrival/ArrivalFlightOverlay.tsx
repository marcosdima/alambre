import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import type { HandArrivalFlight } from 'alambre';
import { PlayingCard } from '../card-game/components/PlayingCard';
import type { CardSize, PlayingCardData } from '../card-game/types';

export interface ArrivalFlightOverlayProps {
  activeArrival: HandArrivalFlight<PlayingCardData> | null;
  flightAnimatedStyle: StyleProp<ViewStyle>;
  size?: CardSize;
}

export function ArrivalFlightOverlay({
  activeArrival,
  flightAnimatedStyle,
  size = 'md',
}: ArrivalFlightOverlayProps) {
  if (!activeArrival) return null;

  const { item, flipOnFly } = activeArrival;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.flightWrapper,
        flightAnimatedStyle,
        { zIndex: 9999 },
      ]}
    >
      {/* Front Face */}
      <View
        style={[
          styles.cardFace,
          flipOnFly && styles.flipFaceFront,
        ]}
      >
        <PlayingCard
          suit={item.suit}
          rank={item.rank}
          faceUp={true}
          size={size}
          accessible={false}
        />
      </View>

      {/* Back Face (shown during mid-air 180 deg flip) */}
      {flipOnFly && (
        <View style={[styles.cardFace, styles.flipFaceBack]}>
          <PlayingCard
            suit={item.suit}
            rank={item.rank}
            faceUp={false}
            size={size}
            accessible={false}
          />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flightWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 30,
  },
  cardFace: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  flipFaceFront: {
    backfaceVisibility: 'hidden',
  },
  flipFaceBack: {
    backfaceVisibility: 'hidden',
    transform: [{ rotateY: '180deg' }],
  },
});
