export type Options<T> = {
  persistent?: boolean;
  disabled?: boolean;
  stringify?: (t: T) => string;
};
