import * as React from "react";
import styled from "styled-components";
import {
  BufferGeometry,
  Points,
  PointsMaterial,
  VertexColors,
  PerspectiveCamera,
  WebGLRenderer,
  BufferAttribute
} from "three";
import * as THREE from "three";
import GeometryHelper from "./geometry_helper";

export default class Scene extends React.Component {
  readonly points: Points = new Points(
    new BufferGeometry(),
    new PointsMaterial({
      vertexColors: VertexColors,
      size: 0.02
    })
  );
  camera?: PerspectiveCamera;
  renderer?: WebGLRenderer;
  scene?: THREE.Scene;

  state = {
    animate: true,
    nextFrame: null
  };
  props: {
    dimension: number;
    points: () => number[][];
    width: number;
    height: number;
  };

  render() {
    if (this.renderer) {
      return (
        <Component>
          <div ref={el => this.appendToDom(el)}></div>
        </Component>
      );
    } else {
      return null;
    }
  }

  appendToDom(el) {
    if (el) el.appendChild(this.renderer.domElement);
  }

  componentDidMount() {
    const { animate } = this.state;
    const { width, height } = this.props;

    const fieldOfView = 100; // degrees
    const near = 0.1;
    const far = 1000;
    const aspect = width / height;

    this.camera = new PerspectiveCamera(fieldOfView, aspect, near, far);
    // TODO: configurable position
    this.camera.position.z = 6;

    this.renderer = new WebGLRenderer();
    this.renderer.setSize(width, height);

    this.scene = new THREE.Scene();
    this.scene.add(this.points);

    if (animate) {
      console.log("starting animation");
      this.requestAnimationFrame();
    } else {
      console.log("drawing once");
      this.draw();
    }
  }

  componentWillUnmount() {
    const { nextFrame } = this.state;
    if (nextFrame) {
      cancelAnimationFrame(nextFrame);
    }
  }

  draw() {
    const { points, dimension } = this.props;
    const vertices = GeometryHelper.vertices(points());
    const colors = GeometryHelper.colors(vertices);
    const geometry = this.points.geometry as BufferGeometry;
    geometry.setAttribute("position", newBufferAttribute(vertices, dimension));
    geometry.setAttribute("color", newBufferAttribute(colors, dimension));
    this.renderer.render(this.scene, this.camera);
  }

  animate() {
    const { animate } = this.state;
    this.draw();
    if (animate) this.requestAnimationFrame();
  }

  requestAnimationFrame() {
    this.setState({
      nextFrame: requestAnimationFrame(() => this.animate())
    });
  }
}

function newBufferAttribute(values, dimension) {
  return new BufferAttribute(new Float32Array(values), dimension);
}

const Component = styled.div``;
