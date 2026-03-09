import { RigidBody } from '@react-three/rapier';
import { useMemo } from 'react';

const ARENA_SIZE = 40;
const HALF = ARENA_SIZE / 2;
const WALL_HEIGHT = 3;
const WALL_THICKNESS = 0.5;

// Pre-generate random positions for tombstones & trees
const randomInRange = (min, max) => Math.random() * (max - min) + min;

const generateProps = (count, margin = 4) => {
  const items = [];
  for (let i = 0; i < count; i++) {
    const x = randomInRange(-HALF + margin, HALF - margin);
    const z = randomInRange(-HALF + margin, HALF - margin);
    // Keep items away from the very center (player spawn)
    if (Math.abs(x) < 3 && Math.abs(z) < 3) continue;
    items.push({ x, z, rotation: Math.random() * Math.PI });
  }
  return items;
};

const Tombstone = ({ position, rotation }) => (
  <RigidBody type="fixed" position={position} rotation={[0, rotation, 0]}>
    <mesh castShadow>
      <boxGeometry args={[0.8, 1.2, 0.3]} />
      <meshStandardMaterial color="#6b7280" />
    </mesh>
  </RigidBody>
);

const Tree = ({ position }) => (
  <group position={position}>
    {/* Trunk */}
    <RigidBody type="fixed">
      <mesh castShadow position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 3, 8]} />
        <meshStandardMaterial color="#5c3a1e" />
      </mesh>
    </RigidBody>
    {/* Canopy */}
    <mesh castShadow position={[0, 3.5, 0]}>
      <coneGeometry args={[1.8, 3, 8]} />
      <meshStandardMaterial color="#1a3a2a" />
    </mesh>
  </group>
);

const FenceSegment = ({ position, args }) => (
  <RigidBody type="fixed" position={position}>
    <mesh castShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color="#3d2b1f" />
    </mesh>
    {/* Fence post details on top */}
    <mesh position={[0, args[1] / 2 + 0.15, 0]}>
      <boxGeometry args={[args[0], 0.3, args[2] * 1.2]} />
      <meshStandardMaterial color="#2a1a0f" />
    </mesh>
  </RigidBody>
);

export const Arena = () => {
  const tombstones = useMemo(() => generateProps(15, 5), []);
  const trees = useMemo(() => generateProps(20, 2), []);

  return (
    <group>
      {/* Ambient & directional lighting for spooky moonlight */}
      <ambientLight intensity={3.0} color="#8899bb" />
      <directionalLight
        position={[10, 20, -10]}
        intensity={0.9}
        color="#aabbdd"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-HALF}
        shadow-camera-right={HALF}
        shadow-camera-top={HALF}
        shadow-camera-bottom={-HALF}
      />

      {/* Ground */}
      <RigidBody type="fixed">
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[ARENA_SIZE, ARENA_SIZE]} />
          <meshStandardMaterial color="#1a2e1a" />
        </mesh>
      </RigidBody>

      {/* Fence walls */}
      {/* North */}
      <FenceSegment
        position={[0, WALL_HEIGHT / 2, -HALF]}
        args={[ARENA_SIZE, WALL_HEIGHT, WALL_THICKNESS]}
      />
      {/* South */}
      <FenceSegment
        position={[0, WALL_HEIGHT / 2, HALF]}
        args={[ARENA_SIZE, WALL_HEIGHT, WALL_THICKNESS]}
      />
      {/* East */}
      <FenceSegment
        position={[HALF, WALL_HEIGHT / 2, 0]}
        args={[WALL_THICKNESS, WALL_HEIGHT, ARENA_SIZE]}
      />
      {/* West */}
      <FenceSegment
        position={[-HALF, WALL_HEIGHT / 2, 0]}
        args={[WALL_THICKNESS, WALL_HEIGHT, ARENA_SIZE]}
      />

      {/* Tombstones */}
      {tombstones.map((t, i) => (
        <Tombstone
          key={`tomb-${i}`}
          position={[t.x, 0.6, t.z]}
          rotation={t.rotation}
        />
      ))}

      {/* Trees */}
      {trees.map((t, i) => (
        <Tree key={`tree-${i}`} position={[t.x, 0, t.z]} />
      ))}

      {/* Fog */}
      <fog attach="fog" args={['#0a1a0a', 5, 35]} />
    </group>
  );
};

export { ARENA_SIZE };
