import React, { memo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
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

  // Auto-compress card spacing if hand grows large to prevent overflowing screen boundaries
  const maxHandSpan = 270;
  const effectiveSpacing = total > 1 ? Math.min(cardSpacing, maxHandSpan / (total - 1)) : cardSpacing;

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
          cardSpacing={effectiveSpacing}
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
  const normalized = total > 1 ? index - (total - 1) / 2 : 0;
  const targetRotation = normalized * spreadAngle;
  const targetX = normalized * cardSpacing;
  const targetY = Math.abs(normalized) * arcCurvature;

  // If card is currently arriving via flight, keep invisible so siblings open slot smoothly
  const initialOp = card.isArriving ? 0 : 0.4;
  const transX = useSharedValue(targetX);
  const transY = useSharedValue(targetY + (card.isArriving ? 0 : 24));
  const rot = useSharedValue(targetRotation);
  const sc = useSharedValue(card.isArriving ? 1 : 0.85);
  const op = useSharedValue(initialOp);

  React.useEffect(() => {
    const liftY = isSelected ? -36 : 0;
    const finalRot = isSelected ? targetRotation * 0.15 : targetRotation;
    const finalScale = isSelected ? 1.08 : 1.0;

    transX.value = withSpring(targetX, { damping: springDamping, stiffness: springStiffness });
    transY.value = withSpring(targetY + liftY, { damping: springDamping, stiffness: springStiffness });
    rot.value = withSpring(finalRot, { damping: springDamping, stiffness: springStiffness });
    sc.value = withSpring(finalScale, { damping: Math.max(10, springDamping - 2), stiffness: springStiffness + 10 });
    op.value = card.isArriving ? 0 : 1;
  }, [targetX, targetY, targetRotation, isSelected, card.isArriving, transX, transY, rot, sc, op, springDamping, springStiffness]);

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
        { zIndex: isSelected ? 99 : index + 1 },
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
