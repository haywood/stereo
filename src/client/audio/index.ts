import { BehaviorSubject, interval, Observable } from 'rxjs';
import { getLogger } from 'loglevel';
import * as inputs from '../inputs';
import { Audio } from './types';
import { SILENCE } from './constants';
import { AudioGraph } from './graph';

const logger = getLogger('Audio');

const subject = new BehaviorSubject<Audio>(SILENCE);
export const stream = subject.asObservable();
let graph: AudioGraph;

inputs.streams.sound.subscribe(async ({ newValue, event }) => {
    if (newValue && event) {
        logger.info('getting user media');
        const stream = await navigator.mediaDevices
            .getUserMedia({ audio: true });
        logger.info('starting new audio graph');
        graph = await AudioGraph.create(stream, subject);
    } else if (!newValue && graph) {
        logger.info('closing audio graph');
        graph.close();
    } else {
        logger.warn(`inputs.streams.sound changed, but there was nothing to do: `, event);
    }
});
