import { Observable, Subscriber } from 'rxjs';

let query = {
    n: '4096',
    animate: 1,
    f0: 'cos(phi)',
    f1: 'sin(phi)',
    seed: '2->sphere(1)->spiral(1, 1)->torus(1, 0.25)',
    pipe: 'R(rate * t, 0, 1)->R(rate * t, 0, 2)->R(rate * t, 0, 3)->stereo(3)',
    h: 'abs(sin(t))*i/n',
    l: '0.2 + 0.6 * (1 + abs(sin(tau * t / 60))) / 2',
    rate: 'pi / 40',
};
export type Q = typeof query;

// TODO: also support override from window.location.hash
Object.assign(query, JSON.parse(localStorage.getItem('q') || '{}'));

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
        const success = Reflect.set(target, property, value);
        localStorage.setItem('q', JSON.stringify(target));
        return success;
    }
});