import { Renderer } from './renderer';
import { data } from './data';
import { Controls } from './controls';

document.onreadystatechange = (): void => {
  if (document.readyState === 'complete') {
    const renderer = new Renderer();
    const controls = new Controls();

    document.body.appendChild(renderer.domElement);
    document.body.appendChild(controls.domElement);

    data.subscribe(renderer.updatePoints);
  }
};
