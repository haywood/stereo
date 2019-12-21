import { parse } from './grammar.pegjs';
import { Scope, CompiledAST, NormalizedParams } from './types';
import { pp } from '../pp';
import { getLogger } from 'loglevel';
import { Resolver } from './resolver';
import { Simplifier } from './simplifier';

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

    compile = (params: NormalizedParams): CompiledAST => {
        const ast = loggingParse(params.pipe);
        logger.debug(`parsed params into ast ${pp(ast)}`);
        const substitutions = {
            theta: this.parseArith(params.theta),
        };
        const simplifier = new Simplifier(this.scope, substitutions);
        const resolver = new Resolver(this.scope);
        return resolver.resolve(simplifier.simplify(ast));
    };

    private parseArith = (expr: string) => {
        return loggingParse(expr, { startRule: 'arith' });
    };
}
