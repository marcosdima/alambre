import { LightDarkProvider } from 'tests/theme/theme';
import { ConfigProvider } from 'tests/config/config';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LangProvider } from 'tests/text/lang-provider';
import Test from 'tests/Test';
import { NavigatorProvider } from './src/providers';
import navigator from 'tests/navigator/navigator';

export default function App() {
  return (
    <ConfigProvider>
      <LightDarkProvider>
        <LangProvider>
          <GestureHandlerRootView>
            <NavigatorProvider pages={navigator}>
              <Test />
            </NavigatorProvider>
          </GestureHandlerRootView>
        </LangProvider>
      </LightDarkProvider>
    </ConfigProvider>
  );
}
