import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import { Vector3 } from 'three';
import { useGameStore } from './useGameStore';
import { getBullets, removeBulletById } from './Gun';

const ENEMY_CONFIG = {
  grunt: {
    color: '#4a6741',
    bodyScale: [0.6, 1.0, 0.5],
    headScale: [0.4, 0.4, 0.4],
    speed: 4,
    attackRange: 2,
    attackDamage: 10,
    attackCooldown: 1.0,
    headColor: '#5a7751'
  },
  chucker: {
    color: '#6b3030',
    bodyScale: [0.5, 1.2, 0.4],
    headScale: [0.35, 0.35, 0.35],
    speed: 2,
    preferredRange: 12,
    attackRange: 18,
    attackDamage: 8,
    attackCooldown: 2.0,
    headColor: '#7b4040',
    projectileSpeed: 10
  },
  titan: {
    color: '#2a2a3a',
    bodyScale: [1.0, 1.5, 0.8],
    headScale: [0.6, 0.6, 0.6],
    speed: 1.5,
    attackRange: 2.5,
    attackDamage: 25,
    attackCooldown: 2.0,
    headColor: '#3a3a4a'
  }
};

const BULLET_HIT_RADIUS = 1.2;
const BULLET_DAMAGE = 20;

const _toPlayer = new Vector3();
const _bulletPos = new Vector3();
const _enemyPos = new Vector3();

export const Enemy = ({ id, type, startPosition }) => {
  const bodyRef = useRef();
  const attackTimer = useRef(0);
  const isWindingUp = useRef(false);
  const windupTimer = useRef(0);
  const config = ENEMY_CONFIG[type];
  const { camera } = useThree();

  // For chucker projectiles
  const projectilesRef = useRef([]);

  useFrame((_, delta) => {
    const state = useGameStore.getState();
    if (state.gameState !== 'playing') return;

    const body = bodyRef.current;
    if (!body) return;

    const pos = body.translation();
    const playerPos = camera.position;

    // --- Bullet collision check ---
    _enemyPos.set(pos.x, pos.y, pos.z);
    const bullets = getBullets();
    for (const bullet of bullets) {
      _bulletPos.copy(bullet.position);
      const dist = _enemyPos.distanceTo(_bulletPos);
      if (dist < BULLET_HIT_RADIUS) {
        removeBulletById(bullet.id);
        const killed = state.damageEnemy(id, BULLET_DAMAGE);
        if (killed) return; // Enemy removed, stop processing
      }
    }

    // --- Movement AI ---
    _toPlayer.set(playerPos.x - pos.x, 0, playerPos.z - pos.z);
    const distToPlayer = _toPlayer.length();

    if (type === 'chucker') {
      // Chucker: maintain distance
      if (distToPlayer < config.preferredRange - 2) {
        // Too close, back away
        _toPlayer.normalize().multiplyScalar(-config.speed);
      } else if (distToPlayer > config.preferredRange + 2) {
        // Too far, approach
        _toPlayer.normalize().multiplyScalar(config.speed);
      } else {
        // Strafe
        const strafeDir = new Vector3(-_toPlayer.z, 0, _toPlayer.x).normalize();
        _toPlayer.copy(strafeDir).multiplyScalar(config.speed * 0.5);
      }
    } else {
      // Grunt & Titan: move toward player
      if (distToPlayer > config.attackRange * 0.8) {
        _toPlayer.normalize().multiplyScalar(config.speed);
      } else {
        _toPlayer.set(0, 0, 0);
      }
    }

    const currentVel = body.linvel();
    body.setLinvel({ x: _toPlayer.x, y: currentVel.y, z: _toPlayer.z }, true);

    // --- Attack ---
    attackTimer.current += delta;

    if (type === 'titan' && distToPlayer < config.attackRange) {
      // Wind-up animation for titan
      if (
        !isWindingUp.current &&
        attackTimer.current >= config.attackCooldown
      ) {
        isWindingUp.current = true;
        windupTimer.current = 0;
      }
      if (isWindingUp.current) {
        windupTimer.current += delta;
        if (windupTimer.current >= 0.5) {
          // Attack!
          state.takeDamage(config.attackDamage);
          attackTimer.current = 0;
          isWindingUp.current = false;
        }
      }
    } else if (type === 'chucker' && distToPlayer < config.attackRange) {
      if (attackTimer.current >= config.attackCooldown) {
        attackTimer.current = 0;
        // Spawn a projectile toward player
        const projDir = new Vector3(
          playerPos.x - pos.x,
          playerPos.y - pos.y,
          playerPos.z - pos.z
        ).normalize();
        projectilesRef.current.push({
          position: new Vector3(pos.x, pos.y + 1, pos.z),
          direction: projDir,
          distance: 0
        });
      }
    } else if (type === 'grunt' && distToPlayer < config.attackRange) {
      if (attackTimer.current >= config.attackCooldown) {
        attackTimer.current = 0;
        state.takeDamage(config.attackDamage);
      }
    }

    // Update chucker projectiles
    if (type === 'chucker') {
      projectilesRef.current = projectilesRef.current.filter(proj => {
        proj.position.addScaledVector(
          proj.direction,
          config.projectileSpeed * delta
        );
        proj.distance += config.projectileSpeed * delta;

        // Check hitting player
        const distToPlayerProj = proj.position.distanceTo(playerPos);
        if (distToPlayerProj < 1.0) {
          state.takeDamage(config.attackDamage);
          return false;
        }
        return proj.distance < 30;
      });
    }
  });

  const bodyHeight = config.bodyScale[1];
  const headY = bodyHeight / 2 + config.headScale[1] / 2 + 0.05;

  return (
    <RigidBody
      ref={bodyRef}
      position={startPosition}
      enabledRotations={[false, false, false]}
      linearDamping={2}
      mass={type === 'titan' ? 5 : 1}
      type="dynamic"
      colliders={false}
    >
      <CapsuleCollider
        args={[bodyHeight / 2, config.bodyScale[0] / 2]}
        position={[0, bodyHeight / 2 + 0.5, 0]}
      />
      {/* Body */}
      <mesh castShadow position={[0, bodyHeight / 2 + 0.5, 0]}>
        <boxGeometry args={config.bodyScale} />
        <meshStandardMaterial color={config.color} />
      </mesh>
      {/* Head */}
      <mesh castShadow position={[0, headY + 0.5, 0]}>
        <boxGeometry args={config.headScale} />
        <meshStandardMaterial color={config.headColor} />
      </mesh>
      {/* Chucker projectiles rendered as children */}
      {type === 'chucker' && (
        <ChuckerProjectiles projectilesRef={projectilesRef} />
      )}
    </RigidBody>
  );
};

// Separate component to render chucker projectiles
const ChuckerProjectiles = ({ projectilesRef }) => {
  const groupRef = useRef();

  useFrame(() => {
    // This is a simple approach - render projectiles as individual meshes
    // For better perf could use instanced mesh
  });

  return (
    <group ref={groupRef}>
      {/* Projectiles are managed imperatively in the parent useFrame */}
    </group>
  );
};
