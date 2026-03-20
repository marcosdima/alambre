import type {
  QueryClient,
  QueryKey,
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

export type RouteCatalog = Record<string, ApiEndpoint<unknown, never>>;

export type ApiContextValue = {
  request: <TResponse>(input: ApiRequestInput & { transform?: (raw: unknown) => TResponse }) => Promise<TResponse>;
};
