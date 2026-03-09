import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { useGameStore } from './fps/useGameStore';
import { Arena } from './fps/Arena';
import { Player } from './fps/Player';
import { Bullets } from './fps/Bullets';
import { WaveManager } from './fps/WaveManager';
import { GunModel } from './fps/GunModel';

const DefaultScene = () => (
  <>
    <OrbitControls />
    <mesh>
      <boxGeometry />
      <meshNormalMaterial />
    </mesh>
  </>
);

const FPSScene = () => (
  <>
    <Physics gravity={[0, -20, 0]}>
      <Arena />
      <Player />
      <Bullets />
      <WaveManager />
    </Physics>
    <GunModel />
  </>
);

export const Game = () => {
  const gameState = useGameStore(s => s.gameState);
  const isInGame = gameState !== 'menu';

  return (
    <Canvas
      camera={{
        position: isInGame ? [0, 2, 0] : [3, 3, 3],
        fov: isInGame ? 75 : 50,
        near: 0.1,
        far: 100
      }}
      shadows
    >
      {isInGame ? <FPSScene /> : <DefaultScene />}
    </Canvas>
  );
};
