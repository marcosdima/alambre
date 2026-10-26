import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppTabs, type AppTabItem } from 'alambre/ui';

export interface GummyTabItem {
  id?: string;
  key?: string;
  label: string;
  content?: React.ReactNode;
}

export interface GummyTabsProps {
  tabs: GummyTabItem[];
  activeTab?: string;
  onChange?: (id: string) => void;
}

export function GummyTabs({ tabs, activeTab, onChange }: GummyTabsProps) {
  const normalizedTabs: AppTabItem<string>[] = tabs.map((tab) => ({
    id: tab.id ?? tab.key ?? tab.label,
    label: tab.label,
    content: tab.content,
  }));

  return (
    <View style={styles.container}>
      <AppTabs
        tabs={normalizedTabs}
        activeTab={activeTab}
        onChange={onChange}
        variant="pill"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
