import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { AlambreIcons, useCollapsible } from 'alambre';
import { useLightDark } from '../../providers/theme';

type Theme = ReturnType<typeof useLightDark>['theme'];
import AppCard from '../../components/AppCard';
import AppButton from '../../components/AppButton';
import AppSlider from '../../components/AppSlider';
import AppSwitch from '../../components/AppSwitch';
import AppBadge from '../../components/AppBadge';

type AccordionSection = {
  id: string;
  title: string;
  badge: string;
  iconName: 'Zap' | 'Leaf' | 'Heart' | 'Trophy';
  content: string;
  highlights: string[];
};

const SECTIONS: AccordionSection[] = [
  {
    id: 'sec-1',
    title: 'Directivas de Arquitectura Alambre',
    badge: 'CORE',
    iconName: 'Zap',
    content:
      'La arquitectura separa rígidamente la lógica de dominio headless de la capa de renderizado. Los paquetes publicados nunca importan vistas específicas de aplicaciones cliente.',
    highlights: [
      'Inversión de dependencias (apps/* → packages/alambre)',
      'Tipos públicos centralizados e inmutables',
      'Cero acoplamiento a librerías UI de terceros',
    ],
  },
  {
    id: 'sec-2',
    title: 'Contratos Headless y Capa de Dominio',
    badge: 'STORAGE',
    iconName: 'Leaf',
    content:
      'Las interfaces como Storage, Navigator y Providers definen contratos universales que funcionan tanto en Node/Vitest como en React Native nativo y Web.',
    highlights: [
      'Storage bindings compatibles con AsyncStorage o memoria',
      'Historial de navegación desacoplado de dependencias reactivas',
      'Manejo de estado predecible y testeable',
    ],
  },
  {
    id: 'sec-3',
    title: 'Motor de Pruebas Maestro Turbo',
    badge: 'TESTING',
    iconName: 'Trophy',
    content:
      'La suite de integración utiliza flujos atómicos y Turbo Mode para ejecutar aserciones en menos de 15 segundos sobre emuladores Android reales.',
    highlights: [
      'Flujos atómicos que aíslan fallos puntuales',
      'Timeout adaptativo con auto-recovery',
      'Cero tests obsoletos o duplicados',
    ],
  },
  {
    id: 'sec-4',
    title: 'Estrategia de Releases y Versiones',
    badge: 'SEMVER',
    iconName: 'Heart',
    content:
      'Cada versión se publica con changelogs automatizados, validación de paridad de tipos y verificación de compatibilidad hacia atrás en base-expo.',
    highlights: [
      'Etiquetado semántico estricto (major.minor.patch)',
      'Registro de descubrimientos con estado ADOPTED',
      'Release armor para sellar versiones estables',
    ],
  },
];

export default function AccordionGroupTestbed() {
  const { theme } = useLightDark();

  const [expandedIds, setExpandedIds] = useState<string[]>(['sec-1']);
  const [isMutex, setIsMutex] = useState(true);
  const [duration, setDuration] = useState(250);

  const toggleSection = (id: string) => {
    setExpandedIds((prev) => {
      const isCurrentlyExpanded = prev.includes(id);

      if (isMutex) {
        // Mutex: only one open at a time
        return isCurrentlyExpanded ? [] : [id];
      } else {
        // Multi: toggle id in array
        return isCurrentlyExpanded ? prev.filter((item) => item !== id) : [...prev, id];
      }
    });
  };

  const expandAll = () => {
    setIsMutex(false);
    setExpandedIds(SECTIONS.map((s) => s.id));
  };

  const collapseAll = () => {
    setExpandedIds([]);
  };

  return (
    <Animated.ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.headline, { color: theme.color }]}>
          Acordeón Mutex Agrupado
        </Text>
        <Text style={[styles.subheadline, { color: theme.muted }]}>
          Paneles colapsables con exclusión mutua coordinada y transiciones de altura sin saltos.
        </Text>
      </View>

      {/* Stage: Accordion Group */}
      <View style={styles.stage}>
        <View style={styles.accordionContainer}>
          {SECTIONS.map((sec) => (
            <AccordionItem
              key={sec.id}
              section={sec}
              isExpanded={expandedIds.includes(sec.id)}
              onToggle={() => toggleSection(sec.id)}
              duration={duration}
              theme={theme}
            />
          ))}
        </View>
      </View>

      {/* Control Panel / Parameters */}
      <AppCard
        variant="outlined"
        title="Parámetros de Acordeón"
        subtitle="Control de exclusión mutua (Mutex) y velocidad de transición."
        style={styles.controlCard}
        bodyStyle={styles.controlBody}
      >
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: theme.color }]}>
            Modo Mutex (Solo un panel abierto a la vez)
          </Text>
          <AppSwitch
            checked={isMutex}
            onChange={(val) => {
              setIsMutex(val);
              if (val && expandedIds.length > 1) {
                setExpandedIds([expandedIds[0]]);
              }
            }}
            size="sm"
          />
        </View>

        <AppSlider
          label={`Duración de animación: ${duration}ms`}
          min={150}
          max={450}
          step={25}
          value={duration}
          onChange={setDuration}
        />

        <View style={styles.actionsRow}>
          <AppButton
            variant="outline"
            tone="neutral"
            onPress={expandAll}
            disabled={isMutex}
            style={styles.actionBtn}
          >
            <Text style={{ color: theme.color, fontSize: 12, fontWeight: '600' }}>
              Expandir Todos
            </Text>
          </AppButton>
          <AppButton
            variant="outline"
            tone="neutral"
            onPress={collapseAll}
            style={styles.actionBtn}
          >
            <Text style={{ color: theme.color, fontSize: 12, fontWeight: '600' }}>
              Colapsar Todos
            </Text>
          </AppButton>
        </View>
      </AppCard>
    </Animated.ScrollView>
  );
}

// Subcomponent: Accordion Item with Smooth Height Animation
function AccordionItem({
  section,
  isExpanded,
  onToggle,
  duration,
  theme,
}: {
  section: AccordionSection;
  isExpanded: boolean;
  onToggle: () => void;
  duration: number;
  theme: Theme;
}) {
  const { animatedStyle, probeProps, progress } = useCollapsible({
    expanded: isExpanded,
    transitionType: 'timing',
    duration,
  });

  const animatedBodyStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value === 0 ? 0 : 1,
    };
  });

  const animatedChevronStyle = useAnimatedStyle(() => {
    const rotation = interpolate(progress.value, [0, 1], [0, 180], Extrapolation.CLAMP);
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  const renderInnerContent = () => (
    <View style={styles.innerContent}>
      <Text style={[styles.sectionDescription, { color: theme.muted }]}>
        {section.content}
      </Text>

      <View style={styles.highlightsBox}>
        {section.highlights.map((h, i) => (
          <View key={i} style={styles.highlightRow}>
            <AlambreIcons.Tick color={theme.primary} lineWidth={2.2} style={styles.tickIcon} />
            <Text style={[styles.highlightText, { color: theme.color }]}>{h}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderIcon = (name: AccordionSection['iconName'], color: string) => {
    switch (name) {
      case 'Leaf':
        return <AlambreIcons.Leaf color={color} lineWidth={2.2} style={styles.secIcon} />;
      case 'Trophy':
        return <AlambreIcons.Trophy color={color} lineWidth={2.2} style={styles.secIcon} />;
      case 'Heart':
        return <AlambreIcons.Heart color={color} lineWidth={2.2} style={styles.secIcon} />;
      case 'Zap':
      default:
        return <AlambreIcons.Zap color={color} lineWidth={2.2} style={styles.secIcon} />;
    }
  };

  return (
    <View
      style={[
        styles.itemCard,
        {
          backgroundColor: theme.surface,
          borderColor: isExpanded ? theme.primary : theme.border,
        },
      ]}
    >
      {/* Header Button */}
      <Pressable onPress={onToggle} style={styles.itemHeader}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: isExpanded ? theme.primarySoft : theme.surfaceAlt },
            ]}
          >
            {renderIcon(section.iconName, isExpanded ? theme.primary : theme.muted)}
          </View>
          <View style={styles.titleColumn}>
            <Text style={[styles.sectionTitle, { color: theme.color }]}>
              {section.title}
            </Text>
            <AppBadge label={section.badge} tone={isExpanded ? 'primary' : 'neutral'} size="sm" />
          </View>
        </View>

        <Animated.View style={[styles.chevronBox, animatedChevronStyle]}>
          <AlambreIcons.Arrow
            drawIt
            color={isExpanded ? theme.primary : theme.muted}
            lineWidth={2.2}
            style={styles.chevronIcon}
          />
        </Animated.View>
      </Pressable>

      {/* Off-screen Measurement Probe */}
      <View {...probeProps}>
        {renderInnerContent()}
      </View>

      {/* Collapsible Animated Body */}
      <Animated.View style={[styles.bodyAnimatedWrapper, animatedStyle, animatedBodyStyle]}>
        {renderInnerContent()}
      </Animated.View>
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
  accordionContainer: {
    gap: 10,
  },
  itemCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secIcon: {
    width: 20,
    height: 20,
  },
  titleColumn: {
    flex: 1,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  chevronBox: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronIcon: {
    width: 16,
    height: 16,
  },
  bodyAnimatedWrapper: {
    overflow: 'hidden',
  },
  innerContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  highlightsBox: {
    gap: 6,
    paddingTop: 4,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tickIcon: {
    width: 14,
    height: 14,
  },
  highlightText: {
    fontSize: 12,
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
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 4,
  },
  actionBtn: {
    flex: 1,
  },
});
