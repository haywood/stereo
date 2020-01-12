export type Options<T> = {
  persistent?: boolean;
  disabled?: boolean;
  parse?: (s: string) => T;
  stringify?: (t: T) => string;
};
