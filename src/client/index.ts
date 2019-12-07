import { Renderer } from './renderer';
import { streamData } from './data';

document.onreadystatechange = (): void => {
  if (document.readyState === 'complete') {
    const renderer = new Renderer();
    streamData().subscribe(data => renderer.updatePoints(data));
    document.body.append(renderer.domElement);
  }
};
