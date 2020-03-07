import * as ast from './ast';
import { Context } from './context';
import { NonTerminal } from './non_terminal';
import { Statement } from './statement';
const {
  CUBE,
  LATTICE,
  QUATERNION,
  ROTATE,
  SPHERE,
  SPIRAL,
  STEREO,
  TORUS
} = ast.StepType;

const screenSize = Math.round(window.screen.width * window.screen.height);

export class Pipe extends NonTerminal {
  apply(stream, ctx: Context) {
    if (Statement.peek(stream)) {
      ctx.enqueue(new Statement());
    }
  }

  protected _evaluate() {
    return ast.pipe(this.values);
  }

  protected newCopy() {
    return new Pipe();
  }
}

type RangeFn = (domain: number) => number;

const rangeFns: Record<ast.StepType, RangeFn> = {
  [CUBE]: domain => domain,
  [LATTICE]: domain => domain,
  [SPHERE]: domain => domain + 1,
  [SPIRAL]: domain => domain + 1,
  [TORUS]: domain => domain + 1,
  [ROTATE]: domain => domain,
  [STEREO]: domain => domain,
  [QUATERNION]: domain => domain
};
