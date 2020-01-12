import { Subject } from 'rxjs';
import { Data } from '../../data';
import { worker } from './worker';

const subject = new Subject<[number, number, number]>();
export const extentStream = subject.asObservable();

export const initRenderer = async (canvas: OffscreenCanvas) => {
  const extent = worker.init(canvas, window.innerWidth, window.innerHeight);
  subject.next(extent);
};

export const render = async () => worker.render();

export const updateRenderer = async (data: Data) => {
  const extent = worker.update(data);
  subject.next(extent);
};

window.onresize = async () => {
  const extent = worker.resize(window.innerWidth, window.innerHeight);
  subject.next(extent);
};
