import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppSegmentedControl } from '@some-alambre/ui';

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

export function GummyTabs({ tabs, activeTab: controlledActiveTab, onChange: controlledOnChange }: GummyTabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(
    tabs[0]?.id ?? tabs[0]?.key ?? '',
  );

  const isControlled = controlledActiveTab !== undefined;
  const currentActiveTab = isControlled ? controlledActiveTab : internalActiveTab;

  const options = tabs.map((tab) => ({
    label: tab.label,
    value: tab.id ?? tab.key ?? tab.label,
  }));

  const handleTabChange = (val: string) => {
    if (!isControlled) {
      setInternalActiveTab(val);
    }
    controlledOnChange?.(val);
  };

  const activeContent = tabs.find(
    (t) => (t.id ?? t.key ?? t.label) === currentActiveTab,
  )?.content;

  return (
    <View style={styles.container}>
      <View style={styles.tabsWrapper}>
        <AppSegmentedControl
          value={currentActiveTab}
          options={options}
          onChange={handleTabChange}
        />
      </View>
      {activeContent ? (
        <View style={styles.contentContainer}>{activeContent}</View>
      ) : null}
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
