import { Observable, Subject } from 'rxjs';

const initialValues = {
    pipe: '10000->sphere(4, 1)->R(theta, 0, 1, cos, tan)->R(theta, 0, 2)->R(theta, 0, 3)->stereo(3)',
    theta: 'pi * (t + power) / 20',
    h: 'chroma * i / n',
    l: '0.2 + 0.8 * power',
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
    for (const [key, value] of Object.entries(values)) {
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
if (query.get('restore') !== '0') {
    restore();
}

for (const key in initialValues) {
    subjects[key] = new Subject();
    streams[key] = subjects[key].asObservable();
}

export const values = new Proxy(initialValues, {
    set(target, property, value) {
        const oldValue = target[property];
        const success = Reflect.set(target, property, value);
        if (query.get('persist') !== '0') persist();
        subjects[property].next({ newValue: value, event: window.event, oldValue });
        return success;
    }
});
