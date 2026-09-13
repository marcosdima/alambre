import { Text, View, StyleSheet } from 'react-native';
import { useNavigator, useToast } from 'alambre';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import { useConfig } from '../../providers/config';
import AppTitle from '../../components/AppTitle';
import AppButton from '../../components/AppButton';

export default () => {
  const { theme } = useLightDark();
  const { lang } = useLang();
  const { config } = useConfig();
  const { navigate } = useNavigator();
  const { show } = useToast();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <AppTitle style={{ color: theme.color }}>{lang.home.title}</AppTitle>
        <Text style={[styles.subtitle, { color: theme.muted }]}>{lang.home.subtitle}</Text>
        <Text style={{ color: theme.primary }}>{config.greeting}</Text>
      </View>

      <AppButton onPress={() => navigate('home', { subpage: 'details' })}>
        <Text style={{ color: theme.primary }}>{lang.home.openDetails}</Text>
      </AppButton>

      <AppButton onPress={() => show({ payload: lang.home.title }) }>
        <Text style={{ color: theme.primary }}>{lang.home.showToast}</Text>
      </AppButton>

      <AppButton onPress={() => navigate('settings')}>
        <Text style={{ color: theme.primary }}>{lang.home.openSettings}</Text>
      </AppButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  card: {
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
});
