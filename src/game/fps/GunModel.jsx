import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Vector3 } from 'three';
import { useGameStore } from './useGameStore';

// Position offset from camera (slightly right, slightly below center, in front)
const REST_OFFSET = new Vector3(0.15, -0.3, 0.25);

// Recoil
const RECOIL_PITCH = 0.15;
const RECOIL_KICK = 0.04;
const RECOIL_RECOVER_SPEED = 8;

// Idle sway
const SWAY_AMOUNT = 0.002;
const SWAY_SPEED = 1.5;
const BOB_AMOUNT = 0.003;
const BOB_SPEED = 3;

const MODEL_SCALE = 0.5;

export const GunModel = () => {
  const groupRef = useRef();
  const { camera } = useThree();

  // Load GLTF shotgun model
  const { scene } = useGLTF('/models/weapons/Shotgun.gltf');

  const initialized = useRef(false);
  if (!initialized.current) {
    initialized.current = true;
    scene.traverse(child => {
      if (child.isMesh) {
        child.frustumCulled = false;
        child.renderOrder = 999;
      }
    });
  }

  const animState = useRef({
    lastShotsFired: 0,
    wasReloading: false,
    recoilProgress: 0,
    recoilPhase: 'rest',
    reloadProgress: 0,
    time: 0,
    initialized: false
  });

  const _pos = useRef(new Vector3());
  const _forward = useRef(new Vector3());
  const _right = useRef(new Vector3());
  const _up = useRef(new Vector3());

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const anim = animState.current;

    if (!anim.initialized) {
      anim.initialized = true;
      group.traverse(c => {
        c.frustumCulled = false;
      });
    }

    anim.time += delta;
    const state = useGameStore.getState();

    // Detect new shot -> procedural recoil
    // Reset tracking when shotsFired resets (e.g. game restart)
    if (state.shotsFired < anim.lastShotsFired) {
      anim.lastShotsFired = 0;
    }
    if (state.shotsFired > anim.lastShotsFired) {
      anim.lastShotsFired = state.shotsFired;
      anim.recoilProgress = 0;
      anim.recoilPhase = 'kick';
    }

    // Recoil animation
    if (anim.recoilPhase === 'kick') {
      anim.recoilProgress += delta * 30;
      if (anim.recoilProgress >= 1) {
        anim.recoilProgress = 1;
        anim.recoilPhase = 'recover';
      }
    } else if (anim.recoilPhase === 'recover') {
      anim.recoilProgress -= delta * RECOIL_RECOVER_SPEED;
      if (anim.recoilProgress <= 0) {
        anim.recoilProgress = 0;
        anim.recoilPhase = 'rest';
      }
    }

    const recoilT = anim.recoilPhase !== 'rest' ? anim.recoilProgress : 0;

    // Procedural reload animation
    if (state.isReloading) {
      anim.reloadProgress = Math.min(1, anim.reloadProgress + delta * 1.5);
    } else if (anim.reloadProgress > 0) {
      anim.reloadProgress = Math.max(0, anim.reloadProgress - delta * 4);
    }
    anim.wasReloading = state.isReloading;

    // Smooth ease-in-out curve for reload tilt
    const reloadT =
      anim.reloadProgress < 0.5
        ? 2 * anim.reloadProgress * anim.reloadProgress
        : 1 - Math.pow(-2 * anim.reloadProgress + 2, 2) / 2;

    // --- Idle sway ---
    const swayX = Math.sin(anim.time * SWAY_SPEED) * SWAY_AMOUNT;
    const swayY = Math.cos(anim.time * SWAY_SPEED * 0.7) * SWAY_AMOUNT;
    const bobY = Math.sin(anim.time * BOB_SPEED) * BOB_AMOUNT;

    // --- Position relative to camera ---
    camera.getWorldDirection(_forward.current);
    _right.current.crossVectors(_forward.current, camera.up).normalize();
    _up.current.crossVectors(_right.current, _forward.current).normalize();

    _pos.current.copy(camera.position);
    _pos.current.addScaledVector(_right.current, REST_OFFSET.x + swayX);
    _pos.current.addScaledVector(_up.current, REST_OFFSET.y + swayY + bobY);
    _pos.current.addScaledVector(
      _forward.current,
      REST_OFFSET.z - recoilT * RECOIL_KICK
    );

    group.position.copy(_pos.current);
    group.quaternion.copy(camera.quaternion);
    group.rotateX(recoilT * RECOIL_PITCH + reloadT * 0.6);
  });

  return (
    <group ref={groupRef} renderOrder={999}>
      <primitive
        object={scene}
        scale={MODEL_SCALE}
        rotation={[0, Math.PI, 0]}
      />
    </group>
  );
};
