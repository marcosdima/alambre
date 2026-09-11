import { Pressable, StyleSheet } from 'react-native';
import { Text, Title, View } from 'alambre';
import type { ToastComponentProps } from 'alambre';
import { useLightDark } from './theme';
import { AlambreIcons } from 'alambre';
import Animated, {
  Easing,
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useEffect, useMemo, useState } from 'react';

type DemoTone = 'info' | 'success' | 'warning' | 'error';

type DemoToastPayload = {
  title?: string;
  content?: string;
  tone?: DemoTone;
};

const DEFAULT_DURATION = 4000;
const ANIMATION_DELAY = 220;
const ANIMATION_TIME = 280;

const isTone = (value: unknown): value is DemoTone => (
  value === 'info'
  || value === 'success'
  || value === 'warning'
  || value === 'error'
);


const parsePayload = (payload?: unknown): DemoToastPayload => {
  if (!payload || typeof payload !== 'object') return {};
  const value = payload as Record<string, unknown>;

  return {
    title: typeof value.title === 'string' ? value.title : undefined,
    content: typeof value.content === 'string' ? value.content : undefined,
    tone: isTone(value.tone) ? value.tone : undefined,
  };
};


const toneStyles: Record<DemoTone, string> = {
  info: '#2563eb',
  success: '#15803d',
  warning: '#b45309',
  error: '#b91c1c',
};

const iconAnimation = {
  drawAnimation: (value: number) => withTiming(value, {
    duration: 460,
    easing: Easing.out(Easing.exp),
  }),
  resetAnimation: (value: number) => withTiming(value, {
    duration: 180,
    easing: Easing.in(Easing.quad),
  }),
};

export default ({ toast, dismiss, queueLength }: ToastComponentProps) => {
  const { theme } = useLightDark();
  const { data, startedAt } = toast;
  const payload = parsePayload(data.payload);
  const tone = payload.tone ?? 'info';
  const title = payload.title ?? tone.toUpperCase();
  const content = payload.content ?? '';
  const progress = useSharedValue(0);
  const [shouldDrawIcon, setShouldDrawIcon] = useState(false);

  const remaining = useMemo(() => {
    const duration = data.duration ?? DEFAULT_DURATION;
    const elapsed = Date.now() - new Date(startedAt).getTime();
    return Math.max(0, duration - elapsed);
  }, [data.duration, startedAt]);

  useEffect(() => {
    if (data.persistent) {
      progress.value = 1;
      return;
    }

    progress.value = 0;
    progress.value = withTiming(1, {
      duration: remaining,
      easing: Easing.linear,
    });
  }, [data.id, data.persistent, progress, remaining]);

  useEffect(() => {
    setShouldDrawIcon(false);

    const timer = setTimeout(() => {
      setShouldDrawIcon(true);
    }, ANIMATION_DELAY + 40);

    return () => clearTimeout(timer);
  }, [data.id]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const iconProps = {
    drawIt: shouldDrawIcon,
    iconAnimation,
    color: toneStyles[tone],
  };

  return (
    <View style={styles.root} pointerEvents='box-none'>
      <Animated.View
        style={[styles.card, { backgroundColor: theme.surface, borderColor: toneStyles[tone] }]}
        entering={FadeInDown.duration(ANIMATION_TIME).delay(ANIMATION_DELAY).easing(Easing.out(Easing.cubic))}
        exiting={FadeOutUp.duration(ANIMATION_TIME).easing(Easing.in(Easing.cubic))}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.iconWrap}>
              {
                tone === 'error'
                  ? <AlambreIcons.Cross key={`error-${data.id}`} {...iconProps} lineWidth={5} />
                  : tone === 'warning'
                    ? <AlambreIcons.Arrow key={`warning-${data.id}`} {...iconProps} lineWidth={7} rotation={-25} />
                    : tone === 'success'
                      ? <AlambreIcons.Tick key={`success-${data.id}`} {...iconProps} lineWidth={5} />
                      : <AlambreIcons.Arrow key={`info-${data.id}`} {...iconProps} lineWidth={7} />
              }
            </View>

            <Title style={[styles.title, { color: toneStyles[tone] }]}>{title}</Title>
          </View>

          <Pressable onPress={() => dismiss(data.id)} style={[styles.closeButton, { borderColor: theme.border }]}>
            <View style={styles.closeIconWrap}>
              <AlambreIcons.Cross
                key={`close-${data.id}`}
                drawIt={shouldDrawIcon}
                iconAnimation={iconAnimation}
                color={theme.color}
                lineWidth={6}
              />
            </View>
          </Pressable>
        </View>

        <Text style={[styles.content, { color: theme.color }]}>{content}</Text>
        <Text style={[styles.meta, { color: theme.muted }]}>Queue: {queueLength}</Text>

        {
          data.persistent
            ? undefined
            : (
              <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                <Animated.View style={[styles.progressBar, progressStyle, { backgroundColor: toneStyles[tone] }]} />
              </View>
            )
        }
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 12,
    width: '100%',
    alignItems: 'center',
    zIndex: 999,
  },
  card: {
    width: '94%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrap: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIconWrap: {
    width: 14,
    height: 14,
  },
  content: {
    fontSize: 13,
    lineHeight: 18,
  },
  meta: {
    fontSize: 12,
  },
  progressTrack: {
    width: '100%',
    height: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
});
