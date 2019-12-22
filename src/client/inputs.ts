import { Observable, Subject } from 'rxjs';

const initialValues = {
    pipe: defaultPipe(),
    theta: 'pi * t / 20',
    h: 'abs(sin(theta * bpm)) * i / n',
    // Models lightness as a sigmoid centered at 0.5
    // See https://en.wikipedia.org/wiki/Logistic_function
    l: '1 / (1 + e ^ (4 * (0.5 - ebeat)))',
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
if (query.get('restore') !== '0') {
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
        if (query.get('persist') !== '0') persist();
        subjects[property].next({ newValue: value, event: window.event, oldValue });
        return success;
    }
});

// Genereates 10,000 points on a 4-d spiral and oscillates them
// in the first 3 of the 6 planes of R^4. Use of tanh instead of sin in
// the xy-plane causes the system to expand and contract at intervals.
function defaultPipe() {
    const d = 4;
    const planes = (limit: number): [number, number][] => {
        let ps = [];
        for (let i = 0; i < d; i++) {
            for (let j = i + 1; j < d; j++) {
                if (ps.length < limit) {
                    ps.push([i, j]);
                } else {
                    return ps;
                }
            }
        }
        return ps;
    };

    const f0s = {
    };

    const f1s = {
        '[0,2]': 'sin',
    };

    const rotations = planes(3).map(plane => {
        const key = JSON.stringify(plane);
        const f0 = f0s[key] || 'cos';
        const f1 = f1s[key] || 'tan';
        return `R(theta, ${plane[0]}, ${plane[1]}, ${f0}, ${f1})`;
    }).join('->');

    return `10000->sphere(${d}, 1)->${rotations}->stereo(3)`;
}
