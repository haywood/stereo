import { Scope, CompiledAST, NormalizedParams } from './types';
import { pp } from '../pp';
import { getLogger } from 'loglevel';
import { Resolver } from './resolver';
import { Simplifier } from './simplifier';
import { Parser } from './parser';
import { PipeNode, ArithNode } from './ast';

const logger = getLogger('Compiler');
logger.setDefaultLevel('info');

export class Compiler {
    private readonly simplifier: Simplifier;

    constructor(params: NormalizedParams) {
        this.simplifier = new Simplifier({
            theta: Parser.parseArith(params.theta),
        });
    }

    compilePipe = (expr: string): PipeNode => {
        const ast = Parser.parsePipe(expr);
        logger.debug(`parsed ${expr} into ast ${pp(ast)}`);
        return this.simplifier.simplify(ast);
    };

    compileArith = (expr: string): ArithNode => {
        const ast = Parser.parseArith(expr);
        return this.simplifier.simplifyArithNode(ast);
    };
}
