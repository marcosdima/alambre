import { render, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import createApiProvider from '../../src/behaviors/api/api-provider';
import type { ApiEndpoint } from '../../src/behaviors/api/api-types';

const okResponse = (body: unknown) => ({
  ok: true,
  status: 200,
  text: async () => JSON.stringify(body),
});

const failResponse = (status: number, body: unknown) => ({
  ok: false,
  status,
  text: async () => typeof body === 'string' ? body : JSON.stringify(body),
});

const createClient = () => new QueryClient({
  defaultOptions: { queries: { retry: 0 } },
});

type User = { id: number; name: string };

const usersRoute: ApiEndpoint<User[], void> = {
  key: ['users'],
  path: '/users',
};

describe('createApiProvider', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(async () => okResponse({ users: [{ id: 1, name: 'a' }] }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('createRoute and createRoutes return their input untouched', () => {
    const api = createApiProvider({ baseUrl: 'https://api.test' });

    expect(api.createRoute(usersRoute)).toBe(usersRoute);
    const catalog = { list: usersRoute };
    expect(api.createRoutes(catalog)).toBe(catalog);
  });

  it('runs a query with a static key and passes the built URL', async () => {
    const api = createApiProvider({
      baseUrl: 'https://api.test/v1',
      createQueryClient: createClient,
    });
    const useUsers = api.createQueryHook<User[], void>(api.createRoute(usersRoute));

    let result: UseQueryResult<User[], Error> | undefined;
    const Consumer = () => {
      result = useUsers(undefined);
      return null;
    };

    render(<api.ApiProvider><Consumer /></api.ApiProvider>);

    // The hook returns the raw response body without applying a transform.
    await waitFor(() => expect(result?.data).toEqual({ users: [{ id: 1, name: 'a' }] }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/v1/users');
    expect(fetchMock.mock.calls[0][1].method).toBe('GET');
  });

  it('resolves dynamic keys and variable-driven paths, queries, headers and transforms', async () => {
    fetchMock.mockImplementation(async () => okResponse({ user: { id: 7, name: 'seven' } }));

    const api = createApiProvider({
      baseUrl: 'https://api.test',
      getHeaders: async () => ({ Authorization: 'Bearer token' }),
      createQueryClient: createClient,
    });

    const route = api.createRoute<User, { id: number }>({
      key: (variables) => ['user', variables.id],
      path: (variables) => `/users/${variables.id}`,
      query: (variables) => ({ page: 1, q: variables.id > 5 ? undefined : 'x', ignore: null }),
      headers: () => ({ 'X-Custom': 'yes' }),
      transform: (raw) => (raw as { user: User }).user,
    });

    const useUser = api.createQueryHook<User, { id: number }>(route);

    let result: UseQueryResult<User, Error> | undefined;
    const Consumer = () => {
      result = useUser({ id: 7 });
      return null;
    };

    render(<api.ApiProvider><Consumer /></api.ApiProvider>);

    await waitFor(() => expect(result?.data).toEqual({ id: 7, name: 'seven' }));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.test/users/7?page=1');
    expect(init.method).toBe('GET');
    expect(init.headers).toMatchObject({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Bearer token',
      'X-Custom': 'yes',
    });
  });

  it('exposes the request error message for non-OK responses', async () => {
    fetchMock.mockImplementation(async () => failResponse(500, { message: 'boom' }));

    const api = createApiProvider({ baseUrl: 'https://api.test', createQueryClient: createClient });
    const useUsers = api.createQueryHook<User[], void>(api.createRoute(usersRoute));

    let result: UseQueryResult<User[], Error> | undefined;
    const Consumer = () => {
      result = useUsers(undefined);
      return null;
    };

    render(<api.ApiProvider><Consumer /></api.ApiProvider>);

    await waitFor(() => expect(result?.status).toBe('error'));
    expect(result?.error?.message).toBe('boom');
  });

  it('falls back to a generic message when the error body has no message', async () => {
    fetchMock.mockImplementation(async () => failResponse(404, {}));

    const api = createApiProvider({ baseUrl: 'https://api.test', createQueryClient: createClient });
    const useUsers = api.createQueryHook<User[], void>(api.createRoute(usersRoute));

    let result: UseQueryResult<User[], Error> | undefined;
    const Consumer = () => {
      result = useUsers(undefined);
      return null;
    };

    render(<api.ApiProvider><Consumer /></api.ApiProvider>);

    await waitFor(() => expect(result?.status).toBe('error'));
    expect(result?.error?.message).toBe('Request failed (404)');
  });

  it('returns non-JSON bodies as strings', async () => {
    fetchMock.mockImplementation(async () => ({
      ok: true,
      status: 200,
      text: async () => 'plain text',
    }));

    const api = createApiProvider({ baseUrl: 'https://api.test', createQueryClient: createClient });
    const useText = api.createQueryHook<string, void>(api.createRoute({
      key: ['text'],
      path: '/text',
    }));

    let result: UseQueryResult<string, Error> | undefined;
    const Consumer = () => {
      result = useText(undefined);
      return null;
    };

    render(<api.ApiProvider><Consumer /></api.ApiProvider>);

    await waitFor(() => expect(result?.data).toBe('plain text'));
  });
});
