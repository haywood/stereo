import { Scope } from '../../core/pipe/types';
import { Compiler } from '../../core/pipe/compiler';
import { inf } from '../../core/constants';
import { expose } from 'threads';
import { Options } from './options';

expose((options: Options) => {
  const compiler = new Compiler({ theta: options.theta });
  const pipe = compiler.compile(options.pipe);
  const scope: Scope = { t: options.t, inf, n: pipe.n, ...options.audio };
  return {
    pipe,
    scope,
    hv: {
      h: compiler.compile(options.h, 'scalar'),
      v: compiler.compile(options.v, 'scalar'),
    },
  };
});
