import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import { useGLTF, useAnimations } from '@react-three/drei';
import { Vector3, LoopOnce } from 'three';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useGameStore } from './useGameStore';
import { getBullets, removeBulletById } from './Gun';

const ENEMY_CONFIG = {
  grunt: {
    speed: 4,
    attackRange: 2,
    attackDamage: 10,
    attackCooldown: 1.0,
    modelPath: '/models/enemies/Zombie_Basic.gltf',
    modelScale: 0.6,
    colliderHeight: 0.5,
    colliderRadius: 0.3
  },
  chucker: {
    speed: 2,
    preferredRange: 12,
    attackRange: 18,
    attackDamage: 8,
    attackCooldown: 2.0,
    projectileSpeed: 10,
    modelPath: '/models/enemies/Zombie_Chucker.gltf',
    modelScale: 0.6,
    colliderHeight: 0.5,
    colliderRadius: 0.35
  },
  titan: {
    speed: 1.5,
    attackRange: 2.5,
    attackDamage: 25,
    attackCooldown: 2.0,
    modelPath: '/models/enemies/Zombie_Titan.gltf',
    modelScale: 0.9,
    colliderHeight: 0.7,
    colliderRadius: 0.45
  }
};

const BULLET_HIT_RADIUS = 1.2;
const BULLET_DAMAGE = 20;

const _toPlayer = new Vector3();
const _bulletPos = new Vector3();
const _enemyPos = new Vector3();

// Preload all enemy models
Object.values(ENEMY_CONFIG).forEach(c => useGLTF.preload(c.modelPath));

const EnemyModel = ({ type, modelRef }) => {
  const config = ENEMY_CONFIG[type];
  const gltf = useGLTF(config.modelPath);

  // Clone the scene so each enemy instance has its own skeleton/materials
  const clonedScene = useMemo(() => skeletonClone(gltf.scene), [gltf.scene]);

  // Set up animations on the cloned scene
  const { actions, mixer } = useAnimations(gltf.animations, clonedScene);

  // Store actions and mixer on the model ref for the parent to control
  useEffect(() => {
    if (modelRef) {
      modelRef.current = { actions, mixer, scene: clonedScene };
    }
  }, [actions, mixer, clonedScene, modelRef]);

  // Start with Walk animation
  useEffect(() => {
    if (actions.Walk) {
      actions.Walk.reset().fadeIn(0.2).play();
    } else if (actions.Run) {
      actions.Run.reset().fadeIn(0.2).play();
    }
  }, [actions]);

  // Clone materials per instance (so hit flash doesn't affect all enemies)
  // and enable shadows
  useEffect(() => {
    clonedScene.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.material = child.material.clone();
      }
    });
  }, [clonedScene]);

  return (
    <primitive
      object={clonedScene}
      scale={config.modelScale}
    />
  );
};

export const Enemy = ({ id, type, startPosition }) => {
  const bodyRef = useRef();
  const modelGroupRef = useRef();
  const modelRef = useRef(null);
  const attackTimer = useRef(0);
  const isWindingUp = useRef(false);
  const windupTimer = useRef(0);
  const currentAnim = useRef('Walk');
  const hitFlashTimer = useRef(0);
  const isDying = useRef(false);
  const deathTimer = useRef(0);
  const meshesCache = useRef(null);
  const config = ENEMY_CONFIG[type];
  const { camera } = useThree();

  // For chucker projectiles
  const projectilesRef = useRef([]);

  const crossFadeTo = (name, duration = 0.2) => {
    const model = modelRef.current;
    if (!model || !model.actions[name] || currentAnim.current === name) return;
    const prev = model.actions[currentAnim.current];
    const next = model.actions[name];
    if (prev) prev.fadeOut(duration);
    next.reset().fadeIn(duration).play();
    currentAnim.current = name;
  };

  useFrame((_, delta) => {
    const state = useGameStore.getState();
    if (state.gameState !== 'playing' && state.gameState !== 'waveIntro') return;

    const body = bodyRef.current;
    if (!body) return;

    // Update animation mixer
    const model = modelRef.current;
    if (model && model.mixer) {
      model.mixer.update(delta);
    }

    // --- Dying state: play death anim, then remove ---
    if (isDying.current) {
      deathTimer.current += delta;
      // Stop all movement
      body.setLinvel({ x: 0, y: body.linvel().y, z: 0 }, true);
      // Remove after death animation plays (2 seconds)
      if (deathTimer.current >= 2.0) {
        state.removeEnemy(id);
      }
      return;
    }

    // Check if store marked us as dying
    const storeEnemy = state.enemies.find(e => e.id === id);
    if (storeEnemy && storeEnemy.dying && !isDying.current) {
      isDying.current = true;
      deathTimer.current = 0;
      // Play death animation
      if (model && model.actions.Death) {
        // Fade out all current animations
        Object.values(model.actions).forEach(a => a.fadeOut(0.15));
        model.actions.Death.reset().fadeIn(0.15).play();
        model.actions.Death.clampWhenFinished = true;
        model.actions.Death.setLoop(LoopOnce, 1);
      }
      return;
    }

    // Cache mesh references once for hit flash
    if (!meshesCache.current && model && model.scene) {
      const meshes = [];
      model.scene.traverse(child => {
        if (child.isMesh && child.material) {
          meshes.push(child);
        }
      });
      meshesCache.current = meshes;
    }

    // Hit flash decay — lerp emissive back to 0
    if (hitFlashTimer.current > 0) {
      hitFlashTimer.current = Math.max(0, hitFlashTimer.current - delta);
      const intensity = hitFlashTimer.current / 0.1; // 0.1s flash duration
      if (meshesCache.current) {
        for (const mesh of meshesCache.current) {
          mesh.material.emissiveIntensity = intensity * 0.6;
        }
      }
    }

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

        // Hit flash — set emissive white, timer handles fade out
        hitFlashTimer.current = 0.1;
        if (meshesCache.current) {
          for (const mesh of meshesCache.current) {
            mesh.material.emissive.setHex(0xffffff);
            mesh.material.emissiveIntensity = 0.6;
          }
        }

        // Play hit react animation briefly
        if (model && model.actions.HitReact) {
          model.actions.HitReact.reset().fadeIn(0.05).play();
          model.actions.HitReact.clampWhenFinished = true;
          model.actions.HitReact.setLoop(LoopOnce, 1);
          setTimeout(() => {
            if (!isDying.current) {
              crossFadeTo(currentAnim.current === 'HitReact' ? 'Walk' : currentAnim.current, 0.15);
            }
          }, 300);
        }

        const killed = state.damageEnemy(id, BULLET_DAMAGE);
        if (killed) return;
      }
    }

    // --- Movement AI ---
    _toPlayer.set(playerPos.x - pos.x, 0, playerPos.z - pos.z);
    const distToPlayer = _toPlayer.length();

    // Rotate model to face player
    if (modelGroupRef.current && distToPlayer > 0.1) {
      const angle = Math.atan2(playerPos.x - pos.x, playerPos.z - pos.z);
      modelGroupRef.current.rotation.y = angle;
    }

    let isMoving = false;

    if (type === 'chucker') {
      if (distToPlayer < config.preferredRange - 2) {
        _toPlayer.normalize().multiplyScalar(-config.speed);
        isMoving = true;
      } else if (distToPlayer > config.preferredRange + 2) {
        _toPlayer.normalize().multiplyScalar(config.speed);
        isMoving = true;
      } else {
        const strafeDir = new Vector3(-_toPlayer.z, 0, _toPlayer.x).normalize();
        _toPlayer.copy(strafeDir).multiplyScalar(config.speed * 0.5);
        isMoving = true;
      }
    } else {
      if (distToPlayer > config.attackRange * 0.8) {
        _toPlayer.normalize().multiplyScalar(config.speed);
        isMoving = true;
      } else {
        _toPlayer.set(0, 0, 0);
      }
    }

    const currentVel = body.linvel();
    body.setLinvel({ x: _toPlayer.x, y: currentVel.y, z: _toPlayer.z }, true);

    // --- Animation state ---
    if (currentAnim.current !== 'HitReact') {
      if (isMoving) {
        crossFadeTo('Walk');
      } else {
        crossFadeTo('Idle');
      }
    }

    // --- Attack ---
    attackTimer.current += delta;

    if (type === 'titan' && distToPlayer < config.attackRange) {
      if (
        !isWindingUp.current &&
        attackTimer.current >= config.attackCooldown
      ) {
        isWindingUp.current = true;
        windupTimer.current = 0;
        crossFadeTo('Punch');
      }
      if (isWindingUp.current) {
        windupTimer.current += delta;
        if (windupTimer.current >= 0.5) {
          state.takeDamage(config.attackDamage);
          attackTimer.current = 0;
          isWindingUp.current = false;
        }
      }
    } else if (type === 'chucker' && distToPlayer < config.attackRange) {
      if (attackTimer.current >= config.attackCooldown) {
        attackTimer.current = 0;
        crossFadeTo('Idle_Attack');
        setTimeout(() => crossFadeTo('Walk', 0.2), 500);
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
        crossFadeTo('Punch');
        setTimeout(() => crossFadeTo('Walk', 0.2), 400);
        state.takeDamage(config.attackDamage);
      }
    }

    // Reset titan wind-up if player moved away
    if (type === 'titan' && isWindingUp.current && distToPlayer >= config.attackRange) {
      isWindingUp.current = false;
    }

    // Update chucker projectiles
    if (type === 'chucker') {
      projectilesRef.current = projectilesRef.current.filter(proj => {
        proj.position.addScaledVector(
          proj.direction,
          config.projectileSpeed * delta
        );
        proj.distance += config.projectileSpeed * delta;

        const distToPlayerProj = proj.position.distanceTo(playerPos);
        if (distToPlayerProj < 1.0) {
          state.takeDamage(config.attackDamage);
          return false;
        }
        return proj.distance < 30;
      });
    }
  });

  const colliderY = config.colliderHeight + 0.3;

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
        args={[config.colliderHeight, config.colliderRadius]}
        position={[0, colliderY, 0]}
      />
      <group ref={modelGroupRef}>
        <EnemyModel type={type} modelRef={modelRef} />
      </group>
      {type === 'chucker' && (
        <ChuckerProjectiles projectilesRef={projectilesRef} />
      )}
    </RigidBody>
  );
};

// Render chucker projectiles as glowing spheres
const ChuckerProjectiles = ({ projectilesRef }) => {
  const meshRefs = useRef([]);

  useFrame(() => {
    const projs = projectilesRef.current;
    meshRefs.current.forEach((mesh, i) => {
      if (mesh && projs[i]) {
        mesh.position.copy(projs[i].position);
        mesh.visible = true;
      } else if (mesh) {
        mesh.visible = false;
      }
    });
  });

  // Render a pool of projectile meshes
  return (
    <group>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh
          key={i}
          ref={el => (meshRefs.current[i] = el)}
          visible={false}
          frustumCulled={false}
        >
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial
            color="#44ff44"
            emissive="#22aa22"
            emissiveIntensity={2}
          />
        </mesh>
      ))}
    </group>
  );
};
