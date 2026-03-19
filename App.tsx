import { LightDarkProvider } from 'tests/theme/theme';
import { ConfigProvider } from 'tests/config/config';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LangProvider } from 'tests/text/lang-provider';
import Test from 'tests/Test';
import { NavigatorProvider, ToastProvider } from './src/providers';
import navigator from 'tests/navigator/navigator';
import { ApiProvider } from 'tests/api';

export default function App() {
  return (
    <ApiProvider>
      <ConfigProvider>
        <LightDarkProvider>
          <LangProvider>
            <GestureHandlerRootView>
              <NavigatorProvider pages={navigator}>
                <ToastProvider>
                  <Test />
                </ToastProvider>
              </NavigatorProvider>
            </GestureHandlerRootView>
          </LangProvider>
        </LightDarkProvider>
      </ConfigProvider>
    </ApiProvider>
  );
}
