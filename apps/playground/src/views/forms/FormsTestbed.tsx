import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLightDark } from '../../providers/theme';
import AppTextInput from '../../components/AppTextInput';
import AppStepper from '../../components/AppStepper';
import AppSlider from '../../components/AppSlider';

export default function FormsTestbed() {
  const { theme } = useLightDark();
  const [text, setText] = useState('');
  const [stepperValue, setStepperValue] = useState(0);
  const [sliderValue, setSliderValue] = useState(50);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.color }]}>Forms Testbed</Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.color }]}>AppTextInput</Text>
        <AppTextInput
          value={text}
          onChangeText={setText}
          placeholder="Escribe algo..."
          label="Nombre de usuario"
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.color }]}>AppStepper</Text>
        <AppStepper
          value={stepperValue}
          onChange={setStepperValue}
          label="Cantidad"
          min={0}
          max={10}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.color }]}>AppSlider</Text>
        <AppSlider
          value={sliderValue}
          onChange={setSliderValue}
          min={0}
          max={100}
          label={`Valor: ${sliderValue}`}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 24 },
  title: { fontSize: 24, fontWeight: 'bold' },
  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
});
