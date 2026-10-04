import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, useSharedValue, useAnimatedStyle, withSpring, interpolate, Extrapolation, runOnJS } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useLightDark } from '../../providers/theme';
import { TestCard } from '../../components/test-utils/TestCard';
import { ConfigSwitch } from '../../components/test-utils/ConfigSwitch';
import { ConfigSlider } from '../../components/test-utils/ConfigSlider';
import { GummyTabs } from '../../components/test-utils/GummyTabs';
import AppTitle, { AppText } from '../../components/AppTitle';
import AppButton from '../../components/AppButton';

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
        description="Validating Reanimated Layout transitions and Gesture-Driven morphs in concrete product scenarios."
      >
        <ConfigSlider label="Damping" value={damping} min={5} max={50} step={1} onChange={setDamping} />
        <ConfigSlider label="Stiffness" value={stiffness} min={50} max={500} step={10} onChange={setStiffness} />
        <ConfigSlider label="Mass" value={mass} min={0.5} max={5} step={0.5} onChange={setMass} />
      </TestCard>
      <GummyTabs tabs={tabs} />
    </View>
  );
}

// --- 1. ACCORDION TESTBED ---
function AccordionTestbed({ transition, theme }: { transition: any, theme: any }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.listContent}>
      {ITEMS.slice(0, 4).map((item) => {
        const isExpanded = expandedId === item.id;
        return (
          <Animated.View key={item.id} layout={transition}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: isExpanded }}
              style={[styles.rowCard, { backgroundColor: item.color }]}
              onPress={() => setExpandedId(isExpanded ? null : item.id)}
            >
              <AppTitle level={3} style={{ color: theme.color }}>{item.title}</AppTitle>
              {isExpanded && (
                <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.mockDetails}>
                  <View style={[styles.skeletonLine, { backgroundColor: theme.surfaceAlt }]} />
                  <View style={[styles.skeletonLine, { width: '60%', backgroundColor: theme.surfaceAlt }]} />
                </Animated.View>
              )}
            </Pressable>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

// --- 2. LIST / GRID MORPH TESTBED ---
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
            <View style={[styles.cardShape, { backgroundColor: item.color }]}>
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

// --- 3. DYNAMIC FILTER TESTBED ---
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
            <View style={[styles.cardShape, { backgroundColor: item.color, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 }]}>
              <AppText style={{ color: theme.color, fontWeight: 'bold' }}>{item.title}</AppText>
              <AppText style={{ color: theme.color }}>Cat: {item.category}</AppText>
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

// --- 4. GESTURE INTERACTIVE MORPH ---
function GestureMorphTestbed({ transition, damping, stiffness, mass, theme }: { transition: any, damping: number, stiffness: number, mass: number, theme: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Shared values for physics state
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const panGesture = useMemo(() => Gesture.Pan()
    .enabled(isExpanded) // Only drag when expanded
    .onStart(() => {
      isDragging.value = true;
    })
    .onUpdate((event) => {
      // Only allow pulling down
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      isDragging.value = false;
      // If pulled down far enough or fast enough, collapse
      if (event.translationY > 150 || event.velocityY > 500) {
        runOnJS(setIsExpanded)(false);
        translateY.value = withSpring(0, { damping, stiffness, mass });
      } else {
        // Spring back to expanded
        translateY.value = withSpring(0, { damping, stiffness, mass });
      }
    }), [isExpanded, damping, stiffness, mass]);

  // Since we are combining Layout transitions with Gesture translations, 
  // we apply the translation and scale to the view.
  const animatedStyle = useAnimatedStyle(() => {
    // Interpolate scale slightly based on drag for an iOS-like "squish" feel
    const scale = interpolate(
      translateY.value,
      [0, 300],
      [1, 0.85],
      Extrapolation.CLAMP
    );
    
    return {
      transform: [
        { translateY: translateY.value },
        { scale }
      ],
      // Border radius also changes based on drag for extra polish
      borderRadius: isExpanded 
        ? interpolate(translateY.value, [0, 150], [16, 32], Extrapolation.CLAMP)
        : 16
    };
  });

  return (
    <View style={styles.tabContent}>
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <AppText style={{ marginBottom: 12, color: theme.muted }}>
          Tap to expand. Once expanded, swipe/pull down the card to interrupt and shrink it back (iOS Photos style).
        </AppText>
      </View>
      <ScrollView contentContainerStyle={styles.listContent}>
        <GestureDetector gesture={panGesture}>
          <Animated.View
            layout={transition}
            style={[
              styles.cardShape, 
              { backgroundColor: '#ff7b72', overflow: 'hidden' },
              isExpanded ? styles.gestureCardExpanded : styles.gestureCardThumbnail,
              animatedStyle
            ]}
          >
            <Pressable 
              accessibilityRole="button"
              accessibilityState={{ expanded: isExpanded }}
              style={StyleSheet.absoluteFill} 
              onPress={() => {
                if (!isExpanded) setIsExpanded(true);
              }}
            >
              <View style={{ flex: 1, padding: 24, justifyContent: isExpanded ? 'flex-start' : 'center' }}>
                <AppTitle level={isExpanded ? 1 : 3} style={{ color: theme.color }}>Interactive Card</AppTitle>
                {isExpanded && (
                  <Animated.View entering={FadeIn} style={{ marginTop: 20, gap: 12 }}>
                    <View style={[styles.skeletonLine, { backgroundColor: theme.surfaceAlt }]} />
                    <View style={[styles.skeletonLine, { backgroundColor: theme.surfaceAlt }]} />
                    <View style={[styles.skeletonLine, { width: '80%', backgroundColor: theme.surfaceAlt }]} />
                    
                    <AppButton 
                      label="Close Programmatically" 
                      onPress={() => setIsExpanded(false)} 
                      style={{ marginTop: 24 }} 
                    />
                  </Animated.View>
                )}
              </View>
            </Pressable>
          </Animated.View>
        </GestureDetector>
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
  mockDetails: { marginTop: 16, gap: 8 },
  skeletonLine: { height: 10, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 5, width: '100%' },
  
  // Morph
  listItem: { width: '100%', height: 64 },
  gridItem: { width: '46%', height: 120 },
  cardShape: { borderRadius: 16, shadowColor: '#000', shadowOffset: { width:0, height:2 }, shadowOpacity: 0.1, elevation: 2 },
  
  // Gesture
  gestureCardThumbnail: { width: '100%', height: 100 },
  gestureCardExpanded: { width: '100%', height: 450, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15 },
});
