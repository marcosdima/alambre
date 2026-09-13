import { Text, View } from 'react-native';
import { Pressable, StyleSheet } from 'react-native';
import { useNavigator } from 'alambre';
import { useLightDark } from '../../providers/theme';
import AppTitle from '../../components/AppTitle';
import AppButton from '../../components/AppButton';
import ToggleLightDark from '../../components/ToggleLightDark';
import { AnimadoView } from 'alambre';
import { withTiming } from 'react-native-reanimated';

export default () => {
  const { navigate } = useNavigator();
  const { toggleTheme, theme, currThemeName } = useLightDark();

  return (
    <AnimadoView
      animation={(v: number) => withTiming(v, { duration: 2000 })}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={[styles.hero, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.badge, { color: theme.primary, backgroundColor: theme.primarySoft }]}>Navigator Demo</Text>
        <AppTitle style={[styles.title, { color: theme.color }]}>Home</AppTitle>
        <Text style={[styles.subtitle, { color: theme.muted }]}>Probando navegacion, tema y componentes interactivos.</Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={() => navigate('play')}
        >
          <Text style={[styles.actionLabel, { color: theme.onPrimary }]}>Ir a Play</Text>
        </Pressable>

        <Pressable
          style={[styles.actionGhost, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
          onPress={() => navigate('home', { subpage: 'configuration' })}
        >
          <Text style={[styles.actionGhostLabel, { color: theme.color }]}>Abrir Config</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.toastButton, { borderColor: theme.warning, backgroundColor: theme.surfaceAlt }]}
        onPress={() => navigate('toast')}
      >
        <Text style={[styles.toastLabel, { color: theme.warning }]}>Ir a Toast Playground</Text>
      </Pressable>

      <ToggleLightDark
        toggle={toggleTheme}
        style={styles.toggle}
        setLeft={currThemeName === 'light'}
      />

      <AppButton
        style={styles.springButton}
        onPress={() => navigate('home', { subpage: 'configuration,advance' })}
      >
        <Text style={[styles.springLabel, { color: theme.success }]}>
          Ir a Advance
        </Text>
      </AppButton>
    </AnimadoView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
  },
  hero: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 18,
    gap: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  actionRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionLabel: {
    fontWeight: '700',
    fontSize: 15,
  },
  actionGhost: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionGhostLabel: {
    fontWeight: '700',
    fontSize: 15,
  },
  toastButton: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  toastLabel: {
    fontWeight: '700',
  },
  toggle: {
    height: 90,
    aspectRatio: 3,
  },
  springButton: {
    minWidth: 180,
    alignItems: 'center',
  },
  springLabel: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
