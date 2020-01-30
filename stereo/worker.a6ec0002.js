// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"../node_modules/comlink/dist/esm/comlink.mjs":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.expose = expose;
exports.proxy = proxy;
exports.transfer = transfer;
exports.windowEndpoint = windowEndpoint;
exports.wrap = wrap;
exports.transferHandlers = exports.releaseProxy = exports.proxyMarker = exports.createEndpoint = void 0;

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
exports.proxyMarker = proxyMarker;
const createEndpoint = Symbol("Comlink.endpoint");
exports.createEndpoint = createEndpoint;
const releaseProxy = Symbol("Comlink.releaseProxy");
exports.releaseProxy = releaseProxy;
const throwSet = new WeakSet();
const transferHandlers = new Map([["proxy", {
  canHandle: obj => obj && obj[proxyMarker],

  serialize(obj) {
    const {
      port1,
      port2
    } = new MessageChannel();
    expose(obj, port1);
    return [port2, [port2]];
  },

  deserialize: port => {
    port.start();
    return wrap(port);
  }
}], ["throw", {
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

}]]);
exports.transferHandlers = transferHandlers;

function expose(obj, ep = self) {
  ep.addEventListener("message", function callback(ev) {
    if (!ev || !ev.data) {
      return;
    }

    const {
      id,
      type,
      path
    } = Object.assign({
      path: []
    }, ev.data);
    const argumentList = (ev.data.argumentList || []).map(fromWireValue);
    let returnValue;

    try {
      const parent = path.slice(0, -1).reduce((obj, prop) => obj[prop], obj);
      const rawValue = path.reduce((obj, prop) => obj[prop], obj);

      switch (type) {
        case 0
        /* GET */
        :
          {
            returnValue = rawValue;
          }
          break;

        case 1
        /* SET */
        :
          {
            parent[path.slice(-1)[0]] = fromWireValue(ev.data.value);
            returnValue = true;
          }
          break;

        case 2
        /* APPLY */
        :
          {
            returnValue = rawValue.apply(parent, argumentList);
          }
          break;

        case 3
        /* CONSTRUCT */
        :
          {
            const value = new rawValue(...argumentList);
            returnValue = proxy(value);
          }
          break;

        case 4
        /* ENDPOINT */
        :
          {
            const {
              port1,
              port2
            } = new MessageChannel();
            expose(obj, port2);
            returnValue = transfer(port1, [port1]);
          }
          break;

        case 5
        /* RELEASE */
        :
          {
            returnValue = undefined;
          }
          break;
      }
    } catch (e) {
      returnValue = e;
      throwSet.add(e);
    }

    Promise.resolve(returnValue).catch(e => {
      throwSet.add(e);
      return e;
    }).then(returnValue => {
      const [wireValue, transferables] = toWireValue(returnValue);
      ep.postMessage(Object.assign(Object.assign({}, wireValue), {
        id
      }), transferables);

      if (type === 5
      /* RELEASE */
      ) {
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
  if (isMessagePort(endpoint)) endpoint.close();
}

function wrap(ep, target) {
  return createProxy(ep, [], target);
}

function throwIfProxyReleased(isReleased) {
  if (isReleased) {
    throw new Error("Proxy has been released and is not useable");
  }
}

function createProxy(ep, path = [], target = function () {}) {
  let isProxyReleased = false;
  const proxy = new Proxy(target, {
    get(_target, prop) {
      throwIfProxyReleased(isProxyReleased);

      if (prop === releaseProxy) {
        return () => {
          return requestResponseMessage(ep, {
            type: 5
            /* RELEASE */
            ,
            path: path.map(p => p.toString())
          }).then(() => {
            closeEndPoint(ep);
            isProxyReleased = true;
          });
        };
      }

      if (prop === "then") {
        if (path.length === 0) {
          return {
            then: () => proxy
          };
        }

        const r = requestResponseMessage(ep, {
          type: 0
          /* GET */
          ,
          path: path.map(p => p.toString())
        }).then(fromWireValue);
        return r.then.bind(r);
      }

      return createProxy(ep, [...path, prop]);
    },

    set(_target, prop, rawValue) {
      throwIfProxyReleased(isProxyReleased); // FIXME: ES6 Proxy Handler `set` methods are supposed to return a
      // boolean. To show good will, we return true asynchronously ¯\_(ツ)_/¯

      const [value, transferables] = toWireValue(rawValue);
      return requestResponseMessage(ep, {
        type: 1
        /* SET */
        ,
        path: [...path, prop].map(p => p.toString()),
        value
      }, transferables).then(fromWireValue);
    },

    apply(_target, _thisArg, rawArgumentList) {
      throwIfProxyReleased(isProxyReleased);
      const last = path[path.length - 1];

      if (last === createEndpoint) {
        return requestResponseMessage(ep, {
          type: 4
          /* ENDPOINT */

        }).then(fromWireValue);
      } // We just pretend that `bind()` didn’t happen.


      if (last === "bind") {
        return createProxy(ep, path.slice(0, -1));
      }

      const [argumentList, transferables] = processArguments(rawArgumentList);
      return requestResponseMessage(ep, {
        type: 2
        /* APPLY */
        ,
        path: path.map(p => p.toString()),
        argumentList
      }, transferables).then(fromWireValue);
    },

    construct(_target, rawArgumentList) {
      throwIfProxyReleased(isProxyReleased);
      const [argumentList, transferables] = processArguments(rawArgumentList);
      return requestResponseMessage(ep, {
        type: 3
        /* CONSTRUCT */
        ,
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
  return Object.assign(obj, {
    [proxyMarker]: true
  });
}

function windowEndpoint(w, context = self, targetOrigin = "*") {
  return {
    postMessage: (msg, transferables) => w.postMessage(msg, targetOrigin, transferables),
    addEventListener: context.addEventListener.bind(context),
    removeEventListener: context.removeEventListener.bind(context)
  };
}

function toWireValue(value) {
  for (const [name, handler] of transferHandlers) {
    if (handler.canHandle(value)) {
      const [serializedValue, transferables] = handler.serialize(value);
      return [{
        type: 3
        /* HANDLER */
        ,
        name,
        value: serializedValue
      }, transferables];
    }
  }

  return [{
    type: 0
    /* RAW */
    ,
    value
  }, transferCache.get(value) || []];
}

function fromWireValue(value) {
  switch (value.type) {
    case 3
    /* HANDLER */
    :
      return transferHandlers.get(value.name).deserialize(value.value);

    case 0
    /* RAW */
    :
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

    ep.postMessage(Object.assign({
      id
    }, msg), transfers);
  });
}

function generateUUID() {
  return new Array(4).fill(0).map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)).join("-");
}
},{}],"../node_modules/object-assign/index.js":[function(require,module,exports) {
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
'use strict';
/* eslint-disable no-unused-vars */

var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
  if (val === null || val === undefined) {
    throw new TypeError('Object.assign cannot be called with null or undefined');
  }

  return Object(val);
}

function shouldUseNative() {
  try {
    if (!Object.assign) {
      return false;
    } // Detect buggy property enumeration order in older V8 versions.
    // https://bugs.chromium.org/p/v8/issues/detail?id=4118


    var test1 = new String('abc'); // eslint-disable-line no-new-wrappers

    test1[5] = 'de';

    if (Object.getOwnPropertyNames(test1)[0] === '5') {
      return false;
    } // https://bugs.chromium.org/p/v8/issues/detail?id=3056


    var test2 = {};

    for (var i = 0; i < 10; i++) {
      test2['_' + String.fromCharCode(i)] = i;
    }

    var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
      return test2[n];
    });

    if (order2.join('') !== '0123456789') {
      return false;
    } // https://bugs.chromium.org/p/v8/issues/detail?id=3056


    var test3 = {};
    'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
      test3[letter] = letter;
    });

    if (Object.keys(Object.assign({}, test3)).join('') !== 'abcdefghijklmnopqrst') {
      return false;
    }

    return true;
  } catch (err) {
    // We don't expect any of the above to throw, but better to be safe.
    return false;
  }
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
  var from;
  var to = toObject(target);
  var symbols;

  for (var s = 1; s < arguments.length; s++) {
    from = Object(arguments[s]);

    for (var key in from) {
      if (hasOwnProperty.call(from, key)) {
        to[key] = from[key];
      }
    }

    if (getOwnPropertySymbols) {
      symbols = getOwnPropertySymbols(from);

      for (var i = 0; i < symbols.length; i++) {
        if (propIsEnumerable.call(from, symbols[i])) {
          to[symbols[i]] = from[symbols[i]];
        }
      }
    }
  }

  return to;
};
},{}],"../node_modules/node-libs-browser/node_modules/assert/node_modules/util/support/isBufferBrowser.js":[function(require,module,exports) {
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],"../node_modules/node-libs-browser/node_modules/inherits/inherits_browser.js":[function(require,module,exports) {
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],"../node_modules/process/browser.js":[function(require,module,exports) {

// shim for using process in browser
var process = module.exports = {}; // cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
  throw new Error('setTimeout has not been defined');
}

function defaultClearTimeout() {
  throw new Error('clearTimeout has not been defined');
}

(function () {
  try {
    if (typeof setTimeout === 'function') {
      cachedSetTimeout = setTimeout;
    } else {
      cachedSetTimeout = defaultSetTimout;
    }
  } catch (e) {
    cachedSetTimeout = defaultSetTimout;
  }

  try {
    if (typeof clearTimeout === 'function') {
      cachedClearTimeout = clearTimeout;
    } else {
      cachedClearTimeout = defaultClearTimeout;
    }
  } catch (e) {
    cachedClearTimeout = defaultClearTimeout;
  }
})();

function runTimeout(fun) {
  if (cachedSetTimeout === setTimeout) {
    //normal enviroments in sane situations
    return setTimeout(fun, 0);
  } // if setTimeout wasn't available but was latter defined


  if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
    cachedSetTimeout = setTimeout;
    return setTimeout(fun, 0);
  }

  try {
    // when when somebody has screwed with setTimeout but no I.E. maddness
    return cachedSetTimeout(fun, 0);
  } catch (e) {
    try {
      // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
      return cachedSetTimeout.call(null, fun, 0);
    } catch (e) {
      // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
      return cachedSetTimeout.call(this, fun, 0);
    }
  }
}

function runClearTimeout(marker) {
  if (cachedClearTimeout === clearTimeout) {
    //normal enviroments in sane situations
    return clearTimeout(marker);
  } // if clearTimeout wasn't available but was latter defined


  if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
    cachedClearTimeout = clearTimeout;
    return clearTimeout(marker);
  }

  try {
    // when when somebody has screwed with setTimeout but no I.E. maddness
    return cachedClearTimeout(marker);
  } catch (e) {
    try {
      // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
      return cachedClearTimeout.call(null, marker);
    } catch (e) {
      // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
      // Some versions of I.E. have different rules for clearTimeout vs setTimeout
      return cachedClearTimeout.call(this, marker);
    }
  }
}

var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
  if (!draining || !currentQueue) {
    return;
  }

  draining = false;

  if (currentQueue.length) {
    queue = currentQueue.concat(queue);
  } else {
    queueIndex = -1;
  }

  if (queue.length) {
    drainQueue();
  }
}

function drainQueue() {
  if (draining) {
    return;
  }

  var timeout = runTimeout(cleanUpNextTick);
  draining = true;
  var len = queue.length;

  while (len) {
    currentQueue = queue;
    queue = [];

    while (++queueIndex < len) {
      if (currentQueue) {
        currentQueue[queueIndex].run();
      }
    }

    queueIndex = -1;
    len = queue.length;
  }

  currentQueue = null;
  draining = false;
  runClearTimeout(timeout);
}

process.nextTick = function (fun) {
  var args = new Array(arguments.length - 1);

  if (arguments.length > 1) {
    for (var i = 1; i < arguments.length; i++) {
      args[i - 1] = arguments[i];
    }
  }

  queue.push(new Item(fun, args));

  if (queue.length === 1 && !draining) {
    runTimeout(drainQueue);
  }
}; // v8 likes predictible objects


function Item(fun, array) {
  this.fun = fun;
  this.array = array;
}

Item.prototype.run = function () {
  this.fun.apply(null, this.array);
};

process.title = 'browser';
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues

process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) {
  return [];
};

process.binding = function (name) {
  throw new Error('process.binding is not supported');
};

process.cwd = function () {
  return '/';
};

process.chdir = function (dir) {
  throw new Error('process.chdir is not supported');
};

process.umask = function () {
  return 0;
};
},{}],"../node_modules/node-libs-browser/node_modules/assert/node_modules/util/util.js":[function(require,module,exports) {
var global = arguments[3];
var process = require("process");
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
var formatRegExp = /%[sdj%]/g;

exports.format = function (f) {
  if (!isString(f)) {
    var objects = [];

    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }

    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function (x) {
    if (x === '%%') return '%';
    if (i >= len) return x;

    switch (x) {
      case '%s':
        return String(args[i++]);

      case '%d':
        return Number(args[i++]);

      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }

      default:
        return x;
    }
  });

  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }

  return str;
}; // Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.


exports.deprecate = function (fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function () {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;

  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }

      warned = true;
    }

    return fn.apply(this, arguments);
  }

  return deprecated;
};

var debugs = {};
var debugEnviron;

exports.debuglog = function (set) {
  if (isUndefined(debugEnviron)) debugEnviron = undefined || '';
  set = set.toUpperCase();

  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;

      debugs[set] = function () {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function () {};
    }
  }

  return debugs[set];
};
/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */

/* legacy: obj, showHidden, depth, colors*/


function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  }; // legacy...

  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];

  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  } // set default options


  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}

exports.inspect = inspect; // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics

inspect.colors = {
  'bold': [1, 22],
  'italic': [3, 23],
  'underline': [4, 24],
  'inverse': [7, 27],
  'white': [37, 39],
  'grey': [90, 39],
  'black': [30, 39],
  'blue': [34, 39],
  'cyan': [36, 39],
  'green': [32, 39],
  'magenta': [35, 39],
  'red': [31, 39],
  'yellow': [33, 39]
}; // Don't use 'blue' not visible on cmd.exe

inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};

function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str + '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}

function stylizeNoColor(str, styleType) {
  return str;
}

function arrayToHash(array) {
  var hash = {};
  array.forEach(function (val, idx) {
    hash[val] = true;
  });
  return hash;
}

function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect && value && isFunction(value.inspect) && // Filter out the util module, it's inspect function is special
  value.inspect !== exports.inspect && // Also filter out any prototype objects using the circular check.
  !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);

    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }

    return ret;
  } // Primitive types cannot have properties


  var primitive = formatPrimitive(ctx, value);

  if (primitive) {
    return primitive;
  } // Look up the keys of the object.


  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  } // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx


  if (isError(value) && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  } // Some type of object without properties can be shortcutted.


  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }

    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }

    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }

    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '',
      array = false,
      braces = ['{', '}']; // Make Array say that they are Array

  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  } // Make functions say that they are functions


  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  } // Make RegExps say that they are RegExps


  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  } // Make dates with properties first say the date


  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  } // Make error with message first say the error


  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);
  var output;

  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function (key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();
  return reduceToSingleString(output, base, braces);
}

function formatPrimitive(ctx, value) {
  if (isUndefined(value)) return ctx.stylize('undefined', 'undefined');

  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '').replace(/'/g, "\\'").replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }

  if (isNumber(value)) return ctx.stylize('' + value, 'number');
  if (isBoolean(value)) return ctx.stylize('' + value, 'boolean'); // For some reason typeof null is "object", so special case here.

  if (isNull(value)) return ctx.stylize('null', 'null');
}

function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}

function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];

  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, String(i), true));
    } else {
      output.push('');
    }
  }

  keys.forEach(function (key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, key, true));
    }
  });
  return output;
}

function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || {
    value: value[key]
  };

  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }

  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }

  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }

      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function (line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function (line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }

  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }

    name = JSON.stringify('' + key);

    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}

function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function (prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] + (base === '' ? '' : base + '\n ') + ' ' + output.join(',\n  ') + ' ' + braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
} // NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.


function isArray(ar) {
  return Array.isArray(ar);
}

exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}

exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}

exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}

exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}

exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}

exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}

exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}

exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}

exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}

exports.isDate = isDate;

function isError(e) {
  return isObject(e) && (objectToString(e) === '[object Error]' || e instanceof Error);
}

exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}

exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null || typeof arg === 'boolean' || typeof arg === 'number' || typeof arg === 'string' || typeof arg === 'symbol' || // ES6 symbol
  typeof arg === 'undefined';
}

exports.isPrimitive = isPrimitive;
exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; // 26 Feb 16:19:34

function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
} // log is just a thin wrapper to console.log that prepends a timestamp


exports.log = function () {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};
/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */


exports.inherits = require('inherits');

exports._extend = function (origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;
  var keys = Object.keys(add);
  var i = keys.length;

  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }

  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}
},{"./support/isBuffer":"../node_modules/node-libs-browser/node_modules/assert/node_modules/util/support/isBufferBrowser.js","inherits":"../node_modules/node-libs-browser/node_modules/inherits/inherits_browser.js","process":"../node_modules/process/browser.js"}],"../node_modules/node-libs-browser/node_modules/assert/assert.js":[function(require,module,exports) {
var global = arguments[3];
'use strict';

var objectAssign = require('object-assign');

// compare and isBuffer taken from https://github.com/feross/buffer/blob/680e9e5e488f22aac27599a57dc844a6315928dd/index.js
// original notice:

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
function compare(a, b) {
  if (a === b) {
    return 0;
  }

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }

  if (x < y) {
    return -1;
  }
  if (y < x) {
    return 1;
  }
  return 0;
}
function isBuffer(b) {
  if (global.Buffer && typeof global.Buffer.isBuffer === 'function') {
    return global.Buffer.isBuffer(b);
  }
  return !!(b != null && b._isBuffer);
}

// based on node assert, original notice:
// NB: The URL to the CommonJS spec is kept just for tradition.
//     node-assert has evolved a lot since then, both in API and behavior.

// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var util = require('util/');
var hasOwn = Object.prototype.hasOwnProperty;
var pSlice = Array.prototype.slice;
var functionsHaveNames = (function () {
  return function foo() {}.name === 'foo';
}());
function pToString (obj) {
  return Object.prototype.toString.call(obj);
}
function isView(arrbuf) {
  if (isBuffer(arrbuf)) {
    return false;
  }
  if (typeof global.ArrayBuffer !== 'function') {
    return false;
  }
  if (typeof ArrayBuffer.isView === 'function') {
    return ArrayBuffer.isView(arrbuf);
  }
  if (!arrbuf) {
    return false;
  }
  if (arrbuf instanceof DataView) {
    return true;
  }
  if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
    return true;
  }
  return false;
}
// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

var regex = /\s*function\s+([^\(\s]*)\s*/;
// based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
function getName(func) {
  if (!util.isFunction(func)) {
    return;
  }
  if (functionsHaveNames) {
    return func.name;
  }
  var str = func.toString();
  var match = str.match(regex);
  return match && match[1];
}
assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  } else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = getName(stackStartFunction);
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function truncate(s, n) {
  if (typeof s === 'string') {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}
function inspect(something) {
  if (functionsHaveNames || !util.isFunction(something)) {
    return util.inspect(something);
  }
  var rawname = getName(something);
  var name = rawname ? ': ' + rawname : '';
  return '[Function' +  name + ']';
}
function getMessage(self) {
  return truncate(inspect(self.actual), 128) + ' ' +
         self.operator + ' ' +
         truncate(inspect(self.expected), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'deepStrictEqual', assert.deepStrictEqual);
  }
};

function _deepEqual(actual, expected, strict, memos) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;
  } else if (isBuffer(actual) && isBuffer(expected)) {
    return compare(actual, expected) === 0;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if ((actual === null || typeof actual !== 'object') &&
             (expected === null || typeof expected !== 'object')) {
    return strict ? actual === expected : actual == expected;

  // If both values are instances of typed arrays, wrap their underlying
  // ArrayBuffers in a Buffer each to increase performance
  // This optimization requires the arrays to have the same type as checked by
  // Object.prototype.toString (aka pToString). Never perform binary
  // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
  // bit patterns are not identical.
  } else if (isView(actual) && isView(expected) &&
             pToString(actual) === pToString(expected) &&
             !(actual instanceof Float32Array ||
               actual instanceof Float64Array)) {
    return compare(new Uint8Array(actual.buffer),
                   new Uint8Array(expected.buffer)) === 0;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else if (isBuffer(actual) !== isBuffer(expected)) {
    return false;
  } else {
    memos = memos || {actual: [], expected: []};

    var actualIndex = memos.actual.indexOf(actual);
    if (actualIndex !== -1) {
      if (actualIndex === memos.expected.indexOf(expected)) {
        return true;
      }
    }

    memos.actual.push(actual);
    memos.expected.push(expected);

    return objEquiv(actual, expected, strict, memos);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b, strict, actualVisitedObjects) {
  if (a === null || a === undefined || b === null || b === undefined)
    return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b))
    return a === b;
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
    return false;
  var aIsArgs = isArguments(a);
  var bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b, strict);
  }
  var ka = objectKeys(a);
  var kb = objectKeys(b);
  var key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length !== kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] !== kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
      return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

assert.notDeepStrictEqual = notDeepStrictEqual;
function notDeepStrictEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
  }
}


// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  }

  try {
    if (actual instanceof expected) {
      return true;
    }
  } catch (e) {
    // Ignore.  The instanceof check doesn't work for arrow functions.
  }

  if (Error.isPrototypeOf(expected)) {
    return false;
  }

  return expected.call({}, actual) === true;
}

function _tryBlock(block) {
  var error;
  try {
    block();
  } catch (e) {
    error = e;
  }
  return error;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof block !== 'function') {
    throw new TypeError('"block" argument must be a function');
  }

  if (typeof expected === 'string') {
    message = expected;
    expected = null;
  }

  actual = _tryBlock(block);

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  var userProvidedMessage = typeof message === 'string';
  var isUnwantedException = !shouldThrow && util.isError(actual);
  var isUnexpectedException = !shouldThrow && actual && !expected;

  if ((isUnwantedException &&
      userProvidedMessage &&
      expectedException(actual, expected)) ||
      isUnexpectedException) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws(true, block, error, message);
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
  _throws(false, block, error, message);
};

assert.ifError = function(err) { if (err) throw err; };

// Expose a strict only variant of assert
function strict(value, message) {
  if (!value) fail(value, true, message, '==', strict);
}
assert.strict = objectAssign(strict, assert, {
  equal: assert.strictEqual,
  deepEqual: assert.deepStrictEqual,
  notEqual: assert.notStrictEqual,
  notDeepEqual: assert.notDeepStrictEqual
});
assert.strict.strict = assert.strict;

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"object-assign":"../node_modules/object-assign/index.js","util/":"../node_modules/node-libs-browser/node_modules/assert/node_modules/util/util.js"}],"constants.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.inf = void 0;
const inf = Math.pow(2, 32) - 1;
exports.inf = inf;
},{}],"fn/index.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CompositeFn = void 0;

var _assert = _interopRequireDefault(require("assert"));

var _constants = require("../constants");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class CompositeFn {
  constructor(fns) {
    this.fns = fns;

    this.sample = function* (n, offset, limit) {
      const {
        fns,
        d
      } = this;
      const [first, ...rest] = fns;
      if (fns.length == 0) return [];

      for (const x of first.sample(n, offset, limit)) {
        this.x.set(x);

        if (rest.length) {
          CompositeFn.apply(rest, this.x, this.y);
        } else {
          this.y.set(x);
        }

        yield this.y.subarray(0, d);
      }
    };

    this.fn = (x, y = new Float32Array(this.d)) => {
      const {
        fns,
        domain,
        d
      } = this;

      _assert.default.equal(x.length, domain);

      _assert.default.equal(y.length, d);

      this.x.set(x);
      CompositeFn.apply(fns, this.x, this.y);
      y.set(this.y.subarray(0, d));
      return y;
    };

    (0, _assert.default)(fns.length, 'fns cannot be empty');
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

exports.CompositeFn = CompositeFn;

CompositeFn.apply = (fns, x, y) => {
  _assert.default.equal(x.length, y.length);

  for (const f of fns) {
    f.fn(x.subarray(0, f.domain), y.subarray(0, f.d));

    for (let i = 0; i < y.length; i++) {
      if (!isFinite(y[i])) y[i] = Math.sign(y[i]) * _constants.inf;
      if (isNaN(y[i])) y[i] = 0;
    }

    x.set(y);
  }
};

CompositeFn.Builder = class {
  constructor() {
    this.fns = [];

    this.add = fn => {
      const {
        fns,
        last
      } = this;

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
},{"assert":"../node_modules/node-libs-browser/node_modules/assert/assert.js","../constants":"constants.ts"}],"fn/interval.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _assert = _interopRequireDefault(require("assert"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
      const {
        domain,
        d,
        a,
        b
      } = this;

      _assert.default.equal(x.length, domain);

      _assert.default.equal(y.length, d);

      for (let i = 0; i < d; i++) {
        y[i] = a[i] + x[i] * (b[i] - a[i]);
      }

      return y;
    };

    this.sample = function* (n, offset, limit) {
      const {
        d,
        fn
      } = this; // b needs to be an integer or the shape is distorted

      const b = Math.round(Math.pow(n, 1 / d));
      const x = new Float32Array(d);

      for (let i = offset; i < limit; i++) {
        for (let k = 0; k < d; k++) {
          const exp = d - k - 1;
          const n = Math.round(i / Math.pow(b, exp));
          x[k] = n % b / (b - 1);
        }

        yield fn(x);
      }
    };

    _assert.default.equal(a.length, d);

    _assert.default.equal(b.length, d);

    this.domain = d;
  }

}

exports.default = Interval;

Interval.nPerLevel = (d, n) => {
  return Math.round(Math.pow(n, 1 / d));
};
},{"assert":"../node_modules/node-libs-browser/node_modules/assert/assert.js"}],"fn/lattice.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _interval = _interopRequireDefault(require("./interval"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Lattice {
  constructor(d, l) {
    this.d = d;
    this.l = l;

    this.fn = (x, y) => this.interval.fn(x, y);

    this.interval = new _interval.default(d, new Array(d).fill(-l / 2), new Array(d).fill(l / 2));
    this.sample = this.interval.sample;
  }

  get domain() {
    return this.d;
  }

}

exports.default = Lattice;
},{"./interval":"fn/interval.ts"}],"fn/cube.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _assert = _interopRequireDefault(require("assert"));

var _lattice = _interopRequireDefault(require("./lattice"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Cube {
  constructor(d, l) {
    this.d = d;
    this.l = l;

    this.fn = (x, y = new Float32Array(this.d)) => {
      const {
        domain,
        d,
        l
      } = this;

      _assert.default.equal(x.length, domain);

      _assert.default.equal(y.length, d);

      for (let i = 0; i < d; i++) {
        y[i] = l * (x[i] - 0.5);
      }

      return y;
    };

    this.sample = function* (n, offset, limit) {
      // TODO: This algorithm produces lots of duplicate points.
      // It looks good enough, but could be better.
      const {
        d
      } = this;
      const scale = 1 / d / 2;
      const faceN = Math.round(n * scale);
      const faceOffset = Math.round(offset * scale);
      const faceSize = Math.round((limit - offset) * scale);
      let count = 0;

      for (let k = 0; k < d; k++) {
        for (const sign of [1, -1]) {
          const faceLimit = faceOffset + Math.min(faceSize, n - count);
          yield* this.sampleFace(k, sign, faceN, faceOffset, faceLimit);
          count += faceLimit - faceOffset;
        }
      }
    };

    this.sampleFace = function* (k, sign, n, offset, limit) {
      const {
        d,
        l
      } = this;
      const lattice = new _lattice.default(d - 1, l);
      const lhalf = l / 2;

      for (const y0 of lattice.sample(n, offset, limit)) {
        const y = new Float32Array(d);
        y.set(y0.subarray(0, k));
        y.set(y0.subarray(k), k + 1);
        y[k] = sign * lhalf;
        yield y;
      }
    };
  }

  get domain() {
    return this.d;
  }

}

exports.default = Cube;
},{"assert":"../node_modules/node-libs-browser/node_modules/assert/assert.js","./lattice":"fn/lattice.ts"}],"fn/polar.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Polar = void 0;

var _assert = _interopRequireDefault(require("assert"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Polar {
  static from(r, phi, y = new Float32Array(phi.length + 1)) {
    _assert.default.equal(y.length, phi.length + 1);

    y[0] = r;

    for (let i = 1; i < y.length; i++) {
      const sin = Math.sin(phi[i - 1]);
      const cos = Math.cos(phi[i - 1]);
      y[i] = y[0] * sin;
      y[0] *= cos;
    }

    return y;
  }

}

exports.Polar = Polar;
},{"assert":"../node_modules/node-libs-browser/node_modules/assert/assert.js"}],"fn/sphere.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _assert = _interopRequireDefault(require("assert"));

var _lattice = _interopRequireDefault(require("./lattice"));

var _polar = require("./polar");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Sphere {
  constructor(d, r) {
    this.d = d;
    this.r = r;

    this.sample = function* (n, offset, limit) {
      const lattice = new _lattice.default(this.domain, 2 * Math.PI);

      for (const phi of lattice.sample(n, offset, limit)) {
        yield this.fn(phi);
      }
    };

    this.fn = (phi, y = new Float32Array(this.d)) => {
      const {
        d,
        r
      } = this;

      _assert.default.equal(phi.length, d - 1);

      _assert.default.equal(y.length, d);

      return _polar.Polar.from(r, phi, y);
    };
  }

  get domain() {
    return this.d - 1;
  }

}

exports.default = Sphere;
},{"assert":"../node_modules/node-libs-browser/node_modules/assert/assert.js","./lattice":"fn/lattice.ts","./polar":"fn/polar.ts"}],"fn/fucked_up_torus.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _assert = _interopRequireDefault(require("assert"));

var _lattice = _interopRequireDefault(require("./lattice"));

var _sphere = _interopRequireDefault(require("./sphere"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
      const lattice = new _lattice.default(this.domain, 2 * Math.PI);

      for (const phi of lattice.sample(n, offset, limit)) {
        yield this.fn(phi);
      }
    };

    this.fn = (phi, y = new Float32Array(this.d)) => {
      const {
        domain,
        d,
        sphere,
        circle
      } = this;

      _assert.default.equal(phi.length, domain);

      _assert.default.equal(y.length, d);

      sphere.fn(phi, y);
      const q = circle.fn(phi.subarray(d - 2));
      y[0] += q[0];
      y[d - 1] += q[1];
      return y;
    };

    this.sphere = new _sphere.default(d, t);
    this.circle = new _sphere.default(2, r);
  }

  get domain() {
    return this.d - 1;
  }

}

exports.default = FuckedUpTorus;
},{"assert":"../node_modules/node-libs-browser/node_modules/assert/assert.js","./lattice":"fn/lattice.ts","./sphere":"fn/sphere.ts"}],"fn/rotator.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _assert = _interopRequireDefault(require("assert"));

var _lattice = _interopRequireDefault(require("./lattice"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Rotator {
  constructor(d, theta, d0, d1, f0 = Math.cos, f1 = Math.sin) {
    this.d = d;
    this.theta = theta;
    this.d0 = d0;
    this.d1 = d1;
    this.f0 = f0;
    this.f1 = f1;

    this.sample = function* (n, offset, limit) {
      const lattice = new _lattice.default(this.domain, 2);

      for (const p of lattice.sample(n, offset, limit)) {
        yield this.fn(p);
      }
    };

    this.fn = (x, y = new Float32Array(this.d)) => {
      const {
        d,
        d0,
        d1,
        r0,
        r1
      } = this;

      _assert.default.equal(x.length, d);

      _assert.default.equal(y.length, d);

      y.set(x);
      const a = x[d0],
            b = x[d1];
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

exports.default = Rotator;
},{"assert":"../node_modules/node-libs-browser/node_modules/assert/assert.js","./lattice":"fn/lattice.ts"}],"fn/spiral.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _assert = _interopRequireDefault(require("assert"));

var _interval = _interopRequireDefault(require("./interval"));

var _polar = require("./polar");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Spiral {
  constructor(
  /**
   * The dimension of the spiral.
   */
  d,
  /**
   * The extent of curl of the spiral, i.e. the max angle.
   */
  theta,
  /**
   * The factor by which the radius increases in each dimension.
   */
  a) {
    this.d = d;
    this.theta = theta;
    this.a = a;

    this.sample = function* (n, offset, limit) {
      const interval = new _interval.default(this.domain, new Array(this.domain).fill(0), new Array(this.domain).fill(1));

      for (const x of interval.sample(n, offset, limit)) {
        yield this.fn(x);
      }
    };

    this.fn = (x, y = new Float32Array(this.d)) => {
      const {
        domain,
        d,
        theta,
        a
      } = this;

      _assert.default.equal(x.length, domain);

      _assert.default.equal(y.length, d);

      const phi = x.map(xi => xi * theta);

      _polar.Polar.from(1, phi, y);

      y[0] *= a[0] * phi[0];

      for (let i = 1; i < d; i++) {
        y[i] *= a[i] * phi[i - 1];
      }

      return y;
    };

    _assert.default.equal(a.length, d, `spiral: Expected a to be of dimension ${d}, but was ${a.length}`);
  }

  get domain() {
    return this.d - 1;
  }

}

exports.default = Spiral;
},{"assert":"../node_modules/node-libs-browser/node_modules/assert/assert.js","./interval":"fn/interval.ts","./polar":"fn/polar.ts"}],"fn/stereo.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _assert = _interopRequireDefault(require("assert"));

var _lattice = _interopRequireDefault(require("./lattice"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Stereo {
  constructor(from, to) {
    this.from = from;
    this.to = to;

    this.sample = function* (n, offset, limit) {
      const lattice = new _lattice.default(this.domain, 2);

      for (const phi of lattice.sample(n, offset, limit)) {
        yield this.fn(phi);
      }
    };

    this.fn = (x, y = new Float32Array(this.to)) => {
      let {
        from,
        to,
        fromTemp,
        toTemp
      } = this;

      _assert.default.equal(x.length, from);

      _assert.default.equal(y.length, to);

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

exports.default = Stereo;

Stereo.up = (x, temp) => {
  _assert.default.equal(temp.length, x.length + 1);

  const n2 = norm2(x);
  const divisor = n2 + 1;
  temp[0] = (n2 - 1) / divisor;

  for (let i = 1; i <= x.length; i++) {
    temp[i] = 2 * x[i - 1] / divisor;
  }
};

Stereo.down = (x, temp) => {
  _assert.default.equal(temp.length, x.length - 1);

  for (let i = 0; i < temp.length; i++) {
    temp[i] = x[i + 1] / (1 - x[0]);
  }
};

const norm2 = x => {
  let result = 0;

  for (let i = 0; i < x.length; i++) {
    result += x[i] * x[i];
  }

  return result;
};
},{"assert":"../node_modules/node-libs-browser/node_modules/assert/assert.js","./lattice":"fn/lattice.ts"}],"fn/torus.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _assert = _interopRequireDefault(require("assert"));

var _lattice = _interopRequireDefault(require("./lattice"));

var _rotator = _interopRequireDefault(require("./rotator"));

var _sphere = _interopRequireDefault(require("./sphere"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Torus {
  constructor(d, r) {
    this.d = d;
    this.r = r;

    this.sample = function* (n, offset, limit) {
      const lattice = new _lattice.default(this.domain, 2 * Math.PI);

      for (const phi of lattice.sample(n, offset, limit)) {
        yield this.fn(phi);
      }
    };

    this.fn = (theta, y = new Float32Array(this.d)) => {
      const {
        d,
        domain,
        r
      } = this;
      const circle = new _sphere.default(2, r[0]);
      circle.fn(theta.subarray(0, 1), y.subarray(0, 2));

      for (let i = 1; i < domain; i++) {
        y[0] += r[i];
        const rotator = new _rotator.default(d, theta[i], i - 1, i + 1);
        rotator.fn(y, y);
      }

      return y;
    };

    (0, _assert.default)(d > 2, `torus: expected d = ${d} > 2`);
    (0, _assert.default)(r.length == this.domain, `torus: expected r.length = ${r.length} == ${this.domain}`);
  }

  get domain() {
    return this.d - 1;
  }

}

exports.default = Torus;
},{"assert":"../node_modules/node-libs-browser/node_modules/assert/assert.js","./lattice":"fn/lattice.ts","./rotator":"fn/rotator.ts","./sphere":"fn/sphere.ts"}],"pp.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.pp = void 0;

const pp = (a, p = 2) => JSON.stringify(a, null, p);

exports.pp = pp;
},{}],"pipe/resolver.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Resolver = void 0;

var _fn = require("../fn");

var _cube = _interopRequireDefault(require("../fn/cube"));

var _fucked_up_torus = _interopRequireDefault(require("../fn/fucked_up_torus"));

var _lattice = _interopRequireDefault(require("../fn/lattice"));

var _rotator = _interopRequireDefault(require("../fn/rotator"));

var _sphere = _interopRequireDefault(require("../fn/sphere"));

var _spiral = _interopRequireDefault(require("../fn/spiral"));

var _stereo = _interopRequireDefault(require("../fn/stereo"));

var _torus = _interopRequireDefault(require("../fn/torus"));

var _pp = require("../pp");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function assert(cond, scope, msg) {
  if (!cond) throw {
    message: msg(),
    scope
  };
}

class Resolver {
  constructor(scope) {
    this.scope = scope;

    this.resolvePipe = pipe => {
      const [head, ...tail] = pipe.steps;
      const n = this.resolve(pipe.n, 'number');
      this.expect(n > 0, 'n', 'be positive', `was ${n}`);
      const fn = new _fn.CompositeFn.Builder().add(this.resolveStep(pipe.d0, head));

      for (let i = 0; i < tail.length; i++) {
        const step = tail[i];
        const d0 = fn.d;
        const d = ranges[step.type](d0);
        fn.add(this.resolveStep(d, step));
      }

      return {
        n,
        fn: fn.build()
      };
    };

    this.resolveStep = (d, {
      type,
      args
    }) => {
      return funs[type](d, ...args.map(a => this.resolve(a)));
    };

    this.resolveFn = ({
      name,
      args
    }) => {
      const fn = Math[name];
      const type = typeof fn;
      this.expect(type === 'function', name, `resolve to a function`, `was ${type}`);
      return fn(...args.map(a => this.resolve(a)));
    };

    this.resolveAccess = ({
      id,
      index
    }) => {
      const scope = this.scope;
      const target = scope[id];
      this.assert(target, () => `failed to resolve access target ${id}`);

      if (index.kind === 'id' && index.id in target) {
        // TODO works in practice, but not sure if corret
        return target[index.id];
      } else {
        return target[this.resolve(index)];
      }
    };

    this.resolveId = id => {
      let value;

      if (id in this.scope) {
        value = this.scope[id];
      } else if (id in Math) {
        value = Math[id];
      } else {
        const idu = id.toUpperCase();
        if (idu in Math) value = Math[idu];
      }

      this.assert(value, () => `failed to resolve id ${id}`);
      return value;
    };

    this.resolveArith = ({
      op,
      operands
    }) => {
      const [a, b] = operands.map(a => this.resolve(a, 'number'));
      return ops[op](a, b);
    };

    this.isNodeDynamic = node => {
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
    this.assert(cond, () => `Expected ${(0, _pp.pp)(node, 0)} to ${expected}, but ${actual}`);
  }

}

exports.Resolver = Resolver;
const ops = {
  '+': (a, b) => a + b,
  '-': (a, b) => b == null ? -a : a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
  '**': (a, b) => Math.pow(a, b),
  '^': (a, b) => Math.pow(a, b)
};
const funs = {
  cube: (d, l) => new _cube.default(d, l),
  lattice: (d, l) => new _lattice.default(d, l),
  sphere: (d, r) => new _sphere.default(d, r),
  spiral: (d, theta, ...a) => new _spiral.default(d, theta, a),
  torus: (d, ...r) => new _torus.default(d, new Float32Array(r)),
  fucked_up_torus: (d, r, t) => new _fucked_up_torus.default(d, r, t),
  rotate: (d, theta, d0, d1, f0 = Math.cos, f1 = Math.sin) => {
    assert(0 <= d0 && d0 < d, null, () => `rotate: Expected 0 <= d0 = ${d0} < d = ${d}`);
    assert(0 <= d1 && d1 < d, null, () => `rotate: Expected 0 <= d1 = ${d1} < d = ${d}`);
    return new _rotator.default(d, theta, d0, d1, f0, f1);
  },
  stereo: (d, to) => new _stereo.default(d, to)
};
const ranges = {
  cube: domain => domain,
  lattice: domain => domain,
  sphere: domain => domain + 1,
  spiral: domain => domain + 1,
  torus: domain => domain + 1,
  fucked_up_torus: domain => domain + 1,
  rotate: domain => domain,
  r: domain => domain,
  stereo: domain => domain
};
},{"../fn":"fn/index.ts","../fn/cube":"fn/cube.ts","../fn/fucked_up_torus":"fn/fucked_up_torus.ts","../fn/lattice":"fn/lattice.ts","../fn/rotator":"fn/rotator.ts","../fn/sphere":"fn/sphere.ts","../fn/spiral":"fn/spiral.ts","../fn/stereo":"fn/stereo.ts","../fn/torus":"fn/torus.ts","../pp":"pp.ts"}],"pipe/evaluator.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Evaluator = exports.EvaluationError = void 0;

var _assert = _interopRequireDefault(require("assert"));

var _resolver = require("./resolver");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const {
  abs,
  min,
  sign
} = Math;

class EvaluationError extends Error {
  constructor(context, cause) {
    var _a;

    super((_a = cause) === null || _a === void 0 ? void 0 : _a.message);
    this.context = context;
    this.cause = cause;
  }

  get name() {
    return 'EvaluationError';
  }

}

exports.EvaluationError = EvaluationError;

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
      const {
        fn,
        n,
        d,
        offset,
        size
      } = this;
      const position = new Float32Array(d * size);
      let i = 0;

      for (const y of fn.sample(n, offset, offset + size)) {
        position.set(y, d * i++);
      }

      return position;
    };

    this.computeColor = position => {
      const {
        d,
        hsv,
        size
      } = this;
      const color = new Float32Array(3 * size);
      const {
        extent
      } = this.scope;

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

    this.resolver = new _resolver.Resolver(scope);
    const {
      n,
      fn
    } = this.resolvePipe(ast);
    const offset = chunk.offset;
    const size = chunk.size;
    const limit = offset + size;
    (0, _assert.default)(offset >= 0, `offset must be non-negative; got ${offset}`);
    (0, _assert.default)(limit <= n, `offset + size must be <= n; got ${offset} + ${size} = ${limit} > ${n}`);
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
    } catch ({
      message,
      scope
    }) {
      throw {
        context: 'pipe',
        message,
        scope
      };
    }
  }

  resolveNumber(context, node) {
    try {
      return this.resolver.resolve(node, 'number');
    } catch ({
      message,
      scope
    }) {
      throw {
        context,
        message,
        scope
      };
    }
  }

}

exports.Evaluator = Evaluator;

function hsv2rgb(h, s, v) {
  // source: https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_RGB
  h = Math.max(0, Math.min(360, h));
  s = Math.max(0, Math.min(1, s));
  v = Math.max(0, Math.min(1, v));
  const hprime = h / 60;
  const c = v * s;
  const x = c * (1 - abs(hprime % 2 - 1));
  const m = v - c;
  let rgb;

  if (hprime <= 1) {
    rgb = [c, x, 0];
  } else if (hprime <= 2) {
    rgb = [x, c, 0];
  } else if (hprime <= 3) {
    rgb = [0, c, x];
  } else if (hprime <= 4) {
    rgb = [0, x, c];
  } else if (hprime <= 5) {
    rgb = [x, 0, c];
  } else if (hprime <= 6) {
    rgb = [c, 0, x];
  } else {
    rgb = [0, 0, 0];
  }

  rgb.forEach((vi, i) => rgb[i] = vi + m);
  return rgb;
}
},{"assert":"../node_modules/node-libs-browser/node_modules/assert/assert.js","./resolver":"pipe/resolver.ts"}],"pipe/worker.ts":[function(require,module,exports) {
"use strict";

var _comlink = require("comlink");

var _evaluator = require("./evaluator");

const worker = {
  iterate: (params, chunk) => {
    const evaluator = new _evaluator.Evaluator(params.scope, params.pipe, params.hsv, chunk);
    return evaluator.iterate();
  }
};
(0, _comlink.expose)(worker);
},{"comlink":"../node_modules/comlink/dist/esm/comlink.mjs","./evaluator":"pipe/evaluator.ts"}],"../node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "53785" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../node_modules/parcel-bundler/src/builtins/hmr-runtime.js","pipe/worker.ts"], null)
//# sourceMappingURL=worker.a6ec0002.js.map