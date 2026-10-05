import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Text, Pressable } from 'react-native';
import { useNavigator, AlambreIcons } from 'alambre';
import { useLightDark } from '../../providers/theme';
import AppCard from '../../components/AppCard';
import TypewriterText from '../../components/TypewriterText';
import SupportModal from '../../components/SupportModal';
import { HangingMobile, AlarmGlyph, ItemsGlyph } from '../../components/illustrations/KineticArt';

export default function Home() {
  const { theme } = useLightDark();
  const { navigate } = useNavigator();
  const [supportVisible, setSupportVisible] = useState(false);

  const Heart = AlambreIcons.Heart;
  const Gear = AlambreIcons.Gear;

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <SupportModal visible={supportVisible} onClose={() => setSupportVisible(false)} />

      <View style={styles.header}>
        <Pressable 
          onPress={() => setSupportVisible(true)}
          style={({ pressed }) => [
            styles.roundButton, 
            { backgroundColor: theme.surfaceAlt, opacity: pressed ? 0.7 : 1 }
          ]}
        >
          <Heart style={{ width: 22, height: 22 }} color={theme.color} />
        </Pressable>
        <Pressable 
          onPress={() => navigate('settings')}
          style={({ pressed }) => [
            styles.roundButton, 
            { backgroundColor: theme.surfaceAlt, opacity: pressed ? 0.7 : 1 }
          ]}
        >
          <Gear style={{ width: 22, height: 22 }} color={theme.color} />
        </Pressable>
      </View>

      <View style={styles.center}>
        <HangingMobile motion={{ speed: 1, amplitude: 1, paused: false }} line={theme.color} size={160} />
        <Text style={[styles.title, { color: theme.color, marginTop: 24 }]}>Colguetti</Text>
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
            <View style={styles.tileIcon}>
              <AlarmGlyph motion={{ speed: 1, amplitude: 1, paused: false }} line={theme.color} size={80} ringing={false} rippleWaves={0} rippleDuration={0} />
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
            <View style={styles.tileIcon}>
              <ItemsGlyph motion={{ speed: 1, amplitude: 1, paused: false }} line={theme.color} size={80} />
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
  tileIcon: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
});
