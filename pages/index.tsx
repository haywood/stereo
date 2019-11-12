import { BufferGeometry, BufferAttribute, PointsMaterial, Geometry, Points, VertexColors, Scene, Color, Vector3, PerspectiveCamera, WebGLRenderer, BoxGeometry, MeshBasicMaterial, Mesh } from 'three'
import React from 'react'

const PI = Math.PI

class ThreeDemo extends React.Component {
  state: {
    camera?: PerspectiveCamera;
    theta: number;
    geometry?: BufferGeometry;
    renderer?: WebGLRenderer;
    scene?: Scene;
    nextFrame?: number;
  } = { theta: 0 }

  componentDidMount () {
    const renderer = new WebGLRenderer()
    const width = window.innerWidth
    const height = window.innerHeight
    const fieldOfView = 75 // degrees
    const aspect = width / height
    const near = 0.1
    const far = 1000

    const camera = new PerspectiveCamera(fieldOfView, aspect, near, far)
    const material = new PointsMaterial({ vertexColors: VertexColors, size: 0.02 })
    const scene = new Scene()
    const geometry = new BufferGeometry()
    const points = new Points(geometry, material)

    scene.add(points)
    camera.position.z = 3
    renderer.setSize(width, height)

    this.setState({ renderer, camera, geometry, scene, theta: 0 }, () => this.animate())
  }

  componentWillUnmount () {
    const { nextFrame } = this.state
    if (nextFrame) {
      cancelAnimationFrame(nextFrame)
    }
  }

  animate () {
    const { renderer, scene, camera, geometry, theta } = this.state
    const order = 100
    const degree = 3
    const sphere = this.hyperSphere(degree, order, theta)
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(sphere), degree))
    geometry.setAttribute('color', new BufferAttribute(new Float32Array(sphere.map(x => (x + 1) / 2)), degree))

    renderer.render(scene, camera)

    this.setState({ theta: theta - Math.PI / 900, nextFrame: requestAnimationFrame(this.animate.bind(this)) })
    // this.setState({ theta: theta - Math.PI / 900 })
  }

  render () {
    return <React.Fragment>
      <div ref={el => this.state.renderer && el && el.appendChild(this.state.renderer.domElement)}></div>
    </React.Fragment>
  }

  hyperSphere (degree: number, order: number, theta: number) {
    if (degree < 2) throw Error()
    const phis = []

    for (let rho = 0.5 * PI; rho < 3 * PI / 2 ** (degree - 2); rho += 2 * PI / order) {
      phis.push(rho)
    }

    if (degree === 2) {
      return phis.map(phi => [Math.cos(phi + theta), Math.sin(phi + theta)]).reduce((a, b) => a.concat(b))
    }

    const circle = this.hyperSphere(degree - 1, order, theta)
    const sphere = []
    for (const phi of phis) {
      for (let offset = 0; offset < circle.length; offset += degree - 1) {
        const p = circle.slice(offset, offset + degree - 1).map(q => q * Math.abs(Math.cos(phi)))
        sphere.push(p[0])
        sphere.push(Math.sin(phi))
        sphere.push(...p.slice(1))
      }
    }
    return sphere
  }
}

const Index = () => (<ThreeDemo />)

export default Index
