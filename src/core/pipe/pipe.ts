import * as math from 'mathjs';
import { getLogger } from 'loglevel';
import { Params, Scope, NormalizedParams, CompiledAST, HL } from './types';
import { Compiler } from './compiler';
import { Evaluator } from './evaluator';

const logger = getLogger('Pipe');
logger.setLevel('info');

export class Pipe {
    static compile = (params: Params): CompiledAST => {
        return Pipe.compileNormal(Pipe.normalized(params));
    };

    static run = (params: Params, buffer?: SharedArrayBuffer) => {
        return Pipe.runNormal(Pipe.normalized(params), buffer);
    };

    static evaluatorFor = (params: Params) => {
        return Pipe.evaluatorForNormal(Pipe.normalized(params));
    };

    private static compileNormal = (params: NormalizedParams): CompiledAST => {
        const { bpm, ebeat, esong, t } = params;
        return new Compiler({ t, bpm, ebeat, esong }).compile(params);

    };

    private static evaluatorForNormal = (params: NormalizedParams) => {
        const ast = Pipe.compileNormal(params);
        const scope = Pipe.finalScope(params, ast);
        const hl = Pipe.compileHL(params);
        return new Evaluator(scope, ast, hl);
    };

    private static runNormal = (params: NormalizedParams, buffer?: SharedArrayBuffer) => {
        return Pipe.evaluatorForNormal(params).iterate(buffer);
    };

    private static normalized = (params: Params): NormalizedParams => {
        return {
            pipe: params.pipe,
            theta: params.theta || 't',
            h: params.h || '1',
            l: params.l || '0.5',
            t: params.t || 0,
            bpm: params.bpm || 0,
            ebeat: params.ebeat || 0,
            esong: params.esong || 0,
        };
    };

    private static finalScope = (params: NormalizedParams, ast: CompiledAST): Scope => {
        const bpm = params.bpm;
        const ebeat = params.ebeat;
        const esong = params.esong;
        const t = params.t;
        const scope: Scope = { t, bpm, ebeat, esong, n: ast.n };
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
