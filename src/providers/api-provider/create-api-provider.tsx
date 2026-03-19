/* global fetch */

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export type RequestHeaders = Record<string, string>;

export type ApiRequestInput = {
  method: HttpMethod;
  path: string;
  query?: QueryParams;
  body?: unknown;
  headers?: RequestHeaders;
};

export type CreateApiProviderOptions = {
  baseUrl: string;
  getHeaders?: () => Promise<RequestHeaders | undefined> | RequestHeaders | undefined;
  createQueryClient?: () => QueryClient;
};

export type ApiEndpoint<TResponse, TVariables = void> = {
  key: QueryKey | ((variables: TVariables) => QueryKey);
  method?: HttpMethod;
  path: string | ((variables: TVariables) => string);
  query?: (variables: TVariables) => QueryParams | undefined;
  body?: (variables: TVariables) => unknown;
  headers?: (variables: TVariables) => RequestHeaders | undefined;
  transform?: (raw: unknown) => TResponse;
};

export type InferRouteResponse<TRoute> = TRoute extends ApiEndpoint<infer TResponse, unknown>
  ? TResponse
  : never;

export type InferRouteVariables<TRoute> = TRoute extends ApiEndpoint<unknown, infer TVariables>
  ? TVariables
  : never;

type RouteCatalog = Record<string, ApiEndpoint<unknown, never>>;

type ApiContextValue = {
  request: <TResponse>(input: ApiRequestInput & { transform?: (raw: unknown) => TResponse }) => Promise<TResponse>;
};

const buildUrl = (baseUrl: string, path: string, query?: QueryParams): string => {
  const normalizedBase = baseUrl.endsWith('/')
    ? baseUrl.slice(0, -1)
    : baseUrl;

  const normalizedPath = path.startsWith('/')
    ? path
    : `/${path}`;

  if (!query) return `${normalizedBase}${normalizedPath}`;

  const queryString = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  if (!queryString) return `${normalizedBase}${normalizedPath}`;

  return `${normalizedBase}${normalizedPath}?${queryString}`;
};


const createApiProvider = ({
  baseUrl,
  getHeaders,
  createQueryClient,
}: CreateApiProviderOptions) => {
  const ApiContext = createContext<ApiContextValue | undefined>(undefined);

  const resolveValue = <T,>(value: T | (() => T)): T => {
    if (typeof value === 'function') {
      return (value as () => T)();
    }
    return value;
  };

  const ApiProvider = ({ children }: { children: ReactNode }) => {
    const queryClient = useMemo(
      () => createQueryClient?.() ?? new QueryClient(),
      [],
    );

    const request = async <TResponse,>({
      method,
      path,
      query,
      body,
      headers,
      transform,
    }: ApiRequestInput & { transform?: (raw: unknown) => TResponse }): Promise<TResponse> => {
      const authHeaders = await getHeaders?.();
      const url = buildUrl(baseUrl, path, query);

      const response = await fetch(url, {
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...authHeaders,
          ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });

      const rawText = await response.text();
      let rawData: unknown = undefined;

      if (rawText.length) {
        try {
          rawData = JSON.parse(rawText);
        } catch {
          rawData = rawText;
        }
      }

      if (!response.ok) {
        const message = typeof rawData === 'object' && rawData && 'message' in rawData
          ? String((rawData as { message?: unknown }).message)
          : `Request failed (${response.status})`;
        throw new Error(message);
      }

      if (transform) return transform(rawData);
      return rawData as TResponse;
    };

    return (
      <QueryClientProvider client={queryClient}>
        <ApiContext.Provider value={{ request }}>
          {children}
        </ApiContext.Provider>
      </QueryClientProvider>
    );
  };


  const useApi = () => {
    const ctx = useContext(ApiContext);
    if (!ctx) {
      throw new Error('useApi must be used within ApiProvider');
    }
    return ctx;
  };

  const createQueryHook = <TResponse, TVariables = void>(
    endpoint: ApiEndpoint<TResponse, TVariables>,
  ) => {
    return (
      variables: TVariables,
      options?: Omit<UseQueryOptions<TResponse, Error, TResponse, QueryKey>, 'queryKey' | 'queryFn'>,
    ): UseQueryResult<TResponse, Error> => {
      const { request } = useApi();

      const queryKey = resolveValue<QueryKey>(
        typeof endpoint.key === 'function'
          ? () => (endpoint.key as (v: TVariables) => QueryKey)(variables)
          : endpoint.key,
      );

      return useQuery({
        queryKey,
        queryFn: () => request<TResponse>({
          method: endpoint.method ?? 'GET',
          path: typeof endpoint.path === 'function'
            ? endpoint.path(variables)
            : endpoint.path,
          query: endpoint.query?.(variables),
          body: endpoint.body?.(variables),
          headers: endpoint.headers?.(variables),
          transform: endpoint.transform,
        }),
        ...options,
      });
    };
  };

  const createRoute = <TResponse, TVariables = void>(
    route: ApiEndpoint<TResponse, TVariables>,
  ): ApiEndpoint<TResponse, TVariables> => route;

  const createRoutes = <TRoutes extends RouteCatalog>(
    routes: TRoutes,
  ): TRoutes => routes;

  const createQueryHookFromRoute = <TResponse, TVariables = void>(
    route: ApiEndpoint<TResponse, TVariables>,
  ) => createQueryHook<TResponse, TVariables>(route);

  const createMutationHook = <TResponse, TVariables>(
    endpoint: ApiEndpoint<TResponse, TVariables>,
    settings?: {
      invalidateKeys?: QueryKey[];
    },
  ) => {
    return (
      options?: Omit<UseMutationOptions<TResponse, Error, TVariables>, 'mutationFn'>,
    ): UseMutationResult<TResponse, Error, TVariables> => {
      const { request } = useApi();
      const queryClient = useQueryClient();

      return useMutation({
        mutationFn: (variables: TVariables) => request<TResponse>({
          method: endpoint.method ?? 'POST',
          path: typeof endpoint.path === 'function'
            ? endpoint.path(variables)
            : endpoint.path,
          query: endpoint.query?.(variables),
          body: endpoint.body?.(variables),
          headers: endpoint.headers?.(variables),
          transform: endpoint.transform,
        }),
        ...options,
        onSuccess: async (data, variables, onMutateResult, context) => {
          if (settings?.invalidateKeys?.length) {
            await Promise.all(
              settings.invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: key })),
            );
          }

          await options?.onSuccess?.(data, variables, onMutateResult, context);
        },
      });
    };
  };

  const createMutationHookFromRoute = <TResponse, TVariables>(
    route: ApiEndpoint<TResponse, TVariables>,
    settings?: {
      invalidateKeys?: QueryKey[];
    },
  ) => createMutationHook<TResponse, TVariables>(route, settings);

  return {
    ApiProvider,
    useApi,
    createRoute,
    createRoutes,
    createQueryHook,
    createQueryHookFromRoute,
    createMutationHook,
    createMutationHookFromRoute,
  };
};

export default createApiProvider;
