import type { ReactNode } from 'react';
import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import Animated, { SlideInRight, SlideInLeft, SlideOutRight, SlideOutLeft, Easing } from 'react-native-reanimated';
import { StepFlowContext, type StepFlowDirection, useStepFlowContext } from './StepFlowContext';

type RootProps = {
  children: ReactNode;
  totalSteps: number;
  initialStep?: number;
  onComplete?: () => void;
  style?: StyleProp<ViewStyle>;
};

function Root({ children, totalSteps, initialStep = 0, onComplete, style }: RootProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep);
  const [direction, setDirection] = useState<StepFlowDirection>('none');
  const [isGated, setGated] = useState(false);

  const next = useCallback(() => {
    if (isGated) return;
    if (currentStepIndex < totalSteps - 1) {
      setDirection('forward');
      setCurrentStepIndex((i) => i + 1);
    } else {
      onComplete?.();
    }
  }, [currentStepIndex, totalSteps, isGated, onComplete]);

  const prev = useCallback(() => {
    if (currentStepIndex > 0) {
      setDirection('backward');
      setCurrentStepIndex((i) => i - 1);
    }
  }, [currentStepIndex]);

  const value = useMemo(() => ({
    currentStepIndex,
    direction,
    totalSteps,
    next,
    prev,
    isGated,
    setGated,
    isComplete: currentStepIndex >= totalSteps - 1,
  }), [currentStepIndex, direction, totalSteps, next, prev, isGated]);

  return (
    <StepFlowContext.Provider value={value}>
      <View style={[styles.root, style]}>
        {children}
      </View>
    </StepFlowContext.Provider>
  );
}

type StageProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

function Stage({ children, style }: StageProps) {
  const { currentStepIndex, direction } = useStepFlowContext();

  const entering = direction === 'backward'
    ? SlideInLeft.duration(350).easing(Easing.out(Easing.quad))
    : SlideInRight.duration(350).easing(Easing.out(Easing.quad));

  const exiting = direction === 'backward'
    ? SlideOutRight.duration(350).easing(Easing.in(Easing.quad))
    : SlideOutLeft.duration(350).easing(Easing.in(Easing.quad));

  return (
    <View style={[styles.stageContainer, style]}>
      <Animated.View
        key={currentStepIndex}
        entering={entering}
        exiting={exiting}
        style={styles.stage}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  stageContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  stage: {
    flex: 1,
  },
});

export const StepFlow = {
  Root,
  Stage,
};
