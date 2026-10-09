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

if (!(Text as any).defaultProps) {
  (Text as any).defaultProps = {};
}
(Text as any).defaultProps.style = { fontFamily: 'Kranky' };
(Text as any).defaultProps.allowFontScaling = false; // Optional, often good to standardize

if (!(TextInput as any).defaultProps) {
  (TextInput as any).defaultProps = {};
}
(TextInput as any).defaultProps.style = { fontFamily: 'Kranky' };

export default function App() {
  const [fontsLoaded] = useFonts({
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
