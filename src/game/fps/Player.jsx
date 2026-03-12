import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import { Vector3, Euler } from 'three';
import { usePlayerControls } from './usePlayerControls';
import { useGameStore } from './useGameStore';
import { Gun } from './Gun';

const MOVE_SPEED = 8;
const MOUSE_SENSITIVITY = 0.001;
const PITCH_LIMIT = Math.PI / 2 - 0.1;

export const Player = () => {
  const bodyRef = useRef();
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const { camera } = useThree();
  const { getMovement, getLookDelta } = usePlayerControls();
  const gameState = useGameStore(s => s.gameState);

  // Temp vectors to avoid GC
  const _moveDir = useRef(new Vector3());
  const _forward = useRef(new Vector3());
  const _right = useRef(new Vector3());

  useFrame(() => {
    if (gameState !== 'playing' && gameState !== 'waveIntro') return;
    const body = bodyRef.current;
    if (!body) return;

    // --- Camera rotation ---
    const look = getLookDelta();
    yawRef.current -= look.yaw * MOUSE_SENSITIVITY;
    pitchRef.current -= look.pitch * MOUSE_SENSITIVITY;
    pitchRef.current = Math.max(
      -PITCH_LIMIT,
      Math.min(PITCH_LIMIT, pitchRef.current)
    );

    const euler = new Euler(pitchRef.current, yawRef.current, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);

    // --- Movement ---
    const move = getMovement();

    // Forward/right vectors from yaw only (ignore pitch for movement)
    _forward.current
      .set(0, 0, -1)
      .applyAxisAngle({ x: 0, y: 1, z: 0 }, yawRef.current);
    _right.current
      .set(1, 0, 0)
      .applyAxisAngle({ x: 0, y: 1, z: 0 }, yawRef.current);

    _moveDir.current
      .set(0, 0, 0)
      .addScaledVector(_forward.current, -move.z)
      .addScaledVector(_right.current, move.x)
      .normalize()
      .multiplyScalar(MOVE_SPEED);

    // Apply velocity (keep existing Y velocity for gravity)
    const currentVel = body.linvel();
    body.setLinvel(
      { x: _moveDir.current.x, y: currentVel.y, z: _moveDir.current.z },
      true
    );

    // --- Sync camera position to physics body ---
    const pos = body.translation();
    camera.position.set(pos.x, pos.y + 0.7, pos.z); // +0.7 = eye height above capsule center
  });

  return (
    <RigidBody
      ref={bodyRef}
      position={[0, 2, 0]}
      enabledRotations={[false, false, false]}
      linearDamping={4}
      mass={1}
      type="dynamic"
      colliders={false}
    >
      <CapsuleCollider args={[0.5, 0.4]} position={[0, 0.9, 0]} />
      <Gun />
    </RigidBody>
  );
};
