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
    pipe: '10000->spiral(4, 1, 1)->R(theta, 0, 1)->R(theta, 0, 2)->R(theta, 0, 3)->stereo(3)',
    theta: 'pi * t * bpm',
    h: 'abs(sin(theta)) * i / n',
    l: '0.2 + 0.4 * ebeat',
    animate: true,
    sound: false,
};
export type Inputs = typeof initialValues;

type Change<T> = {
    newValue: T;
    oldValue?: T;
    event?: Event;
};
const subjects: { [P in keyof Inputs]?: Subject<Change<Inputs[P]>> } = {};

export const streams: { [P in keyof Inputs]?: Observable<Change<Inputs[P]>> } = {};

const persistence: { [P in keyof Inputs]: boolean } = {
    pipe: true,
    theta: true,
    h: true,
    l: true,
    animate: false,
    sound: false,
};

const persist = () => {
    for (const [key, value] of Object.entries(inputs)) {
        if (persistence[key]) {
            localStorage.setItem(`inputs.${key}`, value.toString());
        };
    }
};

const restore = () => {
    // TODO (maybe): also support override from window.location.hash
    for (const [key, saved] of Object.entries(persistence)) {
        if (saved) {
            const value = localStorage.getItem(`inputs.${key}`);
            if (value) initialValues[key] = value;
        };
    }
};

const query = new URLSearchParams(window.location.search);
const useLs = query.get('ls') !== '0';
if (useLs) {
    restore();
}

for (const key in initialValues) {
    subjects[key] = new Subject();
    streams[key] = subjects[key].asObservable();
}

export const inputs = new Proxy(initialValues, {
    set(target, property, value) {
        const oldValue = target[property];
        const success = Reflect.set(target, property, value);
        if (useLs) persist();
        subjects[property].next({ newValue: value, event: window.event, oldValue });
        return success;
    }
});
