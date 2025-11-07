import { LightDarkProvider } from 'tests/theme/theme';
import { ConfigProvider } from 'tests/config/config';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LangProvider } from 'tests/text/lang-provider';
import Test from 'tests/Test';
import { SafeAreaView } from '@base';

export default function App() {
  return (
    <ConfigProvider>
      <LightDarkProvider>
        <LangProvider>
          <GestureHandlerRootView>
              <Test />
          </GestureHandlerRootView>
        </LangProvider>
      </LightDarkProvider>
    </ConfigProvider>
  );
}
