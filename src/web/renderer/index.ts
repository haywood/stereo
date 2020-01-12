import { ModuleThread, Worker, spawn } from 'threads';

import { RenderThread } from './worker';

export const renderThreadPromise: Promise<ModuleThread<RenderThread>> = spawn<
  RenderThread
>(new Worker('./worker', { name: 'renderer' }));
