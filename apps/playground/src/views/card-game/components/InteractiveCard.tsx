import React, { memo } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import { PlayingCard } from './PlayingCard';
import type { CardSize, DropZoneBounds, PlayingCardData, Point2D } from '../types';
import { useCardToss } from '../hooks/use-card-toss';

export interface InteractiveCardProps {
  card: PlayingCardData;
  homeSlot: Point2D;
  homeRotation?: number;
  dropZones: readonly DropZoneBounds[];
  size?: CardSize;
  disabled?: boolean;
  onDropSuccess?: (
    card: PlayingCardData,
    targetZone: DropZoneBounds,
    targetRotation: number,
  ) => void;
  onRestitution?: (card: PlayingCardData) => void;
  style?: StyleProp<ViewStyle>;
}

export const InteractiveCard = memo(function InteractiveCard({
  card,
  homeSlot,
  homeRotation = 0,
  dropZones,
  size = 'md',
  disabled = false,
  onDropSuccess,
  onRestitution,
  style,
}: InteractiveCardProps) {
  const { gesture, animatedStyle, isDragging } = useCardToss({
    card,
    homeSlot,
    homeRotation,
    dropZones,
    disabled,
    onDropSuccess,
    onRestitution,
  });

  const frontLayerStyle = useAnimatedStyle(() => {
    return {
      backfaceVisibility: 'hidden',
      transform: [{ rotateY: '0deg' }],
    };
  });

  const backLayerStyle = useAnimatedStyle(() => {
    return {
      backfaceVisibility: 'hidden',
      transform: [{ rotateY: '180deg' }],
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.cardContainer,
          animatedStyle,
          isDragging && styles.draggingElevation,
          style,
        ]}
      >
        {/* Front Face */}
        <Animated.View style={[styles.cardLayer, frontLayerStyle]}>
          <PlayingCard
            suit={card.suit}
            rank={card.rank}
            faceUp={true}
            size={size}
            accessible={true}
          />
        </Animated.View>

        {/* Back Face for 3D flip */}
        <Animated.View style={[styles.cardLayer, backLayerStyle]}>
          <PlayingCard
            suit={card.suit}
            rank={card.rank}
            faceUp={false}
            size={size}
            accessible={false}
          />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  draggingElevation: {
    zIndex: 9999,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 25,
  },
  cardLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
