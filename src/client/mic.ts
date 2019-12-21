import { BehaviorSubject } from 'rxjs';
import { Energy } from './mic/energy';
import { BeatFinder, Beat } from './mic/beat';
import { getLogger } from 'loglevel';
import * as inputs from './inputs';
import { mean } from 'mathjs';

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

const newMusicFilter = (ctx: AudioContext) => {
    const max = 9000;
    const min = 16;
    const mid = (max + min) / 2;
    return new BiquadFilterNode(ctx, {
        frequency: mid,
        Q: mid / (max - min),
    });
};

const start = async (stream: MediaStream): Promise<State> => {
    logger.info('initializing audio graph');
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const bandCount = 32;
    const filter = newMusicFilter(ctx);
    const analyzer = new AnalyserNode(ctx, {
        fftSize: 1024,
        maxDecibels: -50,
    });
    const buffer = new Uint8Array(analyzer.frequencyBinCount);
    const energy = new Energy(bandCount);
    const beatFinder = new BeatFinder(bandCount, 1024);

    source.connect(filter).connect(analyzer);
    const getEsong = (energies: Float32Array) => {
        const nonZero = energies.filter(e => e !== 0);
        if (nonZero.length) {
            return mean(...nonZero);
        } else {
            return 0;
        }
    };

    const interval = setInterval(() => {
        try {
            analyzer.getByteFrequencyData(buffer);
            const energies = energy.compute(buffer);
            const beat = beatFinder.find(energies);
            const esong = getEsong(energies);

            subject.next({ beat, esong });
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
