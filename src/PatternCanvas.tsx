import { useEffect, useRef } from 'react';
import { Scene, PerspectiveCamera, WebGLRenderer, BoxGeometry, WireframeGeometry, Float32BufferAttribute, Color, DynamicDrawUsage, SphereGeometry, Points, ShaderMaterial, MeshBasicMaterial, LineBasicMaterial, MeshNormalMaterial, Mesh, BufferGeometry } from 'three';

const theta_ticks = 1_000;
const phi_ticks = 1_000;
const n_particles = theta_ticks * phi_ticks;
const radius = 200;
const theta_turns = 20;
const phi_turns = 20;

export default function PatternCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    renderScene(canvasRef.current);
  }, []);

  return <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} />;
}

function renderScene(canvas: HTMLCanvasElement) {
  const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.2, 1000);
  camera.position.z = radius;

  const renderer = new WebGLRenderer({ canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);

  const geometry = new BufferGeometry();
  setAttributes(geometry);

  const shaderMaterial = new ShaderMaterial({
    vertexShader,
    fragmentShader,

    vertexColors: true
  });
  const points = new Points(geometry, shaderMaterial);

  const scene = new Scene();
  scene.add(points);

  function animate() {
    points.rotation.x += 0.001;
    points.rotation.y += 0.001;
    points.rotation.z += 0.001;

    renderer.render(scene, camera);
  }
  renderer.setAnimationLoop(animate);
}

function setAttributes(geometry: BufferGeometry) {
  const positions = [];
  const colors = [];
  const sizes = [];

  const color = new Color();

  for (let i = 0; i < theta_ticks; i++) {
    const theta = 2 * Math.PI * i * theta_turns / theta_ticks;

    for (let j = 0; j < phi_ticks; j++) {
      const phi = 2 * Math.PI * j * phi_turns / phi_ticks;
      const r = Math.sqrt(theta * theta + phi * phi);

      positions.push(r * Math.cos(phi));   // x
      positions.push(r * Math.sin(phi));   // y
      positions.push(r * Math.cos(theta)); // z

      color.setHSL((i * theta_ticks + j) / n_particles, 1.0, 0.5);
      colors.push(color.r, color.g, color.b);

      sizes.push(1);
    }
  }

  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.setAttribute('size', new Float32BufferAttribute(sizes, 1).setUsage(DynamicDrawUsage));
}

const vertexShader = `
attribute float size;

varying vec3 vColor;

void main() {
  vColor = color;

  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

  gl_PointSize = size * ( 300.0 / -mvPosition.z );

  gl_Position = projectionMatrix * mvPosition;

}
`;

const fragmentShader = `
varying vec3 vColor;

void main() {
  gl_FragColor = vec4( vColor, 1.0 );
}
`