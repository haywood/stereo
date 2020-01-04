import { getLogger } from 'loglevel';
import { Params, NormalizedParams, HV, Chunk } from './types';
import { Compiler } from './compiler';
import { Evaluator } from './evaluator';
import { PipeNode } from './ast';
import { inf } from '../constants';

const logger = getLogger('Pipe');
logger.setLevel('info');

export class Pipe {
  static compile = (params: Params): PipeNode => {
    return new Compiler(Pipe.normalized(params)).compilePipe(params.pipe);
  };

  static evaluatorFor = (params: Params, chunk?: Chunk) => {
    return Pipe.evaluatorForNormal(Pipe.normalized(params), chunk);
  };

  static scopeFor = (params: Params, n: number) => {
    return Pipe.scopeForNormal(Pipe.normalized(params), n);
  };

  private static evaluatorForNormal = (
    params: NormalizedParams,
    chunk?: Chunk,
  ) => {
    const compiler = new Compiler(params);
    const ast = compiler.compilePipe(params.pipe);
    const hv = Pipe.compileHV(params, compiler);
    return new Evaluator(Pipe.scopeForNormal(params, ast.n), ast, hv, chunk);
  };

  private static normalized = (params: Params): NormalizedParams => {
    return {
      pipe: params.pipe,
      theta: params.theta || 't',
      h: params.h || '1',
      v: params.v || '0.5',
      t: params.t || 0,
      power: params.power || 0,
      chroma: params.chroma || 0,
    };
  };

  private static scopeForNormal = (params: NormalizedParams, n: number) => {
    const { power, t, chroma } = params;
    return { t, power, chroma, n, inf };
  };

  private static compileHV = (
    params: NormalizedParams,
    compiler: Compiler,
  ): HV => {
    return {
      h: compiler.compileArith(`359 * (${params.h})`),
      v: compiler.compileArith(`100 * (${params.v})`),
    };
  };
}
