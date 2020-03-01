import { PipeNode, Scalar, StepType } from './ast';
import { Parser } from './parser';
import assert from 'assert';
const {
  CUBE,
  LATTICE,
  QUATERNION,
  ROTATE,
  SPHERE,
  SPIRAL,
  STEREO,
  TORUS
} = StepType;

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
      const rangeFn = rangeFns[type];
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

type RangeFn = (domain: number) => number;

const rangeFns: Record<StepType, RangeFn> = {
  [CUBE]: domain => domain,
  [LATTICE]: domain => domain,
  [SPHERE]: domain => domain + 1,
  [SPIRAL]: domain => domain + 1,
  [TORUS]: domain => domain + 1,
  [ROTATE]: domain => domain,
  [STEREO]: domain => domain,
  [QUATERNION]: domain => domain
};
