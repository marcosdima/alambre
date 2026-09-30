import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { AlambreIcons } from 'alambre';
import { useLightDark } from '../../providers/theme';

type Theme = ReturnType<typeof useLightDark>['theme'];
import AppCard from '../../components/AppCard';
import AppSlider from '../../components/AppSlider';
import AppSwitch from '../../components/AppSwitch';
import AppSegmentedControl from '../../components/AppSegmentedControl';
import AppButton from '../../components/AppButton';
import AppBadge from '../../components/AppBadge';

const SCREEN_WIDTH = Dimensions.get('window').width;

type CarouselCardData = {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  tone: 'primary' | 'success' | 'warning' | 'danger';
  iconName: 'Zap' | 'Leaf' | 'Heart' | 'Trophy' | 'Coffee';
  accentColor: string;
};

const SAMPLE_CARDS: CarouselCardData[] = [
  {
    id: 'c1',
    title: 'Alambre Core',
    subtitle: 'Arquitectura headless y contratos desacoplados.',
    tag: 'FRAMEWORK',
    tone: 'primary',
    iconName: 'Zap',
    accentColor: '#3b82f6',
  },
  {
    id: 'c2',
    title: 'Microfísica Nativa',
    subtitle: 'Reanimated 4 worklets y resortes críticos.',
    tag: 'KINETIC',
    tone: 'success',
    iconName: 'Leaf',
    accentColor: '#10b981',
  },
  {
    id: 'c3',
    title: 'Tokens Semánticos',
    subtitle: 'Soporte dinámico claro / oscuro sin flash.',
    tag: 'DESIGN',
    tone: 'warning',
    iconName: 'Heart',
    accentColor: '#f59e0b',
  },
  {
    id: 'c4',
    title: 'Gestos y Arrastre',
    subtitle: 'Colisiones matemáticas y drop zones reactivas.',
    tag: 'GESTURES',
    tone: 'primary',
    iconName: 'Trophy',
    accentColor: '#8b5cf6',
  },
  {
    id: 'c5',
    title: 'Cero Dependencias',
    subtitle: 'Exportable a base-expo sin paquetes pesados.',
    tag: 'CLEAN',
    tone: 'danger',
    iconName: 'Coffee',
    accentColor: '#ef4444',
  },
];

type CarouselEffect = 'scale' | 'coverflow' | 'flat';

export function calculateSnapInterval(cardWidth: number, cardGap: number): number {
  return Math.round(cardWidth + cardGap);
}

export function calculateActiveIndex(
  scrollX: number,
  snapInterval: number,
  totalItems: number,
): number {
  if (snapInterval <= 0 || totalItems <= 0) return 0;
  const raw = Math.round(scrollX / snapInterval);
  return Math.max(0, Math.min(raw, totalItems - 1));
}

export function getScrollTargetForIndex(
  index: number,
  snapInterval: number,
  totalItems: number,
): number {
  if (totalItems <= 0) return 0;
  const clamped = Math.max(0, Math.min(index, totalItems - 1));
  return clamped * snapInterval;
}

export default function CarouselTest() {
  const { theme } = useLightDark();
  const scrollRef = useRef<Animated.ScrollView>(null);

  // Configuration State
  const [cardWidthPercent, setCardWidthPercent] = useState(80); // 60% - 95%
  const [cardGap, setCardGap] = useState(14); // 8 - 24
  const [effect, setEffect] = useState<CarouselEffect>('scale');
  const [showIndicators, setShowIndicators] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState(3000);
  const [minScalePercent, setMinScalePercent] = useState(88); // 75% - 100%
  const [activeIndex, setActiveIndex] = useState(0);

  const cardWidth = Math.round((SCREEN_WIDTH * cardWidthPercent) / 100);
  const snapInterval = calculateSnapInterval(cardWidth, cardGap);
  const sideInset = Math.round((SCREEN_WIDTH - cardWidth) / 2);

  // Reanimated scroll position
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const idx = calculateActiveIndex(offsetX, snapInterval, SAMPLE_CARDS.length);
      setActiveIndex(idx);
    },
    [snapInterval],
  );

  // Auto-play timer
  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % SAMPLE_CARDS.length;
        scrollRef.current?.scrollTo({
          x: getScrollTargetForIndex(next, snapInterval, SAMPLE_CARDS.length),
          animated: true,
        });
        return next;
      });
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [autoPlay, autoPlayInterval, snapInterval]);

  const scrollToIndex = (index: number) => {
    setActiveIndex(index);
    scrollRef.current?.scrollTo({
      x: getScrollTargetForIndex(index, snapInterval, SAMPLE_CARDS.length),
      animated: true,
    });
  };

  const renderIcon = (name: CarouselCardData['iconName'], color: string) => {
    switch (name) {
      case 'Leaf':
        return <AlambreIcons.Leaf color={color} lineWidth={2.2} style={styles.cardIcon} />;
      case 'Heart':
        return <AlambreIcons.Heart color={color} lineWidth={2.2} style={styles.cardIcon} />;
      case 'Trophy':
        return <AlambreIcons.Trophy color={color} lineWidth={2.2} style={styles.cardIcon} />;
      case 'Coffee':
        return <AlambreIcons.Coffee color={color} lineWidth={2.2} style={styles.cardIcon} />;
      case 'Zap':
      default:
        return <AlambreIcons.Zap color={color} lineWidth={2.2} style={styles.cardIcon} />;
    }
  };

  return (
    <Animated.ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Info */}
      <View style={styles.header}>
        <Text style={[styles.headline, { color: theme.color }]}>
          Laboratorio de Carruseles
        </Text>
        <Text style={[styles.subheadline, { color: theme.muted }]}>
          Experimentación interactiva de microfísica, peek horizontal y snapping para `alambre`.
        </Text>
      </View>

      {/* Interactive Carousel Stage */}
      <View style={styles.stageContainer}>
        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={snapInterval}
          decelerationRate="fast"
          bounces
          scrollEventThrottle={16}
          onScroll={scrollHandler}
          onMomentumScrollEnd={onMomentumScrollEnd}
          contentContainerStyle={[
            styles.carouselContent,
            {
              paddingHorizontal: sideInset,
              gap: cardGap,
            },
          ]}
        >
          {SAMPLE_CARDS.map((card, index) => {
            return (
              <CarouselItemView
                key={card.id}
                card={card}
                index={index}
                scrollX={scrollX}
                snapInterval={snapInterval}
                cardWidth={cardWidth}
                effect={effect}
                minScale={minScalePercent / 100}
                renderIcon={renderIcon}
                theme={theme}
              />
            );
          })}
        </Animated.ScrollView>

        {/* Pagination Indicators */}
        {showIndicators && (
          <View style={styles.indicatorRow}>
            {SAMPLE_CARDS.map((_, i) => {
              return (
                <IndicatorDot
                  key={i}
                  index={i}
                  scrollX={scrollX}
                  snapInterval={snapInterval}
                  activeColor={theme.primary}
                  inactiveColor={theme.border}
                  onPress={() => scrollToIndex(i)}
                />
              );
            })}
          </View>
        )}
      </View>

      {/* Control Panel / Rich Configuration Directives */}
      <AppCard
        variant="outlined"
        title="Parámetros del Contenedor"
        subtitle="Configuración rica en tiempo real para evaluar comportamiento cinético."
        style={styles.controlCard}
      >
        {/* Effect Mode */}
        <View style={styles.controlGroup}>
          <Text style={[styles.controlLabel, { color: theme.color }]}>
            Efecto de Transición
          </Text>
          <AppSegmentedControl
            options={[
              { label: 'Escala Suave', value: 'scale' },
              { label: 'Cover Flow 3D', value: 'coverflow' },
              { label: 'Plano (Flat)', value: 'flat' },
            ]}
            value={effect}
            onChange={(val) => setEffect(val as CarouselEffect)}
          />
        </View>

        {/* Card Width Slider */}
        <View style={styles.controlGroup}>
          <AppSlider
            label={`Ancho de Tarjeta: ${cardWidthPercent}%`}
            min={60}
            max={95}
            step={5}
            value={cardWidthPercent}
            onChange={setCardWidthPercent}
          />
        </View>

        {/* Card Gap Slider */}
        <View style={styles.controlGroup}>
          <AppSlider
            label={`Espaciado entre tarjetas: ${cardGap}px`}
            min={8}
            max={28}
            step={2}
            value={cardGap}
            onChange={setCardGap}
          />
        </View>

        {/* Min Scale Slider (when effect === 'scale') */}
        {effect === 'scale' && (
          <View style={styles.controlGroup}>
            <AppSlider
              label={`Escala mínima lateral: ${minScalePercent}%`}
              min={75}
              max={100}
              step={2}
              value={minScalePercent}
              onChange={setMinScalePercent}
            />
          </View>
        )}

        {/* Toggles */}
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: theme.color }]}>
            Mostrar indicadores de página
          </Text>
          <AppSwitch
            checked={showIndicators}
            onChange={setShowIndicators}
            size="sm"
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: theme.color }]}>
            Auto-reproducción (Auto-play)
          </Text>
          <AppSwitch
            checked={autoPlay}
            onChange={setAutoPlay}
            size="sm"
          />
        </View>

        {autoPlay && (
          <View style={styles.controlGroup}>
            <AppSlider
              label={`Intervalo de auto-play: ${autoPlayInterval / 1000}s`}
              min={1500}
              max={6000}
              step={500}
              value={autoPlayInterval}
              onChange={setAutoPlayInterval}
            />
          </View>
        )}

        {/* Quick Nav Actions */}
        <View style={styles.actionsRow}>
          <AppButton
            variant="outline"
            tone="primary"
            size="sm"
            label="Anterior"
            disabled={activeIndex === 0}
            onPress={() => scrollToIndex(Math.max(0, activeIndex - 1))}
          />
          <AppButton
            variant="outline"
            tone="primary"
            size="sm"
            label="Siguiente"
            disabled={activeIndex === SAMPLE_CARDS.length - 1}
            onPress={() => scrollToIndex(Math.min(SAMPLE_CARDS.length - 1, activeIndex + 1))}
          />
          <AppButton
            variant="ghost"
            tone="neutral"
            size="sm"
            label="Reiniciar (↺)"
            onPress={() => scrollToIndex(0)}
          />
        </View>
      </AppCard>
    </Animated.ScrollView>
  );
}

// Subcomponent: Individual Animated Carousel Card
function CarouselItemView({
  card,
  index,
  scrollX,
  snapInterval,
  cardWidth,
  effect,
  minScale,
  renderIcon,
  theme,
}: {
  card: CarouselCardData;
  index: number;
  scrollX: SharedValue<number>;
  snapInterval: number;
  cardWidth: number;
  effect: CarouselEffect;
  minScale: number;
  renderIcon: (name: CarouselCardData['iconName'], color: string) => ReactNode;
  theme: Theme;
}) {
  const animatedCardStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * snapInterval,
      index * snapInterval,
      (index + 1) * snapInterval,
    ];

    if (effect === 'scale') {
      const scale = interpolate(
        scrollX.value,
        inputRange,
        [minScale, 1.0, minScale],
        Extrapolation.CLAMP,
      );
      const opacity = interpolate(
        scrollX.value,
        inputRange,
        [0.72, 1.0, 0.72],
        Extrapolation.CLAMP,
      );

      return {
        transform: [{ scale }],
        opacity,
      };
    }

    if (effect === 'coverflow') {
      const rotateY = interpolate(
        scrollX.value,
        inputRange,
        [28, 0, -28],
        Extrapolation.CLAMP,
      );
      const scale = interpolate(
        scrollX.value,
        inputRange,
        [0.86, 1.0, 0.86],
        Extrapolation.CLAMP,
      );
      const opacity = interpolate(
        scrollX.value,
        inputRange,
        [0.75, 1.0, 0.75],
        Extrapolation.CLAMP,
      );

      return {
        transform: [
          { perspective: 800 },
          { scale },
          { rotateY: `${rotateY}deg` },
        ],
        opacity,
      };
    }

    // flat
    return {
      transform: [{ scale: 1 }],
      opacity: 1,
    };
  });

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          width: cardWidth,
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        animatedCardStyle,
      ]}
    >
      <View style={styles.cardHeaderRow}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
          ]}
        >
          {renderIcon(card.iconName, card.accentColor)}
        </View>
        <AppBadge label={card.tag} tone={card.tone} size="sm" />
      </View>

      <Text style={[styles.cardTitle, { color: theme.color }]}>
        {card.title}
      </Text>
      <Text style={[styles.cardSubtitle, { color: theme.muted }]}>
        {card.subtitle}
      </Text>

      <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
        <Text style={[styles.footerText, { color: theme.muted }]}>
          Card #{index + 1} de {SAMPLE_CARDS.length}
        </Text>
        <AlambreIcons.Arrow
          drawIt
          color={card.accentColor}
          lineWidth={16}
          style={styles.arrowIcon}
        />
      </View>
    </Animated.View>
  );
}

// Subcomponent: Animated Pagination Dot
function IndicatorDot({
  index,
  scrollX,
  snapInterval,
  activeColor,
  inactiveColor,
  onPress,
}: {
  index: number;
  scrollX: SharedValue<number>;
  snapInterval: number;
  activeColor: string;
  inactiveColor: string;
  onPress: () => void;
}) {
  const animatedDotStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * snapInterval,
      index * snapInterval,
      (index + 1) * snapInterval,
    ];

    const width = interpolate(
      scrollX.value,
      inputRange,
      [8, 24, 8],
      Extrapolation.CLAMP,
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.4, 1.0, 0.4],
      Extrapolation.CLAMP,
    );

    const backgroundColor = interpolateColor(
      scrollX.value,
      inputRange,
      [inactiveColor, activeColor, inactiveColor],
    );

    return {
      width,
      opacity,
      backgroundColor,
    };
  });

  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Animated.View style={[styles.indicatorDot, animatedDotStyle]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
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
  stageContainer: {
    gap: 14,
    paddingVertical: 6,
  },
  carouselContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cardContainer: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    gap: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    width: 22,
    height: 22,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  arrowIcon: {
    width: 18,
    height: 14,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 16,
  },
  indicatorDot: {
    height: 8,
    borderRadius: 4,
  },
  controlCard: {
    marginHorizontal: 20,
    gap: 16,
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
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    gap: 10,
  },
});
