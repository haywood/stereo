import { parse, AST, FunctionCall, Arithmetic, Scalar, Value, Arg } from 'pegjs-loader?allowedStartRules[]=pipe,allowedStartRules[]=arithmetic!./grammar.pegjs';
import { Params, Scope, SimplifiedFunctionCall, SimplifiedAST } from './types';
import assert from 'assert';
import { pp } from '../pp';
import * as math from 'mathjs';

const assertNumber = (x: any): number => {
    assert.equal(typeof x, 'number', `Expected ${pp(x)} to be a number.`);
    return x as number;
};

export class Compiler {
    constructor(private readonly scope: Scope) { }

    compile = (params: Params): SimplifiedAST => {
        const theta = parse(params.theta, { startRule: 'arithmetic' });
        const ast = parse(params.pipe, {
            startRule: 'pipe',
            substitutions: {
                theta,
            },
        });
        return this.simplify(ast);
    };

    simplify = (ast: AST): SimplifiedAST => {
        return {
            n: ast.n,
            chain: ast.chain.map(this.simplifyFunctionCall),
        };
    };

    simplifyFunctionCall = (fc: FunctionCall): SimplifiedFunctionCall => {
        return {
            op: fc.op,
            args: fc.args.map(this.simplifyArg),
            isTemporal: fc.args.some(this.isTemporalArg),
        };
    };

    isTemporalArg = (a: Arg) => {
        const { scalar, arithmetic } = a;
        if (scalar) {
            return this.isTemporalScalar(scalar);
        } else if (arithmetic) {
            return this.isTemporalArithmetic(arithmetic);
        } else {
            return false;
        }
    };

    isTemporalScalar = (s: Scalar) => s.id === 't';

    isTemporalArithmetic = (a: Arithmetic) => {
        const { args, scalar } = a;
        if (scalar) return this.isTemporalScalar(scalar);
        else if (args) return args.some(this.isTemporalArg);
        else return false;
    };

    simplifyArg = (fa: Arg): Value => {
        const { scalar, arithmetic } = fa;
        if (scalar) {
            return this.simplifyScalar(scalar);
        } else if (arithmetic) {
            return this.simplifyArithmetic(arithmetic);
        } else {
            this.fail('arg', fa);
        }
    };

    simplifyArithmetic = (a: Arithmetic): number => {
        const { op, args, scalar } = a;
        if (op) {
            assert.equal(args.length, 2,
                `All arithmetic operators are binary, but found ${args.length} args were found in node ${pp(a)}`);
            assert(arithmeticOps[op], `arithmetic op ${op} not found`);
            const x = assertNumber(this.simplifyArg(args[0]));
            const y = assertNumber(this.simplifyArg(args[1]));
            return arithmeticOps[op](x, y);
        } else if (scalar) {
            return this.simplifyNumericScalar(scalar);
        } else {
            this.fail('arithmetic', a);
        }
    };

    simplifyNumericScalar = (s: Scalar): number => {
        let value = s.value;
        if (value == null && s.id) {
            value = math.evaluate(s.id, this.scope);
        }
        return assertNumber(value);
    };

    simplifyScalar = (s: Scalar): Value => {
        const { id, value } = s;
        if (id in Math) {
            return (theta: number) => Math[id](theta);
        } else if (id || value) {
            return this.simplifyNumericScalar(s);
        } else {
            this.fail('scalar', s);
        }
    };

    fail = (type: string, node: any) => {
        assert.fail(`Don't know how to handle ${type} node ${pp(node)}`);
    };
}

const arithmeticOps: {
    [op: string]: (a: number, b: number) => number;
} = {
    '+': (a, b) => a + b,
    '-': (a, b) => a - b,
    '*': (a, b) => a * b,
    '/': (a, b) => a / b,
    '**': (a, b) => a ** b,
};
