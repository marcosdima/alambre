import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LightDarkProvider } from './src/providers/theme';
import { ConfigProvider } from './src/providers/config';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LangProvider } from './src/providers/lang';
import Root from './src/navigator/Root';
import { ConfirmProvider, NavigatorProvider, ToastProvider } from 'alambre';
import navigator from './src/navigator/navigator';
import { ColguettiToast } from './src/providers/toast';
import ConfirmDialog from './src/components/ConfirmDialog';
import AppSplash from './src/components/AppSplash';
import { ItemsProvider } from './src/items/items-context';
import { AlarmsProvider } from './src/alarms/alarms-context';
import { ConfirmationsProvider } from './src/checklist/confirmations-context';
import { ActivationProvider } from './src/checklist/activation-context';
import { NotificationPermissionProvider } from './src/notifications/notification-permission-context';
import { useFonts } from 'expo-font';

export default function App() {
  const [fontsLoaded] = useFonts({
    // eslint-disable-next-line no-undef
    'Kranky': require('./assets/Kranky-Regular.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ConfigProvider>
        <LightDarkProvider>
          <LangProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <ItemsProvider>
                <AlarmsProvider>
                  <ConfirmationsProvider>
                    <ActivationProvider>
                      <NotificationPermissionProvider>
                        <NavigatorProvider pages={navigator}>
                          <ConfirmProvider ConfirmComponent={ConfirmDialog}>
                            <ToastProvider ToastComponent={ColguettiToast}>
                              <Root />
                              <AppSplash />
                            </ToastProvider>
                          </ConfirmProvider>
                        </NavigatorProvider>
                      </NotificationPermissionProvider>
                    </ActivationProvider>
                  </ConfirmationsProvider>
                </AlarmsProvider>
              </ItemsProvider>
            </GestureHandlerRootView>
          </LangProvider>
        </LightDarkProvider>
      </ConfigProvider>
    </SafeAreaProvider>
  );
}
