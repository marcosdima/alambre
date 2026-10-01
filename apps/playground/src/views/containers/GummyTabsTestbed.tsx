import { useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
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
import AppButton from '../../components/AppButton';
import AppSlider from '../../components/AppSlider';
import AppSwitch from '../../components/AppSwitch';
import AppBadge from '../../components/AppBadge';

const SCREEN_WIDTH = Dimensions.get('window').width;

type TabItem = {
  key: string;
  label: string;
  badge?: string;
  iconName: 'Zap' | 'Leaf' | 'Trophy' | 'Coffee';
  summary: string;
  detail: string;
};

const TABS: TabItem[] = [
  {
    key: 'overview',
    label: 'Resumen',
    iconName: 'Zap',
    summary: 'Métricas Generales del Framework',
    detail: 'Tiempo de arranque en frío < 250ms con arquitectura desacoplada y bundles ligeros.',
  },
  {
    key: 'metrics',
    label: 'Métricas',
    badge: '120fps',
    iconName: 'Leaf',
    summary: 'Rendimiento de Fotogramas',
    detail: '99.8% de fotogramas estables en pruebas automatizadas de Maestro con Turbo Mode.',
  },
  {
    key: 'activity',
    label: 'Actividad',
    badge: '3',
    iconName: 'Trophy',
    summary: 'Registro de Sucesos y Eventos',
    detail: 'Consolidación de pruebas en colguetti 1.0 y sincronización de contratos headless.',
  },
  {
    key: 'settings',
    label: 'Ajustes',
    iconName: 'Coffee',
    summary: 'Configuración de Contenedores',
    detail: 'Aislamiento estricto de parámetros cinéticos y validación multi-dispositivo.',
  },
];

export default function GummyTabsTestbed() {
  const { theme } = useLightDark();
  const pagerRef = useRef<Animated.ScrollView>(null);

  const [activeTab, setActiveTab] = useState(0);
  const [elasticity, setElasticity] = useState(1.35); // 1.0 (flat) - 1.8 (very gummy)
  const [colorMorph, setColorMorph] = useState(true);

  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const tabWidth = (SCREEN_WIDTH - 40) / TABS.length;

  const navigateToTab = (index: number) => {
    setActiveTab(index);
    pagerRef.current?.scrollTo({
      x: index * SCREEN_WIDTH,
      animated: true,
    });
  };

  // Gummy Liquid Indicator Animation
  const animatedIndicatorStyle = useAnimatedStyle(() => {
    const progress = scrollX.value / SCREEN_WIDTH;

    // Normal position
    const baseLeft = progress * tabWidth;

    // Liquid stretch: expands in middle of transitions
    const cycle = progress % 1;
    const stretchDistance = Math.sin(cycle * Math.PI) * (tabWidth * (elasticity - 1));

    const width = tabWidth - 6 + stretchDistance;
    const left = baseLeft + 3 - stretchDistance * 0.25;

    return {
      left,
      width,
    };
  });

  const renderIcon = (name: TabItem['iconName'], color: string) => {
    switch (name) {
      case 'Leaf':
        return <AlambreIcons.Leaf color={color} lineWidth={2.2} style={styles.tabPaneIcon} />;
      case 'Trophy':
        return <AlambreIcons.Trophy color={color} lineWidth={2.2} style={styles.tabPaneIcon} />;
      case 'Coffee':
        return <AlambreIcons.Coffee color={color} lineWidth={2.2} style={styles.tabPaneIcon} />;
      case 'Zap':
      default:
        return <AlambreIcons.Zap color={color} lineWidth={2.2} style={styles.tabPaneIcon} />;
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
          Pestañas con Indicador Elástico
        </Text>
        <Text style={[styles.subheadline, { color: theme.muted }]}>
          Paginador horizontal continuo con píldora indicadora líquida (Gummy Tab Bar).
        </Text>
      </View>

      {/* Stage: Gummy Tab Bar + Content Pager */}
      <View style={styles.stage}>
        {/* Tab Bar Header */}
        <View
          style={[
            styles.tabBarContainer,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
          ]}
        >
          {/* Animated Liquid Pill */}
          <Animated.View
            style={[
              styles.liquidPill,
              { backgroundColor: theme.surface, borderColor: theme.border },
              animatedIndicatorStyle,
            ]}
          />

          {/* Tab Button Items */}
          {TABS.map((tab, idx) => (
            <TabHeaderButton
              key={tab.key}
              tab={tab}
              index={idx}
              scrollX={scrollX}
              colorMorph={colorMorph}
              onPress={() => navigateToTab(idx)}
              theme={theme}
            />
          ))}
        </View>

        {/* Horizontal Content Pager */}
        <Animated.ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={scrollHandler}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setActiveTab(idx);
          }}
          style={styles.pagerScrollView}
          contentContainerStyle={styles.pagerContent}
        >
          {TABS.map((tab, idx) => (
            <View key={tab.key} style={styles.pageContainer}>
              <View
                style={[
                  styles.pageCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View style={styles.pageHeaderRow}>
                  <View style={[styles.iconCircle, { backgroundColor: theme.primarySoft }]}>
                    {renderIcon(tab.iconName, theme.primary)}
                  </View>
                  <AppBadge
                    label={`Pestaña ${idx + 1} de ${TABS.length}`}
                    tone="primary"
                    size="sm"
                  />
                </View>

                <Text style={[styles.pageSummary, { color: theme.color }]}>
                  {tab.summary}
                </Text>

                <Text style={[styles.pageDetail, { color: theme.muted }]}>
                  {tab.detail}
                </Text>

                <View style={[styles.pageFooter, { borderTopColor: theme.border }]}>
                  <Text style={[styles.pageFooterHint, { color: theme.muted }]}>
                    ← Desliza lateralmente para viajar entre pestañas →
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </Animated.ScrollView>
      </View>

      {/* Control Panel / Parameters */}
      <AppCard
        variant="outlined"
        title="Parámetros de Pestañas Elásticas"
        subtitle="Control de elasticidad del indicador y feedback de color."
        style={styles.controlCard}
        bodyStyle={styles.controlBody}
      >
        <AppSlider
          label={`Factor de elasticidad líquida: ${elasticity.toFixed(2)}x`}
          min={100}
          max={180}
          step={5}
          value={Math.round(elasticity * 100)}
          onChange={(val) => setElasticity(val / 100)}
        />

        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: theme.color }]}>
            Interpolación de color de texto activo
          </Text>
          <AppSwitch checked={colorMorph} onChange={setColorMorph} size="sm" />
        </View>

        <View style={styles.quickNavRow}>
          {TABS.map((tab, idx) => (
            <AppButton
              key={tab.key}
              variant={activeTab === idx ? 'solid' : 'outline'}
              tone={activeTab === idx ? 'primary' : 'neutral'}
              onPress={() => navigateToTab(idx)}
              style={styles.quickNavBtn}
            >
              <Text
                style={{
                  color: activeTab === idx ? '#ffffff' : theme.color,
                  fontWeight: '600',
                  fontSize: 12,
                }}
              >
                {tab.label}
              </Text>
            </AppButton>
          ))}
        </View>
      </AppCard>
    </Animated.ScrollView>
  );
}

// Subcomponent: Tab Header Button with Dynamic Color Interpolation
function TabHeaderButton({
  tab,
  index,
  scrollX,
  colorMorph,
  onPress,
  theme,
}: {
  tab: TabItem;
  index: number;
  scrollX: SharedValue<number>;
  colorMorph: boolean;
  onPress: () => void;
  theme: Theme;
}) {
  const animatedTextStyle = useAnimatedStyle(() => {
    if (!colorMorph) {
      return {};
    }
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];
    const color = interpolateColor(
      scrollX.value,
      inputRange,
      [theme.muted, theme.primary, theme.muted],
    );
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.94, 1.04, 0.94],
      Extrapolation.CLAMP,
    );

    return {
      color,
      transform: [{ scale }],
    };
  });

  return (
    <Pressable onPress={onPress} style={styles.tabButton}>
      <Animated.Text style={[styles.tabButtonText, animatedTextStyle]}>
        {tab.label}
      </Animated.Text>
    </Pressable>
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
    gap: 16,
  },
  tabBarContainer: {
    marginHorizontal: 16,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    position: 'relative',
  },
  liquidPill: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    borderRadius: 11,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pagerScrollView: {
    width: SCREEN_WIDTH,
  },
  pagerContent: {
    alignItems: 'center',
  },
  pageContainer: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 16,
  },
  pageCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    gap: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  pageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPaneIcon: {
    width: 22,
    height: 22,
  },
  pageSummary: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  pageDetail: {
    fontSize: 13,
    lineHeight: 19,
  },
  pageFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    alignItems: 'center',
  },
  pageFooterHint: {
    fontSize: 11,
    fontWeight: '500',
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
  quickNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    paddingTop: 4,
  },
  quickNavBtn: {
    flex: 1,
    paddingHorizontal: 4,
  },
});
