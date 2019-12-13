import { Observable, Subscriber, Subject, Subscription } from 'rxjs';

const query = {
    pipe: '3->sphere(1)->R(t, 0, 1)->stereo(3)',
    rate: 'pi / 40',
    f0: 'cos(phi)',
    f1: 'sin(phi)',
    h: 'abs(sin(t))*i/n',
    l: '0.2 + 0.6 * (1 + abs(sin(tau * t / 60))) / 2',
    animate: true,
    remote: true,
};
export type Q = typeof query;

// TODO: also support override from window.location.hash
const savedQuery = JSON.parse(localStorage.getItem('q') || '{}');
for (const key in savedQuery) {
    if (!(key in query)) delete savedQuery[key];
}
Object.assign(query, savedQuery);

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