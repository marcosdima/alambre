import { Text, View, StyleSheet } from 'react-native';
import { useNavigator } from 'alambre';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import AppTitle from '../../components/AppTitle';
import AppButton from '../../components/AppButton';

export default () => {
  const { theme } = useLightDark();
  const { lang } = useLang();
  const { navigate } = useNavigator();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.hero, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <AppTitle style={{ color: theme.color }}>{lang.home.title}</AppTitle>
        <Text style={[styles.subtitle, { color: theme.muted }]}>{lang.home.subtitle}</Text>
      </View>

      <View style={[styles.nextRow, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
        <Text style={{ color: theme.muted }}>{lang.home.noNextAlarms}</Text>
      </View>

      <AppButton style={styles.leaveButton} onPress={() => navigate('alarms')}>
        <Text style={[styles.leaveLabel, { color: theme.success }]}>{lang.home.leaveNow}</Text>
      </AppButton>

      <View style={styles.guideRow}>
        <AppButton style={styles.ghost} onPress={() => navigate('items')}>
          <Text style={{ color: theme.primary }}>{lang.home.guideItems}</Text>
        </AppButton>
        <AppButton style={styles.ghost} onPress={() => navigate('alarms')}>
          <Text style={{ color: theme.primary }}>{lang.home.guideAlarms}</Text>
        </AppButton>
        <AppButton style={styles.ghost} onPress={() => navigate('settings')}>
          <Text style={{ color: theme.primary }}>{lang.home.guideSettings}</Text>
        </AppButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  hero: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 18,
    gap: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  nextRow: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  leaveButton: {
    marginTop: 4,
  },
  leaveLabel: {
    fontWeight: '700',
    fontSize: 16,
  },
  guideRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ghost: {
    flexGrow: 1,
  },
});
