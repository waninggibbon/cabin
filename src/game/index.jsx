import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Arena } from './fps/Arena';
import { Player } from './fps/Player';
import { Bullets } from './fps/Bullets';
import { WaveManager } from './fps/WaveManager';
import { GunModel } from './fps/GunModel';

export const Game = () => {
  return (
    <Canvas
      camera={{
        position: [0, 2, 0],
        fov: 75,
        near: 0.1,
        far: 100
      }}
      shadows
    >
      <Physics gravity={[0, -20, 0]}>
        <Arena />
        <Player />
        <Bullets />
        <WaveManager />
      </Physics>
      <GunModel />
    </Canvas>
  );
};
