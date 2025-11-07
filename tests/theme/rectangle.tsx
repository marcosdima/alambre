import { Text, View } from "@base";
import { Button } from "react-native";
import { useLightDark } from "./theme";
import { useConfig } from "../config/config";

export default () => {
  const { theme, toggleTheme } = useLightDark();
  const { config } = useConfig();

  return (
    <View style={{ backgroundColor: theme.background }}>
      <Text style={theme}>
        {config.alias}
      </Text>
      <Text style={theme}>
        {config.batteryOptions}
      </Text>
      <Button title="Change" onPress={toggleTheme}></Button>
    </View>
  )
}