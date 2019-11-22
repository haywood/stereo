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
  scene?: THREE.Scene;

  state = {
    animate: true,
    nextFrame: null,
    renderer: null
  };
  props: {
    id: string;
    dimension: number;
    points: () => number[][];
    width: number;
    height: number;
  };

  render = () => {
    if (this.state.renderer) {
      return (
        <Component
          id={this.props.id}
          ref={el => this.appendToDom(el)}
        ></Component>
      );
    } else {
      return null;
    }
  };

  appendToDom = (el: Element) => {
    const { renderer } = this.state;
    if (el && renderer) {
      el.appendChild(renderer.domElement);
    }
  };

  componentDidMount = () => {
    const { animate } = this.state;
    const { width, height } = this.props;

    const fieldOfView = 100; // degrees
    const near = 0.1;
    const far = 1000;
    const aspect = width / height;

    this.camera = new PerspectiveCamera(fieldOfView, aspect, near, far);
    // TODO: configurable position
    this.camera.position.z = 6;

    const renderer = new WebGLRenderer();
    renderer.setSize(width, height, true);

    this.scene = new THREE.Scene();
    this.scene.add(this.points);

    this.setState({ renderer }, () => {
      if (animate) {
        console.log("starting animation");
        renderer.setAnimationLoop(this.draw);
      } else {
        console.log("drawing once");
        this.draw();
      }
    });
  };

  componentWillUnmount = () => {
    const { renderer } = this.state;
    if (renderer) {
      renderer.setAnimationLoop(null);
    }
  };

  draw = () => {
    const { points, dimension } = this.props;
    const { renderer } = this.state;
    const vertices = GeometryHelper.vertices(points());
    const colors = GeometryHelper.colors(vertices);
    const geometry = this.points.geometry as BufferGeometry;
    geometry.setAttribute("position", newBufferAttribute(vertices, dimension));
    geometry.setAttribute("color", newBufferAttribute(colors, dimension));
    renderer.render(this.scene, this.camera);
  };
}

function newBufferAttribute(values, dimension) {
  return new BufferAttribute(new Float32Array(values), dimension);
}

const Component = styled.div``;
