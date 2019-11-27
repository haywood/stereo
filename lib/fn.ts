import memoize from "memoizee";

export const cos = memoize(Math.cos);
export const sin = memoize(Math.sin);
export const tan = memoize(Math.tan);
export const tanh = memoize(Math.tanh);
export const exp = memoize(Math.exp);
