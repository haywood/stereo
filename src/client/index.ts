import { Renderer } from './renderer';
import * as data from './data';
import { Controls } from './controls';
import { setDefaultLevel } from 'loglevel';

setDefaultLevel('info');

document.onreadystatechange = (): void => {
  if (document.readyState === 'complete') {
    const renderer = new Renderer();
    const controls = new Controls();

    document.body.appendChild(renderer.domElement);
    document.body.appendChild(controls.domElement);

    data.stream.subscribe(
      renderer.updatePoints,
      (err: Error) => alert(`${err.message}\n${err.stack}`),
    );
  }
};
