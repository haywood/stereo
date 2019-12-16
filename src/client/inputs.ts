import { Observable, Subject } from 'rxjs';

const initialValues = {
    // good ones
    // 1000 -> cube(2, tau) -> sphere -> spiral
    // 1000 -> cube(2, tau) -> sphere -> spiral -> (fucked_up_)?torus
    // 1000 -> cube(3, tau) -> sphere
    // 1000 -> cube(3, tau) -> (fucked_up_)?torus (interesting)
    // 1000 -> cube(3, tau) -> spiral (really good)
    // 1000 -> cube(3, tau) -> sphere -> sphere
    // 1000 -> cube(2, tau) -> 3 * sphere
    pipe: '10000->sphere(2, 1)->torus(1, 0.25)->spiral(1, 1)->R(t, 0, 1)->stereo(3)',
    rate: 'pi / 40 + bpm',
    f0: 'cos(phi)',
    f1: 'tan(phi)',
    h: 'abs(sin(t))*i/n',
    l: '0.2 + 0.6 * (1 + abs(sin(tau * t / 60))) / 2',
    animate: true,
    remote: true,
};
export type Inputs = typeof initialValues;

const query = new URLSearchParams(window.location.search);
if (query.has('ls') && query.get('ls') !== '0') {
    // TODO (maybe): also support override from window.location.hash
    const savedInputs = JSON.parse(localStorage.getItem('inputs') || '{}');
    for (const key in savedInputs) {
        if (!(key in initialValues)) delete savedInputs[key];
    }
    Object.assign(initialValues, savedInputs);
}

type Change<T> = {
    newValue: T;
    oldValue?: T;
    event?: Event;
};
const subjects: { [P in keyof Inputs]?: Subject<Change<Inputs[P]>> } = {};

export const streams: { [P in keyof Inputs]?: Observable<Change<Inputs[P]>> } = {};

for (const key in initialValues) {
    subjects[key] = new Subject();
    streams[key] = subjects[key].asObservable();
}

export const inputs = new Proxy(initialValues, {
    set(target, property, value) {
        const oldValue = target[property];
        const success = Reflect.set(target, property, value);
        localStorage.setItem('inputs', JSON.stringify(target));
        subjects[property].next({ newValue: value, event: window.event, oldValue });
        return success;
    }
});
