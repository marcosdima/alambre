import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLightDark } from '../../providers/theme';
import CarouselTestbed from './CarouselTestbed';
import DeckTestbed from './DeckTestbed';
import SwipeableRowsTestbed from './SwipeableRowsTestbed';
import GummyTabsTestbed from './GummyTabsTestbed';
import AccordionGroupTestbed from './AccordionGroupTestbed';
import SplitPaneTestbed from './SplitPaneTestbed';

export type ContainerType = 'carousel' | 'deck' | 'rows' | 'tabs' | 'accordion' | 'split';

type ContainerOption = {
  key: ContainerType;
  label: string;
  icon: string;
};

const OPTIONS: ContainerOption[] = [
  { key: 'carousel', label: 'Carrusel', icon: '🎠' },
  { key: 'deck', label: 'Stack Descartable', icon: '🎴' },
  { key: 'rows', label: 'Filas Deslizables', icon: '↔️' },
  { key: 'tabs', label: 'Pestañas Gummy', icon: '📑' },
  { key: 'accordion', label: 'Acordeón Mutex', icon: '📂' },
  { key: 'split', label: 'Panel Dual', icon: '➗' },
];

export default function ContainersHub() {
  const { theme } = useLightDark();
  const [selected, setSelected] = useState<ContainerType>('carousel');

  const renderActiveTestbed = () => {
    switch (selected) {
      case 'deck':
        return <DeckTestbed />;
      case 'rows':
        return <SwipeableRowsTestbed />;
      case 'tabs':
        return <GummyTabsTestbed />;
      case 'accordion':
        return <AccordionGroupTestbed />;
      case 'split':
        return <SplitPaneTestbed />;
      case 'carousel':
      default:
        return <CarouselTestbed />;
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* Top Horizontal Category Switcher Bar */}
      <View style={[styles.topBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topBarContent}
        >
          {OPTIONS.map((opt) => {
            const isActive = selected === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setSelected(opt.key)}
                style={[
                  styles.pill,
                  {
                    backgroundColor: isActive ? theme.primary : theme.surfaceAlt,
                    borderColor: isActive ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text style={styles.pillIcon}>{opt.icon}</Text>
                <Text
                  style={[
                    styles.pillLabel,
                    {
                      color: isActive ? '#ffffff' : theme.color,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Active Container Testbed */}
      <View style={styles.testbedContainer}>
        {renderActiveTestbed()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  topBarContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillIcon: {
    fontSize: 14,
  },
  pillLabel: {
    fontSize: 13,
  },
  testbedContainer: {
    flex: 1,
  },
});
