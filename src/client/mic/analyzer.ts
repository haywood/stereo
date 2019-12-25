export class Analyzer {
    private readonly node: AnalyserNode;
    private readonly data: Float32Array;
    private readonly bytes: Uint8Array;

    constructor(mediaStream: MediaStream) {
        const ctx = new AudioContext();
        this.node = new AnalyserNode(ctx, { fftSize: 2048 });
        this.bytes = new Uint8Array(this.node.frequencyBinCount);
        this.data = new Float32Array(this.node.frequencyBinCount);

        new MediaStreamAudioSourceNode(ctx, { mediaStream })
            .connect(this.node);
    }

    read = () => {
        this.node.getByteFrequencyData(this.bytes);
        this.data.set(this.bytes);
        for (let i = 0; i < this.data.length; i++) {
            this.data[i] /= 255;
        }
        return this.data;
    };
}
