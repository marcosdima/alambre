import { Text, Title, View } from 'src/components/base';
import { Pressable, StyleSheet } from 'react-native';
import { useNavigator } from 'src/providers';
import { useLightDark } from 'tests/theme/theme';
import { ApiShow } from 'tests/api';

export default () => {
  const { navigate } = useNavigator();
  const { theme } = useLightDark();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Title style={[styles.title, { color: theme.color }]}>Play</Title>
        <Text style={[styles.description, { color: theme.muted }]}>
          Entrypoint para arrancar pruebas de flujo y volver a secciones de setup.
        </Text>

        <Pressable
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={() => navigate('home', { subpage: 'configuration' })}
        >
          <Text style={[styles.primaryLabel, { color: theme.onPrimary }]}>Ir a Configuracion</Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryButton, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
          onPress={() => navigate('home')}
        >
          <Text style={[styles.secondaryLabel, { color: theme.color }]}>Volver a Home</Text>
        </Pressable>

        <ApiShow />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  card: {
    width: '100%',
    maxWidth: 500,
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  title: {
    marginBottom: 4,
  },
  description: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryLabel: {
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 13,
    alignItems: 'center',
  },
  secondaryLabel: {
    fontWeight: '700',
    fontSize: 15,
  },
});
