import type { Storage } from '../../types/actions';
import BaseModule from '../base-module';
import type { ConfigState } from './config-types';

export default class ConfigModule<T extends Record<string, string>> extends BaseModule<ConfigState<T>> {
  constructor(
    private readonly baseConfig: T,
    private readonly storage: Storage,
  ) {
    super({ config: baseConfig });
  }


  async init() {
    const nextConfig = { ...this.baseConfig };

    for (const key of Object.keys(this.baseConfig) as (keyof T)[]) {
      const saved = await this.storage.get(key as string);
      nextConfig[key] = (saved ?? this.baseConfig[key]) as T[keyof T];
    }

    this.setState({ config: nextConfig });
  }


  async saveField(field: keyof T, value: string) {
    this.setState((prev) => ({
      config: {
        ...prev.config,
        [field]: value,
      },
    }));

    await this.storage.set(field as string, value);
  }
}
