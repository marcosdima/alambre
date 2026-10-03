import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useLightDark } from '../../providers/theme';
import { TestCard } from '../../components/test-utils/TestCard';
import { ConfigSwitch } from '../../components/test-utils/ConfigSwitch';
import { ConfigSlider } from '../../components/test-utils/ConfigSlider';
import { ScrollWheel } from './ScrollWheel';

export default function KineticListTestbed() {
  const { theme } = useLightDark();

  const [isSnapEnabled, setIsSnapEnabled] = useState(false);
  const snapEnabledSV = useSharedValue(false);

  // We hardcode itemSize since resizing isn't the focus of kinetic behavior testing
  const itemSizeSV = useSharedValue(100);

  const [damping, setDamping] = useState(20);
  const dampingSV = useSharedValue(20);

  const handleSnapChange = (val: boolean) => {
    setIsSnapEnabled(val);
    snapEnabledSV.value = val;
  };

  const handleDampingChange = (val: number) => {
    setDamping(val);
    dampingSV.value = val;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TestCard title="Kinetic Scroll Wheel" description="Unified math for free-scrolling and strict snapping.">
        <ConfigSwitch
          label="Index Snapping"
          value={isSnapEnabled}
          onChange={handleSnapChange}
        />
        {isSnapEnabled && (
          <ConfigSlider
            label={`Snapping Damping: ${damping}`}
            value={damping}
            min={5}
            max={50}
            step={1}
            onChange={handleDampingChange}
          />
        )}

        <View style={styles.wheelWrapper}>
          <ScrollWheel
            snapEnabled={snapEnabledSV}
            itemSize={itemSizeSV}
            itemCount={50}
            damping={dampingSV}
          />
        </View>
      </TestCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  wheelWrapper: {
    marginTop: 32,
    overflow: 'hidden',
  },
});
