import { Pressable, StyleSheet } from 'react-native';
import { Text, View } from 'react-native';
import type { ToastComponentProps } from 'alambre';
import { useNavigator } from 'alambre';
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
const ANIMATION_DELAY = 180;
const SLIDE_FROM = -140;

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

const hexToRgba = (hex: string, alpha: number) => {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

export function ColguettiToast({ toast, dismiss }: ToastComponentProps) {
  const { theme } = useLightDark();
  const { noPreviousPages } = useNavigator();
  const { data, startedAt } = toast;
  const payload = parsePayload(data.payload);
  const tone = payload.tone ?? 'info';
  const title = payload.title ?? tone.toUpperCase();
  const content = payload.content ?? '';
  const progress = useSharedValue(0);
  const [shouldDrawIcon, setShouldDrawIcon] = useState(false);
  const toneColor = toneStyles[tone];

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
    color: toneColor,
  };

  return (
    <View
      style={[styles.root, { top: noPreviousPages ? 12 : 72 }]}
      pointerEvents='box-none'
    >
      <Animated.View
        key={data.id}
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: toneColor,
          },
        ]}
        entering={FadeInDown
          .springify()
          .damping(15)
          .stiffness(140)
          .mass(0.6)
          .withInitialValues({ opacity: 0, transform: [{ translateY: SLIDE_FROM }] })}
        exiting={FadeOutUp.duration(240).easing(Easing.in(Easing.cubic))}
      >
        <View style={[styles.accentBar, { backgroundColor: toneColor }]} />
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

            <Text numberOfLines={1} style={[styles.title, { color: toneColor }]}>{title}</Text>
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

        {content ? (
          <Text style={[styles.content, { color: theme.color }]}>{content}</Text>
        ) : null}

        {
          data.persistent
            ? undefined
            : (
              <View style={[styles.progressTrack, { backgroundColor: hexToRgba(toneColor, 0.2) }]}>
                <Animated.View style={[styles.progressBar, progressStyle, { backgroundColor: toneColor }]} />
              </View>
            )
        }
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    zIndex: 999,
  },
  card: {
    width: '94%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  accentBar: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    left: 0,
    width: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
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
    lineHeight: 24,
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
    marginLeft: 32,
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
