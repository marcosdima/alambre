import { View } from "@base"
import { Button, StyleSheet } from "react-native"
import Hi from "./text/Hi"
import { useLightDark } from "./theme/theme"
import ToggleLightDark from "src/components/animations/ToggleLightDark"
import Sun from "src/components/icons/Sun"
import { useState } from "react"
import Moon from "src/components/icons/Moon"
import Circle from "src/components/icons/base/Circle"
import { CircleProps } from "react-native-svg"

export default () => {
  const { theme, toggleTheme } = useLightDark();
  const [val,setVal] = useState(0);
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Sun reset={val % 2 === 0} style={styles.toggle}/>
      <Moon reset={val % 2 === 0} style={styles.toggle}/>
      <Button title="AHHH" onPress={() => setVal(val + 1)}/>
      <Hi></Hi>
      <ToggleLightDark setLeft={false} style={styles.toggle} toggle={toggleTheme}/>
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
  toggle: {
    width: 210,
    height: 70,
  }
});