import { Subject } from 'rxjs';
import { ModuleThread, Transfer, Worker, spawn } from 'threads';

import { Data } from '../../data';
import { RenderThread } from './worker';

const subject = new Subject<[number, number, number]>();
export const extentStream = subject.asObservable();

const renderThread: Promise<ModuleThread<RenderThread>> = spawn<RenderThread>(
  new Worker('./worker', { name: 'renderer' })
);

export const initRenderer = async (canvas: OffscreenCanvas) => {
  const extent = await (await renderThread).init(
    Transfer(canvas as any), // cast to any because Transferable typedef is broken
    window.innerWidth,
    window.innerHeight
  );
  subject.next(extent);
};

export const render = async () => (await renderThread).render();

export const updateRenderer = async (data: Data) => {
  const extent = await (await renderThread).update(data);
  subject.next(extent);
};

window.onresize = async () => {
  const extent = await (await renderThread).resize(
    window.innerWidth,
    window.innerHeight
  );
  subject.next(extent);
};
