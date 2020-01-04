interface Reducable<T> {
  reduce<M>(cb: (memo: M, t: T) => M, m0?: M): M;
  slice(): this;
  sort(cb?: (a: T, b: T) => number): this;
  length: number;
  [index: number]: T;
}

export const mean = (xs: Reducable<number>) => sum(xs) / xs.length;

export const sum = (xs: Reducable<number>) =>
  xs.reduce((memo, x) => memo + x, 0);

export const median = (xs: Reducable<number>) => {
  const sorted = xs.slice().sort((a, b) => a - b);
  return sorted[Math.round(xs.length / 2)];
};
