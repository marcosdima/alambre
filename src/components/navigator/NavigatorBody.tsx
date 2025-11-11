import { View } from '@base';
import { useNavigator } from '@providers';
import type { DefaultReact } from '@types';
import {  useEffect, useState } from 'react';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import { Pressable } from 'react-native';
import type { EntryOrExitLayoutType } from 'react-native-reanimated';
import Animated, {
  Easing,
  FadeInDown,
  FadeOutUp,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Arrow from 'src/components/icons/Arrow';

type Animations = {
  pageEntering?: EntryOrExitLayoutType;
  pageExiting?: EntryOrExitLayoutType;
}

type NavigatorBodyProps = DefaultReact.ViewProps & {
   arrowColor?: ColorValue;
   width?: number;
   pressStyle?: StyleProp<ViewStyle>;
   animations?: {
    go?: Animations,
    return?: Animations,
   },
};

export const NavigatorBody = (
  {
    children: _children,
    style,
    animations,
    arrowColor = 'black',
    width = 4,
    ...props
  }: NavigatorBodyProps,
) => {
  const {
    previous,
    currentPage,
    noPreviousPages,
    pageKey,
  } = useNavigator();

  const scale = useSharedValue(1);
  const shows = useSharedValue(0);
  const [isReturning, setIsReturning] = useState(false);

  // Shows arrow just if there are previus pages.
  useEffect(() => {
    shows.value = withTiming(noPreviousPages ? 0 : 1, { duration: 1000 });
  }, [noPreviousPages, arrowColor, shows]);

  // TODO: Rethink. This is the simpliest way to handle this animation bug.
  useEffect(() => {
    if (isReturning) setIsReturning(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Arrow contenedor animated style.
  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      shows.value,
      [0, 1],
      ['transparent', arrowColor as string],
    ),
    transform: [{ scale: scale.value }],
  }));

  // What happens when the arrow is pressed.
  const onPressIn = () => {
    scale.value = withTiming(0.85, { duration: 300 });
  };

  // What happens when the arrow is released.
  const onPressOut = () => {
    scale.value = withSpring(1, {
      damping: 6,
      stiffness: 250,
      mass: 1,
    });
    setIsReturning(true);
    setTimeout(previous, 100);
  };

  const {
    pressStyle = {
      height: '3.5%',
      width: '12.5%',
      position: 'absolute',
      top: 10,
      left: 10,
      zIndex: 999,
      borderColor: arrowColor,
      borderRadius: 50,
      borderWidth: 2,
      padding: 2,
    },
  } = props;

  const animationsSelected = isReturning ? animations?.return : animations?.go;
  const animationConfig = {
    entering: animationsSelected?.pageEntering ?? FadeInDown.duration(500).delay(350).easing(Easing.ease),
    exiting: animationsSelected?.pageExiting ?? FadeOutUp.duration(500).easing(Easing.ease),
  };

  return (
    <View
      style={[{ position: 'relative', flex: 1 }, style]}
      {...props}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          pressStyle,
          animatedStyle,
        ]}
      >
        <Pressable
          onPressIn={onPressIn}
          onPressOut={onPressOut}
        >
          <Arrow
            reset={noPreviousPages}
            color={arrowColor}
            lineWidth={width}
            rotate={180}
          />
        </Pressable>
      </Animated.View>
      <Animated.View
        key={pageKey}
        style={{ width: '100%', height: '100%', position: 'absolute' }}
        {...animationConfig}
      >
        {currentPage.component}
      </Animated.View>
    </View>
  );
};
