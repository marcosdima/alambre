import { act, render, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import type { QueryKey, UseMutationResult } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import createApiProvider from '../../src/behaviors/api/create-api';

describe('createApiProvider mutations', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true }),
    }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('runs mutations with POST by default and invalidates the configured keys on success', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: 0 } },
    });
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');

    const api = createApiProvider({
      baseUrl: 'https://api.test',
      createQueryClient: () => client,
    });

    const createUser = api.createMutationHook<{ ok: boolean }, { name: string }>(
      api.createRoute({
        key: ['create-user'],
        path: '/users',
        body: (variables) => variables,
      }),
      { invalidateKeys: [['users'] as QueryKey] },
    );

    let result: UseMutationResult<{ ok: boolean }, Error, { name: string }> | undefined;
    const Consumer = () => {
      result = createUser();
      return null;
    };

    render(<api.ApiProvider><Consumer /></api.ApiProvider>);

    await act(async () => {
      await result!.mutate({ name: 'x' });
    });

    await waitFor(() => expect(result?.isSuccess).toBe(true));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.test/users');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ name: 'x' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users'] });
  });

  it('supports custom mutation methods and headers', async () => {
    const api = createApiProvider({ baseUrl: 'https://api.test' });

    const removeUser = api.createMutationHook<void, { id: number }>(
      api.createRoute({
        key: ['remove-user'],
        method: 'DELETE',
        path: (variables) => `/users/${variables.id}`,
        headers: () => ({ 'X-Why': 'remove' }),
      }),
    );

    let result: UseMutationResult<void, Error, { id: number }> | undefined;
    const Consumer = () => {
      result = removeUser();
      return null;
    };

    render(<api.ApiProvider><Consumer /></api.ApiProvider>);

    await act(async () => {
      await result!.mutate({ id: 3 });
    });

    await waitFor(() => expect(result?.isSuccess).toBe(true));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.test/users/3');
    expect(init.method).toBe('DELETE');
    expect(init.headers).toMatchObject({ 'X-Why': 'remove' });
  });

  it('createMutationHookFromRoute delegates to the plain variant', async () => {
    const api = createApiProvider({ baseUrl: 'https://api.test' });

    const mut = api.createMutationHookFromRoute<{ ok: boolean }, { name: string }>(
      api.createRoute({ key: ['mut'], path: '/mut', body: (variables) => variables }),
    );

    let result: UseMutationResult<{ ok: boolean }, Error, { name: string }> | undefined;
    const Consumer = () => {
      result = mut();
      return null;
    };

    render(<api.ApiProvider><Consumer /></api.ApiProvider>);

    await act(async () => {
      await result!.mutate({ name: 'y' });
    });

    await waitFor(() => expect(result?.isSuccess).toBe(true));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('propagates rejection errors from non-OK mutation responses', async () => {
    fetchMock.mockImplementation(async () => ({
      ok: false,
      status: 409,
      text: async () => JSON.stringify({ message: 'conflict' }),
    }));

    const api = createApiProvider({ baseUrl: 'https://api.test' });

    const createUser = api.createMutationHook<{ ok: boolean }, { name: string }>(
      api.createRoute({
        key: ['create-user'],
        path: '/users',
        body: (variables) => variables,
      }),
    );

    let result: UseMutationResult<{ ok: boolean }, Error, { name: string }> | undefined;
    const Consumer = () => {
      result = createUser();
      return null;
    };

    render(<api.ApiProvider><Consumer /></api.ApiProvider>);

    await act(async () => {
      await result!.mutate({ name: 'x' });
    });

    await waitFor(() => expect(result?.isError).toBe(true));
    expect(result?.error?.message).toBe('conflict');
  });
});
