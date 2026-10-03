import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, withSpring, withTiming } from 'react-native-reanimated';
import { useLightDark } from '../../providers/theme';
import { TestCard } from '../../components/test-utils/TestCard';
import { ConfigSwitch } from '../../components/test-utils/ConfigSwitch';
import { ConfigSlider } from '../../components/test-utils/ConfigSlider';
import AppTitle, { AppText } from '../../components/AppTitle';

const DATA = [
  { id: '1', title: 'Card One', color: '#ff7b72' },
  { id: '2', title: 'Card Two', color: '#79c0ff' },
  { id: '3', title: 'Card Three', color: '#d2a8ff' },
  { id: '4', title: 'Card Four', color: '#a5d6ff' },
];

export default function SpatialTransitionsTestbed() {
  const { theme } = useLightDark();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const [useSpring, setUseSpring] = useState(true);
  const [duration, setDuration] = useState(300);
  const [damping, setDamping] = useState(15);
  const [stiffness, setStiffness] = useState(150);

  const transition = useSpring 
    ? LinearTransition.springify().damping(damping).stiffness(stiffness)
    : LinearTransition.duration(duration);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TestCard title="Spatial Layout Transitions" description="Uses Reanimated Layout Transitions to smoothly expand a grid item while pushing neighbors.">
        <ConfigSwitch
          label="Use Spring (vs Timing)"
          value={useSpring}
          onChange={setUseSpring}
        />
        {!useSpring && (
          <ConfigSlider
            label={`Duration (${duration}ms)`}
            value={duration}
            min={100}
            max={1000}
            step={50}
            onChange={setDuration}
          />
        )}
        {useSpring && (
          <>
            <ConfigSlider
              label={`Damping (${damping})`}
              value={damping}
              min={1}
              max={50}
              step={1}
              onChange={setDamping}
            />
            <ConfigSlider
              label={`Stiffness (${stiffness})`}
              value={stiffness}
              min={10}
              max={500}
              step={10}
              onChange={setStiffness}
            />
          </>
        )}
      </TestCard>

      <ScrollView style={styles.gridContainer} contentContainerStyle={styles.grid}>
        {DATA.map((item) => {
          const isSelected = selectedId === item.id;
          const isAnotherSelected = selectedId !== null && !isSelected;

          return (
            <Animated.View
              key={item.id}
              layout={transition}
              style={[
                styles.cardWrapper, 
                isSelected && styles.cardWrapperSelected,
                isAnotherSelected && styles.cardWrapperHidden
              ]}
            >
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => setSelectedId(isSelected ? null : item.id)}
                activeOpacity={1}
              >
                <Animated.View
                  layout={transition}
                  style={[
                    styles.card, 
                    { backgroundColor: item.color },
                    isSelected && styles.detailCard
                  ]}
                >
                  {isSelected && (
                    <Animated.View entering={FadeIn.delay(100)} exiting={FadeOut.duration(100)} style={styles.closeButton}>
                      <AppText variant="subtitle" style={{ color: '#1A1A1A', fontWeight: 'bold' }}>Close</AppText>
                    </Animated.View>
                  )}
                  <AppTitle level={isSelected ? 1 : 3} style={{ color: '#1A1A1A' }}>
                    {item.title}
                  </AppTitle>
                </Animated.View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gridContainer: {
    flex: 1,
    marginTop: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  cardWrapper: {
    width: '50%',
    padding: 8,
    height: 166, // 150 + 16
    opacity: 1,
  },
  cardWrapperSelected: {
    width: '100%',
    height: 350,
  },
  cardWrapperHidden: {
    opacity: 0.3,
    transform: [{ scale: 0.95 }],
  },
  card: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailCard: {
    borderRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 8,
  },
});
