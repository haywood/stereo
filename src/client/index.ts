import {Renderer} from './renderer';
import {streamData, streamData2} from './data';

document.onreadystatechange = (): void => {
  if (document.readyState === 'complete') {
    const renderer = new Renderer();
    streamData2().subscribe(data => renderer.update(data));
    document.body.append(renderer.domElement);
  }
};
