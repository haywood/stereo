import { pi, evaluate, compile, EvalFunction } from 'mathjs';
import { Observable, Subscriber } from 'rxjs';

const params = new URLSearchParams(document.location.search);

const query = {
    n: params.get('n') || '4096',
    animate: !!(parseInt(params.get('a')) || 1),
    f0: params.get('f0') || 'cos(phi)',
    f1: params.get('f1') || 'sin(phi)',
    seed: params.get('seed') || '2->sphere(1)->spiral(1, 1)->torus(1, 0.25)',
    pipe: params.get('pipe') || 'R(rate * t, 0, 1)->R(rate * t, 0, 2)->R(rate * t, 0, 3)->stereo(3)',
    h: params.get('h') || 'abs(sin(t))*i/n',
    l: params.get('l') || '0.2 + 0.6 * (1 + abs(sin(tau * t / 60))) / 2',
    rate: params.has('rate')
        ? evaluate(params.get('rate'))
        : pi / 40,
};

export type Q = typeof query;
const subscribers: { [P in keyof Q]?: Subscriber<Q[P]> } = {};
export const streams: { [P in keyof Q]?: Observable<Q[P]> } = {};
for (const key in query) {
    streams[key] = Observable.create((subscriber) => {
        subscribers[key] = subscriber;
        subscriber.next(query[key])
    });
}

export const q = new Proxy(query, {
    set(target, property, value) {
        const event = window.event;
        subscribers[property].next({ value, event });
        return Reflect.set(target, property, value);
    }
});