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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      graph = await AudioGraph.create(stream, subject);
    } catch (e) {
      console.error(e);
      inputs.mic.value = false;
    }
  } else {
    try {
      if (graph) await graph.close();
    } catch (e) {
      console.error(e);
    } finally {
      subject.next(AUDIO_PLACEHOLDER);
    }
  }
});
