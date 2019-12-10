import { Renderer } from './renderer';
import { streamData } from './data';
import { Controls } from './controls';
import { streams } from './query';

document.onreadystatechange = (): void => {
  if (document.readyState === 'complete') {
    const renderer = new Renderer();
    const controls = new Controls();

    document.body.appendChild(renderer.domElement);
    document.body.appendChild(controls.domElement);

    streams.animate.subscribe(({ newValue, oldValue }) => {
      if (newValue && !oldValue) {
        streamData().subscribe(data => renderer.updatePoints(data));
      }
    });
  }
};
