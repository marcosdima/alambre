import React, { ReactNode, useMemo } from 'react';
import { StyleSheet, Pressable, ViewStyle, StyleProp, View } from 'react-native';
import Animated, { 
  FadeIn, 
  LinearTransition, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  interpolate, 
  Extrapolation, 
  runOnJS 
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

export interface InteractiveCardProps {
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  collapsedContent: ReactNode;
  expandedContent: ReactNode;
  transition?: any;
  damping?: number;
  stiffness?: number;
  mass?: number;
  style?: StyleProp<ViewStyle>;
  expandedStyle?: StyleProp<ViewStyle>;
  collapsedStyle?: StyleProp<ViewStyle>;
}

export function InteractiveCard({
  isExpanded,
  onExpand,
  onCollapse,
  collapsedContent,
  expandedContent,
  transition = LinearTransition.springify().damping(16).stiffness(200).mass(1),
  damping = 16,
  stiffness = 200,
  mass = 1,
  style,
  expandedStyle,
  collapsedStyle
}: InteractiveCardProps) {
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const panGesture = useMemo(() => Gesture.Pan()
    .enabled(isExpanded)
    .onStart(() => {
      isDragging.value = true;
    })
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      isDragging.value = false;
      if (event.translationY > 150 || event.velocityY > 500) {
        runOnJS(onCollapse)();
        translateY.value = withSpring(0, { damping, stiffness, mass });
      } else {
        translateY.value = withSpring(0, { damping, stiffness, mass });
      }
    }), [isExpanded, damping, stiffness, mass, onCollapse]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      translateY.value,
      [0, 300],
      [1, 0.85],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { translateY: translateY.value },
        { scale }
      ],
      borderRadius: isExpanded 
        ? interpolate(translateY.value, [0, 150], [16, 32], Extrapolation.CLAMP)
        : 16
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        layout={transition}
        style={[
          styles.cardShape,
          isExpanded ? expandedStyle : collapsedStyle,
          style,
          animatedStyle
        ]}
      >
        <Pressable 
          accessibilityRole="button"
          accessibilityState={{ expanded: isExpanded }}
          style={StyleSheet.absoluteFill} 
          onPress={() => {
            if (!isExpanded) onExpand();
          }}
        >
          {isExpanded ? expandedContent : collapsedContent}
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  cardShape: {
    borderRadius: 16,
    overflow: 'hidden',
  },
});
