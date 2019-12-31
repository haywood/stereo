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

  const cursorInactiveTimeout = 1000;
  let setCursorInactiveHandle, lastMouseMove = 0;

  const maybeSetCursorInactive = (event?) => {
    if (Date.now() < lastMouseMove + cursorInactiveTimeout) return;
    if (controls.hasAttention()) return;

    document.body.classList.add('cursor-inactive');
    controls.hide();
  };

  document.body.onmousemove = (event) => {
    controls.show();

    if (document.body.classList.contains('cursor-inactive')) {
      document.body.classList.remove('cursor-inactive');
    }

    lastMouseMove = Date.now();
    setTimeout(
      () => maybeSetCursorInactive(event), cursorInactiveTimeout);
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
