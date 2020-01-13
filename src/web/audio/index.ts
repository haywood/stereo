import { BehaviorSubject } from 'rxjs';

import { inputs } from '../inputs';
import { AUDIO_PLACEHOLDER } from './constants';
import { AudioGraph } from './graph';
import { Audio } from './types';

const subject = new BehaviorSubject<Audio>(AUDIO_PLACEHOLDER);
export const audioStream = subject.asObservable();
let graph: AudioGraph;

inputs.mic.stream.subscribe(async ({ newValue, event }) => {
  if (newValue) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    graph = await AudioGraph.create(stream, subject);
  } else {
    if (graph) await graph.close();
    subject.next(AUDIO_PLACEHOLDER);
  }
});
