import { LightDarkProvider } from 'tests/providers/theme';
import { ConfigProvider } from 'tests/providers/config';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LangProvider } from 'tests/providers/lang';
import Test from 'tests/navigator/Test';
import { NavigatorProvider, ToastProvider } from './src/modules';
import navigator from 'tests/navigator/navigator';
import { ApiProvider } from 'tests/providers/api';
import ExampleToast from 'tests/providers/toast';

export default function App() {
  return (
    <ApiProvider>
      <ConfigProvider>
        <LightDarkProvider>
          <LangProvider>
            <GestureHandlerRootView>
              <NavigatorProvider pages={navigator}>
                <ToastProvider ToastComponent={ExampleToast}>
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
