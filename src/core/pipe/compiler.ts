import { parse, ASTNode } from 'pegjs-loader?allowedStartRules[]=pipe,allowedStartRules[]=arith!./grammar.pegjs';
import { Params, Scope, SimplifiedFunctionCall, SimplifiedAST, Value } from './types';
import assert from 'assert';
import { pp } from '../pp';
import * as math from 'mathjs';
import { getLogger } from 'loglevel';

const logger = getLogger('Compiler');
logger.setDefaultLevel('info');

const loggingParse: typeof parse = (expr, options) => {
    try {
        const node = parse(expr, options);
        logger.debug(`parsed ${expr} into node ${pp(node)}`);
        return node;
    } catch (err) {
        logger.error(`error parsing ${expr} at ${pp(err.location)}: ${err.message}`);
        throw err;
    }
};

export class Compiler {
    constructor(private readonly scope: Scope) { }

    compile = (params: Params): SimplifiedAST => {
        const theta = loggingParse(params.theta, { startRule: 'arith' });
        const ast = loggingParse(params.pipe, {
            substitutions: {
                theta,
            },
        });
        const pipe = this.compilePipe(ast);
        logger.debug(`parsed params into simplified ast ${pp(pipe)}`);
        return pipe;
    };

    compilePipe = (pipe: ASTNode): SimplifiedAST => {
        const n = assertNumberInNode('n', pipe);
        const chain = assertDefInNode('chain', pipe);

        return {
            n,
            chain: chain.map(this.compileFun),
        };
    };

    compileFun = (fun: ASTNode): SimplifiedFunctionCall => {
        const fn = assertDefInNode('fn', fun);
        const args = assertDefInNode('args', fun);

        return {
            fn,
            args: args.map(this.compileFunArg),
            isTemporal: args.some(isTemporal),
        };
    };

    compileFunArg = (arg: ASTNode): Value => {
        if (arg.id) {
            return this.compileVar(arg);
        } else {
            return this.compileArith(arg);
        }
    };

    compileArith = (arith: ASTNode): number => {
        if (arith.op != null) {
            const op = ops[arith.op];
            const [a, b] = assertDefInNode('operands', arith);
            return op(this.compileArith(a), this.compileArith(b));
        } else {
            return this.compileNumericScalar(arith);
        }
    };

    compileVar = (node: ASTNode): Value => {
        const id = node.id;
        if (id in Math && typeof Math[id] === 'function') {
            return Math[id];
        } else if (node.sub != null) {
            return this.compileArith(node.sub);
        } else {
            assert.fail(`don't know how to handle var node ${pp(node)}`);
        }
    };

    compileNumericScalar = (scalar: ASTNode): number => {
        if (scalar.value != null) {
            return scalar.value;
        } else if (scalar.sub) {
            return this.compileArith(scalar.sub);
        } else if (scalar.id) {
            const result = math.evaluate(scalar.id, this.scope);
            assert.equal(typeof result, 'number', `Expected evaluation of ${pp(scalar.id)} to produce a number`);
            return result;
        } else {
            assert.fail(`don't know how to handle numeric scalar ${pp(scalar)}`);
        }
    };

    compileScalar = (scalar: ASTNode): Value => {
        const id = scalar.id;
        if (id in Math && typeof Math[id] === 'function') {
            return Math[id] as number;
        } else {
            return this.compileNumericScalar(scalar);
        }
    };
}

const assertDefInNode = (name: string, node: ASTNode) => {
    const x = node[name];
    assertCondInNode(x != null, name, 'to be defined', node);
    return x;
};

const assertNumberInNode = (name: string, node: ASTNode): number => {
    const x = node[name];
    assertCondInNode(typeof x === 'number', name, 'a number', node);
    return x as number;
};

const assertCondInNode = (cond: boolean, name: string, expected: string, node: ASTNode) => {
    assert(cond, `Expected ${name} to be ${expected} in ${pp(node)}`);
};

const isTemporal = (node: ASTNode): boolean => {
    if (node.id === 't') return true;
    else if (node.args) return node.args.some(isTemporal);
    else if (node.operands) return node.operands.some(isTemporal);
    else if (node.sub) return isTemporal(node.sub);
    else return false;
};

const ops: {
    [op: string]: (a: number, b: number) => number;
} = {
    '+': (a, b) => a + b,
    '-': (a, b) => a - b,
    '*': (a, b) => a * b,
    '/': (a, b) => a / b,
    '**': (a, b) => a ** b,
    '^': (a, b) => a ** b,
};
