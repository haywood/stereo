import { Observable, Subscriber, Subject, Subscription } from 'rxjs';

const query = {
    n: '4096',
    f0: 'cos(phi)',
    f1: 'sin(phi)',
    seed: '2->sphere(1)->spiral(1, 1)->torus(1, 0.25)',
    pipe: 'R(rate * t, 0, 1)->R(rate * t, 0, 2)->R(rate * t, 0, 3)->stereo(3)',
    h: 'abs(sin(t))*i/n',
    l: '0.2 + 0.6 * (1 + abs(sin(tau * t / 60))) / 2',
    rate: 'pi / 40',
    animate: true,
    remote: true,
};
export type Q = typeof query;

// TODO: also support override from window.location.hash
Object.assign(query, JSON.parse(localStorage.getItem('q') || '{}'));

type Change<T> = {
    newValue: T,
    oldValue?: T,
    event?: Event
};
const subjects: { [P in keyof Q]?: Subject<Change<Q[P]>> } = {};

export const streams: { [P in keyof Q]?: Observable<Change<Q[P]>> } = {};

for (const key in query) {
    subjects[key] = new Subject();
    streams[key] = subjects[key].asObservable();
}

export const q = new Proxy(query, {
    set(target, property, value) {
        const oldValue = target[property];
        const success = Reflect.set(target, property, value);
        localStorage.setItem('q', JSON.stringify(target));
        subjects[property].next({ newValue: value, event: window.event, oldValue });
        return success;
    }
});