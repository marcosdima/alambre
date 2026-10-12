import { createConfigProvider } from 'alambre';
import { storage } from '../storage';

const config = {
  leaveGraceMinutes: '10',
  fontFamily: 'Nunito',
  tutorialCompleted: 'false',
};

export const { ConfigProvider, useConfig } = createConfigProvider(config, storage);
