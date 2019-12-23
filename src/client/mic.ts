import { BehaviorSubject } from 'rxjs';
import { Energy } from './mic/energy';
import { BeatFinder, Beat } from './mic/beat';
import { getLogger } from 'loglevel';
import * as inputs from './inputs';
import { mean, floor } from 'mathjs';

const logger = getLogger('Energy');

export type Music = {
    beat: Beat;
    esong: number;
};

const FAKE_MUSIC = {
    beat: {
        e: 1,
        bpm: 1,
        time: 0,
    },
    esong: 1,
};

const subject = new BehaviorSubject<Music>(FAKE_MUSIC);

const bandCount = 64;
const fftSize = 2048;
const memory = 43;
const energy = new Energy(bandCount, fftSize, memory);
const beatFinder = new BeatFinder(bandCount, memory);
const detectMusic = (buffer: Uint8Array): Music => {
    const energies = energy.compute(buffer);
    const beat = beatFinder.find(energies);
    const esong = () => {
        const nonZero = energies.filter(x => x);
        return nonZero.length ? mean(...nonZero) : 0;
    };
    return { beat, esong: esong() };
};

const start = async (stream: MediaStream): Promise<State> => {
    logger.info('initializing audio graph');
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyzer = new AnalyserNode(ctx, {
        fftSize,
        maxDecibels: -50,
        minDecibels: -100,
        smoothingTimeConstant: 0,
    });
    const buffer = new Uint8Array(analyzer.frequencyBinCount);

    source.connect(analyzer);

    const interval = setInterval(() => {
        try {
            // This code attempts to implement the beat detection algorithm described at
            // http://archive.gamedev.net/archive/reference/programming/features/beatdetection/index.html
            // TODO: The O(1000) bpm values that it produces suggest that something is off...
            analyzer.getByteFrequencyData(buffer);

            // TODO: do this part in a worker
            const music = detectMusic(buffer);

            subject.next(music);
        } catch (err) {
            subject.error(err);
        }
    }, 10);
    return { source, interval };
};

type State = {
    source: MediaStreamAudioSourceNode;
    interval: NodeJS.Timeout;
};
export const stream = subject.asObservable();
let state: State;

inputs.streams.sound.subscribe(async ({ newValue, event }) => {
    if (!newValue) {
        state.source.disconnect();
        clearInterval(state.interval);
        state = null;
        subject.next(FAKE_MUSIC);
    } else if (event && !state) {
        const stream = await navigator.mediaDevices
            .getUserMedia({ audio: true });
        state = await start(stream);
    }
});
