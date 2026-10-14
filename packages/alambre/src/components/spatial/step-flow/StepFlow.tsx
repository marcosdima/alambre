import type { ReactNode } from 'react';
import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import Animated, { SlideInRight, SlideInLeft, SlideOutRight, SlideOutLeft, Easing, FadeIn, type EntryOrExitLayoutType } from 'react-native-reanimated';
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

  const goTo = useCallback((index: number) => {
    if (index === currentStepIndex || index < 0 || index >= totalSteps) return;
    setDirection(index > currentStepIndex ? 'forward' : 'backward');
    setCurrentStepIndex(index);
  }, [currentStepIndex, totalSteps]);

  const value = useMemo(() => ({
    currentStepIndex,
    direction,
    totalSteps,
    next,
    prev,
    goTo,
    isGated,
    setGated,
    isComplete: currentStepIndex >= totalSteps - 1,
  }), [currentStepIndex, direction, totalSteps, next, prev, goTo, isGated]);

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
  contentStyle?: StyleProp<ViewStyle>;
  entering?: EntryOrExitLayoutType;
  exiting?: EntryOrExitLayoutType;
  disableExit?: boolean;
};

function Stage({ children, style, contentStyle, entering, exiting, disableExit = true }: StageProps) {
  const { currentStepIndex, direction } = useStepFlowContext();

  const defaultEntering = direction === 'none'
    ? FadeIn.duration(200)
    : direction === 'backward'
      ? SlideInLeft.duration(350).easing(Easing.out(Easing.quad))
      : SlideInRight.duration(350).easing(Easing.out(Easing.quad));

  const defaultExiting = direction === 'backward'
    ? SlideOutRight.duration(350).easing(Easing.in(Easing.quad))
    : SlideOutLeft.duration(350).easing(Easing.in(Easing.quad));

  return (
    <View style={[styles.stageContainer, style]}>
      <Animated.View
        key={currentStepIndex}
        entering={entering ?? defaultEntering}
        exiting={disableExit || direction === 'none' ? undefined : (exiting ?? defaultExiting)}
        style={[styles.stage, contentStyle]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  stageContainer: {
    width: '100%',
  },
  stage: {
    width: '100%',
  },
});

export const StepFlow = {
  Root,
  Stage,
};
