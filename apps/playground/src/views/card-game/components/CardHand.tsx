import React, { memo, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  runOnJS,
  useReducedMotion,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useKineticSwipe } from 'alambre';
import { PlayingCard } from './PlayingCard';
import type { HandFanSlot, PlayingCardData } from '../types';
import { calculateResponsiveHandFan } from '../engine/hand-fan';

export interface CardHandProps {
  cards: PlayingCardData[];
  selectedCardId?: string | null;
  onSelectCard?: (card: PlayingCardData) => void;
  onPlayCard?: (card: PlayingCardData) => void;
  enableSwipeToPlay?: boolean;
  spreadAngle?: number; // degrees per card
  arcCurvature?: number; // vertical curve intensity
  cardSpacing?: number; // px horizontal distance between centers
  maxSpan?: number; // maximum span before auto-compression kicks in
  size?: 'sm' | 'md' | 'lg';
  springDamping?: number;
  springStiffness?: number;
  onHandLayout?: (layout: { x: number; y: number; width: number; height: number }) => void;
}

export const CardHand = memo(function CardHand({
  cards,
  selectedCardId = null,
  onSelectCard,
  onPlayCard,
  enableSwipeToPlay = false,
  spreadAngle = 5,
  arcCurvature = 3.5,
  cardSpacing = 38,
  maxSpan = 280,
  size = 'md',
  springDamping = 16,
  springStiffness = 140,
  onHandLayout,
}: CardHandProps) {
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);

  const fanResult = useMemo(() => {
    return calculateResponsiveHandFan(cards, {
      containerWidth,
      maxSpan,
      baseSpacing: cardSpacing,
      spreadAngle,
      arcCurvature,
      selectedCardId,
    });
  }, [cards, containerWidth, maxSpan, cardSpacing, spreadAngle, arcCurvature, selectedCardId]);

  return (
    <View
      onLayout={(e) => {
        const layout = e.nativeEvent.layout;
        setContainerWidth(layout.width);
        onHandLayout?.(layout);
      }}
      style={styles.handContainer}
    >
      {fanResult.slots.map((slot) => (
        <HandCardItem
          key={slot.card.id}
          slot={slot}
          isSelected={selectedCardId === slot.card.id}
          size={size}
          springDamping={springDamping}
          springStiffness={springStiffness}
          onPress={() => onSelectCard?.(slot.card)}
          onPlayCard={onPlayCard}
          enableSwipeToPlay={enableSwipeToPlay}
        />
      ))}
    </View>
  );
});

interface HandCardItemProps {
  slot: HandFanSlot;
  isSelected: boolean;
  size: 'sm' | 'md' | 'lg';
  springDamping: number;
  springStiffness: number;
  onPress: () => void;
  onPlayCard?: (card: PlayingCardData) => void;
  enableSwipeToPlay?: boolean;
}

function HandCardItem({
  slot,
  isSelected,
  size,
  springDamping,
  springStiffness,
  onPress,
  onPlayCard,
  enableSwipeToPlay = false,
}: HandCardItemProps) {
  const { card } = slot;

  // If card is currently arriving via flight, keep invisible so siblings open slot smoothly
  const initialOp = card.isArriving ? 0 : 0.4;
  const transX = useSharedValue(slot.translateX);
  const transY = useSharedValue(slot.translateY + (card.isArriving ? 0 : 24));
  const rot = useSharedValue(slot.rotateDeg);
  const sc = useSharedValue(card.isArriving ? 1 : 0.85);
  const op = useSharedValue(initialOp);

  const systemReducedMotion = useReducedMotion();

  React.useEffect(() => {
    if (systemReducedMotion) {
      transX.value = slot.translateX;
      transY.value = slot.translateY;
      rot.value = slot.rotateDeg;
      sc.value = slot.scale;
      op.value = card.isArriving ? 0 : 1;
      return;
    }
    transX.value = withSpring(slot.translateX, { damping: springDamping, stiffness: springStiffness });
    transY.value = withSpring(slot.translateY, { damping: springDamping, stiffness: springStiffness });
    rot.value = withSpring(slot.rotateDeg, { damping: springDamping, stiffness: springStiffness });
    sc.value = withSpring(slot.scale, { damping: Math.max(10, springDamping - 2), stiffness: springStiffness + 10 });
    op.value = card.isArriving ? 0 : 1;
  }, [
    slot.translateX,
    slot.translateY,
    slot.rotateDeg,
    slot.scale,
    card.isArriving,
    systemReducedMotion,
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

  const swipe = useKineticSwipe({
    directions: ['up'],
    threshold: 55,
    escapeVelocity: 450,
    activeOffsetY: [-12, 12],
    disabled: card.isArriving || !enableSwipeToPlay || !onPlayCard,
    onDismissStart: () => {
      onPlayCard?.(card);
    },
  });

  const tapGesture = useMemo(() => {
    return Gesture.Tap()
      .maxDuration(250)
      .enabled(!card.isArriving)
      .onEnd(() => {
        'worklet';
        runOnJS(onPress)();
      });
  }, [card.isArriving, onPress]);

  const gesture = useMemo(() => {
    if (!enableSwipeToPlay || !onPlayCard) {
      return tapGesture;
    }
    return Gesture.Exclusive(swipe.gesture, tapGesture);
  }, [enableSwipeToPlay, onPlayCard, swipe.gesture, tapGesture]);

  if (enableSwipeToPlay && onPlayCard) {
    return (
      <Animated.View
        style={[
          styles.cardWrapper,
          { zIndex: slot.zIndex },
          animatedStyle,
        ]}
      >
        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[swipe.animatedStyle]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`${card.rank} of ${card.suit}`}
            accessibilityHint="Double tap to select, or swipe up to play to table"
            accessibilityState={{ selected: isSelected }}
          >
            <PlayingCard
              suit={card.suit}
              rank={card.rank}
              faceUp={card.faceUp ?? true}
              selected={isSelected}
              size={size}
              accessible={false}
            />
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        { zIndex: slot.zIndex },
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
          accessible={false}
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
