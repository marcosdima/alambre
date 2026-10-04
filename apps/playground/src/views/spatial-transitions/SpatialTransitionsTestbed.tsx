import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useLightDark } from '../../providers/theme';
import { TestCard } from '../../components/test-utils/TestCard';
import { ConfigSwitch } from '../../components/test-utils/ConfigSwitch';
import { ConfigSlider } from '../../components/test-utils/ConfigSlider';
import { GummyTabs } from '../../components/test-utils/GummyTabs';
import AppTitle, { AppText } from '../../components/AppTitle';
import AppButton from '../../components/AppButton';
import { AccordionItem, InteractiveCard } from 'alambre';

// --- DATA ---
const ITEMS = [
  { id: '1', title: 'System Settings', color: '#ff7b72', category: 'A' },
  { id: '2', title: 'Network Config', color: '#79c0ff', category: 'B' },
  { id: '3', title: 'User Profiles', color: '#d2a8ff', category: 'A' },
  { id: '4', title: 'Security Policies', color: '#a5d6ff', category: 'C' },
  { id: '5', title: 'Display Options', color: '#f0883e', category: 'B' },
  { id: '6', title: 'Audio Setup', color: '#8957e5', category: 'A' },
];

export default function SpatialTransitionsTestbed() {
  const { theme } = useLightDark();

  const [damping, setDamping] = useState(16);
  const [stiffness, setStiffness] = useState(200);
  const [mass, setMass] = useState(1);

  const transition = LinearTransition.springify().damping(damping).stiffness(stiffness).mass(mass);

  const tabs = [
    { id: 'accordion', label: 'Accordion', content: <AccordionTestbed transition={transition} theme={theme} /> },
    { id: 'morph', label: 'List / Grid', content: <MorphTestbed transition={transition} theme={theme} /> },
    { id: 'filter', label: 'Dynamic Filter', content: <FilterTestbed transition={transition} theme={theme} /> },
    { id: 'gesture', label: 'Interactive Gesture', content: <GestureMorphTestbed transition={transition} damping={damping} stiffness={stiffness} mass={mass} theme={theme} /> },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TestCard 
        title="Real-World Spatial UI" 
        description="Validating extracted Spatial components (AccordionItem, InteractiveCard) from alambre."
      >
        <ConfigSlider label="Damping" value={damping} min={5} max={50} step={1} onChange={setDamping} />
        <ConfigSlider label="Stiffness" value={stiffness} min={50} max={500} step={10} onChange={setStiffness} />
        <ConfigSlider label="Mass" value={mass} min={0.5} max={5} step={0.5} onChange={setMass} />
      </TestCard>
      <GummyTabs tabs={tabs} />
    </View>
  );
}

function AccordionTestbed({ transition, theme }: { transition: any, theme: any }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.listContent}>
      {ITEMS.slice(0, 4).map((item) => (
        <AccordionItem
          key={item.id}
          id={item.id}
          isExpanded={expandedId === item.id}
          onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
          transition={transition}
          style={[styles.rowCard, { backgroundColor: item.color }]}
          title={<AppTitle level={3} style={{ color: theme.color }}>{item.title}</AppTitle>}
        >
          <View style={[styles.skeletonLine, { backgroundColor: theme.surfaceAlt }]} />
          <View style={[styles.skeletonLine, { width: '60%', backgroundColor: theme.surfaceAlt }]} />
        </AccordionItem>
      ))}
    </ScrollView>
  );
}

function MorphTestbed({ transition, theme }: { transition: any, theme: any }) {
  const [isGrid, setIsGrid] = useState(false);

  return (
    <View style={styles.tabContent}>
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <ConfigSwitch label="View as Grid" value={isGrid} onChange={setIsGrid} />
      </View>
      <ScrollView contentContainerStyle={isGrid ? styles.gridContent : styles.listContent}>
        {ITEMS.map((item) => (
          <Animated.View 
            key={item.id} 
            layout={transition}
            style={isGrid ? styles.gridItem : styles.listItem}
          >
            <View style={[styles.cardShape, { backgroundColor: item.color, flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
              <AppText style={{ color: theme.color, fontWeight: 'bold' }}>
                {isGrid ? item.id : item.title}
              </AppText>
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

function FilterTestbed({ transition, theme }: { transition: any, theme: any }) {
  const [filterA, setFilterA] = useState(true);
  const filteredItems = ITEMS.filter(item => filterA || item.category !== 'A');

  return (
    <View style={styles.tabContent}>
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <AppButton 
          label={filterA ? "Hide Category A" : "Show All"} 
          onPress={() => setFilterA(!filterA)} 
          tone="primary"
        />
      </View>
      <ScrollView contentContainerStyle={styles.listContent}>
        {filteredItems.map((item) => (
          <Animated.View 
            key={item.id} 
            layout={transition}
            entering={FadeIn}
            exiting={FadeOut}
            style={styles.listItem}
          >
            <View style={[styles.cardShape, { backgroundColor: item.color, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }]}>
              <AppText style={{ color: theme.color, fontWeight: 'bold' }}>{item.title}</AppText>
              <AppText style={{ color: theme.color }}>Cat: {item.category}</AppText>
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

function GestureMorphTestbed({ transition, damping, stiffness, mass, theme }: { transition: any, damping: number, stiffness: number, mass: number, theme: any }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={styles.tabContent}>
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <AppText style={{ marginBottom: 12, color: theme.muted }}>
          Tap to expand. Once expanded, swipe/pull down the card to interrupt and shrink it back (iOS Photos style).
        </AppText>
      </View>
      <ScrollView contentContainerStyle={styles.listContent}>
        <InteractiveCard
          isExpanded={isExpanded}
          onExpand={() => setIsExpanded(true)}
          onCollapse={() => setIsExpanded(false)}
          transition={transition}
          damping={damping}
          stiffness={stiffness}
          mass={mass}
          style={{ backgroundColor: '#ff7b72' }}
          collapsedStyle={styles.gestureCardThumbnail}
          expandedStyle={styles.gestureCardExpanded}
          collapsedContent={
            <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
              <AppTitle level={3} style={{ color: theme.color }}>Interactive Card</AppTitle>
            </View>
          }
          expandedContent={
            <View style={{ flex: 1, padding: 24, justifyContent: 'flex-start' }}>
              <AppTitle level={1} style={{ color: theme.color }}>Interactive Card</AppTitle>
              <View style={{ marginTop: 20, gap: 12 }}>
                <View style={[styles.skeletonLine, { backgroundColor: theme.surfaceAlt }]} />
                <View style={[styles.skeletonLine, { backgroundColor: theme.surfaceAlt }]} />
                <View style={[styles.skeletonLine, { width: '80%', backgroundColor: theme.surfaceAlt }]} />
                <AppButton 
                  label="Close Programmatically" 
                  onPress={() => setIsExpanded(false)} 
                  style={{ marginTop: 24 }} 
                />
              </View>
            </View>
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabContent: { flex: 1, paddingTop: 16 },
  listContent: { paddingHorizontal: 16, gap: 12, paddingBottom: 40 },
  gridContent: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 12, paddingBottom: 40 },
  
  // Accordion
  rowCard: { padding: 16, borderRadius: 16, minHeight: 64, justifyContent: 'center' },
  skeletonLine: { height: 10, borderRadius: 5, width: '100%' },
  
  // Morph
  listItem: { width: '100%', height: 64 },
  gridItem: { width: '46%', height: 120 },
  cardShape: { borderRadius: 16, shadowColor: '#000', shadowOffset: { width:0, height:2 }, shadowOpacity: 0.1, elevation: 2 },
  
  // Gesture
  gestureCardThumbnail: { width: '100%', height: 100 },
  gestureCardExpanded: { width: '100%', height: 450, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15 },
});
