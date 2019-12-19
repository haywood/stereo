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

const start = async (stream: MediaStream) => {
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

    setInterval(() => {
        try {
            analyzer.getByteFrequencyData(buffer);
            const energies = energy.compute(buffer);
            const beat = beatFinder.find(energies);

            subject.next(beat);
        } catch (err) {
            subject.error(err);
        }
    }, 10);
    return source;
};

export const stream = subject.asObservable();
let source: MediaStreamAudioSourceNode;

inputs.streams.sound.subscribe(async ({ newValue, event }) => {
    if (!newValue) {
        source.disconnect();
        source = null;
        subject.next(FAKE_BEAT);
    } else if (event && !source) {
        const stream = await navigator.mediaDevices
            .getUserMedia({ audio: true });
        source = await start(stream);
    }
});
