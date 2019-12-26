import { Subject } from "rxjs";
import { Audio } from './types';
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
            channelCountMode: 'explicit',
            channelCount: 1,
        });
        source.connect(power).connect(ctx.destination);
        power.port.onmessage = (msg) => subject.next(msg.data as Audio);
        power.onprocessorerror = (err) => subject.error(err);
    }

    close = () => this.ctx.close();
}
