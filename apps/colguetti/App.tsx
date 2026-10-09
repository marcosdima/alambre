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
import { RouteIntentProvider } from './src/navigator/RouteIntent';
import { ItemsProvider } from './src/items/items-context';
import { AlarmsProvider } from './src/alarms/alarms-context';
import { ConfirmationsProvider } from './src/checklist/confirmations-context';
import { ActivationProvider } from './src/checklist/activation-context';
import { NotificationPermissionProvider } from './src/notifications/notification-permission-context';
import { useFonts } from 'expo-font';
import { Text, TextInput } from 'react-native';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (!(Text as any).defaultProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Text as any).defaultProps = {};
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Text as any).defaultProps.style = { fontFamily: 'Kranky' };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Text as any).defaultProps.allowFontScaling = false; // Optional, often good to standardize

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (!(TextInput as any).defaultProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (TextInput as any).defaultProps = {};
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(TextInput as any).defaultProps.style = { fontFamily: 'Kranky' };

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
              <RouteIntentProvider>
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
              </RouteIntentProvider>
            </GestureHandlerRootView>
          </LangProvider>
        </LightDarkProvider>
      </ConfigProvider>
    </SafeAreaProvider>
  );
}
