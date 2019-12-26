import * as math from 'mathjs';
import { getLogger } from 'loglevel';
import { Params, Scope, NormalizedParams, CompiledAST, HL, Chunk } from './types';
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
        const { eaudio, daudio, t } = params;
        return new Compiler({ t, eaudio, daudio }).compile(params);

    };

    private static normalized = (params: Params): NormalizedParams => {
        return {
            pipe: params.pipe,
            theta: params.theta || 't',
            h: params.h || '1',
            l: params.l || '0.5',
            t: params.t || 0,
            eaudio: params.eaudio || 0,
            daudio: params.daudio || 0,
        };
    };

    private static finalScope = (params: NormalizedParams, ast: CompiledAST): Scope => {
        const { eaudio, daudio, t } = params;
        const scope: Scope = { t, eaudio, daudio, n: ast.n };
        scope.theta = math.evaluate(params.theta, scope);

        return scope;
    };

    private static compileHL = (params: NormalizedParams): HL => {
        return {
            h: math.compile(`360 * (${params.h})`),
            l: math.compile(`100 * (${params.l})`),
        };
    };
}
