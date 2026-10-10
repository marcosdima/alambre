import type { ReactNode } from 'react';
import React from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useStepFlowContext } from './StepFlowContext';

export type StepFlowControlsProps = {
  renderNextButton?: (props: { onPress: () => void; disabled: boolean; isComplete: boolean }) => ReactNode;
  renderPrevButton?: (props: { onPress: () => void; disabled: boolean }) => ReactNode;
  style?: StyleProp<ViewStyle>;
  hidePrevOnFirst?: boolean;
};

export function StepFlowControls({
  renderNextButton,
  renderPrevButton,
  style,
  hidePrevOnFirst = true,
}: StepFlowControlsProps) {
  const { currentStepIndex, next, prev, isGated, isComplete } = useStepFlowContext();

  const showPrev = !hidePrevOnFirst || currentStepIndex > 0;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.prevContainer}>
        {showPrev && renderPrevButton && renderPrevButton({ onPress: prev, disabled: false })}
      </View>
      <View style={styles.nextContainer}>
        {renderNextButton && (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            {renderNextButton({ onPress: next, disabled: isGated, isComplete })}
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  prevContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  nextContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
});
