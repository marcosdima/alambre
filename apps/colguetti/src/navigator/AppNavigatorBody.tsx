import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
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
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { EntryOrExitLayoutType } from 'react-native-reanimated';

type AppNavigatorAnimations = {
  pageEntering?: EntryOrExitLayoutType;
  pageExiting?: EntryOrExitLayoutType;
};

type AppNavigatorBodyProps = ComponentProps<typeof View> & {
  arrowColor?: ColorValue;
  arrowBackgroundColor?: ColorValue;
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

export default ({
  style,
  animations,
  arrowColor = 'black',
  arrowBackgroundColor = 'rgba(15, 23, 42, 0.16)',
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
  const [isReturning, setIsReturning] = useState(false);
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

  useEffect(() => {
    if (isReturning) setIsReturning(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

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

  const onPressIn = () => {
    scale.value = withTiming(0.85, { duration: 300 });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, {
      damping: 6,
      stiffness: 250,
      mass: 1,
    });
    setIsReturning(true);
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
      {headerMode && (
        <View style={[styles.header, headerStyle]} pointerEvents="box-none">
          <Animated.View
            style={[styles.arrowSlot, animatedStyle]}
            pointerEvents={noPreviousPages ? 'none' : 'auto'}
          >
            {arrowButton}
          </Animated.View>
          <Animated.Text
            key={headerTitle}
            style={[styles.headerTitle, { color: titleColor }]}
            entering={FadeIn.duration(200)}
            numberOfLines={1}
          >
            {headerTitle}
          </Animated.Text>
        </View>
      )}

      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={styles.pageScrollContent}
        onScroll={(event) => setScrollTop(Math.max(0, event.nativeEvent.contentOffset.y))}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps='handled'
      >
        <Animated.View
          key={pageKey}
          style={styles.pageContainer}
          {...animationConfig}
        >
          {currentPage.component}
        </Animated.View>
      </ScrollView>

      {!headerMode && (
        <Animated.View
          style={[
            pressStyle,
            animatedStyle,
          ]}
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
});
