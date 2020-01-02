import * as math from 'mathjs';
import { getLogger } from 'loglevel';
import { Params, Scope, NormalizedParams, CompiledAST, HV, Chunk } from './types';
import { Compiler } from './compiler';
import { Evaluator } from './evaluator';
import { Parser } from './parser';

const logger = getLogger('Pipe');
logger.setLevel('info');

export class Pipe {
    static compile = (params: Params): CompiledAST => {
        return Pipe.compileNormal(Pipe.normalized(params));
    };
    static evaluatorFor = (params: Params, chunk?: Chunk) => {
        return Pipe.evaluatorForNormal(Pipe.normalized(params), chunk);
    };

    private static evaluatorForNormal = (params: NormalizedParams, chunk?: Chunk) => {
        const ast = Pipe.compileNormal(params);
        const { power, t, chroma } = params;
        const scope = { t, power, chroma, n: ast.n };
        const hv = Pipe.compileHV(params);
        return new Evaluator(scope, ast, hv, chunk);
    };

    private static compileNormal = (params: NormalizedParams): CompiledAST => {
        const { power, chroma, t } = params;
        return new Compiler({ t, power, chroma }).compile(params);

    };

    private static normalized = (params: Params): NormalizedParams => {
        return {
            pipe: params.pipe,
            theta: params.theta || 't',
            h: params.h || '1',
            v: params.v || '0.5',
            t: params.t || 0,
            power: params.power || 0,
            chroma: params.chroma || 0,
        };
    };

    private static compileHV = (params: NormalizedParams): HV => {
        // TODO refactor to simplify the parsed ast
        return {
            h: Parser.parseArith(`359 * (${params.h})`),
            v: Parser.parseArith(`100 * (${params.v})`),
        };
    };
}
