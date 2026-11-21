import React, { useRef, useEffect } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  useSharedValue,
  Easing,
} from 'react-native-reanimated';
import type { BaseCardItem, CardTableProps, RenderCardProps } from './types';

const DEFAULT_CARD_WIDTH = 58;
const DEFAULT_CARD_HEIGHT = 84;

interface PhysicalCardAnchorProps<T extends BaseCardItem> {
  card: T;
  targetX: number;
  targetY: number;
  targetRot: number;
  zIndex: number;
  isFlipped: boolean;
  isSelected: boolean;
  isFlying: boolean;
  flyDelayMs: number;
  flyDurationMs: number;
  cardWidth: number;
  cardHeight: number;
  zone: 'deck' | 'hand' | 'discard';
  onPress: () => void;
  renderCard: (props: RenderCardProps<T>) => React.ReactNode;
  springConfig?: { stiffness?: number; damping?: number };
}

function PhysicalCardAnchor<T extends BaseCardItem>({
  card,
  targetX,
  targetY,
  targetRot,
  zIndex,
  isFlipped,
  isSelected,
  isFlying,
  flyDelayMs,
  flyDurationMs,
  cardWidth,
  cardHeight,
  zone,
  onPress,
  renderCard,
  springConfig,
}: PhysicalCardAnchorProps<T>) {
  const posX = useSharedValue(targetX);
  const posY = useSharedValue(targetY);
  const rotZ = useSharedValue(targetRot);
  const rotY = useSharedValue(isFlipped ? 180 : 0);
  const lift = useSharedValue(0);
  const scale = useSharedValue(1);

  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      posX.value = targetX;
      posY.value = targetY;
      rotZ.value = targetRot;
      rotY.value = isFlipped ? 180 : 0;
      return;
    }

    if (isFlying) {
      lift.value = 0;
      if (flyDelayMs > 0) {
        lift.value = withDelay(
          flyDelayMs,
          withSequence(
            withTiming(45, { duration: flyDurationMs * 0.45, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: flyDurationMs * 0.55, easing: Easing.in(Easing.quad) }),
          ),
        );
        posX.value = withDelay(
          flyDelayMs,
          withTiming(targetX, { duration: flyDurationMs, easing: Easing.bezier(0.25, 1, 0.5, 1) }),
        );
        posY.value = withDelay(
          flyDelayMs,
          withTiming(targetY, { duration: flyDurationMs, easing: Easing.bezier(0.25, 1, 0.5, 1) }),
        );
        rotZ.value = withDelay(
          flyDelayMs,
          withTiming(targetRot, { duration: flyDurationMs, easing: Easing.out(Easing.quad) }),
        );
        rotY.value = withDelay(
          flyDelayMs,
          withTiming(isFlipped ? 180 : 0, { duration: flyDurationMs, easing: Easing.inOut(Easing.quad) }),
        );
      } else {
        lift.value = withSequence(
          withTiming(45, { duration: flyDurationMs * 0.45, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: flyDurationMs * 0.55, easing: Easing.in(Easing.quad) }),
        );
        posX.value = withTiming(targetX, { duration: flyDurationMs, easing: Easing.bezier(0.25, 1, 0.5, 1) });
        posY.value = withTiming(targetY, { duration: flyDurationMs, easing: Easing.bezier(0.25, 1, 0.5, 1) });
        rotZ.value = withTiming(targetRot, { duration: flyDurationMs, easing: Easing.out(Easing.quad) });
        rotY.value = withTiming(isFlipped ? 180 : 0, { duration: flyDurationMs, easing: Easing.inOut(Easing.quad) });
      }
    } else {
      lift.value = withTiming(0, { duration: 120 });
      const stiff = springConfig?.stiffness ?? 240;
      const damp = springConfig?.damping ?? 32;
      posX.value = withSpring(targetX, { stiffness: stiff, damping: damp });
      posY.value = withSpring(targetY, { stiffness: stiff, damping: damp });
      rotZ.value = withSpring(targetRot, { stiffness: stiff, damping: damp });
      rotY.value = withSpring(isFlipped ? 180 : 0, { stiffness: stiff, damping: damp });
    }
  }, [targetX, targetY, targetRot, isFlipped, isFlying, flyDelayMs, flyDurationMs, posX, posY, rotZ, rotY, lift, springConfig]);

  useEffect(() => {
    scale.value = withSpring(isSelected ? 1.08 : 1, { stiffness: 280, damping: 28 });
  }, [isSelected, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: -cardWidth / 2,
      top: -cardHeight / 2,
      transform: [
        { perspective: 1000 },
        { translateX: posX.value },
        { translateY: posY.value - lift.value + (isSelected ? -16 : 0) },
        { rotate: `${rotZ.value}deg` },
        { rotateY: `${rotY.value}deg` },
        { scale: scale.value },
      ],
      zIndex: isSelected ? 999 : isFlying ? 500 + zIndex : zIndex,
    };
  });

  // Double-sided 3D visibility WITHOUT Android HWUI backfaceVisibility culling bug
  const frontStyle = useAnimatedStyle(() => {
    const norm = Math.abs(rotY.value % 360);
    const isFront = norm <= 90 || norm >= 270;
    return {
      opacity: isFront ? 1 : 0,
      zIndex: isFront ? 2 : 1,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const norm = Math.abs(rotY.value % 360);
    const isBack = norm > 90 && norm < 270;
    return {
      opacity: isBack ? 1 : 0,
      zIndex: isBack ? 2 : 1,
      position: 'absolute',
      top: 0,
      left: 0,
      width: cardWidth,
      height: cardHeight,
      transform: [{ scaleX: -1 }],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <Pressable onPress={onPress} style={{ width: cardWidth, height: cardHeight }}>
        <Animated.View style={frontStyle}>
          {renderCard({ card, isFlipped: false, isSelected, isFlying, zone, onPress })}
        </Animated.View>
        <Animated.View style={backStyle}>
          {renderCard({ card, isFlipped: true, isSelected, isFlying, zone, onPress })}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export function CardTable<T extends BaseCardItem>({
  table,
  renderCard,
  renderDeckOverlay,
  renderDiscardOverlay,
  style,
  cardWidth = DEFAULT_CARD_WIDTH,
  cardHeight = DEFAULT_CARD_HEIGHT,
  springConfig,
}: CardTableProps<T>) {
  const {
    allCards,
    deckCards,
    handCards,
    discardCards,
    selectedId,
    flyingCardIds,
    cardDelays,
    flightDurationMs,
    deckPos,
    discardPos,
    handCenter,
    handSlots,
    arenaWidth,
    select,
    setArenaWidth,
  } = table;

  const onLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (Math.abs(width - arenaWidth) > 4) {
      setArenaWidth(width);
    }
  };

  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      {/* Optional Overlay anchors for deck and discard */}
      {renderDeckOverlay?.({ count: deckCards.length, position: deckPos })}
      {renderDiscardOverlay?.({ count: discardCards.length, position: discardPos })}

      {/* Persistent Single-Identity Physical Cards (Zero Unmounts) */}
      {allCards.map((card) => {
        // 1. Deck Zone
        const deckIndex = deckCards.findIndex((c) => c.id === card.id);
        if (deckIndex !== -1) {
          return (
            <PhysicalCardAnchor
              key={card.id}
              card={card}
              targetX={deckPos.x - deckIndex * 0.4}
              targetY={deckPos.y - deckIndex * 0.6}
              targetRot={0}
              zIndex={deckCards.length - deckIndex}
              isFlipped={true}
              isSelected={false}
              isFlying={false}
              flyDelayMs={0}
              flyDurationMs={flightDurationMs}
              cardWidth={cardWidth}
              cardHeight={cardHeight}
              zone="deck"
              onPress={() => select(card.id)}
              renderCard={renderCard}
              springConfig={springConfig}
            />
          );
        }

        // 2. Hand Zone
        const handIndex = handCards.findIndex((c) => c.id === card.id);
        if (handIndex !== -1) {
          const slot = handSlots[handIndex];
          const targetX = slot ? slot.centerCoord.x : handCenter.x;
          const targetY = slot ? slot.centerCoord.y : handCenter.y;
          const targetRot = slot ? slot.rotateDeg : 0;
          const zIndex = 100 + (slot ? slot.zIndex : handIndex);

          return (
            <PhysicalCardAnchor
              key={card.id}
              card={card}
              targetX={targetX}
              targetY={targetY}
              targetRot={targetRot}
              zIndex={zIndex}
              isFlipped={false}
              isSelected={selectedId === card.id}
              isFlying={flyingCardIds.has(card.id)}
              flyDelayMs={cardDelays[card.id] ?? 0}
              flyDurationMs={flightDurationMs}
              cardWidth={cardWidth}
              cardHeight={cardHeight}
              zone="hand"
              onPress={() => select(card.id)}
              renderCard={renderCard}
              springConfig={springConfig}
            />
          );
        }

        // 3. Discard Zone
        const discardIndex = discardCards.findIndex((c) => c.id === card.id);
        if (discardIndex !== -1) {
          const rotOffset = ((discardIndex * 13) % 21) - 10;
          return (
            <PhysicalCardAnchor
              key={card.id}
              card={card}
              targetX={discardPos.x + (discardIndex % 3 - 1) * 2}
              targetY={discardPos.y + (discardIndex % 2 - 0.5) * 2}
              targetRot={rotOffset}
              zIndex={50 + discardIndex}
              isFlipped={false}
              isSelected={false}
              isFlying={flyingCardIds.has(card.id)}
              flyDelayMs={cardDelays[card.id] ?? 0}
              flyDurationMs={flightDurationMs}
              cardWidth={cardWidth}
              cardHeight={cardHeight}
              zone="discard"
              onPress={() => select(card.id)}
              renderCard={renderCard}
              springConfig={springConfig}
            />
          );
        }

        return null;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
});
