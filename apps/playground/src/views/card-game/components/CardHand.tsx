import React, { memo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { calculateHandFan } from 'alambre';
import { PlayingCard } from './PlayingCard';
import type { PlayingCardData } from '../types';

export interface CardHandProps {
  cards: PlayingCardData[];
  selectedCardId?: string | null;
  onSelectCard?: (card: PlayingCardData) => void;
  spreadAngle?: number; // degrees per card
  arcCurvature?: number; // vertical curve intensity
  cardSpacing?: number; // px horizontal distance between centers
  size?: 'sm' | 'md' | 'lg';
  springDamping?: number;
  springStiffness?: number;
  onHandLayout?: (layout: { x: number; y: number; width: number; height: number }) => void;
}

export const CardHand = memo(function CardHand({
  cards,
  selectedCardId = null,
  onSelectCard,
  spreadAngle = 6,
  arcCurvature = 4,
  cardSpacing = 38,
  size = 'md',
  springDamping = 16,
  springStiffness = 140,
  onHandLayout,
}: CardHandProps) {
  const total = cards.length;

  return (
    <View
      onLayout={(e) => onHandLayout?.(e.nativeEvent.layout)}
      style={styles.handContainer}
    >
      {cards.map((card, index) => (
        <HandCardItem
          key={card.id}
          card={card}
          index={index}
          total={total}
          isSelected={selectedCardId === card.id}
          spreadAngle={spreadAngle}
          arcCurvature={arcCurvature}
          cardSpacing={cardSpacing}
          size={size}
          springDamping={springDamping}
          springStiffness={springStiffness}
          onPress={() => onSelectCard?.(card)}
        />
      ))}
    </View>
  );
});

interface HandCardItemProps {
  card: PlayingCardData;
  index: number;
  total: number;
  isSelected: boolean;
  spreadAngle: number;
  arcCurvature: number;
  cardSpacing: number;
  size: 'sm' | 'md' | 'lg';
  springDamping: number;
  springStiffness: number;
  onPress: () => void;
}

function HandCardItem({
  card,
  index,
  total,
  isSelected,
  spreadAngle,
  arcCurvature,
  cardSpacing,
  size,
  springDamping,
  springStiffness,
  onPress,
}: HandCardItemProps) {
  const fanTransform = calculateHandFan(index, total, {
    spreadAngle,
    arcCurvature,
    itemSpacing: cardSpacing,
    isSelected,
  });

  // If card is currently arriving via flight, keep invisible so siblings open slot smoothly
  const initialOp = card.isArriving ? 0 : 0.4;
  const transX = useSharedValue(fanTransform.translateX);
  const transY = useSharedValue(fanTransform.translateY + (card.isArriving ? 0 : 24));
  const rot = useSharedValue(fanTransform.rotateDeg);
  const sc = useSharedValue(card.isArriving ? 1 : 0.85);
  const op = useSharedValue(initialOp);

  React.useEffect(() => {
    transX.value = withSpring(fanTransform.translateX, { damping: springDamping, stiffness: springStiffness });
    transY.value = withSpring(fanTransform.translateY, { damping: springDamping, stiffness: springStiffness });
    rot.value = withSpring(fanTransform.rotateDeg, { damping: springDamping, stiffness: springStiffness });
    sc.value = withSpring(fanTransform.scale, { damping: Math.max(10, springDamping - 2), stiffness: springStiffness + 10 });
    op.value = card.isArriving ? 0 : 1;
  }, [
    fanTransform.translateX,
    fanTransform.translateY,
    fanTransform.rotateDeg,
    fanTransform.scale,
    card.isArriving,
    transX,
    transY,
    rot,
    sc,
    op,
    springDamping,
    springStiffness,
  ]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: op.value,
      transform: [
        { translateX: transX.value },
        { translateY: transY.value },
        { rotate: `${rot.value}deg` },
        { scale: sc.value },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        { zIndex: fanTransform.zIndex },
        animatedStyle,
      ]}
    >
      <Pressable
        disabled={card.isArriving}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${card.rank} of ${card.suit}`}
        accessibilityHint="Double tap to select or deselect card"
        accessibilityState={{ selected: isSelected }}
        onPress={onPress}
      >
        <PlayingCard
          suit={card.suit}
          rank={card.rank}
          faceUp={card.faceUp ?? true}
          selected={isSelected}
          size={size}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  handContainer: {
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '100%',
    position: 'relative',
    overflow: 'visible',
  },
  cardWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
