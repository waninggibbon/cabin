import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from './useGameStore';
import { Enemy } from './Enemy';
import { ARENA_SIZE } from './Arena';

const HALF = ARENA_SIZE / 2;
const SPAWN_MARGIN = 2; // Offset from fence
const SPAWN_RATE = 0.4; // seconds between individual enemy spawns
const WAVE_INTRO_DURATION = 3; // seconds to show "WAVE X" before starting

const getSpawnPosition = () => {
  // Spawn along a random edge of the fence
  const side = Math.floor(Math.random() * 4);
  const offset = (Math.random() - 0.5) * (ARENA_SIZE - SPAWN_MARGIN * 2);

  switch (side) {
    case 0:
      return [offset, 2, -(HALF - SPAWN_MARGIN)]; // North
    case 1:
      return [offset, 2, HALF - SPAWN_MARGIN]; // South
    case 2:
      return [HALF - SPAWN_MARGIN, 2, offset]; // East
    case 3:
      return [-(HALF - SPAWN_MARGIN), 2, offset]; // West
    default:
      return [offset, 2, -(HALF - SPAWN_MARGIN)];
  }
};

export const WaveManager = () => {
  const [spawnedEnemies, setSpawnedEnemies] = useState([]);
  const spawnQueue = useRef([]);
  const spawnTimer = useRef(0);
  const introTimer = useRef(0);
  const waveStarted = useRef(false);

  const gameState = useGameStore(s => s.gameState);
  const wave = useGameStore(s => s.wave);
  const enemiesRemaining = useGameStore(s => s.enemiesRemaining);

  // When entering waveIntro, build the spawn queue
  useEffect(() => {
    if (gameState === 'waveIntro') {
      introTimer.current = 0;
      waveStarted.current = false;

      const config = useGameStore.getState().getWaveEnemies();
      const queue = [];

      for (let i = 0; i < config.grunts; i++) queue.push('grunt');
      for (let i = 0; i < config.chuckers; i++) queue.push('chucker');
      for (let i = 0; i < config.titans; i++) queue.push('titan');

      // Shuffle
      for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue[i], queue[j]] = [queue[j], queue[i]];
      }

      spawnQueue.current = queue;
      spawnTimer.current = 0;
    }
  }, [gameState, wave]);

  // Check if wave is complete
  useEffect(() => {
    if (
      gameState === 'playing' &&
      waveStarted.current &&
      spawnQueue.current.length === 0 &&
      enemiesRemaining <= 0
    ) {
      // All enemies defeated, next wave
      useGameStore.getState().nextWave();
    }
  }, [gameState, enemiesRemaining]);

  useFrame((_, delta) => {
    if (gameState === 'waveIntro') {
      introTimer.current += delta;
      if (introTimer.current >= WAVE_INTRO_DURATION) {
        useGameStore.getState().startWave();
        waveStarted.current = true;
      }
      return;
    }

    if (gameState !== 'playing') return;

    // Spawn enemies from queue
    if (spawnQueue.current.length > 0) {
      spawnTimer.current += delta;
      if (spawnTimer.current >= SPAWN_RATE) {
        spawnTimer.current = 0;
        const type = spawnQueue.current.shift();
        const position = getSpawnPosition();
        const id = useGameStore.getState().spawnEnemy(type, position);
        setSpawnedEnemies(prev => [...prev, { id, type, position }]);
      }
    }
  });

  // Clean up enemies that have been removed from the store
  const storeEnemies = useGameStore(s => s.enemies);
  const storeEnemyIds = new Set(storeEnemies.map(e => e.id));

  const activeEnemies = spawnedEnemies.filter(e => storeEnemyIds.has(e.id));

  // Sync if different (enemies died)
  useEffect(() => {
    if (activeEnemies.length !== spawnedEnemies.length) {
      setSpawnedEnemies(activeEnemies);
    }
  }, [storeEnemies]);

  // Reset on new game
  useEffect(() => {
    if (gameState === 'menu') {
      setSpawnedEnemies([]);
      spawnQueue.current = [];
    }
  }, [gameState]);

  return (
    <group>
      {activeEnemies.map(enemy => (
        <Enemy
          key={enemy.id}
          id={enemy.id}
          type={enemy.type}
          startPosition={enemy.position}
        />
      ))}
    </group>
  );
};
