import type { ComponentProps } from 'react';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Pressable, BackHandler, View } from 'react-native';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { EntryOrExitLayoutType } from 'react-native-reanimated';
import type { NavigatorReturn } from '../../types/navigator';
import * as AlambreIcons from '../../components/icons';
import { kinetics } from '../../core/kinetics';
import { useTheme } from '../theme/ThemeProvider';
import { resolveTypography } from '../theme/typography';
import { useNavigator as useDefaultNavigator } from '../../behaviors/navigator/navigator-provider';

export type AppNavigatorAnimations = {
  pageEntering?: EntryOrExitLayoutType;
  pageExiting?: EntryOrExitLayoutType;
};

export type AppNavigatorBodyProps = ComponentProps<typeof View> & {
  arrowColor?: ColorValue;
  arrowBackgroundColor?: ColorValue;
  arrowBorderColor?: ColorValue;
  width?: number;
  pressStyle?: StyleProp<ViewStyle>;
  headerTitle?: string;
  titleColor?: ColorValue;
  fontFamily?: string;
  backLabel?: string;
  headerStyle?: StyleProp<ViewStyle>;
  animations?: {
    go?: AppNavigatorAnimations;
    return?: AppNavigatorAnimations;
  };
  useNavigator?: () => NavigatorReturn;
};

export function AppNavigatorBody({
  style,
  animations,
  arrowColor: customArrowColor,
  arrowBackgroundColor: customArrowBg,
  arrowBorderColor: customArrowBorder,
  width = 4,
  headerTitle,
  titleColor: customTitleColor,
  fontFamily,
  backLabel = 'Back',
  headerStyle,
  useNavigator = useDefaultNavigator,
  pressStyle: customPressStyle,
  ...props
}: AppNavigatorBodyProps) {
  const { theme } = useTheme();
  const {
    previous,
    currentPage,
    noPreviousPages,
    pageKey,
    scrollTop,
    setScrollTop,
  } = useNavigator();

  const arrowColor = customArrowColor ?? theme.primary;
  const arrowBackgroundColor = customArrowBg ?? theme.surfaceAlt;
  const arrowBorderColor = customArrowBorder ?? theme.border;
  const titleColor = customTitleColor ?? theme.color;

  const scale = useSharedValue(1);
  const iconVisible = useSharedValue(0);
  const detailsVisible = useSharedValue(0);
  const [drawArrow, setDrawArrow] = useState(false);

  const headerMode = headerTitle !== undefined && !noPreviousPages;
  const canShowArrow = headerMode || (!noPreviousPages && scrollTop <= 4);

  useEffect(() => {
    if (canShowArrow) {
      setDrawArrow(false);
      iconVisible.value = withTiming(1, kinetics.timing.fast);

      const drawTimer = setTimeout(() => {
        setDrawArrow(true);
      }, 40);

      const detailsTimer = setTimeout(() => {
        detailsVisible.value = withTiming(1, kinetics.timing.base);
      }, 160);

      return () => {
        clearTimeout(drawTimer);
        clearTimeout(detailsTimer);
      };
    }

    setDrawArrow(false);
    detailsVisible.value = withTiming(0, kinetics.timing.fast);
    iconVisible.value = withTiming(0, kinetics.timing.fast);
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
  const navigateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (navigateTimeoutRef.current) {
        clearTimeout(navigateTimeoutRef.current);
      }
    };
  }, []);

  const onPressIn = () => {
    scale.value = withTiming(0.85, kinetics.timing.slow);
  };

  const onPressOut = () => {
    scale.value = withSpring(1, kinetics.spring.bouncy);
    isReturningRef.current = true;
    if (navigateTimeoutRef.current) clearTimeout(navigateTimeoutRef.current);
    navigateTimeoutRef.current = setTimeout(previous, 10);
  };

  const arrowButton = (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={!canShowArrow}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={backLabel}
    >
      <Animated.View style={[styles.iconBody, iconStyle]}>
        <AlambreIcons.Arrow
          drawIt={drawArrow}
          iconAnimation={{
            drawAnimation: (value: number) => withTiming(value, kinetics.timing.slow),
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
    position: 'absolute' as const,
    top: 12,
    left: 12,
    zIndex: 999,
    minWidth: 44,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: arrowBackgroundColor,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    ...pillBorder,
  };

  const appliedPressStyle = customPressStyle ?? defaultPressStyle;

  const direction = isReturningRef.current ? 'return' : 'go';
  const animationsSelected = direction === 'return' ? animations?.return : animations?.go;

  const enterAnimation = animationsSelected?.pageEntering
    ?? FadeInDown.duration(500).delay(350).easing(Easing.ease);

  useEffect(() => {
    isReturningRef.current = false;
  }, [pageKey]);

  useEffect(() => {
    const onHardwareBack = () => {
      if (!noPreviousPages) {
        isReturningRef.current = true;
        previous();
        return true;
      }
      return false;
    };

    const sub = BackHandler?.addEventListener?.('hardwareBackPress', onHardwareBack);
    return () => {
      sub?.remove?.();
    };
  }, [noPreviousPages, previous]);

  const typographyStyle = fontFamily
    ? resolveTypography(fontFamily, '700')
    : resolveTypography(theme, { weight: '700' });

  return (
    <View
      style={[{ position: 'relative', flex: 1 }, style]}
      {...props}
    >
      {headerMode && (
        <Animated.View
          key="page-header"
          entering={FadeInDown.duration(240).delay(60).easing(Easing.out(Easing.cubic))}
          style={[styles.header, { backgroundColor: theme.surfaceAlt }, headerStyle]}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[styles.arrowSlot, { backgroundColor: arrowBackgroundColor }, pillBorder, animatedStyle]}
            pointerEvents={noPreviousPages ? 'none' : 'auto'}
          >
            {arrowButton}
          </Animated.View>
          <Animated.Text
            key={headerTitle}
            style={[
              styles.headerTitle,
              { color: titleColor },
              typographyStyle,
            ]}
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
          style={[appliedPressStyle, animatedStyle]}
          pointerEvents={canShowArrow ? 'auto' : 'none'}
        >
          {arrowButton}
        </Animated.View>
      )}
    </View>
  );
}

export const AppNavigatorShell = AppNavigatorBody;
export default AppNavigatorBody;

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
