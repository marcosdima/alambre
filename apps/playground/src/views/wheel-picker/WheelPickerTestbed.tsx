import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLightDark } from '../../providers/theme';
import SwipeableTimePicker from '../../components/SwipeableTimePicker';

export default function WheelPickerTestbed() {
  const { theme } = useLightDark();
  const [time, setTime] = useState('08:00');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.color }]}>Wheel Picker Testbed</Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.color }]}>SwipeableTimePicker</Text>
        <Text style={{ color: theme.muted }}>Hora seleccionada: {time}</Text>
        <SwipeableTimePicker value={time} onChange={setTime} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 24, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
  section: { gap: 12, alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
});
