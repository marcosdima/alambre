import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  Keyframe,
} from 'react-native-reanimated';
import { AlambreIcons } from 'alambre';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import AppSlider from '../../components/AppSlider';
import AppSegmentedControl from '../../components/AppSegmentedControl';
import AppSelect from '../../components/AppSelect';
import AppButton from '../../components/AppButton';

type PatternMode = 'alternate' | 'cascade' | 'pop';
type EasingType = 'cubic' | 'quad' | 'back' | 'bounce';
type EngineMode = 'preset' | 'keyframe';

export default function AnimationTest() {
  const { theme } = useLightDark();
  const { lang } = useLang();

  // Slider magnitudes
  const [duration, setDuration] = useState(260);
  const [stagger, setStagger] = useState(100);
  const [distance, setDistance] = useState(30);
  const [initialScale, setInitialScale] = useState(0.9);

  // Selectors
  const [pattern, setPattern] = useState<PatternMode>('alternate');
  const [easingCurve, setEasingCurve] = useState<EasingType>('cubic');
  const [engine, setEngine] = useState<EngineMode>('preset');
  const [slowMotion, setSlowMotion] = useState(false);
  const [replayKey, setReplayKey] = useState(0);

  const getEasingFunction = (curve: EasingType) => {
    switch (curve) {
      case 'quad':
        return Easing.out(Easing.quad);
      case 'back':
        return Easing.out(Easing.back(1.6));
      case 'bounce':
        return Easing.out(Easing.bounce);
      case 'cubic':
      default:
        return Easing.out(Easing.cubic);
    }
  };

  const getEnteringAnimation = (index: number) => {
    const speedMult = slowMotion ? 4 : 1;
    const actualDuration = duration * speedMult;
    const actualDelay = index * stagger * speedMult;
    const isEven = index % 2 === 0;

    if (pattern === 'pop') {
      return new Keyframe({
        0: {
          opacity: 0,
          transform: [{ scale: initialScale }],
        },
        100: {
          opacity: 1,
          transform: [{ scale: 1 }],
        },
      })
        .duration(actualDuration)
        .delay(actualDelay);
    }

    if (engine === 'keyframe') {
      if (pattern === 'alternate') {
        const offset = isEven ? -distance : distance;
        return new Keyframe({
          0: {
            opacity: 0,
            transform: [{ translateX: offset }, { scale: initialScale }],
          },
          100: {
            opacity: 1,
            transform: [{ translateX: 0 }, { scale: 1 }],
          },
        })
          .duration(actualDuration)
          .delay(actualDelay);
      }
      return new Keyframe({
        0: {
          opacity: 0,
          transform: [{ translateY: -distance }, { scale: initialScale }],
        },
        100: {
          opacity: 1,
          transform: [{ translateY: 0 }, { scale: 1 }],
        },
      })
        .duration(actualDuration)
        .delay(actualDelay);
    }

    // Engine === 'preset'
    if (pattern === 'alternate') {
      const Builder = isEven ? FadeInLeft : FadeInRight;
      return Builder.duration(actualDuration)
        .delay(actualDelay)
        .easing(getEasingFunction(easingCurve));
    }

    return FadeInDown.duration(actualDuration)
      .delay(actualDelay)
      .easing(getEasingFunction(easingCurve));
  };

  const patternOptions = [
    { value: 'alternate' as const, label: 'Alternado' },
    { value: 'cascade' as const, label: 'Cascada' },
    { value: 'pop' as const, label: 'Pop / Zoom' },
  ];

  const engineOptions = [
    { value: 'preset' as const, label: 'Reanimated Presets' },
    { value: 'keyframe' as const, label: 'Dynamic Keyframe' },
  ];

  const easingOptions = [
    {
      value: 'cubic' as const,
      label: 'Cubic Out',
      description: 'Curva suave y natural para elementos de interfaz.',
    },
    {
      value: 'quad' as const,
      label: 'Quad Out',
      description: 'Respuesta rápida y aceleración uniforme.',
    },
    {
      value: 'back' as const,
      label: 'Back Out (Springy)',
      description: 'Rebote elástico sutil con overshoot al final.',
    },
    {
      value: 'bounce' as const,
      label: 'Bounce Out',
      description: 'Efecto de rebote físico articulado.',
    },
  ];

  const previewCards = [
    {
      id: 1,
      title: 'Perfil de Usuario',
      subtitle: 'Configuración de cuenta activa',
      tag: 'Activo',
      icon: (
        <AlambreIcons.Sun
          drawIt={true}
          color={theme.primary}
          lineWidth={2.5}
          style={{ width: 22, height: 22 }}
        />
      ),
    },
    {
      id: 2,
      title: 'Notificaciones Push',
      subtitle: 'Alertas inmediatas y resumen diario',
      tag: 'Activado',
      icon: (
        <AlambreIcons.Zap
          drawIt={true}
          color={theme.primary}
          lineWidth={2.5}
          style={{ width: 22, height: 22 }}
        />
      ),
    },
    {
      id: 3,
      title: 'Sincronización en la Nube',
      subtitle: 'Respaldos automáticos cada 24 horas',
      tag: 'Completado',
      icon: (
        <AlambreIcons.Tick
          drawIt={true}
          color={theme.primary}
          lineWidth={2.5}
          style={{ width: 22, height: 22 }}
        />
      ),
    },
  ];

  return (
    <View style={[styles.container, styles.content, { backgroundColor: theme.background }]}>
      {/* Controls Card */}
      <View
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={styles.titleRow}>
          <View style={styles.titleGroup}>
            <Text style={[styles.title, { color: theme.color }]}>
              {lang.animations.title}
            </Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>
              {lang.animations.subtitle}
            </Text>
          </View>
          {/* Slow Motion Button */}
          <Pressable
            onPress={() => setSlowMotion((s) => !s)}
            style={[
              styles.slowMoChip,
              {
                backgroundColor: slowMotion ? theme.primarySoft : theme.surfaceAlt,
                borderColor: slowMotion ? theme.primary : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.slowMoText,
                { color: slowMotion ? theme.primary : theme.color },
              ]}
            >
              {slowMotion ? '⏱ 0.25x' : '⏱ 1.0x'}
            </Text>
          </Pressable>
        </View>

        {/* Sliders Section */}
        <View style={styles.slidersContainer}>
          <AppSlider
            label={lang.animations.duration}
            unit="ms"
            value={duration}
            min={50}
            max={1000}
            step={25}
            onChange={setDuration}
          />
          <AppSlider
            label={lang.animations.delay}
            unit="ms"
            value={stagger}
            min={0}
            max={500}
            step={25}
            onChange={setStagger}
          />
          {pattern !== 'pop' && (
            <AppSlider
              label={lang.animations.distance}
              unit="px"
              value={distance}
              min={5}
              max={120}
              step={5}
              onChange={setDistance}
            />
          )}
          {pattern === 'pop' && (
            <AppSlider
              label="Escala Inicial"
              unit="x"
              value={initialScale}
              min={0.5}
              max={1}
              step={0.05}
              onChange={setInitialScale}
            />
          )}
        </View>

        {/* Pattern Segmented Control */}
        <AppSegmentedControl<PatternMode>
          label={lang.animations.pattern}
          value={pattern}
          options={patternOptions}
          onChange={setPattern}
        />

        {/* Easing Dropdown Select */}
        <AppSelect<EasingType>
          label="Curva de Aceleración"
          value={easingCurve}
          options={easingOptions}
          onChange={setEasingCurve}
        />

        {/* Engine Segmented Control */}
        {pattern !== 'pop' && (
          <AppSegmentedControl<EngineMode>
            label="Motor de Render"
            value={engine}
            options={engineOptions}
            onChange={setEngine}
          />
        )}

        {/* Replay Button */}
        <AppButton onPress={() => setReplayKey((k) => k + 1)}>
          <Text style={{ color: theme.primary, fontWeight: '700' }}>
            {lang.animations.replay} (↺)
          </Text>
        </AppButton>
      </View>

      {/* Preview Section */}
      <View key={`preview-${replayKey}`} style={styles.previewContainer}>
        {previewCards.map((card, index) => {
          const appliedDelay = index * stagger * (slowMotion ? 4 : 1);
          return (
            <Animated.View
              key={card.id}
              entering={getEnteringAnimation(index)}
              style={[
                styles.previewCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.previewHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: theme.primarySoft,
                        borderColor: theme.primary,
                      },
                    ]}
                  >
                    {card.icon}
                  </View>
                  <View style={styles.cardTitles}>
                    <Text style={[styles.cardTitle, { color: theme.color }]}>
                      {card.title}
                    </Text>
                    <Text style={[styles.cardSubtitle, { color: theme.muted }]}>
                      {card.subtitle}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.tagBadge,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.tagText, { color: theme.primary }]}>
                    {card.tag}
                  </Text>
                </View>
              </View>

              {/* Param specs footer */}
              <View
                style={[
                  styles.cardFooter,
                  { borderTopColor: theme.border, borderTopWidth: 1 },
                ]}
              >
                <Text style={[styles.paramBadge, { color: theme.muted }]}>
                  {`+${appliedDelay}ms delay`}
                </Text>
                <Text style={[styles.paramBadge, { color: theme.muted }]}>
                  {`${duration * (slowMotion ? 4 : 1)}ms duración`}
                </Text>
                <Text style={[styles.paramBadge, { color: theme.muted }]}>
                  {easingCurve}
                </Text>
              </View>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 18,
    gap: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleGroup: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  slowMoChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  slowMoText: {
    fontSize: 12,
    fontWeight: '700',
  },
  slidersContainer: {
    gap: 8,
  },
  previewContainer: {
    gap: 12,
  },
  previewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitles: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  paramBadge: {
    fontSize: 11,
    fontWeight: '500',
  },
});
