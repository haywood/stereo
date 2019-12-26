import { BehaviorSubject, interval, Observable } from 'rxjs';
import { getLogger } from 'loglevel';
import * as inputs from './inputs';
import { Music, MusicWorker } from './mic/types';
import { spawn, Worker, ModuleThread } from 'threads';
import { audioSampleRate } from './constants';
import { Analyzer } from './mic/analyzer';

const logger = getLogger('Energy');

const FAKE_MUSIC: Music = {
    esong: 0.5,
    dsong: 1,
};

const subject = new BehaviorSubject<Music>(FAKE_MUSIC);

const start = async (stream: MediaStream): Promise<void> => {
    logger.info('initializing audio graph');
    const worker = await spawn<ModuleThread<MusicWorker>>(new Worker('./mic/mic.worker'));
    const analyzer = new Analyzer(stream);

    interval(1 / audioSampleRate).subscribe(async () => {
        if (!inputs.values.sound) return;

        try {
            subject.next(await worker.analyze(analyzer.read()));
        } catch (err) {
            subject.error(err);
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
