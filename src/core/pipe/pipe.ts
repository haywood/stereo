import * as math from 'mathjs';
import { getLogger } from 'loglevel';
import { Params, Scope, NormalizedParams, CompiledAST, HV, Chunk } from './types';
import { Compiler } from './compiler';
import { Evaluator } from './evaluator';

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
        const scope = Pipe.finalScope(params, ast);
        const hl = Pipe.compileHL(params);
        return new Evaluator(scope, ast, hl, chunk);
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

    private static finalScope = (params: NormalizedParams, ast: CompiledAST): Scope => {
        const { power, t, chroma } = params;
        const scope: Scope = { t, power, chroma, n: ast.n };
        scope.theta = math.evaluate(params.theta, scope);

        return scope;
    };

    private static compileHL = (params: NormalizedParams): HV => {
        return {
            h: math.compile(`359 * (${params.h})`),
            v: math.compile(`100 * (${params.v})`),
        };
    };
}
