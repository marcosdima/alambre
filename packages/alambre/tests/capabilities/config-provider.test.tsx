import { act, render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import createConfigProvider from '../../src/capabilities/config/config-provider';
import type { UseConfigType } from '../../src/capabilities/config/config-types';
import { createMemoryStorage } from '../helpers/storage';

type Config = { alias: string; theme: string };

const baseConfig: Config = { alias: 'guest', theme: 'default' };

describe('createConfigProvider', () => {
  it('falls back to the base config when nothing is persisted', async () => {
    const storage = createMemoryStorage();
    const { ConfigProvider, useConfig } = createConfigProvider(baseConfig, storage);

    const holder: { current?: UseConfigType<Config> } = {};
    const Consumer = () => {
      holder.current = useConfig();
      return null;
    };

    render(<ConfigProvider><Consumer /></ConfigProvider>);

    await waitFor(() => expect(holder.current?.config).toEqual(baseConfig));
  });

  it('loads persisted values per field and keeps base defaults for missing fields', async () => {
    const storage = createMemoryStorage({ alias: 'saved-alias' });
    const { ConfigProvider, useConfig } = createConfigProvider(baseConfig, storage);

    const holder: { current?: UseConfigType<Config> } = {};
    const Consumer = () => {
      holder.current = useConfig();
      return null;
    };

    render(<ConfigProvider><Consumer /></ConfigProvider>);

    await waitFor(() => expect(holder.current?.config.alias).toBe('saved-alias'));
    expect(holder.current?.config.theme).toBe('default');
    expect(storage.getCalls).toContain('alias');
    expect(storage.getCalls).toContain('theme');
  });

  it('saves a field through the storage adapter using the field name as the key', async () => {
    const storage = createMemoryStorage();
    const { ConfigProvider, useConfig } = createConfigProvider(baseConfig, storage);

    const holder: { current?: UseConfigType<Config> } = {};
    const Consumer = () => {
      holder.current = useConfig();
      return null;
    };

    render(<ConfigProvider><Consumer /></ConfigProvider>);

    await waitFor(() => expect(holder.current).toBeDefined());

    await act(async () => {
      await holder.current!.saveField('alias', 'renamed');
    });

    await waitFor(() => expect(holder.current?.config.alias).toBe('renamed'));
    expect(holder.current?.config.theme).toBe('default');
    expect(storage.setCalls).toContainEqual(['alias', 'renamed']);
  });

  it('throws when the hook is used outside the provider', () => {
    const storage = createMemoryStorage();
    const { useConfig } = createConfigProvider(baseConfig, storage);

    const Consumer = () => {
      useConfig();
      return null;
    };

    expect(() => render(<Consumer />)).toThrow(/useConfig must be used within ConfigProvider/);
  });
});
