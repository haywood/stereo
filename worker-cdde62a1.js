
var workerCdde62A1 = (function () {
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);


class Interval {
    constructor(d, a, b) {
        this.d = d;
        this.a = a;
        this.b = b;
        /**
         * @param x A vector of length this.domain contained in the interval [0, 1].
         * @returns A mapping of the vector into this interval.
         */
        this.fn = (x, y = new Float32Array(this.d)) => {
            const { a, b, d } = this;
            constants42935Eee.a.equal(x.length, d);
            constants42935Eee.a.equal(y.length, d);
            for (let i = 0; i < d; i++) {
                y[i] = a[i] + x[i] * (b[i] - a[i]);
            }
            return y;
        };
        this.sample = function* (n, offset, limit) {
            const { d, fn } = this;
            n = Interval.nPerLevel(d, n);
            const points = [[]];
            let i = 0;
            while (points.length && i < limit) {
                const p = points.pop();
                if (p.length < d) {
                    points.push(...successors(p));
                }
                else if (i++ >= offset) {
                    yield fn(p);
                }
            }
            function* successors(p) {
                for (let i = 0; i < n; i++) {
                    yield [...p, i / n];
                }
            }
        };
        constants42935Eee.a.equal(a.length, d);
        constants42935Eee.a.equal(b.length, d);
        this.domain = d;
    }
}
Interval.nPerLevel = (d, n) => {
    return Math.round(Math.pow(n, 1 / d));
};
//# sourceMappingURL=interval.js.map

/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const proxyMarker = Symbol("Comlink.proxy");
const createEndpoint = Symbol("Comlink.endpoint");
const releaseProxy = Symbol("Comlink.releaseProxy");
const throwSet = new WeakSet();
const transferHandlers = new Map([
    [
        "proxy",
        {
            canHandle: obj => obj && obj[proxyMarker],
            serialize(obj) {
                const { port1, port2 } = new MessageChannel();
                expose(obj, port1);
                return [port2, [port2]];
            },
            deserialize: (port) => {
                port.start();
                return wrap(port);
            }
        }
    ],
    [
        "throw",
        {
            canHandle: obj => throwSet.has(obj),
            serialize(obj) {
                const isError = obj instanceof Error;
                let serialized = obj;
                if (isError) {
                    serialized = {
                        isError,
                        message: obj.message,
                        stack: obj.stack
                    };
                }
                return [serialized, []];
            },
            deserialize(obj) {
                if (obj.isError) {
                    throw Object.assign(new Error(), obj);
                }
                throw obj;
            }
        }
    ]
]);
function expose(obj, ep = self) {
    ep.addEventListener("message", function callback(ev) {
        if (!ev || !ev.data) {
            return;
        }
        const { id, type, path } = Object.assign({ path: [] }, ev.data);
        const argumentList = (ev.data.argumentList || []).map(fromWireValue);
        let returnValue;
        try {
            const parent = path.slice(0, -1).reduce((obj, prop) => obj[prop], obj);
            const rawValue = path.reduce((obj, prop) => obj[prop], obj);
            switch (type) {
                case 0 /* GET */:
                    {
                        returnValue = rawValue;
                    }
                    break;
                case 1 /* SET */:
                    {
                        parent[path.slice(-1)[0]] = fromWireValue(ev.data.value);
                        returnValue = true;
                    }
                    break;
                case 2 /* APPLY */:
                    {
                        returnValue = rawValue.apply(parent, argumentList);
                    }
                    break;
                case 3 /* CONSTRUCT */:
                    {
                        const value = new rawValue(...argumentList);
                        returnValue = proxy(value);
                    }
                    break;
                case 4 /* ENDPOINT */:
                    {
                        const { port1, port2 } = new MessageChannel();
                        expose(obj, port2);
                        returnValue = transfer(port1, [port1]);
                    }
                    break;
                case 5 /* RELEASE */:
                    {
                        returnValue = undefined;
                    }
                    break;
            }
        }
        catch (e) {
            returnValue = e;
            throwSet.add(e);
        }
        Promise.resolve(returnValue)
            .catch(e => {
            throwSet.add(e);
            return e;
        })
            .then(returnValue => {
            const [wireValue, transferables] = toWireValue(returnValue);
            ep.postMessage(Object.assign(Object.assign({}, wireValue), { id }), transferables);
            if (type === 5 /* RELEASE */) {
                // detach and deactive after sending release response above.
                ep.removeEventListener("message", callback);
                closeEndPoint(ep);
            }
        });
    });
    if (ep.start) {
        ep.start();
    }
}
function isMessagePort(endpoint) {
    return endpoint.constructor.name === "MessagePort";
}
function closeEndPoint(endpoint) {
    if (isMessagePort(endpoint))
        endpoint.close();
}
function wrap(ep, target) {
    return createProxy(ep, [], target);
}
function throwIfProxyReleased(isReleased) {
    if (isReleased) {
        throw new Error("Proxy has been released and is not useable");
    }
}
function createProxy(ep, path = [], target = function () { }) {
    let isProxyReleased = false;
    const proxy = new Proxy(target, {
        get(_target, prop) {
            throwIfProxyReleased(isProxyReleased);
            if (prop === releaseProxy) {
                return () => {
                    return requestResponseMessage(ep, {
                        type: 5 /* RELEASE */,
                        path: path.map(p => p.toString())
                    }).then(() => {
                        closeEndPoint(ep);
                        isProxyReleased = true;
                    });
                };
            }
            if (prop === "then") {
                if (path.length === 0) {
                    return { then: () => proxy };
                }
                const r = requestResponseMessage(ep, {
                    type: 0 /* GET */,
                    path: path.map(p => p.toString())
                }).then(fromWireValue);
                return r.then.bind(r);
            }
            return createProxy(ep, [...path, prop]);
        },
        set(_target, prop, rawValue) {
            throwIfProxyReleased(isProxyReleased);
            // FIXME: ES6 Proxy Handler `set` methods are supposed to return a
            // boolean. To show good will, we return true asynchronously ¯\_(ツ)_/¯
            const [value, transferables] = toWireValue(rawValue);
            return requestResponseMessage(ep, {
                type: 1 /* SET */,
                path: [...path, prop].map(p => p.toString()),
                value
            }, transferables).then(fromWireValue);
        },
        apply(_target, _thisArg, rawArgumentList) {
            throwIfProxyReleased(isProxyReleased);
            const last = path[path.length - 1];
            if (last === createEndpoint) {
                return requestResponseMessage(ep, {
                    type: 4 /* ENDPOINT */
                }).then(fromWireValue);
            }
            // We just pretend that `bind()` didn’t happen.
            if (last === "bind") {
                return createProxy(ep, path.slice(0, -1));
            }
            const [argumentList, transferables] = processArguments(rawArgumentList);
            return requestResponseMessage(ep, {
                type: 2 /* APPLY */,
                path: path.map(p => p.toString()),
                argumentList
            }, transferables).then(fromWireValue);
        },
        construct(_target, rawArgumentList) {
            throwIfProxyReleased(isProxyReleased);
            const [argumentList, transferables] = processArguments(rawArgumentList);
            return requestResponseMessage(ep, {
                type: 3 /* CONSTRUCT */,
                path: path.map(p => p.toString()),
                argumentList
            }, transferables).then(fromWireValue);
        }
    });
    return proxy;
}
function myFlat(arr) {
    return Array.prototype.concat.apply([], arr);
}
function processArguments(argumentList) {
    const processed = argumentList.map(toWireValue);
    return [processed.map(v => v[0]), myFlat(processed.map(v => v[1]))];
}
const transferCache = new WeakMap();
function transfer(obj, transfers) {
    transferCache.set(obj, transfers);
    return obj;
}
function proxy(obj) {
    return Object.assign(obj, { [proxyMarker]: true });
}
function toWireValue(value) {
    for (const [name, handler] of transferHandlers) {
        if (handler.canHandle(value)) {
            const [serializedValue, transferables] = handler.serialize(value);
            return [
                {
                    type: 3 /* HANDLER */,
                    name,
                    value: serializedValue
                },
                transferables
            ];
        }
    }
    return [
        {
            type: 0 /* RAW */,
            value
        },
        transferCache.get(value) || []
    ];
}
function fromWireValue(value) {
    switch (value.type) {
        case 3 /* HANDLER */:
            return transferHandlers.get(value.name).deserialize(value.value);
        case 0 /* RAW */:
            return value.value;
    }
}
function requestResponseMessage(ep, msg, transfers) {
    return new Promise(resolve => {
        const id = generateUUID();
        ep.addEventListener("message", function l(ev) {
            if (!ev.data || !ev.data.id || ev.data.id !== id) {
                return;
            }
            ep.removeEventListener("message", l);
            resolve(ev.data);
        });
        if (ep.start) {
            ep.start();
        }
        ep.postMessage(Object.assign({ id }, msg), transfers);
    });
}
function generateUUID() {
    return new Array(4)
        .fill(0)
        .map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16))
        .join("-");
}
//# sourceMappingURL=comlink.mjs.map

class CompositeFn {
    constructor(fns) {
        this.fns = fns;
        this.sample = function* (n, offset, limit) {
            const { fns, d } = this;
            const [first, ...rest] = fns;
            if (fns.length == 0)
                return [];
            for (const x of first.sample(n, offset, limit)) {
                this.x.set(x);
                if (rest.length) {
                    CompositeFn.apply(rest, this.x, this.y);
                }
                else {
                    this.y.set(x);
                }
                yield this.y.subarray(0, d);
            }
        };
        this.fn = (x, y = new Float32Array(this.d)) => {
            const { fns, domain, d } = this;
            constants42935Eee.a.equal(x.length, domain);
            constants42935Eee.a.equal(y.length, d);
            this.x.set(x);
            CompositeFn.apply(fns, this.x, this.y);
            y.set(this.y.subarray(0, d));
            return y;
        };
        constants42935Eee.a(fns.length, 'fns cannot be empty');
        const length = Math.max(this.domainMax, this.dMax);
        this.x = new Float32Array(length);
        this.y = new Float32Array(length);
    }
    get first() {
        return this.fns[0];
    }
    get last() {
        return this.fns[this.fns.length - 1];
    }
    get domain() {
        return this.first.domain;
    }
    get d() {
        return this.last.d;
    }
    get domainMax() {
        return this.fns.reduce((max, f) => Math.max(f.domain, max), 0);
    }
    get dMax() {
        return this.fns.reduce((max, f) => Math.max(f.d, max), 0);
    }
}
CompositeFn.apply = (fns, x, y) => {
    constants42935Eee.a.equal(x.length, y.length);
    for (const f of fns) {
        f.fn(x.subarray(0, f.domain), y.subarray(0, f.d));
        for (let i = 0; i < y.length; i++) {
            if (!isFinite(y[i]))
                y[i] = Math.sign(y[i]) * constants42935Eee.i;
            if (isNaN(y[i]))
                y[i] = 0;
        }
        x.set(y);
    }
};
CompositeFn.Builder = class {
    constructor() {
        this.fns = [];
        this.add = (fn) => {
            const { fns, last } = this;
            if (last && fn.domain !== last.d) {
                throw new Error(`Cannot add ${fn} to composite, because its domain is not ${last.d}`);
            }
            fns.push(fn);
            return this;
        };
        this.build = () => {
            return new CompositeFn(this.fns);
        };
    }
    get d() {
        return this.last.d;
    }
    get last() {
        return this.fns[this.fns.length - 1];
    }
};
//# sourceMappingURL=index.js.map

class Cube {
    constructor(d, l) {
        this.d = d;
        this.l = l;
        this.fn = (x, y) => this.interval.fn(x, y);
        this.sample = (n, offset, limit) => this.interval.sample(n, offset, limit);
        this.interval = new Interval(d, new Array(d).fill(-l / 2), new Array(d).fill(l / 2));
    }
    get domain() {
        return this.d;
    }
}
//# sourceMappingURL=cube.js.map

class Sphere {
    constructor(d, r) {
        this.d = d;
        this.r = r;
        this.sample = function* (n, offset, limit) {
            const cube = new Cube(this.domain, 2 * Math.PI);
            for (const phi of cube.sample(n, offset, limit)) {
                yield this.fn(phi);
            }
        };
        this.fn = (phi, y = new Float32Array(this.d)) => {
            const { d, r } = this;
            constants42935Eee.a.equal(phi.length, d - 1);
            constants42935Eee.a.equal(y.length, d);
            y[0] = r;
            for (let i = 1; i < y.length; i++) {
                const sin = Math.sin(phi[i - 1]);
                const cos = Math.cos(phi[i - 1]);
                y[i] = y[0] * sin;
                y[0] *= cos;
            }
            return y;
        };
    }
    get domain() {
        return this.d - 1;
    }
}
//# sourceMappingURL=sphere.js.map

// This shape does not implement a torus. It used to,
// but then I changed the way Rotator works, which
// changed the way that the points of the sphere are
// distributed, making the translation step behave incorrectly
// Still makes a cool shape though, so keeping it
class FuckedUpTorus {
    constructor(d, r, t) {
        this.d = d;
        this.r = r;
        this.t = t;
        this.sample = function* (n, offset, limit) {
            const cube = new Cube(this.domain, 2 * Math.PI);
            for (const phi of cube.sample(n, offset, limit)) {
                yield this.fn(phi);
            }
        };
        this.fn = (phi, y = new Float32Array(this.d)) => {
            const { domain, d, sphere, circle } = this;
            constants42935Eee.a.equal(phi.length, domain);
            constants42935Eee.a.equal(y.length, d);
            sphere.fn(phi, y);
            const q = circle.fn(phi.subarray(d - 2));
            y[0] += q[0];
            y[d - 1] += q[1];
            return y;
        };
        this.sphere = new Sphere(d, t);
        this.circle = new Sphere(2, r);
    }
    get domain() {
        return this.d - 1;
    }
}
//# sourceMappingURL=fucked_up_torus.js.map

class Rotator {
    constructor(d, theta, d0, d1, f0 = Math.cos, f1 = Math.sin) {
        this.d = d;
        this.theta = theta;
        this.d0 = d0;
        this.d1 = d1;
        this.f0 = f0;
        this.f1 = f1;
        this.sample = function* (n, offset, limit) {
            const cube = new Cube(this.domain, 2);
            for (const p of cube.sample(n, offset, limit)) {
                yield this.fn(p);
            }
        };
        this.fn = (x, y = new Float32Array(this.d)) => {
            const { d, d0, d1, r0, r1 } = this;
            constants42935Eee.a.equal(x.length, d);
            constants42935Eee.a.equal(y.length, d);
            y.set(x);
            const a = x[d0], b = x[d1];
            y[d0] = a * r0 - b * r1;
            y[d1] = a * r1 + b * r0;
            return y;
        };
        this.r0 = f0(theta);
        this.r1 = f1(theta);
    }
    get domain() {
        return this.d;
    }
}
//# sourceMappingURL=rotator.js.map

class Spiral {
    constructor(d, a, k) {
        this.d = d;
        this.a = a;
        this.k = k;
        this.sample = function* (n, offset, limit) {
            const cube = new Cube(this.domain, 4 * Math.PI);
            for (const phi of cube.sample(n, offset, limit)) {
                yield this.fn(phi);
            }
        };
        this.fn = (phi, y = new Float32Array(this.d)) => {
            const { a, k, domain, d } = this;
            constants42935Eee.a.equal(phi.length, d - 1);
            constants42935Eee.a.equal(y.length, d);
            this.sphere.fn(phi, y);
            let x = 0;
            for (let i = 0; i < domain; i++) {
                x += k[i] * phi[i];
            }
            const r = Math.exp(x);
            for (let i = 0; i < d; i++) {
                y[i] = y[i] * a[i] * r;
            }
            return y;
        };
        this.sphere = new Sphere(d, 1);
    }
    get domain() {
        return this.d - 1;
    }
}
//# sourceMappingURL=spiral.js.map

class Stereo {
    constructor(from, to) {
        this.from = from;
        this.to = to;
        this.sample = function* (n, offset, limit) {
            const cube = new Cube(this.domain, 2);
            for (const phi of cube.sample(n, offset, limit)) {
                yield this.fn(phi);
            }
        };
        this.fn = (x, y = new Float32Array(this.to)) => {
            let { from, to, fromTemp, toTemp } = this;
            constants42935Eee.a.equal(x.length, from);
            constants42935Eee.a.equal(y.length, to);
            if (from === to) {
                y.set(x);
                return y;
            }
            fromTemp.set(x);
            while (from < to) {
                Stereo.up(fromTemp.subarray(0, from), toTemp.subarray(0, ++from));
                fromTemp.set(toTemp);
            }
            while (from > to) {
                Stereo.down(fromTemp.subarray(0, from), toTemp.subarray(0, --from));
                fromTemp.set(toTemp);
            }
            y.set(toTemp.subarray(0, to));
            return y;
        };
        this.fromTemp = new Float32Array(Math.max(from, to));
        this.toTemp = new Float32Array(Math.max(from, to));
    }
    get domain() {
        return this.from;
    }
    get d() {
        return this.to;
    }
}
Stereo.up = (x, temp) => {
    constants42935Eee.a.equal(temp.length, x.length + 1);
    const n2 = norm2(x);
    const divisor = n2 + 1;
    temp[0] = (n2 - 1) / divisor;
    for (let i = 1; i <= x.length; i++) {
        temp[i] = (2 * x[i - 1]) / divisor;
    }
};
Stereo.down = (x, temp) => {
    constants42935Eee.a.equal(temp.length, x.length - 1);
    for (let i = 0; i < temp.length; i++) {
        temp[i] = x[i + 1] / (1 - x[0]);
    }
};
const norm2 = (x) => {
    let result = 0;
    for (let i = 0; i < x.length; i++) {
        result += x[i] * x[i];
    }
    return result;
};
//# sourceMappingURL=stereo.js.map

class Torus {
    constructor(d, r) {
        this.d = d;
        this.r = r;
        this.sample = function* (n, offset, limit) {
            const cube = new Cube(this.domain, 2 * Math.PI);
            for (const phi of cube.sample(n, offset, limit)) {
                yield this.fn(phi);
            }
        };
        this.fn = (theta, y = new Float32Array(this.d)) => {
            const { d, domain, r } = this;
            const circle = new Sphere(2, r[0]);
            circle.fn(theta.subarray(0, 1), y.subarray(0, 2));
            for (let i = 1; i < domain; i++) {
                y[0] += r[i];
                const rotator = new Rotator(d, theta[i], i - 1, i + 1);
                rotator.fn(y, y);
            }
            return y;
        };
        constants42935Eee.a(d > 2, `torus: expected d = ${d} > 2`);
        constants42935Eee.a(r.length == this.domain, `torus: expected r.length = ${r.length} == ${this.domain}`);
    }
    get domain() {
        return this.d - 1;
    }
}
//# sourceMappingURL=torus.js.map

const pp = (a, p = 2) => JSON.stringify(a, null, p);
//# sourceMappingURL=pp.js.map

function assert(cond, scope, msg) {
    if (!cond)
        throw { message: msg(), scope };
}
class Resolver {
    constructor(scope) {
        this.scope = scope;
        this.resolvePipe = (pipe) => {
            const [head, ...tail] = pipe.steps;
            const fn = new CompositeFn.Builder().add(this.resolveStep(pipe.d0, head));
            for (let i = 0; i < tail.length; i++) {
                fn.add(this.resolveStep(fn.d, tail[i]));
            }
            return { n: pipe.n, fn: fn.build() };
        };
        this.resolveStep = (d0, { type, args }) => {
            const d = ranges[type](d0);
            return funs[type](d, ...args.map(a => this.resolve(a)));
        };
        this.resolveFn = ({ name, args }) => {
            const fn = Math[name];
            const type = typeof fn;
            this.expect(type === 'function', name, `resolve to a function`, `was ${type}`);
            return fn(...args.map(a => this.resolve(a)));
        };
        this.resolveAccess = ({ id, index }) => {
            const scope = this.scope;
            const target = scope[id];
            this.assert(target, () => `failed to resolve access target ${id}`);
            if (index.kind === 'id' && index.id in target) {
                // TODO works in practice, but not sure if corret
                return target[index.id];
            }
            else {
                return target[this.resolve(index)];
            }
        };
        this.resolveId = (id) => {
            let value;
            if (id in this.scope) {
                value = this.scope[id];
            }
            else if (id in Math) {
                value = Math[id];
            }
            else {
                const idu = id.toUpperCase();
                if (idu in Math)
                    value = Math[idu];
            }
            this.assert(value, () => `failed to resolve id ${id}`);
            return value;
        };
        this.resolveArith = ({ op, operands }) => {
            const [a, b] = operands.map(a => this.resolve(a, 'number'));
            return ops[op](a, b);
        };
        this.isNodeDynamic = (node) => {
            switch (node.kind) {
                case 'fn':
                    return node.args.some(this.isNodeDynamic);
                case 'id':
                    return typeof this.resolve(node) === 'number';
                case 'arith':
                    return node.operands.some(this.isNodeDynamic);
                default:
                    return false;
            }
        };
    }
    resolve(node, hint) {
        let value;
        switch (node.kind) {
            case 'pipe':
                value = this.resolvePipe(node);
                break;
            case 'arith':
                value = this.resolveArith(node);
                break;
            case 'number':
                value = node.value;
                break;
            case 'fn':
                value = this.resolveFn(node);
                break;
            case 'access':
                value = this.resolveAccess(node);
                break;
            case 'id':
                value = this.resolveId(node.id);
                break;
            case 'paren':
                value = this.resolve(node.scalar);
                break;
        }
        if (hint) {
            const actual = typeof value;
            this.expect(actual === hint, node, `be a ${hint}`, `was ${actual}`);
        }
        if (hint === 'number') {
            this.expect(!isNaN(value), node, 'be a number', 'was NaN');
        }
        return value;
    }
    assert(cond, msg) {
        assert(cond, this.scope, msg);
    }
    expect(cond, node, expected, actual) {
        this.assert(cond, () => `Expected ${pp(node, 0)} to ${expected}, but ${actual}`);
    }
}
const ops = {
    '+': (a, b) => a + b,
    '-': (a, b) => (b == null ? -a : a - b),
    '*': (a, b) => a * b,
    '/': (a, b) => a / b,
    '**': (a, b) => Math.pow(a, b),
    '^': (a, b) => Math.pow(a, b)
};
const funs = {
    cube: (d, l) => new Cube(d, l),
    sphere: (d, r) => new Sphere(d, r),
    spiral: (d, a, k) => new Spiral(d, new Array(d).fill(a), new Array(d - 1).fill(k)),
    torus: (d, ...r) => new Torus(d, new Float32Array(r)),
    fucked_up_torus: (d, r, t) => new FuckedUpTorus(d, r, t),
    rotate: (d, theta, d0, d1, f0 = Math.cos, f1 = Math.sin) => {
        assert(0 <= d0 && d0 < d, null, () => `rotate: Expected 0 <= d0 = ${d0} < d = ${d}`);
        assert(0 <= d1 && d1 < d, null, () => `rotate: Expected 0 <= d1 = ${d1} < d = ${d}`);
        return new Rotator(d, theta, d0, d1, f0, f1);
    },
    stereo: (d, to) => new Stereo(d, to)
};
const ranges = {
    cube: domain => domain,
    sphere: domain => domain + 1,
    spiral: domain => domain + 1,
    torus: domain => domain + 1,
    fucked_up_torus: domain => domain + 1,
    rotate: domain => domain,
    r: domain => domain,
    stereo: domain => domain
};
//# sourceMappingURL=resolver.js.map

const { abs, min, sign } = Math;
class Evaluator {
    constructor(scope, ast, hsv, chunk) {
        this.scope = scope;
        this.hsv = hsv;
        this.iterate = () => {
            const position = this.computePosition();
            const color = this.computeColor(position);
            return {
                d: this.d,
                position,
                color
            };
        };
        this.computePosition = () => {
            const { fn, n, d, offset, size } = this;
            const position = new Float32Array(d * size);
            let i = 0;
            for (const y of fn.sample(n, offset, offset + size)) {
                position.set(y, d * i++);
            }
            return position;
        };
        this.computeColor = (position) => {
            const { d, hsv, size } = this;
            const color = new Float32Array(3 * size);
            const { extent } = this.scope;
            for (let i = 0; i < size; i++) {
                const p = position.subarray(i * d, (i + 1) * d);
                this.scope.p = p.map((pk, k) => {
                    const m = extent[k];
                    return m ? sign(pk) * min(1, abs(pk) / m) : 0;
                });
                this.scope.i = i;
                const h = 360 * this.resolveNumber('h', hsv.h);
                const s = this.resolveNumber('s', hsv.s);
                const v = this.resolveNumber('v', hsv.v);
                const rgb = hsv2rgb(h, s, v);
                color.set(rgb, i * 3);
            }
            return color;
        };
        this.resolver = new Resolver(scope);
        const { n, fn } = this.resolvePipe(ast);
        const offset = chunk.offset;
        const size = chunk.size;
        const limit = offset + size;
        constants42935Eee.a(offset >= 0, `offset must be non-negative; got ${offset}`);
        constants42935Eee.a(limit <= n, `offset + size must be <= n; got ${offset} + ${size} = ${limit} > ${n}`);
        this.n = n;
        this.fn = fn;
        this.offset = offset;
        this.size = limit - offset;
    }
    get d() {
        return this.fn.d;
    }
    resolvePipe(node) {
        try {
            return this.resolver.resolve(node);
        }
        catch ({ message, scope }) {
            throw { context: 'pipe', message, scope };
        }
    }
    resolveNumber(context, node) {
        try {
            return this.resolver.resolve(node, 'number');
        }
        catch ({ message, scope }) {
            throw { context, message, scope };
        }
    }
}
function hsv2rgb(h, s, v) {
    // source: https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_RGB
    h = Math.max(0, Math.min(360, h));
    s = Math.max(0, Math.min(1, s));
    v = Math.max(0, Math.min(1, v));
    const hprime = h / 60;
    const c = v * s;
    const x = c * (1 - abs((hprime % 2) - 1));
    const m = v - c;
    let rgb;
    if (hprime <= 1) {
        rgb = [c, x, 0];
    }
    else if (hprime <= 2) {
        rgb = [x, c, 0];
    }
    else if (hprime <= 3) {
        rgb = [0, c, x];
    }
    else if (hprime <= 4) {
        rgb = [0, x, c];
    }
    else if (hprime <= 5) {
        rgb = [x, 0, c];
    }
    else if (hprime <= 6) {
        rgb = [c, 0, x];
    }
    else {
        rgb = [0, 0, 0];
    }
    rgb.forEach((vi, i) => (rgb[i] = vi + m));
    return rgb;
}
//# sourceMappingURL=evaluator.js.map

const worker = {
    iterate: (params, chunk) => {
        const evaluator = new Evaluator(params.scope, params.pipe, params.hsv, chunk);
        return evaluator.iterate();
    }
};
const newWorker = () => new Worker('/stereo/pipe/worker.js');
expose(worker);


return {
  I: Interval,
  n: newWorker,
  p: pp,
  w: wrap
};
})();
//# sourceMappingURL=worker-cdde62a1.js.map
