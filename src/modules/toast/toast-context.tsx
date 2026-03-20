import { createContext } from 'react';
import type { UseToastType } from './toast-types';

export default createContext<UseToastType | undefined>(undefined);
