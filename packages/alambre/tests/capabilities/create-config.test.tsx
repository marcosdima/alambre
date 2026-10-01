import { act, render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import createConfig from '../../src/capabilities/config/create-config';
import type { UseConfigType } from '../../src/capabilities/config/config-types';
import { createMemoryStorage } from '../helpers/storage';

type Config = { alias: string; theme: string };

const baseConfig: Config = { alias: 'guest', theme: 'default' };

describe('createConfig', () => {
  it('falls back to the base config when nothing is persisted', async () => {
    const storage = createMemoryStorage();
    const { useConfig } = createConfig(baseConfig, storage);

    const holder: { current?: UseConfigType<Config> } = {};
    const Consumer = () => {
      holder.current = useConfig();
      return null;
    };

    render(<Consumer />);

    await waitFor(() => expect(holder.current?.config).toEqual(baseConfig));
  });

  it('loads persisted values per field and keeps base defaults for missing fields', async () => {
    const storage = createMemoryStorage({ alias: 'saved-alias' });
    const { useConfig } = createConfig(baseConfig, storage);

    const holder: { current?: UseConfigType<Config> } = {};
    const Consumer = () => {
      holder.current = useConfig();
      return null;
    };

    render(<Consumer />);

    await waitFor(() => expect(holder.current?.config.alias).toBe('saved-alias'));
    expect(holder.current?.config.theme).toBe('default');
    expect(storage.getCalls).toContain('alias');
    expect(storage.getCalls).toContain('theme');
  });

  it('saves a field through the storage adapter using the field name as the key', async () => {
    const storage = createMemoryStorage();
    const { useConfig } = createConfig(baseConfig, storage);

    const holder: { current?: UseConfigType<Config> } = {};
    const Consumer = () => {
      holder.current = useConfig();
      return null;
    };

    render(<Consumer />);

    await waitFor(() => expect(holder.current).toBeDefined());

    await act(async () => {
      await holder.current!.saveField('alias', 'renamed');
    });

    await waitFor(() => expect(holder.current?.config.alias).toBe('renamed'));
    expect(holder.current?.config.theme).toBe('default');
    expect(storage.setCalls).toContainEqual(['alias', 'renamed']);
  });

  it('can be accessed directly via actions and store without React render', async () => {
    const storage = createMemoryStorage();
    const { store, actions } = createConfig(baseConfig, storage);

    await waitFor(() => expect(store.getState().config).toEqual(baseConfig));

    await actions.saveField('alias', 'direct-update');

    expect(store.getState().config.alias).toBe('direct-update');
    expect(storage.setCalls).toContainEqual(['alias', 'direct-update']);
  });

  it('supports booleans, numbers, and objects with typed saveField and serialization', async () => {
    type AdvancedConfig = {
      notificationsEnabled: boolean;
      refreshInterval: number;
      metadata: { env: string; tags: string[] };
    };

    const advancedBase: AdvancedConfig = {
      notificationsEnabled: true,
      refreshInterval: 30,
      metadata: { env: 'production', tags: ['fast', 'stable'] },
    };

    const storage = createMemoryStorage();
    const { useConfig, store } = createConfig(advancedBase, storage);

    const holder: { current?: UseConfigType<AdvancedConfig> } = {};
    const Consumer = () => {
      holder.current = useConfig();
      return null;
    };

    render(<Consumer />);

    await waitFor(() => expect(holder.current?.loading).toBe(false));
    expect(holder.current?.config).toEqual(advancedBase);

    // Save boolean
    await act(async () => {
      await holder.current!.saveField('notificationsEnabled', false);
    });
    expect(holder.current?.config.notificationsEnabled).toBe(false);
    expect(storage.setCalls).toContainEqual(['notificationsEnabled', 'false']);

    // Save number
    await act(async () => {
      await holder.current!.saveField('refreshInterval', 60);
    });
    expect(holder.current?.config.refreshInterval).toBe(60);
    expect(storage.setCalls).toContainEqual(['refreshInterval', '60']);

    // Save object
    const newMeta = { env: 'staging', tags: ['beta'] };
    await act(async () => {
      await holder.current!.saveField('metadata', newMeta);
    });
    expect(holder.current?.config.metadata).toEqual(newMeta);
    expect(storage.setCalls).toContainEqual(['metadata', JSON.stringify(newMeta)]);
    expect(store.getState().config.metadata).toEqual(newMeta);
  });

  it('hydrates booleans, numbers, and objects from storage and safely falls back on corrupted data', async () => {
    type ConfigWithTypes = {
      active: boolean;
      count: number;
      details: { role: string };
      fallbackSafe: number;
    };

    const base: ConfigWithTypes = {
      active: false,
      count: 0,
      details: { role: 'user' },
      fallbackSafe: 99,
    };

    const storage = createMemoryStorage({
      active: 'true',
      count: '42',
      details: JSON.stringify({ role: 'admin' }),
      fallbackSafe: 'corrupted-non-json{',
    });

    const { useConfig } = createConfig(base, storage);

    const holder: { current?: UseConfigType<ConfigWithTypes> } = {};
    const Consumer = () => {
      holder.current = useConfig();
      return null;
    };

    render(<Consumer />);

    await waitFor(() => expect(holder.current?.loading).toBe(false));
    expect(holder.current?.config.active).toBe(true);
    expect(holder.current?.config.count).toBe(42);
    expect(holder.current?.config.details).toEqual({ role: 'admin' });
    // Corrupted entry gracefully falls back to base config value
    expect(holder.current?.config.fallbackSafe).toBe(99);
  });

  it('exposes loading indicator during hydration', async () => {
    let resolveStorage: (val: string | null) => void = () => {};
    const deferredStorage = {
      get: () => new Promise<string | null>((resolve) => {
        resolveStorage = resolve;
      }),
      set: async () => {},
    };

    const singleKeyConfig = { alias: 'guest' };
    const { store } = createConfig(singleKeyConfig, deferredStorage);
    expect(store.getState().loading).toBe(true);

    resolveStorage('saved-alias');
    await waitFor(() => expect(store.getState().loading).toBe(false));
  });
});

