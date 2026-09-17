import { Text, View, StyleSheet, Pressable, Switch } from 'react-native';
import { useLang } from '../../providers/lang';
import { useLightDark } from '../../providers/theme';
import { useConfig } from '../../providers/config';
import ToggleLightDark from '../../components/ToggleLightDark';

export default () => {
  const { theme, toggleTheme, currThemeName } = useLightDark();
  const { lang, currentLang, changeLang } = useLang();
  const { config, saveField } = useConfig();

  const isAutoCross = config.autoCross === 'true';

  const toggleAutoCross = () => {
    void saveField('autoCross', isAutoCross ? 'false' : 'true');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Language */}
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

      {/* Theme */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionLabel, { color: theme.color }]}>{lang.settings.theme}</Text>
        <ToggleLightDark toggle={toggleTheme} setLeft={currThemeName === 'light'} style={styles.toggle} />
      </View>

      {/* Gameplay Settings */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionLabel, { color: theme.color }]}>{lang.settings.gameplay}</Text>
        <View style={styles.switchRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.switchTitle, { color: theme.color }]}>
              {lang.settings.autoCross}
            </Text>
            <Text style={[styles.switchDesc, { color: theme.muted }]}>
              {lang.settings.autoCrossDesc}
            </Text>
          </View>
          <Switch
            value={isAutoCross}
            onValueChange={toggleAutoCross}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={theme.surface}
          />
        </View>
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
    alignSelf: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
});
