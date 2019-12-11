import { Renderer } from './renderer';
import { stream } from './data';
import { Controls } from './controls';
import { streams, q } from './query';
import { take } from 'rxjs/operators';
import { Subscriber, Subscription } from 'rxjs';
import { Data } from '../core/data';

document.onreadystatechange = (): void => {
  if (document.readyState === 'complete') {
    const renderer = new Renderer();
    const controls = new Controls();

    document.body.appendChild(renderer.domElement);
    document.body.appendChild(controls.domElement);

    stream.subscribe(renderer.updatePoints);
  }
};
