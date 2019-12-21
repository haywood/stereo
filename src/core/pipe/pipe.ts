import { CompositeFn } from '../fn/fn';
import * as math from 'mathjs';
import { getLogger } from 'loglevel';
import { Data, Vector } from '../data';
import { Color } from 'three';
import assert from 'assert';
import { pp } from '../pp';
import { Params, Scope } from './types';
import { Compiler } from './compiler';
import { Evaluator } from './evaluator';

const logger = getLogger('Pipe');
logger.setLevel('info');

export class Pipe {
    static run = (params: Params, buffer?: SharedArrayBuffer) => {
        const bpm = params.bpm || 0;
        const ebeat = params.ebeat || 0;
        const esong = params.esong || 0;
        const t = (params.t || 0) / 1000;
        const h = math.compile(`360 * (${params.h || 1})`);
        const l = math.compile(`100 * (${params.l || 0.5})`);
        const theta = params.theta = params.theta || 't';
        const ast = new Compiler({ t, bpm, ebeat, esong }).compile(params);
        const thetaScope: Scope = { t, bpm, ebeat, esong, n: ast.n };
        const scope: Scope = {
            theta: math.evaluate(theta, thetaScope),
            ...thetaScope,
        };
        return new Evaluator(scope, ast, h, l).evaluate(buffer);
    };
}
