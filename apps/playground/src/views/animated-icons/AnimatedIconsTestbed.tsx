import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { withTiming } from 'react-native-reanimated';
import { useLightDark } from '../../providers/theme';
import { TestCard } from '../../components/test-utils/TestCard';
import { ConfigSwitch } from '../../components/test-utils/ConfigSwitch';
import { ConfigSlider } from '../../components/test-utils/ConfigSlider';
import { GummyTabs } from '../../components/test-utils/GummyTabs';
import { createAnimatedIcon } from 'alambre';
import AppTitle, { AppText } from '../../components/AppTitle';
import AppCard from '../../components/AppCard';

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

  const [duration, setDuration] = useState(300);
  const [strokeOffset, setStrokeOffset] = useState(0); // 0 = fully drawn

  const iconAnimationConfig = {
    drawAnimation: (v: number) => withTiming(v, { duration }),
    resetAnimation: (v: number) => withTiming(v, { duration }),
  };

  const tabs = [
    { id: 'favorite', label: 'Favorite Button', content: <FavoriteScenario theme={theme} iconAnimation={iconAnimationConfig} offset={strokeOffset} /> },
    { id: 'task', label: 'Task Completion', content: <TaskScenario theme={theme} iconAnimation={iconAnimationConfig} offset={strokeOffset} /> },
    { id: 'weather', label: 'Weather Widget', content: <WeatherScenario theme={theme} iconAnimation={iconAnimationConfig} offset={strokeOffset} /> }
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TestCard 
        title="AI-Optimized Animated Icons" 
        description="Testing the new createAnimatedIcon factory. Standard 24x24 viewBox makes AI generation flawless."
      >
        <ConfigSlider label="Animation Duration (ms)" value={duration} min={100} max={2000} step={100} onChange={setDuration} />
        <ConfigSlider label="Manual Stroke Offset" value={strokeOffset} min={0} max={100} step={5} onChange={setStrokeOffset} />
      </TestCard>
      
      <GummyTabs tabs={tabs} />
    </View>
  );
}

function FavoriteScenario({ theme, iconAnimation, offset }: any) {
  const [isFavorite, setIsFavorite] = useState(false);
  
  return (
    <View style={styles.tabContent}>
      <AppCard variant="outlined" style={styles.cardCenter}>
        <AppTitle level={3} style={{ color: theme.color, marginBottom: 16 }}>Product Detail</AppTitle>
        <Pressable 
          accessibilityRole="button"
          accessibilityState={{ checked: isFavorite }}
          accessibilityLabel="Toggle Favorite"
          style={[styles.button, { backgroundColor: isFavorite ? theme.primary : theme.surfaceAlt }]}
          onPress={() => setIsFavorite(!isFavorite)}
        >
          <StarIcon 
            size={32} 
            color={isFavorite ? '#ffffff' : theme.muted} 
            drawIt={isFavorite} 
            strokeOffset={offset} 
            iconAnimation={iconAnimation}
          />
          <AppText style={{ color: isFavorite ? '#ffffff' : theme.color, marginLeft: 8, fontWeight: 'bold' }}>
            {isFavorite ? 'Saved to Favorites' : 'Add to Favorites'}
          </AppText>
        </Pressable>
      </AppCard>
    </View>
  );
}

function TaskScenario({ theme, iconAnimation, offset }: any) {
  const [isDone, setIsDone] = useState(false);
  
  return (
    <View style={styles.tabContent}>
      <AppCard variant="soft" style={styles.row}>
        <Pressable 
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isDone }}
          accessibilityLabel="Mark task as done"
          style={[styles.checkbox, { borderColor: isDone ? theme.primary : theme.muted, backgroundColor: isDone ? theme.primary : 'transparent' }]}
          onPress={() => setIsDone(!isDone)}
        >
          <CheckIcon 
            size={16} 
            color="#ffffff" 
            drawIt={isDone} 
            strokeOffset={offset} 
            iconAnimation={iconAnimation}
          />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <AppText style={{ color: theme.color, textDecorationLine: isDone ? 'line-through' : 'none' }}>
            Buy groceries for the week
          </AppText>
        </View>
      </AppCard>
    </View>
  );
}

function WeatherScenario({ theme, iconAnimation, offset }: any) {
  const [isRaining, setIsRaining] = useState(true);
  
  return (
    <View style={styles.tabContent}>
      <ConfigSwitch label="Simulate Rain" value={isRaining} onChange={setIsRaining} />
      <AppCard variant="outlined" style={[styles.cardCenter, { marginTop: 16 }]}>
        <CloudRainIcon 
          size={64} 
          color={theme.color} 
          drawIt={isRaining} 
          strokeOffset={offset} 
          iconAnimation={iconAnimation}
        />
        <AppTitle level={3} style={{ color: theme.color, marginTop: 16 }}>
          {isRaining ? 'Heavy Rain Expected' : 'Clear Skies'}
        </AppTitle>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  tabContent: { flex: 1, paddingTop: 24, paddingBottom: 40 },
  cardCenter: { alignItems: 'center', justifyContent: 'center', padding: 24, borderRadius: 16 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16 },
  button: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 100 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }
});
