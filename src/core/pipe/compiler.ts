import { Scope, CompiledAST, NormalizedParams } from './types';
import { pp } from '../pp';
import { getLogger } from 'loglevel';
import { Resolver } from './resolver';
import { Simplifier } from './simplifier';
import { Parser } from './parser';

const logger = getLogger('Compiler');
logger.setDefaultLevel('info');

export class Compiler {
    constructor(private readonly scope: Scope) { }

    compile = (params: NormalizedParams): CompiledAST => {
        const ast = Parser.parsePipe(params.pipe);
        logger.debug(`parsed params into ast ${pp(ast)}`);
        const substitutions = {
            theta: Parser.parseArith(params.theta),
        };
        const simplifier = new Simplifier(substitutions);
        const resolver = new Resolver(this.scope);
        return resolver.resolve(simplifier.simplify(ast));
    };
}
