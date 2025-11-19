import { createContext } from 'react';
import type { UseToastType } from './types';

export default createContext<UseToastType | undefined>(undefined);
