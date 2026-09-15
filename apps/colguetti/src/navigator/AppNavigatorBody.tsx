import type { ComponentProps, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Pressable } from 'react-native';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';
import type { NavigatorTypes } from 'alambre';
import { View } from 'react-native';
import { AlambreIcons } from 'alambre';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import type { EntryOrExitLayoutType } from 'react-native-reanimated';

type AppNavigatorAnimations = {
  pageEntering?: EntryOrExitLayoutType;
  pageExiting?: EntryOrExitLayoutType;
};

type AppNavigatorBodyProps = ComponentProps<typeof View> & {
  arrowColor?: ColorValue;
  arrowBackgroundColor?: ColorValue;
  arrowBorderColor?: ColorValue;
  width?: number;
  pressStyle?: StyleProp<ViewStyle>;
  headerTitle?: string;
  titleColor?: ColorValue;
  headerStyle?: StyleProp<ViewStyle>;
  animations?: {
    go?: AppNavigatorAnimations;
    return?: AppNavigatorAnimations;
  };
  useNavigator: () => NavigatorTypes.NavigatorReturn;
};

const EXIT_DURATION = 200;
const EXIT_SLIDE = 40;

export default ({
  style,
  animations,
  arrowColor = 'black',
  arrowBackgroundColor = 'rgba(15, 23, 42, 0.16)',
  arrowBorderColor,
  width = 4,
  headerTitle,
  titleColor = 'black',
  headerStyle,
  useNavigator,
  ...props
}: AppNavigatorBodyProps) => {
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

  const onPressIn = () => {
    scale.value = withTiming(0.85, { duration: 300 });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 6, stiffness: 250, mass: 1 });
    isReturningRef.current = true;
    setTimeout(previous, 10);
  };

  const arrowButton = (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={!canShowArrow}
      hitSlop={12}
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

  const {
    pressStyle = {
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
    },
  } = props;

  const direction = isReturningRef.current ? 'return' : 'go';
  const animationsSelected = direction === 'return' ? animations?.return : animations?.go;

  const enterAnimation = animationsSelected?.pageEntering
    ?? FadeInDown.duration(500).delay(350).easing(Easing.ease);

  const prevPageKeyRef = useRef(pageKey);
  const prevComponentRef = useRef<ReactNode>(currentPage.component);
  const exitProgress = useSharedValue(0);
  const exitMultiplier = useSharedValue(0);
  const [transitioningPage, setTransitioningPage] = useState<ReactNode | null>(null);

  const prevPageKey = prevPageKeyRef.current;
  const prevComponent = prevComponentRef.current;
  const navigationDetected = prevPageKey !== pageKey;

  useEffect(() => {
    if (!navigationDetected) return;
    const dir = isReturningRef.current ? 'return' : 'go';
    isReturningRef.current = false;
    setTransitioningPage(prevComponent);
    exitMultiplier.value = dir === 'go' ? -1 : 1;
    exitProgress.value = 0;
    exitProgress.value = withTiming(
      1,
      { duration: EXIT_DURATION, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(setTransitioningPage)(null);
      },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey]);

  prevPageKeyRef.current = pageKey;
  prevComponentRef.current = currentPage.component;

  const exitOverlayStyle = useAnimatedStyle(() => ({
    opacity: 1 - exitProgress.value,
    transform: [{ translateX: exitMultiplier.value * EXIT_SLIDE * exitProgress.value }],
  }));

  return (
    <View
      style={[{ position: 'relative', flex: 1 }, style]}
      {...props}
    >
      {headerMode && (
        <Animated.View
          key="page-header"
          entering={FadeInDown.duration(240).delay(60).easing(Easing.out(Easing.cubic))}
          exiting={FadeOutUp.duration(200).easing(Easing.in(Easing.cubic))}
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

      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={styles.pageScrollContent}
        onScroll={(event) => setScrollTop(Math.max(0, event.nativeEvent.contentOffset.y))}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          key={pageKey}
          style={styles.pageContainer}
          entering={enterAnimation}
        >
          {currentPage.component}
        </Animated.View>
      </ScrollView>

      {!headerMode && (
        <Animated.View
          style={[pressStyle, animatedStyle]}
          pointerEvents={canShowArrow ? 'auto' : 'none'}
        >
          {arrowButton}
        </Animated.View>
      )}

      {transitioningPage && (
        <Animated.View
          style={[styles.exitOverlay, exitOverlayStyle]}
          pointerEvents="none"
        >
          {transitioningPage}
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
    fontWeight: '700',
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
  exitOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
