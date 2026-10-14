import { createConfig } from 'alambre';
import { storage } from '../storage';

const config = {
  leaveGraceMinutes: '10',
  fontFamily: 'Nunito',
  tutorialCompleted: 'false',
};

export const { useConfig, actions: { saveField } } = createConfig(config, storage);

