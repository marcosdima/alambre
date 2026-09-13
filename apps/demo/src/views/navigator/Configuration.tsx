import { Text, View } from 'react-native';
import { Pressable, StyleSheet } from 'react-native';
import { useNavigator } from 'alambre';
import { useLightDark } from '../../providers/theme';
import AppTitle from '../../components/AppTitle';

export default () => {
  const { navigate } = useNavigator();
  const { theme } = useLightDark();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <AppTitle style={[styles.title, { color: theme.color }]}>Configuration</AppTitle>
        <Text style={[styles.description, { color: theme.muted }]}>Aca dejamos accesos directos para testear la profundidad del arbol de paginas.</Text>

        <Pressable
          style={[styles.primaryButton, { backgroundColor: theme.success }]}
          onPress={() => navigate('home', { subpage: 'configuration,advance' })}
        >
          <Text style={[styles.primaryLabel, { color: theme.onPrimary }]}>Ir a Advance</Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryButton, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
          onPress={() => navigate('play')}
        >
          <Text style={[styles.secondaryLabel, { color: theme.color }]}>Ir a Play</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
