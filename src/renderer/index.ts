import { Subject } from 'rxjs';
import { Data } from '../../data';
import { worker } from './worker';

const subject = new Subject<[number, number, number]>();
export const extentStream = subject.asObservable();

const query = new URLSearchParams(window.location.search);
const width = Number(query.get('width'));
const height = Number(query.get('height'));
const fixedSize = !!width && !!height;

export const initRenderer = async (
  canvas: HTMLCanvasElement | OffscreenCanvas
) => {
  const extent = worker.init(
    canvas,
    fixedSize ? width : window.innerWidth,
    fixedSize ? height : window.innerHeight
  );
  subject.next(extent);
};

export const render = async () => worker.render();

export const renderPng = async () => worker.renderPng();

export const updateRenderer = async (data: Data) => {
  const extent = worker.update(data);
  subject.next(extent);
};

if (!fixedSize) {
  window.onresize = async () => {
    const extent = worker.resize(window.innerWidth, window.innerHeight);
    subject.next(extent);
  };
}
