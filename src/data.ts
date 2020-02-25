import { Subject } from 'rxjs';

import debug from './debug';
import { error } from './error';
import { inputs } from './inputs';
import { TextInput } from './inputs/text';
import { Params } from './params';
import * as params from './params/stream';
import { runPipeline } from './pipe/pool';
import { DataChunk } from './types';

const subject = new Subject<DataChunk>();

export const dataStream = subject.asObservable();

type Source = {
  getData(params: Params): ReturnType<typeof runPipeline>;
};

const webWorkerSource = async (): Promise<Source> => {
  return { getData: (params: Params) => runPipeline(params, subject) };
};
