import { LightDarkProvider } from './src/providers/theme';
import { ConfigProvider } from './src/providers/config';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LangProvider } from './src/providers/lang';
import Test from './src/navigator/Test';
import { NavigatorProvider, ToastProvider } from 'alambre';
import navigator from './src/navigator/navigator';
import { ApiProvider } from './src/providers/api';
import ExampleToast from './src/providers/toast';

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
