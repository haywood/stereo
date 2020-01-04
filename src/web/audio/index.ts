import { BehaviorSubject, interval, Observable } from 'rxjs';
import { getLogger } from 'loglevel';
import { inputs } from '../inputs';
import { Audio } from './types';
import { AUDIO_PLACEHOLDER } from './constants';
import { AudioGraph } from './graph';

const logger = getLogger('Audio');

const subject = new BehaviorSubject<Audio>(AUDIO_PLACEHOLDER);
export const audioStream = subject.asObservable();
let graph: AudioGraph;

inputs.mic.stream.subscribe(async ({ newValue, event }) => {
  if (newValue) {
    logger.info('getting user media');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    logger.info('starting new audio graph');
    graph = await AudioGraph.create(stream, subject);
  } else {
    logger.info('closing audio graph');
    if (graph) await graph.close();
    subject.next(AUDIO_PLACEHOLDER);
  }
});
