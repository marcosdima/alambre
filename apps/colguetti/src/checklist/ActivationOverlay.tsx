import AppText from '../components/AppText';
import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveRoutine } from './use-active-routine';
import { useLang } from '../providers/lang';
import { useLightDark } from '../providers/theme';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import AppButton from '../components/AppButton';
import { ItemIcon } from '../items/icon-catalog';
import { AlambreIcons, CountUp } from 'alambre';
import { AlarmGlyph } from '../components/illustrations/SkiaArt';
import SkiaFrame from '../components/SkiaFrame';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';

const { width } = Dimensions.get('window');
const TILE_SIZE = (width - 64) / 2;

export default function ActivationOverlay() {
  const {
    routine,
    routineItems,
    ticked,
    remaining,
    success,
    allChecked,
    toggle,
    complete,
    postpone,
    dismiss,
    confirmAndClose,
  } = useActiveRoutine();
  const { lang } = useLang();
  const { theme } = useLightDark();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (Platform.OS === 'android') {
      void NavigationBar.setVisibilityAsync('hidden');
    }
    return () => {
      if (Platform.OS === 'android') {
        void NavigationBar.setVisibilityAsync('visible');
      }
    };
  }, []);

  // Auto-complete when all checked (since useActiveRoutine doesn't auto-complete on tick)
  useEffect(() => {
    if (routine && allChecked && !success) {
      complete();
    }
  }, [routine, allChecked, success, complete]);

  if (!routine) return null;

  const minutesLeft = Math.floor(remaining / 60000);
  const secondsLeft = Math.floor((remaining % 60000) / 1000);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: theme.background }]}
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(400)}
    >
      <View style={[styles.safeArea, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}>
        <Animated.View 
          entering={SlideInDown.springify().damping(28).stiffness(110)}
          style={styles.contentWrapper}
        >
          {/* Header Section */}
          <View style={styles.header}>
            {!success ? (
              <Animated.View entering={ZoomIn} exiting={ZoomOut} style={styles.glyphWrapper}>
                <AlarmGlyph line={theme.color} size={80} ringing={true} rippleWaves={3} />
              </Animated.View>
            ) : (
              <Animated.View entering={ZoomIn} style={styles.successBadge}>
                <Pressable onPress={() => confirmAndClose()} style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
                  <View style={[styles.successCircle, { backgroundColor: theme.primary }]}>
                    <AlambreIcons.Tick color={theme.onPrimary} lineWidth={3} style={{ width: 48, height: 48 }} />
                  </View>
                </Pressable>
              </Animated.View>
            )}
            
            {!success && (
              <View style={styles.countdownRow}>
                {minutesLeft < 10 && <AppText style={[styles.timeText, { color: theme.color }]}>0</AppText>}
                <CountUp value={minutesLeft} duration={400} style={[styles.timeText, { color: theme.color }]} />
                
                <AppText style={[styles.timeText, { color: theme.color, marginHorizontal: 12 }]}>:</AppText>
                
                {secondsLeft < 10 && <AppText style={[styles.timeText, { color: theme.color }]}>0</AppText>}
                <CountUp value={secondsLeft} duration={400} style={[styles.timeText, { color: theme.color }]} />
              </View>
            )}
            
            <AppText style={[styles.titleText, { color: theme.primary }]}>{routine.label}</AppText>
          </View>

          {/* Body Section */}
          <View style={styles.body}>
            {success ? (
              <Animated.View entering={FadeIn.delay(300)} style={styles.successMessage}>
                <Pressable onPress={() => confirmAndClose()} style={({ pressed }) => [{ alignItems: 'center', opacity: pressed ? 0.8 : 1 }]}>
                  <AppText style={[styles.successText, { color: theme.color }]}>¡Todo listo!</AppText>
                  <AppText style={[styles.successSubtext, { color: theme.muted }]}>Que tengas un buen día</AppText>
                  <AppText style={{ color: theme.primary, marginTop: 16, fontSize: 16, fontWeight: '600' }}>Toca para cerrar</AppText>
                </Pressable>
              </Animated.View>
            ) : (
              <ScrollView 
                contentContainerStyle={styles.gridContainer}
                showsVerticalScrollIndicator={false}
              >
                {routineItems.map((item, index) => {
                  const isTicked = !!ticked[item.id];
                  return (
                    <Animated.View 
                      key={item.id} 
                      entering={FadeIn.delay(100 + index * 100).springify()}
                    >
                      <Pressable
                        onPress={() => toggle(item.id)}
                        style={({ pressed }) => [
                          styles.tile,
                          {
                            width: TILE_SIZE,
                            height: 110,
                            backgroundColor: isTicked ? theme.primarySoft : theme.surfaceAlt,
                            transform: [{ scale: pressed ? 0.95 : 1 }],
                          }
                        ]}
                      >
                        {isTicked && (
                          <Animated.View entering={ZoomIn} style={[StyleSheet.absoluteFill, styles.tileCheckedBg, { backgroundColor: theme.primary }]} />
                        )}
                        <View style={[styles.iconBox, { backgroundColor: isTicked ? 'transparent' : item.color }]}>
                          {isTicked ? (
                            <AlambreIcons.Tick color={theme.onPrimary} lineWidth={3} style={styles.itemIcon} />
                          ) : (
                            <ItemIcon
                              icon={item.icon}
                              color="#fff"
                              style={styles.itemIcon}
                              lineWidth={2}
                            />
                          )}
                        </View>
                        <AppText
                          style={[
                            styles.itemName,
                            { color: isTicked ? theme.onPrimary : theme.color }
                          ]}
                          numberOfLines={2}
                        >
                          {item.name}
                        </AppText>
                        <SkiaFrame 
                          color={isTicked ? theme.onPrimary : theme.border} 
                          inset={6} 
                          cornerGap={10} 
                          strokeWidth={isTicked ? 2 : 1.5} 
                          cornerShape="dot" 
                        />
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* Footer Actions */}
          {!success && (
            <Animated.View entering={SlideInDown.delay(300)} style={styles.actions}>
              <AppButton
                variant="soft"
                tone="danger"
                label={lang.common.cancel || "Dismiss"}
                style={styles.actionBtn}
                onPress={dismiss}
              />
              <AppButton
                variant="solid"
                tone="warning"
                label="Snooze"
                style={styles.actionBtn}
                onPress={postpone}
              />
            </Animated.View>
          )}
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 9999,
  },
  safeArea: {
    flex: 1,
    paddingTop: 40,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  contentWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  glyphWrapper: {
    marginBottom: 8,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 8, // Agranda el espacio entre el título y la hora
  },
  timeText: {
    fontFamily: 'Kranky',
    fontSize: 84, // Agranda el tamaño de la fuente del contador
    lineHeight: 96,
    letterSpacing: 2,
    textAlign: 'center',
  },
  titleText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginTop: 16, // Agranda el espacio entre la hora y el título
  },
  body: {
    flex: 1,
    width: '100%',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    paddingBottom: 24,
  },
  tile: {
    borderRadius: 20,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  tileCheckedBg: {
    borderRadius: 20,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIcon: {
    width: 24,
    height: 24,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    paddingTop: 20,
  },
  actionBtn: {
    flex: 1,
    height: 56,
    borderRadius: 28,
  },
  successBadge: {
    marginBottom: 20,
    marginTop: 20,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successMessage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    fontFamily: 'Kranky',
    fontSize: 48,
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 18,
  },
});
