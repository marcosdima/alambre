import { createApiProvider } from 'src/modules';

export type User = {
  id: number;
  name: string;
  username: string;
  email: string;
};

export type Post = {
  userId: number;
  id: number;
  title: string;
  body: string;
};

export type Comment = {
  postId: number;
  id: number;
  name: string;
  email: string;
  body: string;
};

export type Album = {
  userId: number;
  id: number;
  title: string;
};

export type Todo = {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
};

export type KnownApiResponse = User[] | Post[] | Comment[] | Album[] | Todo[];

export type CreatePostInput = {
  title: string;
  body: string;
  userId: number;
};

export const apiRouteOptions = [
  { key: 'usersList', path: '/users' },
  { key: 'postsList', path: '/posts' },
  { key: 'commentsList', path: '/comments' },
  { key: 'albumsList', path: '/albums' },
  { key: 'todosList', path: '/todos' },
] as const;

export type ApiRouteKey = typeof apiRouteOptions[number]['key'];

export type ExecuteRouteInput = {
  routeKey: ApiRouteKey;
};

const {
  ApiProvider,
  createRoute,
  createRoutes,
  createQueryHookFromRoute,
  createMutationHook,
} = createApiProvider({
  baseUrl: 'https://jsonplaceholder.typicode.com',
});

export const apiRoutes = createRoutes({
  usersList: createRoute<User[]>({
    key: ['users', 'list'],
    method: 'GET',
    path: '/users',
  }),
  postsList: createRoute<Post[]>({
    key: ['posts', 'list'],
    method: 'GET',
    path: '/posts',
  }),
  commentsList: createRoute<Comment[]>({
    key: ['comments', 'list'],
    method: 'GET',
    path: '/comments',
  }),
  albumsList: createRoute<Album[]>({
    key: ['albums', 'list'],
    method: 'GET',
    path: '/albums',
  }),
  todosList: createRoute<Todo[]>({
    key: ['todos', 'list'],
    method: 'GET',
    path: '/todos',
  }),
  postById: createRoute<Post, { id: number }>({
    key: ({ id }) => ['posts', 'detail', id],
    method: 'GET',
    path: ({ id }) => `/posts/${id}`,
  }),
  createPost: createRoute<Post, CreatePostInput>({
    key: ['posts', 'create'],
    method: 'POST',
    path: '/posts',
    body: (input) => input,
  }),
});

const routePathByKey: Record<ApiRouteKey, string> = {
  usersList: '/users',
  postsList: '/posts',
  commentsList: '/comments',
  albumsList: '/albums',
  todosList: '/todos',
};

export const usePostById = createQueryHookFromRoute(apiRoutes.postById);

export const useCreatePost = createMutationHook<Post, CreatePostInput>(
  apiRoutes.createPost,
  {
    invalidateKeys: [['posts', 'detail']],
  },
);

export const useExecuteRoute = createMutationHook<KnownApiResponse, ExecuteRouteInput>({
  key: ['api', 'execute-route'],
  method: 'GET',
  path: ({ routeKey }) => routePathByKey[routeKey],
});

export { ApiProvider };
