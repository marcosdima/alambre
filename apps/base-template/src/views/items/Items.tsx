import { Text, View, StyleSheet } from 'react-native';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import AppTitle from '../../components/AppTitle';

export default () => {
  const { theme } = useLightDark();
  const { lang } = useLang();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppTitle style={{ color: theme.color }}>{lang.items.title}</AppTitle>
      <Text style={[styles.empty, { color: theme.muted }]}>{lang.items.empty}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  empty: {
    fontSize: 15,
    lineHeight: 20,
  },
});
