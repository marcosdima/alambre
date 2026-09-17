import { Text, View, StyleSheet, Pressable } from 'react-native';
import { useLang } from '../../providers/lang';
import { useLightDark } from '../../providers/theme';
import AppTitle from '../../components/AppTitle';
import ToggleLightDark from '../../components/ToggleLightDark';

export default () => {
  const { theme, toggleTheme, currThemeName } = useLightDark();
  const { lang, currentLang, changeLang } = useLang();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppTitle style={{ color: theme.color }}>{lang.settings.title}</AppTitle>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionLabel, { color: theme.color }]}>{lang.settings.language}</Text>
        <View style={styles.row}>
          {(['es', 'en'] as const).map((code) => {
            const active = currentLang === code;
            return (
              <Pressable
                key={code}
                onPress={() => changeLang(code)}
                style={[
                  styles.langChip,
                  { borderColor: theme.border, backgroundColor: theme.surfaceAlt },
                  active && { borderColor: theme.primary, backgroundColor: theme.primarySoft },
                ]}
              >
                <Text style={{ color: active ? theme.primary : theme.color, textTransform: 'uppercase' }}>
                  {code}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionLabel, { color: theme.color }]}>{lang.settings.theme}</Text>
        <ToggleLightDark toggle={toggleTheme} setLeft={currThemeName === 'light'} style={styles.toggle} />
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
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  sectionLabel: {
    fontWeight: '700',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  langChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggle: {
    height: 64,
    aspectRatio: 3.2,
  },
});
