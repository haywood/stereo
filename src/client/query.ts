import { pi, evaluate, compile, EvalFunction } from 'mathjs';
const params = new URLSearchParams(document.location.search);
const get = (key, defaultValue) => params.get(key) || defaultValue;

export let rate: number = evaluate(get('rate', pi / 180));
export const setRate = (r) => rate = r;
export const n: number = evaluate(get('n', 10000));
export const color: EvalFunction = compile(get('color', '(1 + cos(i * pi / 2)) / 2'));
export const animate = !!parseInt(get('a', 1));
export const f0 = get('f0', 'cos(phi)');
export const f1 = get('f1', 'sin(phi)');
export const seed = get('seed', '2->sphere(1)->spiral(1, 1)->torus(1, 0.25)')