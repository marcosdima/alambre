import AppText from '../../components/AppText';
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Pressable, PanResponder } from 'react-native';
import { useNavigator, AlambreIcons, Typewriter, CountUp, DropInTitle } from 'alambre';
import { useLightDark } from '../../providers/theme';
import { useConfig } from '../../providers/config';
import { useLang } from '../../providers/lang';
import AppCard from '../../components/AppCard';
import SupportModal from '../../components/SupportModal';
import { HangingMobile, AlarmGlyph, ItemsGlyph, GeoHeart } from '../../components/illustrations/SkiaArt';
import { useAlarms } from '../../alarms/alarms-context';
import { useActivation } from '../../checklist/activation-context';
import { Canvas, Path } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolateColor,
  useReducedMotion,
} from 'react-native-reanimated';
import DotGrid from '../../components/DotGrid';
import SkiaFrame from '../../components/SkiaFrame';
import type { Weekday, Alarm } from '../../alarms/alarm-types';

export default function Home() {
  const { theme, currThemeName } = useLightDark();
  const { config } = useConfig();
  const { lang } = useLang();
  const { navigate } = useNavigator();
  const { alarms } = useAlarms();
  const { activate } = useActivation();
  const [supportVisible, setSupportVisible] = useState(false);

  const Gear = AlambreIcons.Gear;
  const Play = AlambreIcons.Play;

  const activeAlarms = alarms.filter((a) => a.enabled);
  const carouselAlarms = activeAlarms.length > 0 ? activeAlarms : alarms;

  const [activeIndex, setActiveIndex] = useState(0);

  const lengthRef = useRef(carouselAlarms.length);
  useEffect(() => {
    lengthRef.current = carouselAlarms.length;
  }, [carouselAlarms.length]);

  const next = () => setActiveIndex((prev) => lengthRef.current ? (prev + 1) % lengthRef.current : 0);
  const prevAction = () => setActiveIndex((prev) => lengthRef.current ? (prev - 1 + lengthRef.current) % lengthRef.current : 0);

  useEffect(() => {
    if (carouselAlarms.length <= 1) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [activeIndex, carouselAlarms.length]);

  useEffect(() => {
    if (carouselAlarms.length > 0 && activeIndex >= carouselAlarms.length) {
      setActiveIndex(0);
    }
  }, [carouselAlarms.length, activeIndex]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dx) > 15,
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 40) {
          prevAction();
        } else if (gestureState.dx < -40) {
          next();
        }
      },
    }),
  ).current;

  const handlePlay = (alarm: Alarm) => {
    void activate(alarm);
  };

  const currentAlarm = carouselAlarms[activeIndex];
  const [hourStr, minStr] = (currentAlarm?.time || '00:00').split(':');
  const alarmHours = Number(hourStr) || 0;
  const alarmMinutes = Number(minStr) || 0;
  const today = new Date().getDay();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <DotGrid color={theme.border} spacing={35} radius={1.5} opacity={0.4} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <SupportModal visible={supportVisible} onClose={() => setSupportVisible(false)} />

        <View style={styles.header}>
          <Pressable
            onPress={() => setSupportVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={lang.settings.supportTitle}
            style={({ pressed }) => [
              styles.roundButton,
              { backgroundColor: theme.surfaceAlt, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <GeoHeart color={theme.danger} size={24} bpm={56} />
          </Pressable>
          <Pressable
            onPress={() => navigate('settings')}
            accessibilityRole="button"
            accessibilityLabel={lang.settings.title}
            style={({ pressed }) => [
              styles.roundButton,
              { backgroundColor: theme.surfaceAlt, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Gear style={{ width: 22, height: 22 }} color={theme.color} />
          </Pressable>
        </View>

        <View style={styles.center}>
          <HangingMobile line={theme.color} size={240} />
          <DropInTitle
            text="Colguetti"
            style={{ marginTop: -20 }}
            textStyle={[styles.title, { color: theme.color, fontFamily: config.fontFamily }]}
            fontFamily={config.fontFamily}
          />
        </View>

        <View style={styles.menuGrid}>

          {/* Active Alarms Component - Top Row */}
          {carouselAlarms.length > 0 && currentAlarm ? (
            <View style={styles.activeAlarmsTile}>
              <AppCard
                variant="soft"
                padding="none"
                style={{ width: '100%' }}
                contentStyle={{
                  backgroundColor: theme.surfaceAlt,
                  paddingVertical: 20,
                  paddingHorizontal: 20,
                  borderRadius: 20,
                }}
              >
                <View
                  style={styles.activeCardContent}
                  {...panResponder.panHandlers}
                >
                  {/* Top Row: Alarm Label and Time Separated */}
                  <View style={styles.alarmHeaderRow}>
                    <Typewriter
                      key={currentAlarm.id}
                      text={currentAlarm.label}
                      textStyle={[styles.activeCardTitle, { color: theme.color, fontFamily: config.fontFamily }]}
                      containerStyle={{ flex: 1, marginRight: 12, height: 32, justifyContent: 'center' }}
                      speed={30}
                      cursor={false}
                      reserveSpace={false}
                      fontFamily={config.fontFamily}
                      numberOfLines={1}
                    />
                    <View
                      accessible
                      accessibilityRole="text"
                      accessibilityLabel={`${hourStr.padStart(2, '0')}:${minStr.padStart(2, '0')}`}
                      style={styles.timeCluster}
                    >
                      <CountUp
                        key={`h-${currentAlarm.id}-${alarmHours}`}
                        value={alarmHours}
                        padZeroes={2}
                        duration={800}
                        style={[styles.timeDigit, { color: theme.color, fontFamily: config.fontFamily }]}
                      />
                      <AppText style={[styles.timeColon, { color: theme.color, fontFamily: config.fontFamily }]}>:</AppText>
                      <CountUp
                        key={`m-${currentAlarm.id}-${alarmMinutes}`}
                        value={alarmMinutes}
                        padZeroes={2}
                        duration={800}
                        style={[styles.timeDigit, { color: theme.color, fontFamily: config.fontFamily }]}
                      />
                    </View>
                  </View>

                  {/* Middle Row: Weekdays with subtle compact indicators */}
                  <View style={styles.daysRow}>
                    {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                      const isMarked = currentAlarm.weekdays.includes(dayIndex as Weekday);
                      return (
                        <AnimatedDaySquare
                          key={dayIndex}
                          dayIndex={dayIndex}
                          isMarked={isMarked}
                          isToday={today === dayIndex}
                          theme={theme}
                          currThemeName={currThemeName}
                          fontFamily={config.fontFamily}
                          dayLabel={lang.alarms.weekdays[dayIndex].charAt(0)}
                          accessibilityLabel={`${lang.alarms.weekdays[dayIndex]}${isMarked ? `, ${lang.alarms.enabledLabel}` : ''}`}
                        />
                      );
                    })}
                  </View>

                  {/* Pagination Dots */}
                  {carouselAlarms.length > 1 && (
                    <View style={styles.paginationDots}>
                      {carouselAlarms.map((_, idx) => (
                        <Pressable
                          key={idx}
                          onPress={() => setActiveIndex(idx)}
                          accessibilityRole="button"
                          accessibilityLabel={`${lang.alarms.title} ${idx + 1}`}
                          accessibilityState={{ selected: idx === activeIndex }}
                          hitSlop={{ top: 12, bottom: 12, left: 4, right: 4 }}
                          style={styles.dotTouchTarget}
                        >
                          <View
                            style={[
                              styles.dot,
                              {
                                backgroundColor: theme.color,
                                opacity: idx === activeIndex ? 1 : 0.25,
                                width: idx === activeIndex ? 14 : 5,
                              },
                            ]}
                          />
                        </Pressable>
                      ))}
                    </View>
                  )}

                  {/* Bottom: Play Button full width below with margin */}
                  {activeAlarms.length > 0 && (
                    <View style={styles.playButtonWrapper}>
                      <Pressable
                        onPress={() => handlePlay(currentAlarm)}
                        accessibilityRole="button"
                        accessibilityLabel={`${lang.home.activate}: ${currentAlarm.label}`}
                        style={({ pressed }) => [
                          styles.playButtonFull,
                          { backgroundColor: theme.primarySoft, opacity: pressed ? 0.75 : 1 },
                        ]}
                      >
                        <SkiaFrame color={theme.primary} inset={2} cornerGap={6} strokeWidth={1.5} cornerShape="dot" dashed />
                        <Play color={theme.primary} style={{ width: 22, height: 22, marginLeft: 2 }} />
                      </Pressable>
                    </View>
                  )}
                </View>
              </AppCard>
              <SkiaFrame color={theme.border} inset={8} cornerGap={10} strokeWidth={2} cornerShape="dot" />
            </View>
          ) : (
            <View style={styles.activeAlarmsTile}>
              <AppCard
                variant="soft"
                padding="none"
                style={{ width: '100%' }}
                contentStyle={{
                  backgroundColor: theme.surfaceAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 24,
                  borderRadius: 20,
                }}
              >
                <AppText style={{ color: theme.muted, fontSize: 16 }}>{lang.alarms.empty}</AppText>
              </AppCard>
              <SkiaFrame color={theme.border} inset={8} cornerGap={10} strokeWidth={2} cornerShape="dot" />
            </View>
          )}

          {/* Bottom Row - 2 Columns */}
          <View style={styles.bottomRow}>
            <View style={styles.halfTile}>
              <AppCard
                variant="soft"
                padding="sm"
                onPress={() => navigate('alarms')}
                style={{ width: '100%', flex: 1 }}
                contentStyle={{ backgroundColor: theme.primarySoft, flex: 1 }}
              >
                <View style={styles.halfTileContent}>
                  <View style={styles.halfTileCopy}>
                    <AppText numberOfLines={1} style={[styles.tileTitle, { color: theme.color }]}>{lang.alarms.title}</AppText>
                    <AppText
                      numberOfLines={2}
                      style={[styles.tileSubtitle, { color: theme.color }]}
                    >
                      {lang.home.manageAlarms}
                    </AppText>
                  </View>
                  <AlarmGlyph line={theme.color} size={76} ringing={true} rippleWaves={3} />
                </View>
              </AppCard>
              <SkiaFrame color={theme.primary} inset={16} cornerGap={12} strokeWidth={2} cornerShape="square" />
            </View>

            <View style={styles.halfTile}>
              <AppCard
                variant="soft"
                padding="sm"
                onPress={() => navigate('items')}
                style={{ width: '100%', flex: 1 }}
                contentStyle={{ backgroundColor: theme.dangerSoft, flex: 1 }}
              >
                <View style={styles.halfTileContent}>
                  <View style={styles.halfTileCopy}>
                    <AppText numberOfLines={1} style={[styles.tileTitle, { color: theme.color }]}>{lang.items.title}</AppText>
                    <AppText
                      numberOfLines={2}
                      style={[styles.tileSubtitle, { color: theme.color }]}
                    >
                      {lang.tutorial.collection}
                    </AppText>
                  </View>
                  <ItemsGlyph line={theme.color} size={76} />
                </View>
              </AppCard>
              <SkiaFrame color={theme.danger} inset={16} cornerGap={12} strokeWidth={2} cornerShape="triangle" rotateCorners />
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const DAY_SQUARE_PATH = 'M 12 1 L 17 1 A 5 5 0 0 1 23 7 L 23 17 A 5 5 0 0 1 17 23 L 7 23 A 5 5 0 0 1 1 17 L 1 7 A 5 5 0 0 1 7 1 Z';

type AnimatedDaySquareProps = {
  isMarked: boolean;
  isToday: boolean;
  theme: ReturnType<typeof useLightDark>['theme'];
  currThemeName: ReturnType<typeof useLightDark>['currThemeName'];
  dayLabel: string;
  dayIndex?: number;
  fontFamily?: string;
  accessibilityLabel?: string;
};

function AnimatedDaySquare({
  isMarked,
  isToday,
  theme,
  currThemeName,
  dayLabel,
  dayIndex = 0,
  fontFamily,
  accessibilityLabel,
}: AnimatedDaySquareProps) {
  const isReducedMotion = useReducedMotion();
  const drawProgress = useSharedValue(isMarked ? 1 : 0);
  const colorProgress = useSharedValue(isMarked ? 1 : 0);

  useEffect(() => {
    if (isReducedMotion) {
      drawProgress.value = isMarked ? 1 : 0;
      colorProgress.value = isMarked ? 1 : 0;
      return;
    }
    const delay = dayIndex * 20;
    drawProgress.value = withDelay(
      delay,
      withTiming(isMarked ? 1 : 0, {
        duration: 380,
        easing: Easing.out(Easing.cubic),
      }),
    );
    colorProgress.value = withDelay(
      delay,
      withTiming(isMarked ? 1 : 0, {
        duration: 350,
        easing: Easing.inOut(Easing.quad),
      }),
    );
  }, [isMarked, isReducedMotion, dayIndex, colorProgress, drawProgress]);

  const activeStrokeColor = isToday ? theme.danger : theme.primary;
  const targetBg = isToday ? theme.dangerSoft : theme.primarySoft;
  const initialBg = isToday ? theme.dangerSoft : 'rgba(0,0,0,0)';

  const animatedBgStyle = useAnimatedStyle(() => {
    const bg = interpolateColor(
      colorProgress.value,
      [0, 1],
      [initialBg, targetBg],
    );
    return {
      backgroundColor: bg,
    };
  });

  const defaultTextColor = isToday
    ? (currThemeName === 'dark' ? theme.danger : '#943828')
    : theme.muted;
  const activeTextColor = isToday
    ? (currThemeName === 'dark' ? theme.danger : '#943828')
    : theme.primary;

  const animatedTextStyle = useAnimatedStyle(() => {
    const col = interpolateColor(
      colorProgress.value,
      [0, 1],
      [defaultTextColor, activeTextColor],
    );
    return {
      color: col,
    };
  });

  return (
    <Animated.View
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.daySquare,
        { borderColor: isToday ? theme.danger : theme.borderSoft },
        animatedBgStyle,
      ]}
    >
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Path
          path={DAY_SQUARE_PATH}
          color={activeStrokeColor}
          strokeWidth={1.5}
          style="stroke"
          end={drawProgress}
        />
      </Canvas>
      <Animated.Text
        allowFontScaling={false}
        style={[
          styles.dayText,
          { fontFamily },
          animatedTextStyle,
        ]}
      >
        {dayLabel}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 12,
  },
  header: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roundButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    marginTop: 4,
    marginBottom: 14,
  },
  title: {
    fontSize: 44,
    lineHeight: 52,
    paddingVertical: 2,
    includeFontPadding: false,
    letterSpacing: 1.5,
  },
  menuGrid: {
    gap: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 12,
  },
  activeAlarmsTile: {
    width: '100%',
  },
  activeCardContent: {
    flexDirection: 'column',
    width: '100%',
    gap: 10,
  },
  alarmHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: 32,
  },
  activeCardTitle: {
    fontSize: 20,
    lineHeight: 26,
    includeFontPadding: false,
    flexShrink: 1,
  },
  timeCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
  },
  timeDigit: {
    fontSize: 22,
    lineHeight: 26,
    includeFontPadding: false,
  },
  timeColon: {
    fontSize: 22,
    lineHeight: 26,
    marginHorizontal: 2,
    includeFontPadding: false,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
  daySquare: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dayText: {
    fontSize: 11,
    lineHeight: 14,
    includeFontPadding: false,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 1,
  },
  dotTouchTarget: {
    paddingVertical: 2,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  playButtonWrapper: {
    width: '100%',
    marginTop: 0,
  },
  playButtonFull: {
    width: '100%',
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  halfTile: {
    flex: 1,
  },
  halfTileContent: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 18,
    minHeight: 180,
    justifyContent: 'space-between',
  },
  halfTileCopy: {
    width: '100%',
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 3,
    minHeight: 52,
    justifyContent: 'center',
  },
  tileTitle: {
    fontSize: 20,
    lineHeight: 24,
    includeFontPadding: false,
    textAlign: 'center',
  },
  tileSubtitle: {
    fontSize: 13,
    lineHeight: 16,
    opacity: 0.6,
    textAlign: 'center',
    includeFontPadding: false,
    width: '100%',
  },
});
