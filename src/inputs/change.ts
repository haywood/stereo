export type Change<T> = {
  newValue: T;
  oldValue?: T;
  event?: Event;
};
