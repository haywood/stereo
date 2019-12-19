import { Subject, interval, BehaviorSubject } from 'rxjs';
import { Energy } from './mic/energy';
import { BeatFinder, Beat } from './mic/beat';
import { getLogger } from 'loglevel';
import * as inputs from './inputs';

const logger = getLogger('Energy');

const FAKE_BEAT: Beat = {
    e: 1,
    bpm: 0,
    time: 0,
};
const subject = new BehaviorSubject<Beat>(FAKE_BEAT);

const start = async (stream: MediaStream): Promise<State> => {
    logger.info('initializing audio graph');
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const max = 9000;
    const min = 16;
    const mid = (max + min) / 2;
    const filter = new BiquadFilterNode(ctx, {
        frequency: mid,
        Q: mid / (max - min),
    });
    const bandCount = 32;
    const analyzer = new AnalyserNode(ctx, { fftSize: 1024 });
    const buffer = new Uint8Array(analyzer.frequencyBinCount);
    const energy = new Energy(bandCount);
    const beatFinder = new BeatFinder(bandCount, 1024);

    source.connect(filter).connect(analyzer);

    const interval = setInterval(() => {
        try {
            analyzer.getByteFrequencyData(buffer);
            const energies = energy.compute(buffer);
            const beat = beatFinder.find(energies);

            subject.next(beat);
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
        subject.next(FAKE_BEAT);
    } else if (event && !state) {
        const stream = await navigator.mediaDevices
            .getUserMedia({ audio: true });
        state = await start(stream);
    }
});
