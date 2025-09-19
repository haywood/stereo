import { useEffect, useRef } from 'react';
import { initShaderProgram, vsSource, fsSource } from './shaders';
import { initBuffers } from './buffers';
import { drawScene } from './scenes';

export default function PatternCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const gl = canvasRef.current.getContext('webgl2');
    if (!gl) throw new Error('Unable to get WebGL context');

    drawScene(
      gl,
      initShaderProgram(gl, vsSource, fsSource),
      initBuffers(gl),
    );
  }, []);

  return <canvas
    ref={canvasRef}
    className="pattern-canvas"
    width={window.innerWidth}
    height={window.innerHeight}
  >
  </canvas>;
}
