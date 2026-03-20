import { StyleSheet } from 'react-native';
import { View, Text, Title } from '../../components/base';
import Animated, { BounceInUp, BounceOutUp, Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useEffect, useMemo } from 'react';
import { Cross, Tick } from '../../components/icons';
import type { DefaultToastPayload, ToastBodyProps, Type } from './toast-types';

const isTone = (value: unknown): value is Type => (
  value === 'info'
  || value === 'success'
  || value === 'warning'
  || value === 'error'
);

const parsePayload = (payload?: unknown): DefaultToastPayload => {
  if (!payload || typeof payload !== 'object') return {};
  const data = payload as Record<string, unknown>;

  return {
    title: typeof data.title === 'string' ? data.title : undefined,
    content: typeof data.content === 'string' ? data.content : undefined,
    tone: isTone(data.tone) ? data.tone : undefined,
  };
};

export default ({
  toast,
  palette = {},
  delay = 700,
  animationTime = 800,
  position = 'top',
  containerStyle,
}: ToastBodyProps) => {
  const {
    backgroundColor = '#e2e8f0',
    type = {
      info: '#2563eb',
      success: '#15803d',
      warning: '#b45309',
      error: '#b91c1c',
    },
    text = '#0f172a',
  } = palette;

  const { data, startedAt } = toast;
  const parsedPayload = parsePayload(data.payload);

  const progress = useSharedValue(0);
  const remaining = useMemo(() => {
    const elapsed = startedAt
      ? Date.now() - new Date(startedAt).getTime() - delay
      : 0.0;
    const duration = data.duration ?? 4000;
    return Math.max(0, duration - elapsed - delay);
  }, [data.duration, delay, startedAt]);

  useEffect(() => {
    progress.value = withTiming(1, { duration: remaining });
  }, [progress, remaining]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const toneType = parsedPayload.tone ?? 'info';
  const tone = type[toneType] ?? type.info ?? '#2563eb';
  const iconConfig = {
    color: tone,
    lineWidth: 5,
  };

  const title = parsedPayload.title ?? toneType.charAt(0).toUpperCase() + toneType.slice(1);
  const content = parsedPayload.content ?? '';
  const isTop = position === 'top';

  return (
    <Animated.View
      style={[styles.container, isTop ? styles.topPosition : styles.bottomPosition, containerStyle]}
      entering={BounceInUp.duration(animationTime).delay(delay).easing(Easing.ease)}
      exiting={BounceOutUp.duration(animationTime).easing(Easing.ease)}
      pointerEvents='none'
    >
      <View style={[styles.toast, { backgroundColor }]}
      >
        <View style={styles.info}>
          <View style={styles.icon}>
            { toneType === 'error' ? <Cross {...iconConfig} /> : <Tick {...iconConfig} /> }
          </View>
          <View style={styles.text}>
            <Title style={{ color: tone }}>{title}</Title>
            <Text style={{ color: text }}>{content}</Text>
          </View>
        </View>
        <View style={[styles.barBackground, { backgroundColor: text }]}>
          <Animated.View
            style={
              [styles.barFill, barStyle, { backgroundColor: tone }]
            }
          />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 110,
    position: 'absolute',
    zIndex: 999,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  topPosition: {
    top: 0,
    paddingTop: 12,
  },
  bottomPosition: {
    bottom: 0,
    paddingBottom: 12,
  },
  toast: {
    width: '95%',
    minHeight: 76,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    paddingBottom: 12,
    paddingTop: 10,
  },
  info: {
    flexDirection: 'row',
    width: '90%',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  icon: {
    width: 32,
    height: 32,
    marginRight: 12,
    marginTop: 2,
  },
  text: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  barBackground: {
    height: 4,
    width: '90%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
  },
});
