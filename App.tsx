import { Button, StyleSheet } from 'react-native';
import { View } from '@base';
import { useState } from 'react';
import { LightDarkProvider } from 'tests/theme/theme';
import { ConfigProvider } from 'tests/config/config';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Circle from 'src/components/animations/reanimated/Circle';


export default function App() {
  const [val, setVal] = useState(0);
  const odd = val % 2 === 0;
  return (
    <ConfigProvider>
      <LightDarkProvider>
        <GestureHandlerRootView style={styles.container}>
          <View style={{ height: 300 }}>
            <Circle />
          </View>
          <Button title='Button' onPress={() => setVal(val + 1)}/>
        </GestureHandlerRootView>
      </LightDarkProvider>
    </ConfigProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
