import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ConfigProvider } from './src/providers/config';
import { LightDarkProvider } from './src/providers/theme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LangProvider } from './src/providers/lang';
import Root from './src/navigator/Root';
import { ConfirmProvider, NavigatorProvider, ToastProvider } from 'alambre';
import navigator from './src/navigator/navigator';
import { TemplateToast } from './src/providers/toast';
import ConfirmDialog from './src/components/ConfirmDialog';

export default function App() {
  return (
    <SafeAreaProvider>
      <ConfigProvider>
        <LightDarkProvider>
          <LangProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <NavigatorProvider pages={navigator}>
                <ConfirmProvider ConfirmComponent={ConfirmDialog}>
                  <ToastProvider ToastComponent={TemplateToast}>
                    <Root />
                  </ToastProvider>
                </ConfirmProvider>
              </NavigatorProvider>
            </GestureHandlerRootView>
          </LangProvider>
        </LightDarkProvider>
      </ConfigProvider>
    </SafeAreaProvider>
  );
}
