import { pi, evaluate, compile, EvalFunction } from 'mathjs';
const params = new URLSearchParams(document.location.search);

export let rate: number =
    params.has('rate')
        ? evaluate(params.get('rate'))
        : pi / 180;

export const setRate = (r: number) => rate = r;

export const n: string = params.get('n');
export const animate: boolean = !!(parseInt(params.get('a')) || 1);
export const f0: string = params.get('f0');
export const f1: string = params.get('f1');
export const seed: string = params.get('seed');
export const h: string = params.get('h');
export const l: string = params.get('l');