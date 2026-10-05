import React from 'react';
import { StyleSheet, View, ScrollView, Text } from 'react-native';
import { useNavigator, AlambreIcons, SettingsIcon } from 'alambre';
import { useLightDark } from '../../providers/theme';
import AppCard from '../../components/AppCard';
import TypewriterText from '../../components/TypewriterText';

export default function Home() {
  const { theme } = useLightDark();
  const { navigate } = useNavigator();

  const Heart = AlambreIcons.Heart;

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={[styles.roundButton, { backgroundColor: theme.surfaceAlt }]}>
          <Heart style={{ width: 24, height: 24 }} color={theme.color} />
        </View>
        <AppCard 
          variant="soft" 
          style={styles.roundButton} 
          onPress={() => navigate('settings')}
        >
          <SettingsIcon size={22} color={theme.color} />
        </AppCard>
      </View>

      <View style={styles.center}>
        <View style={styles.heroPlaceholder}>
           <Text style={{ color: theme.color, opacity: 0.6 }}>Hero Graphic Placeholder</Text>
        </View>
        <Text style={[styles.title, { color: theme.color }]}>Colguetti</Text>
        <TypewriterText text="Little alarms, hung just right." textStyle={[styles.copy, { color: theme.color, opacity: 0.6 }]} initialDelay={200} />
      </View>

      <View style={styles.menuGrid}>
        <AppCard
          variant="soft"
          padding="lg"
          onPress={() => navigate('alarms')}
          style={[styles.tile, { backgroundColor: theme.primarySoft }]}
        >
          <View style={styles.tileRow}>
            <View style={styles.tileCopy}>
              <Text style={[styles.tileTitle, { color: theme.color }]}>Alarms</Text>
              <Text style={{ color: theme.color, opacity: 0.6 }}>Schedule and manage routines</Text>
            </View>
          </View>
        </AppCard>

        <AppCard 
          variant="soft" 
          padding="lg" 
          onPress={() => navigate('items')}
          style={[styles.tile, { backgroundColor: theme.surfaceAlt }]}
        >
          <View style={styles.tileRow}>
            <View style={styles.tileCopy}>
              <Text style={[styles.tileTitle, { color: theme.color }]}>My Items</Text>
              <Text style={{ color: theme.color, opacity: 0.6 }}>Saved sounds and shapes</Text>
            </View>
          </View>
        </AppCard>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roundButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 16,
  },
  heroPlaceholder: {
    width: 260,
    height: 180,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
  },
  copy: {
    textAlign: 'center',
    fontSize: 16,
  },
  menuGrid: {
    gap: 16,
  },
  tile: {
    borderRadius: 32,
  },
  tileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: 80,
  },
  tileCopy: {
    flex: 1,
    gap: 4,
  },
  tileTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
});
