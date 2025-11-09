export type Storage = {
  get: (key: string) => Promise<string>;
  set: (key: string, value: unknown) => Promise<void>;
}
