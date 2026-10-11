import type { ComponentProps } from 'react';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';
import type { NavigatorReturn } from '../../types/navigator';
import * as AlambreIcons from '../../components/icons';
import type { EntryOrExitLayoutType } from 'react-native-reanimated';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useNavigator as useDefaultNavigator } from './navigator-provider';

type NavigatorAnimations = {
  pageEntering?: EntryOrExitLayoutType;
};

export type NavigatorHostProps = ComponentProps<typeof View> & {
  arrowColor?: ColorValue;
  arrowBackgroundColor?: ColorValue;
  arrowBorderColor?: ColorValue;
  width?: number;
  pressStyle?: StyleProp<ViewStyle>;
  headerTitle?: string;
  titleColor?: ColorValue;
  headerStyle?: StyleProp<ViewStyle>;
  initialMountDelay?: number;
  animations?: {
    go?: NavigatorAnimations;
    return?: NavigatorAnimations;
  };
  useNavigator?: () => NavigatorReturn;
};

export const NavigatorHost = ({
  style,
  animations,
  arrowColor = 'black',
  arrowBackgroundColor = 'rgba(15, 23, 42, 0.16)',
  arrowBorderColor,
  width = 4,
  headerTitle,
  titleColor = 'black',
  headerStyle,
  initialMountDelay = 50,
  useNavigator = useDefaultNavigator,
  pressStyle,
  ...props
}: NavigatorHostProps) => {
  const {
    previous,
    currentPage,
    noPreviousPages,
    pageKey,
    scrollTop,
    setScrollTop,
  } = useNavigator();

  const scale = useSharedValue(1);
  const iconVisible = useSharedValue(0);
  const detailsVisible = useSharedValue(0);
  const [drawArrow, setDrawArrow] = useState(false);

  const headerMode = headerTitle !== undefined && !noPreviousPages;
  const canShowArrow = headerMode || (!noPreviousPages && scrollTop <= 4);

  useEffect(() => {
    if (canShowArrow) {
      setDrawArrow(false);
      iconVisible.value = withTiming(1, { duration: 120 });

      const drawTimer = setTimeout(() => {
        setDrawArrow(true);
      }, 40);

      const detailsTimer = setTimeout(() => {
        detailsVisible.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
      }, 160);

      return () => {
        clearTimeout(drawTimer);
        clearTimeout(detailsTimer);
      };
    }

    setDrawArrow(false);
    detailsVisible.value = withTiming(0, { duration: 140 });
    iconVisible.value = withTiming(0, { duration: 120 });
  }, [canShowArrow, detailsVisible, iconVisible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: iconVisible.value * (0.55 + detailsVisible.value * 0.45),
    transform: [
      { translateY: (1 - detailsVisible.value) * -6 },
      { scale: scale.value },
    ],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconVisible.value,
    transform: [{ scale: scale.value }],
  }));

  const isReturningRef = useRef(false);
  const isNavigatingRef = useRef(false);

  const onPressIn = () => {
    scale.value = withTiming(0.85, { duration: 300 });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 6, stiffness: 250, mass: 1 });
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    isReturningRef.current = true;
    setTimeout(previous, 10);
  };

  const arrowButton = (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={!canShowArrow}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Volver"
    >
      <Animated.View style={[styles.iconBody, iconStyle]}>
        <AlambreIcons.Arrow
          drawIt={drawArrow}
          iconAnimation={{
            drawAnimation: (value: number) => withTiming(value, {
              duration: 320,
              easing: Easing.out(Easing.exp),
            }),
            resetAnimation: (value: number) => withTiming(value, {
              duration: 160,
              easing: Easing.in(Easing.quad),
            }),
          }}
          color={arrowColor}
          lineWidth={width}
          rotation={180}
        />
      </Animated.View>
    </Pressable>
  );

  const pillBorder = arrowBorderColor
    ? { borderColor: arrowBorderColor, borderWidth: StyleSheet.hairlineWidth }
    : null;

  const defaultPressStyle = {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 999,
    minWidth: 44,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: arrowBackgroundColor,
    justifyContent: 'center',
    alignItems: 'center',
    ...pillBorder,
  } as const;

  const appliedPressStyle = pressStyle ?? defaultPressStyle;

  const direction = isReturningRef.current ? 'return' : 'go';
  const animationsSelected = direction === 'return' ? animations?.return : animations?.go;

  const isFirstMount = useRef(true);
  const enterAnimation = animationsSelected?.pageEntering
    ?? FadeInDown.duration(400).delay(isFirstMount.current ? initialMountDelay : 50).easing(Easing.out(Easing.cubic));

  useEffect(() => {
    isFirstMount.current = false;
    isReturningRef.current = false;
    isNavigatingRef.current = false;
  }, [pageKey]);

  return (
    <View
      style={[{ position: 'relative', flex: 1 }, style]}
      {...props}
    >
      {headerMode && (
        <Animated.View
          key="page-header"
          entering={FadeInDown.duration(240).delay(60).easing(Easing.out(Easing.cubic))}
          style={[styles.header, headerStyle]}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[styles.arrowSlot, pillBorder, animatedStyle]}
            pointerEvents={noPreviousPages ? 'none' : 'auto'}
          >
            {arrowButton}
          </Animated.View>
          <Animated.Text
            key={headerTitle}
            style={[styles.headerTitle, { color: titleColor }]}
            entering={FadeIn.duration(180)}
            numberOfLines={1}
          >
            {headerTitle}
          </Animated.Text>
        </Animated.View>
      )}

      <View
        style={styles.pageScroll}
        onLayout={() => {
          // Keep scrollTop at 0 so arrow remains visible
          setScrollTop(0);
        }}
      >
        <Animated.View
          key={pageKey}
          style={styles.pageContainer}
          entering={enterAnimation}
        >
          {currentPage?.component}
        </Animated.View>
      </View>

      {!headerMode && (
        <Animated.View
          style={[appliedPressStyle, animatedStyle]}
          pointerEvents={canShowArrow ? 'auto' : 'none'}
        >
          {arrowButton}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: 12,
    gap: 8,
  },
  arrowSlot: {
    minWidth: 44,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,

  },
  pageScroll: {
    flex: 1,
    width: '100%',
  },
  pageScrollContent: {
    flexGrow: 1,
  },
  pageContainer: {
    flex: 1,
    width: '100%',
    minHeight: '100%',
  },
  iconBody: {
    width: 28,
    height: 28,
  },
});
