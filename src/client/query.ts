import {pi, evaluate, compile, EvalFunction} from 'mathjs';
const params = new URLSearchParams(document.location.search);
const get = (key, defaultValue) => params.get(key) || defaultValue;

export const rate: number = evaluate(get('rate', pi / 180));
export const n: number = evaluate(get('n', 10000));
export const color: EvalFunction = compile(get('color', '(1 + cos(i * pi / 2)) / 2'));
export const animate = !!parseInt(get('a', 1));
