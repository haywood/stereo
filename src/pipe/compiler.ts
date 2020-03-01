import { PipeNode, Scalar, StepType } from './ast';
import { Parser } from './parser';
import assert from 'assert';

export class Compiler {
  constructor() {}

  compile(expr: string): PipeNode;
  compile(expr: string, startRule: 'scalar'): Scalar;
  compile(expr: string, startRule?: string): any {
    switch (startRule) {
      default:
        return this.compilePipe(expr);
      case 'scalar':
        return this.compileScalar(expr);
    }
  }

  private compilePipe = (expr: string): PipeNode => {
    const pipe = Parser.parsePipe(expr);
    const [head, ...rest] = pipe.steps;
    let d = pipe.variables.d0.value;

    head.args.unshift({ kind: 'number', value: d });
    for (const { type, args } of rest) {
      const rangeFn = ranges[type];
      assert(rangeFn, `No rangeFn found for step type ${type}`);
      d = rangeFn(d);
      args.unshift({ kind: 'number', value: d });
    }

    return pipe;
  };

  private compileScalar = (expr: string): Scalar => {
    return Parser.parseScalar(expr);
  };
}

const ranges = {
  [StepType.CUBE]: domain => domain,
  [StepType.LATTICE]: domain => domain,
  [StepType.SPHERE]: domain => domain + 1,
  [StepType.SPIRAL]: domain => domain + 1,
  [StepType.TORUS]: domain => domain + 1,
  [StepType.ROTATE]: domain => domain,
  [StepType.STEREO]: domain => domain,
  [StepType.QUATERNION]: domain => domain
};
