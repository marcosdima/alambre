import React, { useState, type ReactElement } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { AlambreIcons, useDeck } from 'alambre';
import { useLightDark } from '../../providers/theme';
import AppCard from '../../components/AppCard';
import AppButton from '../../components/AppButton';
import AppSlider from '../../components/AppSlider';
import AppSwitch from '../../components/AppSwitch';
import AppBadge from '../../components/AppBadge';

const SCREEN_WIDTH = Dimensions.get('window').width;

type DeckCard = {
  id: string;
  title: string;
  category: string;
  priority: 'ALTA' | 'MEDIA' | 'ESTRATÉGICA' | 'URGENTE';
  description: string;
  color: string;
  iconName: 'Zap' | 'Heart' | 'Trophy' | 'Leaf' | 'Coffee';
};

const INITIAL_DECK: DeckCard[] = [
  {
    id: 'deck-1',
    title: 'Arquitectura Headless',
    category: 'Ingeniería Core',
    priority: 'ALTA',
    description: 'Separar completamente los contratos headless de la capa de renderizado visual.',
    color: '#3b82f6',
    iconName: 'Zap',
  },
  {
    id: 'deck-2',
    title: 'Microfísica 120 FPS',
    category: 'Experiencia Táctil',
    priority: 'ESTRATÉGICA',
    description: 'Worklets en hilo UI para garantizar cero saltos de fotogramas durante gestos veloces.',
    color: '#10b981',
    iconName: 'Leaf',
  },
  {
    id: 'deck-3',
    title: 'Aislamiento de Módulos',
    category: 'Arquitectura',
    priority: 'URGENTE',
    description: 'Evitar que dependencias pesadas contaminen el starter base-template del monorepo.',
    color: '#f59e0b',
    iconName: 'Trophy',
  },
  {
    id: 'deck-4',
    title: 'Tokens Semánticos',
    category: 'Design System',
    priority: 'MEDIA',
    description: 'Integrar paletas de color con adaptación automática a temas claro y oscuro.',
    color: '#8b5cf6',
    iconName: 'Heart',
  },
  {
    id: 'deck-5',
    title: 'Cero Hacks Nativos',
    category: 'Calidad y Rigor',
    priority: 'ESTRATÉGICA',
    description: 'Verificar empíricamente cada suposición visual sobre emuladores y dispositivos reales.',
    color: '#ef4444',
    iconName: 'Coffee',
  },
];

export default function DeckTestbed() {
  const { theme } = useLightDark();

  // Microphysics configuration
  const [threshold, setThreshold] = useState(120);
  const [maxRotation, setMaxRotation] = useState(16);
  const [scaleBackCards, setScaleBackCards] = useState(true);

  // Deck headless hook
  const {
    deck,
    history,
    activeIndex,
    swipeTranslation,
    popCard,
    undoLast,
    triggerProgrammaticSwipe,
    reset,
  } = useDeck({ initialCards: INITIAL_DECK });

  const renderIcon = (name: DeckCard['iconName'], color: string) => {
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
      <View style={styles.header}>
        <Text style={[styles.headline, { color: theme.color }]}>
          Stack de Tarjetas Descartables
        </Text>
        <Text style={[styles.subheadline, { color: theme.muted }]}>
          Física angular, micro-interacciones tipo Tinder y capas en profundidad para `alambre`.
        </Text>
      </View>

      {/* Stage: Interactive Stack */}
      <View style={styles.stage}>
        {history.length >= deck.length ? (
          <View style={[styles.emptyContainer, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <AlambreIcons.Tick color={theme.primary} lineWidth={2.4} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: theme.color }]}>
              ¡Pila de Tarjetas Vacía!
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.muted }]}>
              Has revisado todos los elementos. Puedes reiniciar la pila o deshacer la última acción.
            </Text>
            <AppButton onPress={reset} style={styles.emptyButton}>
              <Text style={{ color: theme.primary, fontWeight: '700' }}>Reiniciar Pila</Text>
            </AppButton>
          </View>
        ) : (
          <View style={styles.deckContainer}>
            {deck.map((card, absoluteIdx) => {
              const isSwiped = absoluteIdx < history.length;
              if (isSwiped) return null;

              return (
                <UnifiedDeckCard
                  key={card.id}
                  card={card}
                  absoluteIdx={absoluteIdx}
                  activeIndex={activeIndex}
                  swipeTranslation={swipeTranslation}
                  threshold={threshold}
                  maxRotation={maxRotation}
                  scaleBackCards={scaleBackCards}
                  onSwipeOut={popCard}
                  renderIcon={renderIcon}
                  theme={theme}
                  isTop={absoluteIdx === history.length}
                />
              );
            }).reverse()}
          </View>
        )}

        {/* Quick Action Triggers */}
        <View style={styles.deckActionsRow}>
          <AppButton
            variant="outline"
            tone="danger"
            disabled={history.length >= deck.length}
            onPress={() => triggerProgrammaticSwipe('left')}
            style={styles.actionCircleButton}
          >
            <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 16 }}>✕</Text>
          </AppButton>

          <AppButton
            variant="outline"
            tone="neutral"
            disabled={history.length === 0}
            onPress={undoLast}
            style={styles.actionCircleButton}
          >
            <Text style={{ color: theme.color, fontWeight: '700', fontSize: 16 }}>↺</Text>
          </AppButton>

          <AppButton
            variant="outline"
            tone="success"
            disabled={history.length >= deck.length}
            onPress={() => triggerProgrammaticSwipe('right')}
            style={styles.actionCircleButton}
          >
            <Text style={{ color: '#10b981', fontWeight: '700', fontSize: 16 }}>✓</Text>
          </AppButton>
        </View>
      </View>

      {/* Control Panel / Parameters */}
      <AppCard
        variant="outlined"
        title="Parámetros de Microfísica"
        subtitle="Calibración de umbrales y rotación angular de la pila."
        style={styles.controlCard}
        bodyStyle={styles.controlBody}
      >
        <AppSlider
          label={`Umbral de descarte (Fling): ${threshold}px`}
          min={70}
          max={180}
          step={5}
          value={threshold}
          onChange={setThreshold}
        />

        <AppSlider
          label={`Rotación angular máxima: ${maxRotation}°`}
          min={8}
          max={28}
          step={2}
          value={maxRotation}
          onChange={setMaxRotation}
        />

        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: theme.color }]}>
            Escalado dinámico de tarjetas inferiores
          </Text>
          <AppSwitch
            checked={scaleBackCards}
            onChange={setScaleBackCards}
            size="sm"
          />
        </View>

        <View style={styles.buttonRow}>
          <AppButton
            onPress={reset}
          >
            <Text style={{ color: theme.primary, fontWeight: '600' }}>Reiniciar Pila (↺)</Text>
          </AppButton>
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
    alignItems: 'center',
    gap: 16,
    minHeight: 330,
    justifyContent: 'center',
  },
  deckContainer: {
    width: SCREEN_WIDTH - 48,
    height: 270,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 20,
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBox: {
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
    marginTop: 4,
  },
  cardCategory: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  cardFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    alignItems: 'center',
  },
  footerNotice: {
    fontSize: 11,
    fontWeight: '500',
  },
  stamp: {
    position: 'absolute',
    top: 18,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 2,
    zIndex: 10,
  },
  likeStamp: {
    right: 18,
    borderColor: '#10b981',
    backgroundColor: '#10b98120',
    transform: [{ rotate: '12deg' }],
  },
  likeStampText: {
    color: '#10b981',
    fontWeight: '800',
    fontSize: 13,
  },
  nopeStamp: {
    left: 18,
    borderColor: '#ef4444',
    backgroundColor: '#ef444420',
    transform: [{ rotate: '-12deg' }],
  },
  nopeStampText: {
    color: '#ef4444',
    fontWeight: '800',
    fontSize: 13,
  },
  emptyContainer: {
    width: SCREEN_WIDTH - 48,
    height: 270,
    borderRadius: 22,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  emptyIcon: {
    width: 36,
    height: 36,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyButton: {
    marginTop: 6,
  },
  deckActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  actionCircleButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  controlCard: {
    marginHorizontal: 16,
  },
  controlBody: {
    gap: 14,
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
  buttonRow: {
    paddingTop: 4,
    alignItems: 'flex-start',
  },
});

// Unified Component: Preserves the View instance when advancing through the deck.
function UnifiedDeckCard({
  card,
  absoluteIdx,
  activeIndex,
  swipeTranslation,
  threshold,
  maxRotation,
  scaleBackCards,
  onSwipeOut,
  renderIcon,
  theme,
  isTop,
}: {
  card: DeckCard;
  absoluteIdx: number;
  activeIndex?: SharedValue<number>;
  swipeTranslation: SharedValue<number>;
  threshold: number;
  maxRotation: number;
  scaleBackCards: boolean;
  onSwipeOut: (direction: 'left' | 'right') => void;
  renderIcon: (name: DeckCard['iconName'], color: string) => ReactElement;
  theme: ReturnType<typeof useLightDark>['theme'];
  isTop: boolean;
}) {
  const localX = useSharedValue(0);
  const localY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((event) => {
      localX.value = event.translationX;
      localY.value = event.translationY;
      swipeTranslation.value = event.translationX;
    })
    .onEnd((event) => {
      const isFlingRight = localX.value > threshold || event.velocityX > 650;
      const isFlingLeft = localX.value < -threshold || event.velocityX < -650;

      if (isFlingRight) {
        localX.value = withTiming(SCREEN_WIDTH * 1.4, { duration: 220 }, () => {
          runOnJS(onSwipeOut)('right');
        });
        swipeTranslation.value = withTiming(SCREEN_WIDTH * 1.4, { duration: 220 });
      } else if (isFlingLeft) {
        localX.value = withTiming(-SCREEN_WIDTH * 1.4, { duration: 220 }, () => {
          runOnJS(onSwipeOut)('left');
        });
        swipeTranslation.value = withTiming(-SCREEN_WIDTH * 1.4, { duration: 220 });
      } else {
        localX.value = withSpring(0, { damping: 18, stiffness: 280 });
        localY.value = withSpring(0, { damping: 18, stiffness: 280 });
        swipeTranslation.value = withSpring(0, { damping: 18, stiffness: 280 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const currentActive = activeIndex ? activeIndex.value : 0;
    const dragProgress = Math.min(Math.abs(swipeTranslation.value) / threshold, 1);
    const continuousActiveIndex = currentActive + dragProgress;
    const relIndex = absoluteIdx - continuousActiveIndex;

    if (absoluteIdx <= currentActive) {
      const rotate = interpolate(localX.value, [-SCREEN_WIDTH * 0.7, 0, SCREEN_WIDTH * 0.7], [-maxRotation, 0, maxRotation], Extrapolation.CLAMP);
      return {
        zIndex: 3,
        transform: [{ translateX: localX.value }, { translateY: localY.value }, { rotate: `${rotate}deg` }],
      };
    } else {
      if (!scaleBackCards) {
        const staticIndex = Math.max(0, Math.round(relIndex));
        if (staticIndex === 1) return { zIndex: 2, transform: [{ scale: 0.94 }, { translateY: 12 }] };
        if (staticIndex >= 2) return { zIndex: 1, transform: [{ scale: 0.88 }, { translateY: 24 }] };
        return { zIndex: 3, transform: [{ scale: 1 }, { translateY: 0 }] };
      }

      const scale = interpolate(relIndex, [0, 1, 2], [1.0, 0.94, 0.88], Extrapolation.CLAMP);
      const translateYOffset = interpolate(relIndex, [0, 1, 2], [0, 12, 24], Extrapolation.CLAMP);
      
      return {
        zIndex: relIndex <= 1 ? 2 : 1,
        transform: [{ scale }, { translateY: translateYOffset }],
      };
    }
  });

  const likeStampStyle = useAnimatedStyle(() => {
    const currentActive = activeIndex ? activeIndex.value : 0;
    if (absoluteIdx > currentActive) return { opacity: 0 };
    return { opacity: interpolate(localX.value, [15, threshold * 0.8], [0, 1], Extrapolation.CLAMP) };
  });

  const nopeStampStyle = useAnimatedStyle(() => {
    const currentActive = activeIndex ? activeIndex.value : 0;
    if (absoluteIdx > currentActive) return { opacity: 0 };
    return { opacity: interpolate(localX.value, [-15, -threshold * 0.8], [0, 1], Extrapolation.CLAMP) };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.cardWrapper,
          { backgroundColor: theme.surface, borderColor: theme.border },
          animatedStyle,
        ]}
      >
        <Animated.View style={[styles.stamp, styles.likeStamp, likeStampStyle]}>
          <Text style={styles.likeStampText}>APROBAR ✓</Text>
        </Animated.View>

        <Animated.View style={[styles.stamp, styles.nopeStamp, nopeStampStyle]}>
          <Text style={styles.nopeStampText}>DESCARTAR ✕</Text>
        </Animated.View>

        <View style={styles.cardHeaderRow}>
          <View style={[styles.iconBox, { borderColor: card.color + '40', backgroundColor: card.color + '15' }]}>
            {renderIcon(card.iconName, card.color)}
          </View>
          <AppBadge label={card.priority} tone="primary" size="sm" />
        </View>

        <Text style={[styles.cardTitle, { color: theme.color }]}>{card.title}</Text>
        <Text style={[styles.cardCategory, { color: card.color }]}>{card.category}</Text>
        <Text style={[styles.cardDescription, { color: theme.muted }]}>{card.description}</Text>

        <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
          <Text style={[styles.footerNotice, { color: theme.muted }]}>
            ← Desliza para descartar | Aprobar →
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}
