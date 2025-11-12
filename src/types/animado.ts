import type { DefaultReact } from '../types';

type State = 'idle' | 'start' | 'update' | 'end';

type AnimadoValue = {
  from: number,
  to: number,
}

type AnimadoFields = {
  opacity?: AnimadoValue;
  scale?: AnimadoValue;
  translateX?: AnimadoValue;
  translateY?: AnimadoValue;
  rotate?: AnimadoValue;
}

type Config = {
  duration: number;
  fields: AnimadoFields;
  stagger?: number,
};

type AnimadoProps = DefaultReact.ViewProps & {
  config?: Partial<Record<State, Config>>;
  propagate?: Partial<Record<State, Config>>;
};

export type {
  AnimadoProps,
  AnimadoValue,
  AnimadoFields,
  State,
  Config,
};
