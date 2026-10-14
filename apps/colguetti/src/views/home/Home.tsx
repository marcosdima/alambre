import AppText from '../../components/AppText';
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { useNavigator, AlambreIcons, Typewriter, CountUp, DropInTitle } from 'alambre';
import { useLightDark } from '../../providers/theme';
import { useConfig } from '../../providers/config';
import { useLang } from '../../providers/lang';
import AppCard from '../../components/AppCard';
import SupportModal from '../../components/SupportModal';
import { HangingMobile, AlarmGlyph, ItemsGlyph, GeoHeart } from '../../components/illustrations/SkiaArt';
import { useAlarms } from '../../alarms/alarms-context';
import { useActivation } from '../../checklist/activation-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolateColor,
  useReducedMotion,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import DotGrid from '../../components/DotGrid';
import SkiaFrame from '../../components/SkiaFrame';
import type { Weekday, Alarm } from '../../alarms/alarm-types';

export default function Home() {
  const { theme } = useLightDark();
  const { config } = useConfig();
  const { lang } = useLang();
  const { navigate } = useNavigator();
  const { alarms } = useAlarms();
  const { activate } = useActivation();
  const [supportVisible, setSupportVisible] = useState(false);
  const isReducedMotion = useReducedMotion();

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isShort = windowHeight < 680;

  const mobileSize = Math.round(
    Math.min(windowWidth - 32, isShort ? 250 : 290),
  );
  const titleFontSize = isShort ? 32 : 36;
  const titleLineHeight = isShort ? 38 : 42;
  const buttonSize = isShort ? 42 : 46;
  const daySquareSize = isShort ? 26 : 30;
  const tileMinHeight = isShort ? 180 : 210;
  const glyphSize = isShort ? 72 : 82;

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
    if (carouselAlarms.length <= 1 || isReducedMotion) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [activeIndex, carouselAlarms.length, isReducedMotion]);

  useEffect(() => {
    if (carouselAlarms.length > 0 && activeIndex >= carouselAlarms.length) {
      setActiveIndex(0);
    }
  }, [carouselAlarms.length, activeIndex]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onEnd((event) => {
      if (event.translationX > 40) {
        runOnJS(prevAction)();
      } else if (event.translationX < -40) {
        runOnJS(next)();
      }
    });

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
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: isShort ? 2 : 6,
            paddingBottom: isShort ? 14 : 18,
            gap: isShort ? 6 : 8,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <SupportModal visible={supportVisible} onClose={() => setSupportVisible(false)} />

        {/* Top Header Bar */}
        <View style={styles.header}>
          <Pressable
            onPress={() => setSupportVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={lang.settings.supportTitle}
            hitSlop={isShort ? 6 : 4}
            style={({ pressed }) => [
              styles.roundButton,
              {
                width: buttonSize,
                height: buttonSize,
                borderRadius: buttonSize / 2,
                backgroundColor: theme.surfaceAlt,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <GeoHeart color={theme.danger} size={isShort ? 20 : 24} bpm={56} />
          </Pressable>
          <Pressable
            onPress={() => navigate('settings')}
            accessibilityRole="button"
            accessibilityLabel={lang.settings.title}
            hitSlop={isShort ? 6 : 4}
            style={({ pressed }) => [
              styles.roundButton,
              {
                width: buttonSize,
                height: buttonSize,
                borderRadius: buttonSize / 2,
                backgroundColor: theme.surfaceAlt,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Gear style={{ width: isShort ? 20 : 22, height: isShort ? 20 : 22 }} color={theme.color} />
          </Pressable>
        </View>

        {/* Hero Artwork & Brand Title */}
        <View style={[styles.center, { marginTop: 0, marginBottom: 0 }]}>
          <HangingMobile line={theme.color} size={mobileSize} />
          <DropInTitle
            text="Colguetti"
            style={{ marginTop: isShort ? -26 : -32 }}
            textStyle={[
              styles.title,
              {
                color: theme.color,
                fontFamily: config.fontFamily,
                fontSize: titleFontSize,
                lineHeight: titleLineHeight,
              },
            ]}
            fontFamily={config.fontFamily}
          />
        </View>

        {/* Menu & Routine Grid */}
        <View style={[styles.menuGrid, { gap: isShort ? 8 : 10 }]}>

          {/* Active Alarms Tile */}
          {carouselAlarms.length > 0 && currentAlarm ? (
            <View style={styles.activeAlarmsTile}>
              <AppCard
                variant="soft"
                padding="none"
                style={{ width: '100%' }}
                contentStyle={{
                  backgroundColor: theme.surfaceAlt,
                  paddingVertical: isShort ? 14 : 18,
                  paddingHorizontal: isShort ? 14 : 18,
                  borderRadius: 20,
                }}
              >
                <GestureDetector gesture={panGesture}>
                  <View style={[styles.cardGestureArea, { gap: isShort ? 8 : 10 }]}>
                    <View style={[styles.activeCardContent, { gap: isShort ? 8 : 10 }]}>
                      {/* Top Row: Phased Kinetic Header (Rolling Time at t=0, Typewriter at t=140) */}
                      <View style={styles.alarmHeaderRow}>
                        <Typewriter
                          key={currentAlarm.id}
                          text={currentAlarm.label}
                          textStyle={[
                            styles.activeCardTitle,
                            {
                              color: theme.color,
                              fontFamily: config.fontFamily,
                              fontSize: isShort ? 18 : 20,
                              lineHeight: isShort ? 24 : 26,
                            },
                          ]}
                          containerStyle={{ flex: 1, marginRight: 12, height: 32, justifyContent: 'center' }}
                          speed={35}
                          initialDelay={140}
                          cursor={false}
                          reserveSpace={false}
                          fontFamily={config.fontFamily}
                          numberOfLines={1}
                        />
                        <View
                          accessible
                          accessibilityRole="text"
                          accessibilityLabel={currentAlarm.time}
                          style={styles.timeCluster}
                        >
                          <CountUp
                            value={alarmHours}
                            padZeroes={2}
                            duration={350}
                            style={[
                              styles.timeDigit,
                              {
                                color: theme.color,
                                fontFamily: config.fontFamily,
                                fontSize: isShort ? 20 : 22,
                                lineHeight: isShort ? 24 : 26,
                              },
                            ]}
                          />
                          <AppText
                            style={[
                              styles.timeColon,
                              {
                                color: theme.color,
                                fontFamily: config.fontFamily,
                                fontSize: isShort ? 20 : 22,
                                lineHeight: isShort ? 24 : 26,
                              },
                            ]}
                          >
                            :
                          </AppText>
                          <CountUp
                            value={alarmMinutes}
                            padZeroes={2}
                            duration={350}
                            style={[
                              styles.timeDigit,
                              {
                                color: theme.color,
                                fontFamily: config.fontFamily,
                                fontSize: isShort ? 20 : 22,
                                lineHeight: isShort ? 24 : 26,
                              },
                            ]}
                          />
                        </View>
                      </View>

                      {/* Middle Row: Weekdays (Smooth color transition) */}
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
                              size={daySquareSize}
                              fontFamily={config.fontFamily}
                              dayLabel={lang.alarms.weekdays[dayIndex].charAt(0)}
                              accessibilityLabel={`${lang.alarms.weekdays[dayIndex]}${today === dayIndex ? `, ${lang.home.todayBadge}` : ''}${isMarked ? `, ${lang.alarms.enabledLabel}` : ''}`}
                            />
                          );
                        })}
                      </View>
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

                    {/* Bottom: Play Button full width */}
                    {activeAlarms.length > 0 && (
                      <View style={styles.playButtonWrapper}>
                        <Pressable
                          onPress={() => handlePlay(currentAlarm)}
                          accessibilityRole="button"
                          accessibilityLabel={`${lang.home.activate}: ${currentAlarm.label}`}
                          hitSlop={isShort ? { top: 4, bottom: 4 } : undefined}
                          style={({ pressed }) => [
                            styles.playButtonFull,
                            {
                              height: isShort ? 42 : 46,
                              backgroundColor: theme.primarySoft,
                              opacity: pressed ? 0.75 : 1,
                            },
                          ]}
                        >
                          <SkiaFrame color={theme.primary} inset={2} cornerGap={6} strokeWidth={1.5} cornerShape="dot" dashed />
                          <Play color={theme.primary} style={{ width: 22, height: 22, marginLeft: 2 }} />
                        </Pressable>
                      </View>
                    )}
                  </View>
                </GestureDetector>
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
                  paddingVertical: isShort ? 18 : 24,
                  borderRadius: 20,
                }}
              >
                <AppText style={{ color: theme.muted, fontSize: 16 }}>{lang.alarms.empty}</AppText>
              </AppCard>
              <SkiaFrame color={theme.border} inset={8} cornerGap={10} strokeWidth={2} cornerShape="dot" />
            </View>
          )}

          {/* Bottom Row - 2 Action Tiles */}
          <View style={[styles.bottomRow, { gap: isShort ? 8 : 12 }]}>
            <View style={styles.halfTile}>
              <AppCard
                variant="soft"
                padding="sm"
                onPress={() => navigate('alarms')}
                accessibilityLabel={`${lang.alarms.title}: ${lang.home.manageAlarms}`}
                style={{ width: '100%', flex: 1 }}
                contentStyle={{ backgroundColor: theme.primarySoft, flex: 1 }}
              >
                <View style={[styles.halfTileContent, { minHeight: tileMinHeight, paddingVertical: isShort ? 16 : 20 }]}>
                  <View style={styles.halfTileCopy}>
                    <AppText
                      numberOfLines={1}
                      style={[styles.tileTitle, { color: theme.color, fontSize: isShort ? 18 : 20 }]}
                    >
                      {lang.alarms.title}
                    </AppText>
                    <AppText
                      numberOfLines={2}
                      style={[styles.tileSubtitle, { color: theme.color, fontSize: isShort ? 12 : 13 }]}
                    >
                      {lang.home.manageAlarms}
                    </AppText>
                  </View>
                  <AlarmGlyph line={theme.color} size={glyphSize} ringing={true} rippleWaves={3} />
                </View>
              </AppCard>
              <SkiaFrame color={theme.primary} inset={12} cornerGap={10} strokeWidth={2} cornerShape="square" />
            </View>

            <View style={styles.halfTile}>
              <AppCard
                variant="soft"
                padding="sm"
                onPress={() => navigate('items')}
                accessibilityLabel={`${lang.items.title}: ${lang.tutorial.collection}`}
                style={{ width: '100%', flex: 1 }}
                contentStyle={{ backgroundColor: theme.dangerSoft, flex: 1 }}
              >
                <View style={[styles.halfTileContent, { minHeight: tileMinHeight, paddingVertical: isShort ? 16 : 20 }]}>
                  <View style={styles.halfTileCopy}>
                    <AppText
                      numberOfLines={1}
                      style={[styles.tileTitle, { color: theme.color, fontSize: isShort ? 18 : 20 }]}
                    >
                      {lang.items.title}
                    </AppText>
                    <AppText
                      numberOfLines={2}
                      style={[styles.tileSubtitle, { color: theme.color, fontSize: isShort ? 12 : 13 }]}
                    >
                      {lang.tutorial.collection}
                    </AppText>
                  </View>
                  <ItemsGlyph line={theme.color} size={glyphSize} />
                </View>
              </AppCard>
              <SkiaFrame color={theme.danger} inset={12} cornerGap={10} strokeWidth={2} cornerShape="triangle" rotateCorners />
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

type AnimatedDaySquareProps = {
  isMarked: boolean;
  isToday: boolean;
  theme: ReturnType<typeof useLightDark>['theme'];
  dayLabel: string;
  dayIndex?: number;
  size?: number;
  fontFamily?: string;
  accessibilityLabel?: string;
};

function AnimatedDaySquare({
  isMarked,
  isToday,
  theme,
  dayLabel,
  size = 28,
  fontFamily,
  accessibilityLabel,
}: AnimatedDaySquareProps) {
  const isReducedMotion = useReducedMotion();
  const colorProgress = useSharedValue(isMarked ? 1 : 0);

  useEffect(() => {
    if (isReducedMotion) {
      colorProgress.value = isMarked ? 1 : 0;
      return;
    }
    colorProgress.value = withTiming(isMarked ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.quad),
    });
  }, [isMarked, isReducedMotion, colorProgress]);

  const defaultBorderColor = isToday ? theme.danger : theme.borderSoft;
  const activeBorderColor = isToday ? theme.danger : theme.primary;

  const defaultBgColor = isToday ? theme.dangerSoft : 'transparent';
  const activeBgColor = isToday ? theme.dangerSoft : theme.primarySoft;

  const defaultTextColor = isToday ? theme.dangerText : theme.muted;
  const activeTextColor = isToday ? theme.dangerText : theme.primary;

  const animatedSquareStyle = useAnimatedStyle(() => {
    const bg = interpolateColor(
      colorProgress.value,
      [0, 1],
      [defaultBgColor, activeBgColor],
    );
    const border = interpolateColor(
      colorProgress.value,
      [0, 1],
      [defaultBorderColor, activeBorderColor],
    );
    return {
      backgroundColor: bg,
      borderColor: border,
    };
  });

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
        {
          width: size,
          height: size,
        },
        animatedSquareStyle,
      ]}
    >
      <Animated.Text
        allowFontScaling={false}
        style={[
          styles.dayText,
          { fontFamily, fontSize: size <= 26 ? 11 : 12 },
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
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
  roundButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  title: {
    paddingVertical: 0,
    includeFontPadding: false,
    letterSpacing: 1.5,
  },
  menuGrid: {
    width: '100%',
  },
  bottomRow: {
    flexDirection: 'row',
  },
  activeAlarmsTile: {
    width: '100%',
  },
  cardGestureArea: {
    flexDirection: 'column',
    width: '100%',
  },
  activeCardContent: {
    flexDirection: 'column',
    width: '100%',
  },
  alarmHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  activeCardTitle: {
    includeFontPadding: false,
    flexShrink: 1,
  },
  timeCluster: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeDigit: {
    includeFontPadding: false,
  },
  timeColon: {
    marginHorizontal: 1,
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
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dayText: {
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
    borderRadius: 14,
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
    justifyContent: 'space-between',
  },
  halfTileCopy: {
    width: '100%',
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
    justifyContent: 'center',
  },
  tileTitle: {
    includeFontPadding: false,
    textAlign: 'center',
  },
  tileSubtitle: {
    opacity: 0.6,
    textAlign: 'center',
    includeFontPadding: false,
    width: '100%',
  },
});
