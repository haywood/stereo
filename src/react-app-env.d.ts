/// <reference types="react-scripts" />

import { ThreeElements } from '@react-three/fiber'

declare module 'react' {
    namespace JSX {
        interface IntrinsicElements extends ThreeElements {
            mesh: any;
            boxGeometry: any;
            meshStandardMaterial: any;
            sphereGeometry: any;
            planeGeometry: any;
            ambientLight: any;
        }
    }
}
