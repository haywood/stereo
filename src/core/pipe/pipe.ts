import * as math from 'mathjs';
import { getLogger } from 'loglevel';
import { Params, Scope, NormalizedParams, CompiledAST, HL } from './types';
import { Compiler } from './compiler';
import { Evaluator } from './evaluator';

const logger = getLogger('Pipe');
logger.setLevel('info');

export class Pipe {
    static run = (params: Params, buffer?: SharedArrayBuffer) => {
        return Pipe.runNormal(Pipe.normalized(params), buffer);
    };

    private static runNormal = (params: NormalizedParams, buffer?: SharedArrayBuffer) => {
        const ast = Pipe.compile(params);
        const scope = Pipe.finalScope(params, ast);
        const hl = Pipe.compileHL(params);
        return new Evaluator(scope, ast, hl).evaluate(buffer);
    };

    private static normalized = (params: Params): NormalizedParams => {
        return {
            pipe: params.pipe,
            theta: params.theta || 't',
            h: params.h || '1',
            l: params.l || '0.5',
            t: (params.t || 0) / 1000,
            bpm: params.bpm || 0,
            ebeat: params.ebeat || 0,
            esong: params.esong || 0,
        };
    };

    private static compile = (params: NormalizedParams): CompiledAST => {
        const { bpm, ebeat, esong, t } = params;
        return new Compiler({ t, bpm, ebeat, esong }).compile(params);
    };

    private static finalScope = (params: NormalizedParams, ast: CompiledAST): Scope => {
        const bpm = params.bpm;
        const ebeat = params.ebeat;
        const esong = params.esong;
        const t = params.t;
        const theta = params.theta;
        const scope: Scope = { t, bpm, ebeat, esong, n: ast.n };
        scope.theta = math.evaluate(theta, scope);
        return scope;
    };

    private static compileHL = (params: NormalizedParams): HL => {
        const h = math.compile(`360 * (${params.h})`);
        const l = math.compile(`100 * (${params.l})`);
        return { h, l };
    };
}
