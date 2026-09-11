import { Button } from 'react-native';
import { useLang } from '../../providers/lang';
import { Text, View } from 'alambre';
import { useLightDark } from '../../providers/theme';

export default () => {
  const { lang, currentLang, changeLang } = useLang();
  const { theme } = useLightDark();
  return (
    <View style={{ backgroundColor: theme.background }}>
      <Text style={theme}>{lang.hi}</Text>
      <Button
        title={lang.changeLang}
        onPress={
          () => changeLang(currentLang === 'es' ? 'en' : 'es')
        }
      />
    </View>

  );
};
