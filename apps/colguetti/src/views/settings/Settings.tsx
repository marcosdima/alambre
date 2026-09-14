import { Text, View, StyleSheet, Pressable } from 'react-native';
import { useLang } from '../../providers/lang';
import { useLightDark } from '../../providers/theme';
import ToggleLightDark from '../../components/ToggleLightDark';

export default () => {
  const { theme, toggleTheme, currThemeName } = useLightDark();
  const { lang, currentLang, changeLang } = useLang();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionLabel, { color: theme.color }]}>{lang.settings.language}</Text>
        <View style={styles.row}>
          {(['es', 'en'] as const).map((code) => {
            const active = currentLang === code;
            return (
              <Pressable
                key={code}
                onPress={() => changeLang(code)}
                style={({ pressed }) => [
                  styles.langChip,
                  { borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primarySoft : theme.surfaceAlt },
                  pressed && styles.langChipPressed,
                ]}
              >
                <Text style={{ color: active ? theme.primary : theme.color, textTransform: 'uppercase', fontWeight: active ? '800' : '600' }}>
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
    borderWidth: 2,
  },
  langChipPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  toggle: {
    height: 64,
    aspectRatio: 3.2,
  },
});
