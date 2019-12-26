import assert from 'assert';
import { frameSize, octaveMin, noteCount, octaveCount, chromaCount } from './constants';
import * as math from 'mathjs';
import Complex from 'complex.js';

const N = 512;
const K = math.floor(N / 2) + 1;

const w = computeWeights();

export class Spectrum {
    private readonly X = new Array<Complex>(K).fill(Complex.ZERO);
    private n = 0;

    get ready() {
        return this.n >= N;
    }

    getPowersAndReset(): number[] {
        const powers = math.divide(math.abs(this.X), 2);
        this.X.fill(Complex.ZERO);
        this.n = 0;
        return powers;
    }

    process = (frame: Float32Array): void => {
        assert.equal(frame.length, frameSize, `expected frame length to be ${frameSize}, not ${frame.length}`);

        for (const x of frame) {
            const n = this.n++;
            for (let k = 0; k < K; k++) {
                this.X[k] = this.X[k].add(w[index(k, n)].mul(x, 0));
            }
        }
    };

    f = (k: number): number => k / N * sampleRate;
}

function index(k: number, n: number) {
    return k * N + n;
}

function computeWeights(): Complex[] {
    const M = math.tau / N;
    const temp = new Array(N);
    for (let n = 0; n < N; n++) {
        temp[n] = 0.54 - 0.46 * math.cos(n * M);
    }
    const modulus = new Complex(0, M);
    const w = new Array<Complex>(N * K);
    for (let k = 0; k < K; k++) {
        for (let n = 0; n < N; n++) {
            w[index(k, n)] = modulus
                .mul(k, 0)
                .mul(n, 0)
                .neg()
                .exp()
                .mul(temp[n], 0);
        }
    }
    return w;
}
