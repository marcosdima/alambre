import { LightDarkProvider } from './src/providers/theme';
import { ConfigProvider } from './src/providers/config';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LangProvider } from './src/providers/lang';
import Root from './src/navigator/Root';
import { NavigatorProvider, ToastProvider } from 'alambre';
import navigator from './src/navigator/navigator';
import { ColguettiToast } from './src/providers/toast';
import { RouteIntentProvider } from './src/navigator/RouteIntent';
import { ItemsProvider } from './src/items/items-context';
import { AlarmsProvider } from './src/alarms/alarms-context';
import { ConfirmationsProvider } from './src/checklist/confirmations-context';

export default function App() {
  return (
    <ConfigProvider>
      <LightDarkProvider>
        <LangProvider>
          <GestureHandlerRootView>
            <RouteIntentProvider>
              <ItemsProvider>
                <AlarmsProvider>
                  <ConfirmationsProvider>
                    <NavigatorProvider pages={navigator}>
                      <ToastProvider ToastComponent={ColguettiToast}>
                        <Root />
                      </ToastProvider>
                    </NavigatorProvider>
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
