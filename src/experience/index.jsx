import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

export const Experience = () => {
  return (
    <Canvas
      camera={{
        position: [3, 3, 3],
      }}
    >
      <OrbitControls />
      <mesh>
        <boxGeometry />
        <meshNormalMaterial />
      </mesh>
    </Canvas>
  );
};
