import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useLightDark } from '../../providers/theme';
import { TestCard } from '../../components/test-utils/TestCard';
import { ConfigSwitch } from '../../components/test-utils/ConfigSwitch';
import { ConfigSlider } from '../../components/test-utils/ConfigSlider';
import { createAnimatedIcon } from 'alambre';
import AppTitle from '../../components/AppTitle';

// Generated instantly by AI due to standard viewBox!
const CheckIcon = createAnimatedIcon({
  paths: ['M20 6 9 17l-5-5']
});

const StarIcon = createAnimatedIcon({
  paths: ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z']
});

const CloudRainIcon = createAnimatedIcon({
  paths: [
    'M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242',
    'M16 14v6',
    'M8 14v6',
    'M12 16v6'
  ]
});

export default function AnimatedIconsTestbed() {
  const { theme } = useLightDark();

  const [drawIt, setDrawIt] = useState(true);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [strokeOffset, setStrokeOffset] = useState(0); // 0 = fully drawn

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TestCard 
        title="AI-Optimized Animated Icons" 
        description="Testing the new createAnimatedIcon factory. Standard 24x24 viewBox makes AI generation flawless."
      >
        <ConfigSwitch label="Draw Animation State" value={drawIt} onChange={setDrawIt} />
        <ConfigSlider label="Stroke Width" value={strokeWidth} min={1} max={5} step={0.5} onChange={setStrokeWidth} />
        <ConfigSlider label="Stroke Offset (0 = full)" value={strokeOffset} min={0} max={100} step={5} onChange={setStrokeOffset} />
      </TestCard>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          <View style={[styles.iconWrapper, { backgroundColor: theme.surfaceAlt }]}>
            <CheckIcon 
              size={64} 
              color={theme.color} 
              strokeWidth={strokeWidth} 
              drawIt={drawIt} 
              strokeOffset={strokeOffset} 
            />
            <AppTitle level={3} style={{ marginTop: 12, color: theme.color }}>Check</AppTitle>
          </View>
          
          <View style={[styles.iconWrapper, { backgroundColor: theme.surfaceAlt }]}>
            <StarIcon 
              size={64} 
              color="#ffcc00" 
              strokeWidth={strokeWidth} 
              drawIt={drawIt} 
              strokeOffset={strokeOffset} 
            />
            <AppTitle level={3} style={{ marginTop: 12, color: theme.color }}>Star</AppTitle>
          </View>

          <View style={[styles.iconWrapper, { backgroundColor: theme.surfaceAlt }]}>
            <CloudRainIcon 
              size={64} 
              color="#79c0ff" 
              strokeWidth={strokeWidth} 
              drawIt={drawIt} 
              strokeOffset={strokeOffset} 
            />
            <AppTitle level={3} style={{ marginTop: 12, color: theme.color }}>Cloud Rain</AppTitle>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' },
  iconWrapper: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '45%'
  }
});
