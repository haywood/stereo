interface Reducable<T> {
  reduce<M>(cb: (memo: M, t: T) => M, m0?: M): M;
  slice(start?: number): this;
  sort(cb?: (a: T, b: T) => number): this;
  length: number;
  [index: number]: T;
}

const identity = (x: number) => x;

export const max = (xs: Reducable<number>, mapper = identity) =>
  xs.length ? xs.reduce<number>((m, x) => Math.max(m, mapper(x))) : 0;

export const min = (xs: Reducable<number>, mapper = identity) =>
  xs.length ? xs.reduce<number>((m, x) => Math.min(m, mapper(x))) : 0;

export const mean = (xs: Reducable<number>, mapper = identity) =>
  sum(xs, mapper) / xs.length;

export const mad = (xs: Reducable<number>) => {
  const m = mean(xs);
  return mean(xs, x => Math.abs(x - m));
};

export const std = (xs: Reducable<number>) => Math.sqrt(variance(xs));

export const variance = (xs: Reducable<number>) => {
  const m = mean(xs);
  return mean(xs, x => (x - m) ** 2);
};

export const sum = (xs: Reducable<number>, mapper = identity) =>
  xs.reduce((memo, x) => memo + mapper(x), 0);

export const median = (xs: Reducable<number>) => {
  const sorted = xs.slice().sort((a, b) => a - b);
  return sorted[Math.round(xs.length / 2)];
};
