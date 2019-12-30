import { Subject } from "rxjs";
import { Audio } from './types';
import { Spectrum } from "./spectrum";
import { binCount } from "./constants";
import processorUrl from './power.worklet';

export class AudioGraph {

    static create = async (mediaStream: MediaStream, subject: Subject<Audio>) => {
        const ctx = new AudioContext();
        await ctx.audioWorklet.addModule(processorUrl);
        const source = new MediaStreamAudioSourceNode(ctx, { mediaStream });
        return new AudioGraph(ctx, source, subject);
    };

    constructor(
        private readonly ctx: AudioContext,
        source: AudioNode,
        subject: Subject<Audio>,
    ) {
        const power = new AudioWorkletNode(ctx, 'power', {
            numberOfInputs: binCount,
            channelCountMode: 'explicit',
            channelCount: 1,
        });
        power.port.onmessage = (msg) => subject.next(msg.data as Audio);
        power.onprocessorerror = (err) => subject.error(err);
        power.connect(ctx.destination);

        for (let k = 0; k < binCount; k++) {
            const f = Spectrum.f(k);
            const filter = new BiquadFilterNode(ctx, {
                type: 'bandpass',
                frequency: f,
                Q: f / binCount,
            });
            source.connect(filter).connect(power, 0, k);
        }
    }

    close = () => this.ctx.close();
}
