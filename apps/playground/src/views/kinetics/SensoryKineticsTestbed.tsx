import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useLightDark } from '../../providers/theme';
import {
  AppTitle,
  AppText,
  AppCard,
  AppButton,
  AppBadge,
  AppNumberPicker,
} from 'alambre/ui';
import {
  useSpatialFlip,
  usePressKinetics,
  useWheelPicker,
  createSensoryCues,
} from 'alambre';

const ROW_HEIGHT = 44;

export default function SensoryKineticsTestbed() {
  const { theme } = useLightDark();
  const [log, setLog] = useState<string[]>([]);
  const [wheelSelected, setWheelSelected] = useState(0);
  const [isWheelDragging, setIsWheelDragging] = useState(false);

  const addCueLog = (cue: string) => {
    setLog((prev) => [`[CUE] ${cue} fired at ${new Date().toLocaleTimeString()}`, ...prev.slice(0, 10)]);
  };

  const sensoryCues = React.useMemo(() => {
    return createSensoryCues({
      onHaptic: (cue) => {
        addCueLog(`Haptic: ${cue}`);
      },
      onSound: (cue) => {
        addCueLog(`Audio: ${cue}`);
      },
    });
  }, []);

  // 1. Press Kinetics with Declarative Sensory Cues
  const { pressProps, animatedStyle: buttonAnimatedStyle } = usePressKinetics({
    activeScale: 0.94,
    sensory: {
      onPressIn: () => sensoryCues.actions.trigger('button_press_in'),
      onPressOut: () => sensoryCues.actions.trigger('button_release'),
      store: sensoryCues,
    },
  });

  // 2. Spatial Flip with Midpoint Inflection & Landing Cues
  const {
    frontAnimatedStyle,
    backAnimatedStyle,
    containerAnimatedStyle,
    flip,
    isFlipped,
  } = useSpatialFlip({
    perspective: 1000,
    liftHeight: 25,
    sensory: {
      onFlipMidpoint: () => sensoryCues.actions.trigger('card_flip_90deg_midpoint'),
      onLand: () => sensoryCues.actions.trigger('card_land_settle'),
      store: sensoryCues,
    },
  });

  // 3. Tactile Wheel Picker with Snap Tick Cues
  const {
    currentPosition: wheelPosition,
    gesture: wheelGesture,
    allItems: wheelItems,
  } = useWheelPicker({
    itemCount: 10,
    selected: wheelSelected,
    onSelect: setWheelSelected,
    rowHeight: ROW_HEIGHT,
    onDragStart: () => setIsWheelDragging(true),
    onDragEnd: () => setIsWheelDragging(false),
    sensory: {
      onTick: () => sensoryCues.actions.trigger('wheel_tick'),
      onLand: () => sensoryCues.actions.trigger('wheel_settle'),
      store: sensoryCues,
    },
  });

  const wheelAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateY: ROW_HEIGHT - wheelPosition.value * ROW_HEIGHT }],
    };
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      scrollEnabled={!isWheelDragging}
    >
      <View style={[styles.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <AppTitle level={2}>Declarative Sensory Kinetics</AppTitle>
        <AppText variant="muted">
          Automatic audio/haptic dispatch at physical inflection points (midpoints, ticks, landing) with zero worklet boilerplate.
        </AppText>
      </View>

      {/* Section 1: Press Kinetics */}
      <AppCard variant="outlined" style={[styles.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <AppTitle level={3}>1. Press Inflection Cues</AppTitle>
        <AppText variant="muted">
          Touch down and release triggers tactile cues automatically.
        </AppText>
        <View style={styles.centerBox}>
          <Animated.View style={buttonAnimatedStyle}>
            <Pressable {...pressProps} style={[styles.demoButton, { backgroundColor: theme.primary }]}>
              <AppText variant="subtitle" style={{ color: '#ffffff', fontWeight: '700' }}>
                Tactile Press Button
              </AppText>
            </Pressable>
          </Animated.View>
        </View>
      </AppCard>

      {/* Section 2: 3D Flip with Midpoint Cue */}
      <AppCard variant="outlined" style={[styles.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <AppTitle level={3}>2. 3D Spatial Flip Midpoint Cue</AppTitle>
        <AppText variant="muted">
          Crossing the 90° parabolic midpoint triggers a distinct haptic pulse.
        </AppText>

        <View style={styles.centerBox}>
          <Pressable onPress={flip}>
            <Animated.View style={[styles.flipContainer, containerAnimatedStyle]}>
              {/* Front Face */}
              <Animated.View
                style={[
                  styles.flipFace,
                  { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                  frontAnimatedStyle,
                ]}
              >
                <AppBadge tone="primary" size="md">FACE UP</AppBadge>
                <AppText variant="body" style={{ fontWeight: '600' }}>Tap to Flip</AppText>
              </Animated.View>

              {/* Back Face */}
              <Animated.View
                style={[
                  styles.flipFace,
                  { backgroundColor: theme.primary, borderColor: theme.primary },
                  backAnimatedStyle,
                ]}
              >
                <AppBadge tone="neutral" size="md">FACE DOWN</AppBadge>
                <AppText variant="body" style={{ color: '#ffffff', fontWeight: '600' }}>
                  Flipped 180°
                </AppText>
              </Animated.View>
            </Animated.View>
          </Pressable>
        </View>

        <AppButton size="sm" variant="outline" onPress={flip}>
          Toggle Flip ({isFlipped ? 'Back' : 'Front'})
        </AppButton>
      </AppCard>

      {/* Section 3: Wheel Snap Tick Cues */}
      <AppCard variant="outlined" style={[styles.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <AppTitle level={3}>3. Wheel Picker Tick Snapping</AppTitle>
        <AppText variant="muted">
          Selected item: {wheelSelected} (Ticks dispatched on each discrete integer index).
        </AppText>

        <AppNumberPicker
          label="Horizontal Wheel Picker"
          unit=" pts"
          itemCount={10}
          selected={wheelSelected}
          onSelect={setWheelSelected}
          itemWidth={64}
          visibleItems={5}
          sensory={{
            onTick: () => sensoryCues.actions.trigger('wheel_tick'),
            onLand: () => sensoryCues.actions.trigger('wheel_settle'),
            store: sensoryCues,
          }}
        />

        <View style={styles.verticalWheelBox}>
          <AppText variant="subtitle" style={{ fontSize: 13, fontWeight: '600' }}>
            Vertical Wheel Column (Flick & Tap)
          </AppText>
          <View style={[styles.wheelWrapper, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <View
              pointerEvents="none"
              style={[styles.wheelIndicator, { borderColor: theme.primary, backgroundColor: theme.primarySoft }]}
            />
            <GestureDetector gesture={wheelGesture}>
              <Animated.View style={[styles.wheelContent, wheelAnimatedStyle]}>
                {wheelItems.map((num, i) => (
                  <View key={i} style={styles.wheelRow}>
                    <AppText
                      variant="body"
                      style={{
                        fontSize: 16,
                        fontWeight: num === wheelSelected ? '700' : '500',
                        color: num === wheelSelected ? theme.primary : theme.muted,
                      }}
                    >
                      Option #{num}
                    </AppText>
                  </View>
                ))}
              </Animated.View>
            </GestureDetector>
          </View>
        </View>
      </AppCard>

      {/* Real-time Sensory Log */}
      <AppCard variant="outlined" style={[styles.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <AppTitle level={3}>Sensory Dispatch Log</AppTitle>
        <AppText variant="muted" style={{ fontSize: 12 }}>
          {log.length === 0 ? 'Interact with any element above to observe cues.' : log.join('\n')}
        </AppText>
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  panel: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  centerBox: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  demoButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  flipContainer: {
    width: 180,
    height: 110,
    position: 'relative',
  },
  flipFace: {
    ...StyleSheet.absoluteFill,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  verticalWheelBox: {
    gap: 8,
    marginTop: 8,
  },
  wheelWrapper: {
    height: ROW_HEIGHT * 3,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  wheelIndicator: {
    position: 'absolute',
    top: ROW_HEIGHT,
    height: ROW_HEIGHT,
    left: 8,
    right: 8,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderRadius: 8,
  },
  wheelContent: {
    width: '100%',
  },
  wheelRow: {
    height: ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
