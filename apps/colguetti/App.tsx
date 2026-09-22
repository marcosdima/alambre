import { LightDarkProvider } from './src/providers/theme';
import { ConfigProvider } from './src/providers/config';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LangProvider } from './src/providers/lang';
import Root from './src/navigator/Root';
import { ConfirmProvider, NavigatorProvider, ToastProvider } from 'alambre';
import navigator from './src/navigator/navigator';
import { ColguettiToast } from './src/providers/toast';
import ConfirmDialog from './src/components/ConfirmDialog';
import { RouteIntentProvider } from './src/navigator/RouteIntent';
import { ItemsProvider } from './src/items/items-context';
import { AlarmsProvider } from './src/alarms/alarms-context';
import { ConfirmationsProvider } from './src/checklist/confirmations-context';
import { ActivationProvider } from './src/checklist/activation-context';
import { NotificationPermissionProvider } from './src/notifications/notification-permission-context';

export default function App() {
  return (
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
  );
}
