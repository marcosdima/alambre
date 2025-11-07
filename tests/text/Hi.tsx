import { Button } from "react-native";
import { useLang } from "./lang-provider"
import { Text, View } from "@base";
import { useLightDark } from "../theme/theme"

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
}