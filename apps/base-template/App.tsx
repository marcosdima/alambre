import { LightDarkProvider } from './src/providers/theme';
import { ConfigProvider } from './src/providers/config';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LangProvider } from './src/providers/lang';
import Root from './src/navigator/Root';
import { NavigatorProvider, ToastProvider } from 'alambre';
import navigator from './src/navigator/navigator';
import { ColguettiToast } from './src/providers/toast';

export default function App() {
  return (
    <ConfigProvider>
      <LightDarkProvider>
        <LangProvider>
          <GestureHandlerRootView>
            <NavigatorProvider pages={navigator}>
              <ToastProvider ToastComponent={ColguettiToast}>
                <Root />
              </ToastProvider>
            </NavigatorProvider>
          </GestureHandlerRootView>
        </LangProvider>
      </LightDarkProvider>
    </ConfigProvider>
  );
}
