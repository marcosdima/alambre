import { ConfigProvider } from './src/providers/config';
import { LightDarkProvider } from './src/providers/theme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LangProvider } from './src/providers/lang';
import Root from './src/navigator/Root';
import { ConfirmProvider, NavigatorProvider, ToastProvider } from 'alambre';
import navigator from './src/navigator/navigator';
import { TemplateToast } from './src/providers/toast';
import ConfirmDialog from './src/components/ConfirmDialog';

import { RecordsProvider } from './src/session/records-context';
import { PuzzlesProvider } from './src/session/puzzles-context';
import { GameProvider } from './src/session/game-context';

export default function App() {
  return (
    <ConfigProvider>
      <LightDarkProvider>
        <LangProvider>
          <RecordsProvider>
            <PuzzlesProvider>
              <GameProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <NavigatorProvider pages={navigator}>
                    <ConfirmProvider ConfirmComponent={ConfirmDialog}>
                      <ToastProvider ToastComponent={TemplateToast}>
                        <Root />
                      </ToastProvider>
                    </ConfirmProvider>
                  </NavigatorProvider>
                </GestureHandlerRootView>
              </GameProvider>
            </PuzzlesProvider>
          </RecordsProvider>
        </LangProvider>
      </LightDarkProvider>
    </ConfigProvider>
  );
}
