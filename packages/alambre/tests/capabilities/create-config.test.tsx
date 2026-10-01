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
});

