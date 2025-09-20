import { useEffect, useRef } from 'react';
import { initShaderProgram, vsSource, fsSource } from './shaders';
import { initBuffers } from './buffers';
import { drawScene } from './scenes';

let cubeRotation = 0.0;
let deltaTime = 0;

export default function PatternCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const gl = canvasRef.current.getContext('webgl2');
    if (!gl) throw new Error('Unable to get WebGL context');

    renderScene(gl);
  }, []);

  return <canvas
    ref={canvasRef}
    className="pattern-canvas"
    width={window.innerWidth}
    height={window.innerHeight}
  >
  </canvas>;
}

function renderScene(gl: WebGL2RenderingContext) {
  let then = 0;

  const programInfo = initShaderProgram(gl, vsSource, fsSource);
  const buffers = initBuffers(gl);

  // Draw the scene repeatedly
  function render(now: number) {
    now *= 0.001; // convert to seconds
    deltaTime = now - then;
    then = now;

    drawScene(gl, programInfo, buffers, cubeRotation);
    cubeRotation += deltaTime / 2;

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}