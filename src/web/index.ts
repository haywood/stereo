import './global.scss';
import 'multirange/multirange.css';

(async () => {
  const { Renderer } = await import('./renderer');
  const data = await import('./data');
  const { Controls } = await import('./controls');
  const { setDefaultLevel } = await import('loglevel');

  setDefaultLevel('info');

  const renderer = new Renderer();
  const controls = new Controls();

  let cursorInactiveTimeout, lastMouseMove = 0;

  const maybeSetCursorInactive = () => {
    if (Date.now() > lastMouseMove + 1000) {
      document.body.classList.add('cursor-inactive');
      controls.hide();
    }
  };

  document.body.onmousemove = () => {
    lastMouseMove = Date.now();
    controls.show();

    if (document.body.classList.contains('cursor-inactive')) {
      document.body.classList.remove('cursor-inactive');
    }

    clearTimeout(cursorInactiveTimeout);
    cursorInactiveTimeout = setTimeout(maybeSetCursorInactive, 1000);
  };

  document.onreadystatechange = (): void => {
    if (document.readyState === 'complete') {
      document.body.appendChild(renderer.domElement);
      document.body.appendChild(controls.domElement);

      data.stream.subscribe(
        (data) => {
          renderer.update(data);
          document.body.classList.add('data');
          maybeSetCursorInactive();
        },
        (err: Error) => alert(`${err.message}\n${err.stack}`),
      );
    }
  };
})();
