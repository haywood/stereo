import './global.scss';

(async () => {
  const { Renderer } = await import('./renderer');
  const data = await import('./data');
  const { Controls } = await import('./controls');
  const { setDefaultLevel } = await import('loglevel');

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
})();
