import { Subject, interval } from 'rxjs';
import { Energy } from './mic/energy';
import { Beat } from './mic/beat';
import { getLogger } from 'loglevel';

const logger = getLogger('Energy');

export type Band = {
    frequency: number;
    e: number;
    E: number;
    bpm: number;
    on: boolean;
};
const bandCount = 32;
const NO_BEAT: Band = {
    frequency: 0,
    e: 0,
    E: 0,
    bpm: 0,
    on: false,
};
const band = NO_BEAT;
const subject = new Subject<Band>();
const ctx = new AudioContext();

export const stream = subject.asObservable();

const initFromStream = async (stream: MediaStream) => {
    logger.info('initializing audio graph');
    const source = ctx.createMediaStreamSource(stream);
    const max = 9000;
    const min = 16;
    const mid = (max + min) / 2;
    const filter = new BiquadFilterNode(ctx, {
        frequency: mid,
        Q: mid / (max - min),
    });
    const analyzer = new AnalyserNode(ctx, { fftSize: 1024 });
    const buffer = new Uint8Array(analyzer.frequencyBinCount);
    const energy = new Energy(bandCount);
    const beat = new Beat(bandCount, 1024);

    source.connect(filter).connect(analyzer);

    setInterval(() => {
        try {
            analyzer.getByteFrequencyData(buffer);
            const energies = energy.compute(buffer);
            const { e, E, bpm, on, last } = beat.find(energies);
            Object.assign(band, { e, E, bpm, on, last });
            logger.info(`updated band to ${JSON.stringify(band, null, 2)}`);
            subject.next(band);
        } catch (err) {
            subject.error(err);
        }
    }, 10);
};

navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then(initFromStream);

let initted = false;
const resumeContext = async () => {
    if (ctx.state !== 'running' && !initted) {
        logger.info('detected movement. attempting to resume audio context.');
        initted = true;
        try {
            await ctx.resume();
        } catch (err) {
            initted = false;
            logger.error(err);
        }
    }
};

window.addEventListener('mousemove', resumeContext);
