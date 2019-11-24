import memoize from "memoizee";

export const cos = memoize(Math.cos);
export const sin = memoize(Math.sin);
export const exp = memoize(Math.exp);
