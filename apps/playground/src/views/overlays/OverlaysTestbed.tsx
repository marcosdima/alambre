import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLightDark } from '../../providers/theme';
import AppButton from '../../components/AppButton';
import AppDialog from '../../components/AppDialog';
import AppActionSheet from '../../components/AppActionSheet';

export default function OverlaysTestbed() {
  const { theme } = useLightDark();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.color }]}>Overlays Testbed</Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.color }]}>AppDialog</Text>
        <AppButton onPress={() => setDialogVisible(true)}>
          <Text style={{ color: theme.primary }}>Open Dialog</Text>
        </AppButton>
        <AppDialog
          visible={dialogVisible}
          onClose={() => setDialogVisible(false)}
          title="Título del Dialog"
          description="Este es un dialog de prueba."
          confirmLabel="Aceptar"
          cancelLabel="Cancelar"
          onConfirm={() => setDialogVisible(false)}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.color }]}>AppActionSheet</Text>
        <AppButton onPress={() => setSheetVisible(true)}>
          <Text style={{ color: theme.primary }}>Open Action Sheet</Text>
        </AppButton>
        <AppActionSheet
          visible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          title="Acciones"
          options={[
            { id: '1', label: 'Opción 1', onPress: () => setSheetVisible(false) },
            { id: '2', label: 'Opción 2', onPress: () => setSheetVisible(false) },
            { id: '3', label: 'Eliminar', tone: 'danger', onPress: () => setSheetVisible(false) },
          ]}
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
