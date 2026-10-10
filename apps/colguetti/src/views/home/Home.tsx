import AppText from '../../components/AppText';
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Pressable, PanResponder } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, withSpring, FadeIn } from 'react-native-reanimated';
import { useNavigator, AlambreIcons, Typewriter, CountUp } from 'alambre';
import { useLightDark } from '../../providers/theme';
import { useConfig } from '../../providers/config';
import { useLang } from '../../providers/lang';
import AppCard from '../../components/AppCard';
import SupportModal from '../../components/SupportModal';
import DropInTitle from '../../components/DropInTitle';
import { HangingMobile, AlarmGlyph, ItemsGlyph, GeoHeart } from '../../components/illustrations/SkiaArt';
import { useAlarms } from '../../alarms/alarms-context';
import { useActivation } from '../../checklist/activation-context';
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
  const today = new Date().getDay();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <DotGrid color={theme.border} spacing={35} radius={1.5} opacity={0.4} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <SupportModal visible={supportVisible} onClose={() => setSupportVisible(false)} />

        <View style={styles.header}>
          <Pressable
            onPress={() => setSupportVisible(true)}
            style={({ pressed }) => [
              styles.roundButton,
              { backgroundColor: theme.surfaceAlt, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <GeoHeart color={theme.danger} size={24} bpm={56} />
          </Pressable>
          <Pressable
            onPress={() => navigate('settings')}
            style={({ pressed }) => [
              styles.roundButton,
              { backgroundColor: theme.surfaceAlt, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Gear style={{ width: 22, height: 22 }} color={theme.color} />
          </Pressable>
        </View>

        <View style={styles.center}>
          <HangingMobile line={theme.color} size={300} />
          <DropInTitle text="Colguetti" textStyle={[styles.title, { color: theme.color, marginTop: -10 }]} />
        </View>

        <View style={styles.menuGrid}>

          {/* Active Alarms Component - Top Row */}
          {carouselAlarms.length > 0 && currentAlarm ? (
            <View style={{ gap: 16 }}>
              <View style={styles.activeAlarmsTile}>
                <AppCard
                  variant="soft"
                  padding="lg"
                  style={{ width: '100%' }}
                  contentStyle={{ backgroundColor: theme.surfaceAlt }}
                >
                  <View style={{ width: '100%' }} onStartShouldSetResponder={() => true} {...panResponder.panHandlers}>

                    <View style={styles.activeCardContent}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 50 }}>
                        <Typewriter
                          text={currentAlarm.label}
                          textStyle={[styles.activeCardTitle, { color: theme.color, margin: 0, padding: 0 }]}
                          containerStyle={{ flex: 1 }}
                          speed={30}
                          cursor={false}
                          numberOfLines={1}
                        />
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                          {Number(currentAlarm.time.split(':')[0]) < 10 && <AppText style={{ fontSize: 18, lineHeight: 22, color: theme.color }}>0</AppText>}
                          <CountUp value={Number(currentAlarm.time.split(':')[0])} duration={800} style={{ fontSize: 18, lineHeight: 22, color: theme.color, fontFamily: config.fontFamily }} />
                          <AppText style={{ fontSize: 18, lineHeight: 22, color: theme.color }}>:</AppText>
                          {Number(currentAlarm.time.split(':')[1]) < 10 && <AppText style={{ fontSize: 18, lineHeight: 22, color: theme.color }}>0</AppText>}
                          <CountUp value={Number(currentAlarm.time.split(':')[1])} duration={800} style={{ fontSize: 18, lineHeight: 22, color: theme.color, fontFamily: config.fontFamily }} />
                        </View>
                      </View>

                      <View style={[styles.daysRow, { justifyContent: 'center' }]}>
                        {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
                          <AnimatedDaySquare
                            key={dayIndex}
                            isMarked={currentAlarm.weekdays.includes(dayIndex as Weekday)}
                            isToday={today === dayIndex}
                            theme={theme}
                            dayLabel={lang.alarms.weekdays[dayIndex].charAt(0)}
                          />
                        ))}
                      </View>
                    </View>

                    {/* Pagination Dots */}
                    {carouselAlarms.length > 1 && (
                      <View style={styles.paginationDots}>
                        {carouselAlarms.map((_, idx) => (
                          <Pressable key={idx} onPress={() => setActiveIndex(idx)} hitSlop={10}>
                            <View style={[
                              styles.dot,
                              { backgroundColor: theme.color, opacity: idx === activeIndex ? 1 : 0.3 },
                            ]} />
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>

                  {activeAlarms.length > 0 && (
                    <View style={{ marginTop: 16, alignItems: 'center' }}>
                      <Pressable
                        onPress={() => handlePlay(currentAlarm)}
                        style={({ pressed }) => [
                          {
                            backgroundColor: 'transparent',
                            opacity: pressed ? 0.7 : 1,
                            width: '100%',
                            height: 56,
                            borderRadius: 24,
                            alignItems: 'center',
                            justifyContent: 'center',
                          },
                        ]}
                      >
                        <SkiaFrame color={theme.primary} inset={6} cornerGap={8} strokeWidth={2} cornerShape="dot" dashed />
                        <Play color={theme.primary} style={{ width: 28, height: 28, marginLeft: 4 }} />
                      </Pressable>
                    </View>
                  )}
                </AppCard>
                <SkiaFrame color={theme.border} inset={16} cornerGap={12} strokeWidth={2} cornerShape="dot" />
              </View>
            </View>
          ) : (
            <View style={styles.activeAlarmsTile}>
              <AppCard
                variant="soft"
                padding="lg"
                style={{ width: '100%' }}
                contentStyle={{ backgroundColor: theme.surfaceAlt, alignItems: 'center', justifyContent: 'center', height: 100 }}
              >
                <AppText style={{ color: theme.muted, fontSize: 16 }}>{lang.alarms.empty}</AppText>
              </AppCard>
              <SkiaFrame color={theme.border} inset={16} cornerGap={12} strokeWidth={2} cornerShape="dot" />
            </View>
          )}

          {/* Bottom Row - 2 Columns */}
          <View style={styles.bottomRow}>
            <View style={styles.halfTile}>
              <AppCard
                variant="soft"
                padding="lg"
                onPress={() => navigate('alarms')}
                style={{ width: '100%' }}
                contentStyle={{ backgroundColor: theme.primarySoft }}
              >
                <View style={styles.halfTileContent}>
                  <View style={styles.halfTileCopy}>
                    <AppText style={[styles.tileTitle, { color: theme.color, textAlign: 'center' }]}>Alarms</AppText>
                    <AppText style={{ color: theme.color, opacity: 0.6, textAlign: 'center' }}>Manage</AppText>
                  </View>
                  <AlarmGlyph line={theme.color} size={70} ringing={true} rippleWaves={3} />
                </View>
              </AppCard>
              <SkiaFrame color={theme.primary} inset={16} cornerGap={12} strokeWidth={2} cornerShape="square" />
            </View>

            <View style={styles.halfTile}>
              <AppCard
                variant="soft"
                padding="lg"
                onPress={() => navigate('items')}
                style={{ width: '100%' }}
                contentStyle={{ backgroundColor: theme.dangerSoft }}
              >
                <View style={styles.halfTileContent}>
                  <View style={styles.halfTileCopy}>
                    <AppText style={[styles.tileTitle, { color: theme.color, textAlign: 'center' }]}>My Items</AppText>
                    <AppText style={{ color: theme.color, opacity: 0.6, textAlign: 'center' }}>Library</AppText>
                  </View>
                  <ItemsGlyph line={theme.color} size={70} />
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

type AnimatedDaySquareProps = {
  isMarked: boolean;
  isToday: boolean;
  theme: ReturnType<typeof useLightDark>['theme'];
  dayLabel: string;
};

function AnimatedDaySquare({ isMarked, isToday, theme, dayLabel }: AnimatedDaySquareProps) {
  const bg = useDerivedValue(() => {
    return isToday ? theme.dangerSoft : isMarked ? theme.primarySoft : 'transparent';
  }, [isToday, isMarked, theme]);

  const borderColor = useDerivedValue(() => {
    return isToday ? theme.danger : isMarked ? theme.primary : theme.borderSoft;
  }, [isToday, isMarked, theme]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: withSpring(bg.value),
    borderColor: withSpring(borderColor.value),
  }));

  const textColor = isToday ? theme.danger : isMarked ? theme.primary : theme.muted;

  return (
    <Animated.View style={[styles.daySquare, animatedStyle]}>
      <AppText style={[styles.dayText, { color: textColor }]}>
        {dayLabel}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 24,
  },
  header: {
    position: 'absolute',
    top: 16,
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
    marginTop: 32,
    marginBottom: -8,
  },
  title: {

    fontSize: 54,
    lineHeight: 80,
    paddingVertical: 20,
    includeFontPadding: true,
    letterSpacing: 2,
  },
  menuGrid: {
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    gap: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 16,
  },
  activeAlarmsTile: {
    width: '100%',
  },
  halfTile: {
    flex: 1,
  },
  halfTileContent: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
  },
  halfTileCopy: {
    alignItems: 'center',
    gap: 4,
  },
  tileTitle: {
    fontSize: 22,
  },
  activeCardContent: {
    flex: 1,
    gap: 14,
  },
  activeCardTitle: {
    fontSize: 22,
    flexShrink: 1,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  daySquare: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 12,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
