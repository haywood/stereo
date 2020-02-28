import { PipeNode, Scalar } from './grammar.pegjs';
import { Parser } from './parser';

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
    let d = pipe.d0;

    head.args.unshift({ kind: 'number', value: d });
    for (const { type, args } of rest) {
      d = ranges[type](d);
      args.unshift({ kind: 'number', value: d });
    }

    return pipe;
  };

  private compileScalar = (expr: string): Scalar => {
    return Parser.parseScalar(expr);
  };
}

const ranges = {
  cube: domain => domain,
  lattice: domain => domain,
  sphere: domain => domain + 1,
  spiral: domain => domain + 1,
  torus: domain => domain + 1,
  fucked_up_torus: domain => domain + 1,
  rotate: domain => domain,
  r: domain => domain,
  stereo: domain => domain,
  quaternion: domain => domain
};
