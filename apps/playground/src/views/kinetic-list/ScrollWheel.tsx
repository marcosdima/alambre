import React from 'react';
import { StyleSheet, Text, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue, interpolate } from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import { useKineticScroll } from './useKineticScroll';
import { useLightDark } from '../../providers/theme';

interface ScrollWheelProps {
  snapEnabled: SharedValue<boolean>;
  itemSize: SharedValue<number>;
  itemCount: number;
  damping: SharedValue<number>;
}

export function ScrollWheel({ snapEnabled, itemSize, itemCount, damping }: ScrollWheelProps) {
  const { theme } = useLightDark();

  const { translation, gesture } = useKineticScroll(snapEnabled, itemSize, itemCount, damping);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translation.value }],
    };
  });

  const screenWidth = Dimensions.get('window').width;
  const paddingHorizontal = screenWidth / 2 - 50; // approximate center

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.wheelContainer, animatedStyle, { paddingHorizontal }]}>
        {Array.from({ length: itemCount }).map((_, i) => (
          <WheelItem key={i} index={i} translation={translation} itemSize={itemSize} theme={theme} />
        ))}
      </Animated.View>
    </GestureDetector>
  );
}

interface WheelItemProps {
  index: number;
  translation: SharedValue<number>;
  itemSize: SharedValue<number>;
  theme: ReturnType<typeof useLightDark>['theme'];
}

function WheelItem({ index, translation, itemSize, theme }: WheelItemProps) {
  const style = useAnimatedStyle(() => {
    const size = itemSize.value;
    const itemPosition = index * size;
    const distance = Math.abs(translation.value + itemPosition);

    const scale = interpolate(distance, [0, size], [1.2, 0.8], 'clamp');
    const opacity = interpolate(distance, [0, size * 2], [1, 0.3], 'clamp');

    return {
      width: size - 8, // account for margin
      marginHorizontal: 4,
      transform: [{ scale }],
      opacity,
      backgroundColor: theme.surface,
      borderColor: theme.border,
    };
  });

  return (
    <Animated.View style={[styles.item, style]}>
      <Text style={{ color: theme.color, fontSize: 24, fontWeight: 'bold' }}>{index}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wheelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 150,
  },
  item: {
    height: 100,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
