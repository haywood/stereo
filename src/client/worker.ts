import { expose } from 'threads';
import { Energy } from './mic/energy';
import { BeatFinder } from './mic/beat';
import { mean } from 'mathjs';
import { MusicWorker } from './mic/types';

const bandCount = 64;
const fftSize = 2048;
const memory = 43;
const energy = new Energy(bandCount, fftSize, memory);
const beatFinder = new BeatFinder(bandCount, memory);

const worker: MusicWorker = {
    // This code attempts to implement the beat detection algorithm described at
    // http://archive.gamedev.net/archive/reference/programming/features/beatdetection/index.html
    // TODO: The O(1000) bpm values that it produces suggest that something is off...
    analyze: (buffer: SharedArrayBuffer) => {
        const energies = energy.compute(new Uint8Array(buffer));
        const beat = beatFinder.find(energies);
        const esong = () => {
            const nonZero = energies.filter(x => x);
            return nonZero.length ? mean(...nonZero) : 0;
        };
        return { beat, esong: esong() };
    },
};

expose(worker);
