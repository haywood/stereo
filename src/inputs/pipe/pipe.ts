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
    const pipe = ast.pipe({ n: ast.number(screenSize), d0: ast.number(4) }, []);
    const { steps, variables } = pipe;

    for (const node of this.values) {
      if (node instanceof ast.AssignmentNode) {
        variables[node.name] = node.value;
      } else if (node instanceof ast.StepNode) {
        steps.push(node);
      }
    }

    steps[0]?.args.unshift(pipe.variables.d0);

    for (let i = 1; i < steps.length; i++) {
      const rangeFn = rangeFns[steps[i].type];
      const d0 = steps[i - 1].args[0] as ast.NumberNode;
      steps[i].args.unshift(ast.number(d0.value));
    }

    return pipe;
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
