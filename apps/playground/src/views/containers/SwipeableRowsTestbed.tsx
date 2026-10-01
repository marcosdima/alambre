import { useState } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const SCREEN_WIDTH = Dimensions.get('window').width;
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AlambreIcons } from 'alambre';
import { useLightDark } from '../../providers/theme';

type Theme = ReturnType<typeof useLightDark>['theme'];
import AppCard from '../../components/AppCard';
import AppButton from '../../components/AppButton';
import AppSlider from '../../components/AppSlider';
import AppSwitch from '../../components/AppSwitch';
import AppBadge from '../../components/AppBadge';

type ListItem = {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  tag: string;
  completed?: boolean;
};

const INITIAL_ITEMS: ListItem[] = [
  {
    id: 'row-1',
    title: 'Auditoría de Accesibilidad TalkBack',
    subtitle: 'Verificar nodos semánticos en diálogos y hojas modales.',
    timestamp: 'Hace 10 min',
    tag: 'A11Y',
  },
  {
    id: 'row-2',
    title: 'Migración a Reanimated Worklets',
    subtitle: 'Garantizar que todo el cálculo de desplazamiento ocurra en hilo UI.',
    timestamp: 'Hace 35 min',
    tag: 'PERF',
  },
  {
    id: 'row-3',
    title: 'Revisión de Dependencias en base-expo',
    subtitle: 'Confirmar cero filtración de paquetes no aprobados.',
    timestamp: 'Hace 2 horas',
    tag: 'INTEGRITY',
  },
  {
    id: 'row-4',
    title: 'Actualización de Documentación ADR',
    subtitle: 'Registrar decisiones de arquitectura en docs/discoveries.md.',
    timestamp: 'Ayer',
    tag: 'DOCS',
  },
];

export default function SwipeableRowsTestbed() {
  const { theme } = useLightDark();

  const [items, setItems] = useState<ListItem[]>(INITIAL_ITEMS);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [actionThreshold, setActionThreshold] = useState(80);
  const [enableFullSwipe, setEnableFullSwipe] = useState(true);

  const handleComplete = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleArchive = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <Animated.ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.headline, { color: theme.color }]}>
          Filas con Acciones Deslizables
        </Text>
        <Text style={[styles.subheadline, { color: theme.muted }]}>
          Contenedores de lista tipo swipe-to-action con umbrales dinámicos y retorno elástico.
        </Text>
      </View>

      {/* Stage: Interactive Swipeable List */}
      <View style={styles.stage}>
        {items.length === 0 ? (
          <View style={[styles.emptyContainer, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <Text style={[styles.emptyTitle, { color: theme.color }]}>No hay tareas pendientes</Text>
            <AppButton onPress={() => setItems(INITIAL_ITEMS)}>
              <Text style={{ color: theme.primary, fontWeight: '700' }}>Restablecer Lista</Text>
            </AppButton>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {items.map((item) => (
              <SwipeableRowItem
                key={item.id}
                item={item}
                isOpen={activeRowId === item.id}
                onOpenChange={(open) => setActiveRowId(open ? item.id : null)}
                actionThreshold={actionThreshold}
                enableFullSwipe={enableFullSwipe}
                onComplete={() => handleComplete(item.id)}
                onDelete={() => handleDelete(item.id)}
                onArchive={() => handleArchive(item.id)}
                theme={theme}
              />
            ))}
          </View>
        )}
      </View>

      {/* Control Panel / Parameters */}
      <AppCard
        variant="outlined"
        title="Parámetros de Fila Deslizable"
        subtitle="Configuración de umbrales rápidos y full-swipe."
        style={styles.controlCard}
        bodyStyle={styles.controlBody}
      >
        <AppSlider
          label={`Umbral de botones rápidos: ${actionThreshold}px`}
          min={60}
          max={110}
          step={5}
          value={actionThreshold}
          onChange={setActionThreshold}
        />

        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: theme.color }]}>
            Habilitar Full-Swipe (acción directa al arrastre largo)
          </Text>
          <AppSwitch
            checked={enableFullSwipe}
            onChange={setEnableFullSwipe}
            size="sm"
          />
        </View>

        <View style={styles.buttonRow}>
          <AppButton onPress={() => setItems(INITIAL_ITEMS)}>
            <Text style={{ color: theme.primary, fontWeight: '600' }}>Restablecer Lista (↺)</Text>
          </AppButton>
        </View>
      </AppCard>
    </Animated.ScrollView>
  );
}

// Subcomponent: Individual Swipeable Row Item
function SwipeableRowItem({
  item,
  isOpen: _isOpen,
  onOpenChange,
  actionThreshold,
  enableFullSwipe,
  onComplete,
  onDelete,
  onArchive,
  theme,
}: {
  item: ListItem;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  actionThreshold: number;
  enableFullSwipe: boolean;
  onComplete: () => void;
  onDelete: () => void;
  onArchive: () => void;
  theme: Theme;
}) {
  const translateX = useSharedValue(0);
  const fullSwipeThreshold = 170;

  const closeRow = () => {
    translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
    onOpenChange(false);
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd(() => {
      const isRightSwipe = translateX.value > 0;
      const distance = Math.abs(translateX.value);

      if (enableFullSwipe && distance > fullSwipeThreshold) {
        // Full swipe trigger
        if (isRightSwipe) {
          translateX.value = withTiming(SCREEN_WIDTH, { duration: 200 }, () => {
            runOnJS(onComplete)();
            translateX.value = 0;
          });
        } else {
          translateX.value = withTiming(-SCREEN_WIDTH, { duration: 200 }, () => {
            runOnJS(onDelete)();
          });
        }
        return;
      }

      if (isRightSwipe && distance > actionThreshold) {
        // Settle at complete action reveal
        translateX.value = withSpring(actionThreshold, { damping: 18, stiffness: 280 });
        runOnJS(onOpenChange)(true);
      } else if (!isRightSwipe && distance > actionThreshold * 1.6) {
        // Settle at delete/archive actions reveal
        translateX.value = withSpring(-actionThreshold * 1.6, { damping: 18, stiffness: 280 });
        runOnJS(onOpenChange)(true);
      } else {
        // Rebound back to 0
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
        runOnJS(onOpenChange)(false);
      }
    });

  const animatedRowStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const leftActionStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [10, actionThreshold], [0, 1], Extrapolation.CLAMP);
    return { opacity };
  });

  const rightActionStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [-10, -actionThreshold], [0, 1], Extrapolation.CLAMP);
    return { opacity };
  });

  return (
    <View style={[styles.rowContainer, { backgroundColor: theme.surfaceAlt }]}>
      {/* Background Left Action (Completar) */}
      <Animated.View style={[styles.backgroundLeft, leftActionStyle]}>
        <Pressable
          onPress={() => {
            onComplete();
            closeRow();
          }}
          style={styles.actionBtnContent}
        >
          <AlambreIcons.Tick color="#ffffff" lineWidth={2.4} style={styles.actionIcon} />
          <Text style={styles.actionBtnText}>{item.completed ? 'Deshacer' : 'Completar'}</Text>
        </Pressable>
      </Animated.View>

      {/* Background Right Actions (Archivar & Eliminar) */}
      <Animated.View style={[styles.backgroundRight, rightActionStyle]}>
        <Pressable
          onPress={() => {
            onArchive();
            closeRow();
          }}
          style={[styles.actionBtnContent, { backgroundColor: '#f59e0b' }]}
        >
          <AlambreIcons.Sun color="#ffffff" lineWidth={2.2} style={styles.actionIcon} />
          <Text style={styles.actionBtnText}>Archivar</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            onDelete();
            closeRow();
          }}
          style={[styles.actionBtnContent, { backgroundColor: '#ef4444' }]}
        >
          <AlambreIcons.CircleX color="#ffffff" lineWidth={2.2} style={styles.actionIcon} />
          <Text style={styles.actionBtnText}>Eliminar</Text>
        </Pressable>
      </Animated.View>

      {/* Foreground Swipeable Card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.foregroundCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
            item.completed && { opacity: 0.65 },
            animatedRowStyle,
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.itemTitle,
                  { color: theme.color },
                  item.completed && styles.strikethrough,
                ]}
              >
                {item.title}
              </Text>
              <AppBadge label={item.tag} tone={item.completed ? 'neutral' : 'primary'} size="sm" />
            </View>
            <Text style={[styles.itemTimestamp, { color: theme.muted }]}>{item.timestamp}</Text>
          </View>
          <Text style={[styles.itemSubtitle, { color: theme.muted }]}>{item.subtitle}</Text>
        </Animated.View>
      </GestureDetector>
    </View>
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
  },
  listContainer: {
    gap: 12,
  },
  rowContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    height: 94,
    justifyContent: 'center',
  },
  backgroundLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 140,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
  },
  backgroundRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 160,
    flexDirection: 'row',
  },
  actionBtnContent: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionIcon: {
    width: 20,
    height: 20,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  foregroundCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    justifyContent: 'center',
    gap: 4,
  },
  cardHeaderRow: {
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  itemTimestamp: {
    fontSize: 11,
  },
  itemSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  emptyContainer: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
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
