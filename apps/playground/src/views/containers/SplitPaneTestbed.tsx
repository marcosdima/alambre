import { useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { AlambreIcons } from 'alambre';
import { useLightDark } from '../../providers/theme';
import AppCard from '../../components/AppCard';
import AppButton from '../../components/AppButton';
import AppSwitch from '../../components/AppSwitch';
import AppSegmentedControl from '../../components/AppSegmentedControl';
import AppBadge from '../../components/AppBadge';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CONTAINER_HEIGHT = 300;
const CONTAINER_WIDTH = SCREEN_WIDTH - 32;

type Orientation = 'vertical' | 'horizontal';

export default function SplitPaneTestbed() {
  const { theme } = useLightDark();

  const [orientation, setOrientation] = useState<Orientation>('vertical');
  const [enableSnap, setEnableSnap] = useState(true);
  const [splitPercent, setSplitPercent] = useState(50); // 20% - 80%

  // Shared value for split ratio (0.20 - 0.80)
  const splitRatio = useSharedValue(0.5);
  const startRatio = useSharedValue(0.5);

  const SNAP_POINTS = [0.33, 0.5, 0.67];

  const applyRatio = (ratio: number, animated = true) => {
    const clamped = Math.max(0.2, Math.min(0.8, ratio));
    setSplitPercent(Math.round(clamped * 100));
    if (animated) {
      splitRatio.value = withSpring(clamped, { damping: 20, stiffness: 280 });
    } else {
      splitRatio.value = clamped;
    }
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startRatio.value = splitRatio.value;
    })
    .onUpdate((event) => {
      const totalSize = orientation === 'vertical' ? CONTAINER_HEIGHT : CONTAINER_WIDTH;
      const delta = orientation === 'vertical' ? event.translationY : event.translationX;
      const newRatio = startRatio.value + delta / totalSize;
      const clamped = Math.max(0.2, Math.min(0.8, newRatio));
      splitRatio.value = clamped;
    })
    .onEnd(() => {
      if (enableSnap) {
        // Find nearest snap point
        let nearest = SNAP_POINTS[0];
        let minDiff = Math.abs(splitRatio.value - SNAP_POINTS[0]);
        for (let i = 1; i < SNAP_POINTS.length; i++) {
          const diff = Math.abs(splitRatio.value - SNAP_POINTS[i]);
          if (diff < minDiff) {
            minDiff = diff;
            nearest = SNAP_POINTS[i];
          }
        }

        // If within snap capture radius (7%), snap to it
        if (minDiff < 0.08) {
          splitRatio.value = withSpring(nearest, { damping: 20, stiffness: 280 });
          return;
        }
      }
      splitRatio.value = withSpring(splitRatio.value, { damping: 20, stiffness: 280 });
    });

  const animatedPane1Style = useAnimatedStyle(() => {
    if (orientation === 'vertical') {
      return {
        height: `${splitRatio.value * 100}%` as DimensionValue,
        width: '100%',
      };
    }
    return {
      width: `${splitRatio.value * 100}%` as DimensionValue,
      height: '100%',
    };
  });

  const animatedPane2Style = useAnimatedStyle(() => {
    if (orientation === 'vertical') {
      return {
        height: `${(1 - splitRatio.value) * 100}%` as DimensionValue,
        width: '100%',
      };
    }
    return {
      width: `${(1 - splitRatio.value) * 100}%` as DimensionValue,
      height: '100%',
    };
  });

  return (
    <Animated.ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.headline, { color: theme.color }]}>
          Panel Dual Redimensionable
        </Text>
        <Text style={[styles.subheadline, { color: theme.muted }]}>
          Contenedor con divisor táctil arrastrable, snap points magnéticos y orientación adaptativa.
        </Text>
      </View>

      {/* Stage: Interactive Split Pane */}
      <View style={styles.stage}>
        <View
          style={[
            styles.splitStageBox,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              flexDirection: orientation === 'vertical' ? 'column' : 'row',
            },
          ]}
        >
          {/* Pane 1 (Primary / Input) */}
          <Animated.View
            style={[
              styles.pane,
              { backgroundColor: theme.surfaceAlt },
              animatedPane1Style,
            ]}
          >
            <View style={styles.paneHeader}>
              <AlambreIcons.Zap color={theme.primary} lineWidth={2.2} style={styles.paneIcon} />
              <Text style={[styles.paneTitle, { color: theme.color }]}>Entrada / Datos</Text>
              <AppBadge label="PANE 1" tone="primary" size="sm" />
            </View>

            <View style={[styles.codeBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.codeLine, { color: theme.muted }]}>
                {'{ "engine": "alambre", "fps": 120, "arch": "headless" }'}
              </Text>
            </View>
          </Animated.View>

          {/* Splitter Handle Bar */}
          <GestureDetector gesture={panGesture}>
            <View
              style={[
                orientation === 'vertical' ? styles.splitterHorizontal : styles.splitterVertical,
                { backgroundColor: theme.border },
              ]}
            >
              <View
                style={[
                  styles.handlePill,
                  orientation === 'vertical' ? styles.handlePillH : styles.handlePillV,
                  { backgroundColor: theme.primary },
                ]}
              />
            </View>
          </GestureDetector>

          {/* Pane 2 (Secondary / Preview) */}
          <Animated.View
            style={[
              styles.pane,
              { backgroundColor: theme.surface },
              animatedPane2Style,
            ]}
          >
            <View style={styles.paneHeader}>
              <AlambreIcons.Leaf color="#10b981" lineWidth={2.2} style={styles.paneIcon} />
              <Text style={[styles.paneTitle, { color: theme.color }]}>Vista Previa</Text>
              <AppBadge label="PANE 2" tone="success" size="sm" />
            </View>

            <View style={[styles.previewCard, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
              <Text style={[styles.previewText, { color: theme.color }]}>
                Renderizado Dinámico Reactivo
              </Text>
              <Text style={[styles.previewSubtext, { color: theme.muted }]}>
                El divisor responde con física táctil fluida sin repintar los árboles internos.
              </Text>
            </View>
          </Animated.View>
        </View>
      </View>

      {/* Control Panel / Parameters */}
      <AppCard
        variant="outlined"
        title="Parámetros del Panel Dual"
        subtitle={`Proporción activa: ${splitPercent}% / ${100 - splitPercent}%. Calibración de snap magnético.`}
        style={styles.controlCard}
        bodyStyle={styles.controlBody}
      >
        <View style={styles.controlGroup}>
          <Text style={[styles.controlLabel, { color: theme.color }]}>
            Orientación del Divisor
          </Text>
          <AppSegmentedControl
            options={[
              { label: 'Vertical (Arriba/Abajo)', value: 'vertical' },
              { label: 'Horizontal (Izq/Der)', value: 'horizontal' },
            ]}
            value={orientation}
            onChange={(val) => setOrientation(val as Orientation)}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: theme.color }]}>
            Snap Magnético (33% / 50% / 67%)
          </Text>
          <AppSwitch checked={enableSnap} onChange={setEnableSnap} size="sm" />
        </View>

        <View style={styles.quickSnapRow}>
          <Text style={[styles.controlLabel, { color: theme.muted }]}>Proporciones Rápidas:</Text>
          <View style={styles.snapButtonsGroup}>
            <AppButton
              variant="outline"
              tone="neutral"
              onPress={() => applyRatio(0.33)}
              style={styles.snapBtn}
            >
              <Text style={{ color: theme.color, fontSize: 12, fontWeight: '700' }}>33%</Text>
            </AppButton>
            <AppButton
              variant="outline"
              tone="neutral"
              onPress={() => applyRatio(0.5)}
              style={styles.snapBtn}
            >
              <Text style={{ color: theme.color, fontSize: 12, fontWeight: '700' }}>50%</Text>
            </AppButton>
            <AppButton
              variant="outline"
              tone="neutral"
              onPress={() => applyRatio(0.67)}
              style={styles.snapBtn}
            >
              <Text style={{ color: theme.color, fontSize: 12, fontWeight: '700' }}>67%</Text>
            </AppButton>
          </View>
        </View>
      </AppCard>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 56,
    gap: 20,
  },
  header: {
    paddingHorizontal: 20,
    gap: 4,
  },
  headline: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subheadline: {
    fontSize: 13,
    lineHeight: 18,
  },
  stage: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  splitStageBox: {
    width: CONTAINER_WIDTH,
    height: CONTAINER_HEIGHT,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  pane: {
    padding: 12,
    gap: 8,
    overflow: 'hidden',
  },
  paneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  paneIcon: {
    width: 18,
    height: 18,
  },
  paneTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  codeBox: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  codeLine: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  previewCard: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  previewText: {
    fontSize: 12,
    fontWeight: '700',
  },
  previewSubtext: {
    fontSize: 11,
    lineHeight: 15,
  },
  splitterHorizontal: {
    height: 14,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  splitterVertical: {
    width: 14,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  handlePill: {
    borderRadius: 3,
  },
  handlePillH: {
    width: 44,
    height: 4,
  },
  handlePillV: {
    height: 44,
    width: 4,
  },
  controlCard: {
    marginHorizontal: 16,
  },
  controlBody: {
    gap: 14,
  },
  controlGroup: {
    gap: 6,
  },
  controlLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    paddingRight: 10,
  },
  quickSnapRow: {
    gap: 8,
    paddingTop: 4,
  },
  snapButtonsGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  snapBtn: {
    flex: 1,
  },
});
