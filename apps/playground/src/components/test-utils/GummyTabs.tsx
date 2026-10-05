import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import AppSegmentedControl from '../AppSegmentedControl';

export interface GummyTabsProps {
  tabs: { id: string; label: string; content: React.ReactNode }[];
}

export function GummyTabs({ tabs }: GummyTabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id);
  const options = tabs.map((tab) => ({ label: tab.label, value: tab.id }));

  return (
    <View style={styles.container}>
      <View style={styles.tabsWrapper}>
        <AppSegmentedControl
          value={activeTab}
          options={options}
          onChange={setActiveTab}
        />
      </View>
      <View style={styles.contentContainer}>
        {tabs.find((t) => t.id === activeTab)?.content}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsWrapper: {
    marginBottom: 16,
  },
  contentContainer: {
    flex: 1,
  },
});
