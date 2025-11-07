import { View } from "@base"
import { Button, StyleSheet } from "react-native"
import Hi from "./text/Hi"
import { useLightDark } from "./theme/theme"

export default () => {
  const { theme, toggleTheme } = useLightDark();
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Button title='Button' onPress={toggleTheme}/>
      <Hi></Hi>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
});