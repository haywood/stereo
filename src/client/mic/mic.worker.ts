import { expose } from 'threads';
import { Energy } from './energy';
import { mean } from 'mathjs';
import { MusicWorker, Music } from './types';
import { History } from './history';
import { audioSampleRate } from '../constants';

const energy = new Energy(32);
const history = new History(1000 * audioSampleRate);

const worker: MusicWorker = {
    analyze: (data: Float32Array): Music => {
        const energies = energy.compute(data);
        const eaudio = mean(...energies);
        history.set(eaudio);
        const daudio = history.delta();

        return { eaudio, daudio };
    },
};

expose(worker);
