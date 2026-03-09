import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useGameStore } from './useGameStore';

const FIRE_RATE = 0.5; // seconds between shots
const RELOAD_TIME = 1.5; // seconds to reload
const BULLET_SPEED = 40;
const BULLET_MAX_DISTANCE = 50;

// Simple bullet data managed outside React for performance
let activeBullets = [];
let nextBulletId = 0;

export const getBullets = () => activeBullets;

export const removeBulletById = id => {
  activeBullets = activeBullets.filter(b => b.id !== id);
};

export const clearAllBullets = () => {
  activeBullets = [];
};

export const Gun = () => {
  const fireTimer = useRef(0);
  const reloadTimer = useRef(0);
  const { camera } = useThree();
  const _dir = useRef(new Vector3());
  const _pos = useRef(new Vector3());

  useFrame((_, delta) => {
    // Always update bullet positions regardless of game/reload state
    activeBullets = activeBullets.filter(bullet => {
      const step = BULLET_SPEED * delta;
      bullet.position.addScaledVector(bullet.direction, step);
      bullet.distance += step;
      return bullet.distance < BULLET_MAX_DISTANCE;
    });

    const state = useGameStore.getState();
    if (state.gameState !== 'playing') return;

    // Handle reload
    if (state.isReloading) {
      reloadTimer.current += delta;
      if (reloadTimer.current >= RELOAD_TIME) {
        reloadTimer.current = 0;
        state.finishReload();
      }
      return;
    }

    // Auto-fire timer
    fireTimer.current += delta;
    if (fireTimer.current >= FIRE_RATE) {
      fireTimer.current = 0;

      if (state.shoot()) {
        // Create bullet
        camera.getWorldDirection(_dir.current);
        camera.getWorldPosition(_pos.current);

        // Offset bullet spawn slightly forward from camera
        const spawnPos = _pos.current
          .clone()
          .add(_dir.current.clone().multiplyScalar(0.5));

        activeBullets.push({
          id: ++nextBulletId,
          position: spawnPos.clone(),
          direction: _dir.current.clone(),
          distance: 0
        });
      }
    }
  });

  // Visual gun model attached to camera (rendered as child of player RigidBody)
  return (
    <group>
      {/* Gun model is rendered in the HUD/camera space via FpsHud. 
          Nothing to render in world space for the gun itself. */}
    </group>
  );
};
