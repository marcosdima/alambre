import React, { ReactNode } from 'react';
import { StyleSheet, Pressable, ViewStyle, StyleProp } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

export interface AccordionItemProps {
  id: string;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  title: ReactNode;
  children: ReactNode;
  transition?: any; // Reanimated Layout transition
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export function AccordionItem({
  id,
  isExpanded,
  onToggle,
  title,
  children,
  transition = LinearTransition.springify().damping(16).stiffness(200).mass(1),
  style,
  contentStyle
}: AccordionItemProps) {
  return (
    <Animated.View layout={transition}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        style={[styles.container, style]}
        onPress={() => onToggle(id)}
      >
        {title}
        {isExpanded && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={[styles.content, contentStyle]}>
            {children}
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  content: {
    marginTop: 16,
  }
});
