import { Renderer } from './renderer';
import { streamData } from './data';
import { Controls } from './controls';

document.onreadystatechange = (): void => {
  if (document.readyState === 'complete') {
    const renderer = new Renderer();
    const controls = new Controls();
    streamData().subscribe(data => renderer.updatePoints(data));
    document.body.appendChild(renderer.domElement);
    document.body.appendChild(controls.domElement);
  }
};
