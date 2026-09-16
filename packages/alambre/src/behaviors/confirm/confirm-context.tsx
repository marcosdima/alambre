import { createContext } from 'react';
import type { UseConfirmType } from './confirm-types';

export default createContext<UseConfirmType | undefined>(undefined);
