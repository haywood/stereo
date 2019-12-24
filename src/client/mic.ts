import { BehaviorSubject, interval, Observable } from 'rxjs';
import { Energy } from './mic/energy';
import { BeatFinder, Beat } from './mic/beat';
import { getLogger } from 'loglevel';
import * as inputs from './inputs';
import { mean, floor } from 'mathjs';
import { Music, MusicWorker } from './mic/types';
import { spawn, Worker, ModuleThread } from 'threads';
import { map, switchMap } from 'rxjs/operators';
import { sampleRate } from './constants';

const logger = getLogger('Energy');

const FAKE_MUSIC: Music = {
    esong: 0.5,
    dsong: 1,
};

const subject = new BehaviorSubject<Music>(FAKE_MUSIC);

const fftSize = 2048;

const start = async (stream: MediaStream): Promise<void> => {
    logger.info('initializing audio graph');
    const worker = await spawn<ModuleThread<MusicWorker>>(new Worker('./mic/worker'));
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyzer = new AnalyserNode(ctx, {
        fftSize,
        maxDecibels: -50,
        minDecibels: -100,
        // smoothingTimeConstant: 0,
    });
    // need this array, because AnalyserNode won't accept one
    // backed by a shared buffer
    const data = new Uint8Array(analyzer.frequencyBinCount);

    source.connect(analyzer);

    interval(1 / sampleRate).subscribe(async () => {
        if (!inputs.values.sound) return;

        try {
            analyzer.getByteFrequencyData(data);
            const arr = new Array(data.length);
            for (let i = 0; i < data.length; i++) {
                arr[i] = data[i] / 255;
            }
            subject.next(await worker.analyze(arr));
        } catch (err) {
            logger.error(err);
        }
    });
};

export const stream = subject.asObservable();

let subscription = inputs.streams.sound.subscribe(async ({ newValue, event }) => {
    if (newValue && event) {
        const stream = await navigator.mediaDevices
            .getUserMedia({ audio: true });
        await start(stream);
        subscription.unsubscribe();
        subscription = null;
    }
});

inputs.streams.sound.subscribe(async ({ newValue }) => {
    if (!newValue) subject.next(FAKE_MUSIC);
});
