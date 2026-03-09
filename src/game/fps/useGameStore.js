import { create } from 'zustand';

// Wave configuration: defines enemy composition per wave
const WAVE_CONFIG = [
  { grunts: 5, chuckers: 0, titans: 0 }, // Wave 1
  { grunts: 8, chuckers: 0, titans: 0 }, // Wave 2
  { grunts: 6, chuckers: 2, titans: 0 }, // Wave 3
  { grunts: 8, chuckers: 3, titans: 0 }, // Wave 4
  { grunts: 10, chuckers: 4, titans: 1 } // Wave 5
];

// For waves beyond the config, scale with a formula
const getWaveEnemies = waveNumber => {
  if (waveNumber <= WAVE_CONFIG.length) {
    return WAVE_CONFIG[waveNumber - 1];
  }
  // Formula-based scaling for wave 6+
  const w = waveNumber;
  return {
    grunts: 8 + w * 2,
    chuckers: 2 + Math.floor(w * 1.5),
    titans: Math.floor(w / 3)
  };
};

const INITIAL_STATE = {
  gameState: 'menu', // 'menu' | 'playing' | 'waveIntro' | 'paused' | 'gameover'
  wave: 0,
  health: 100,
  maxHealth: 100,
  ammo: 12,
  maxAmmo: 12,
  isReloading: false,
  shotsFired: 0,
  kills: 0,
  score: 0,
  enemies: [], // Array of { id, type, health, maxHealth }
  enemiesRemaining: 0,
  bullets: [] // Array of { id, position, direction }
};

let enemyIdCounter = 0;
let bulletIdCounter = 0;

export const useGameStore = create((set, get) => ({
  ...INITIAL_STATE,

  // --- Game Flow ---
  startGame: () => {
    enemyIdCounter = 0;
    bulletIdCounter = 0;
    set({
      ...INITIAL_STATE,
      gameState: 'waveIntro',
      wave: 1
    });
  },

  pauseGame: () => set({ gameState: 'paused' }),

  resumeGame: () => set({ gameState: 'playing' }),

  gameOver: () => set({ gameState: 'gameover' }),

  returnToMenu: () => set({ ...INITIAL_STATE }),

  // --- Wave Management ---
  startWave: () => {
    set({ gameState: 'playing' });
  },

  nextWave: () => {
    const { wave } = get();
    set({
      gameState: 'waveIntro',
      wave: wave + 1
    });
  },

  getWaveEnemies: () => {
    const { wave } = get();
    return getWaveEnemies(wave);
  },

  // --- Enemy Management ---
  spawnEnemy: (type, position) => {
    const id = ++enemyIdCounter;
    const healthMap = { grunt: 30, chucker: 50, titan: 150 };
    const enemy = {
      id,
      type,
      health: healthMap[type] || 30,
      maxHealth: healthMap[type] || 30,
      position
    };
    set(state => ({
      enemies: [...state.enemies, enemy],
      enemiesRemaining: state.enemiesRemaining + 1
    }));
    return id;
  },

  damageEnemy: (id, damage) => {
    const { enemies } = get();
    const enemy = enemies.find(e => e.id === id);
    if (!enemy) return false;

    const newHealth = enemy.health - damage;
    if (newHealth <= 0) {
      // Enemy killed
      const scoreMap = { grunt: 10, chucker: 25, titan: 50 };
      set(state => ({
        enemies: state.enemies.filter(e => e.id !== id),
        enemiesRemaining: state.enemiesRemaining - 1,
        kills: state.kills + 1,
        score: state.score + (scoreMap[enemy.type] || 10)
      }));
      return true; // killed
    } else {
      set(state => ({
        enemies: state.enemies.map(e =>
          e.id === id ? { ...e, health: newHealth } : e
        )
      }));
      return false; // damaged but alive
    }
  },

  removeEnemy: id => {
    set(state => ({
      enemies: state.enemies.filter(e => e.id !== id),
      enemiesRemaining: state.enemiesRemaining - 1
    }));
  },

  // --- Player ---
  takeDamage: amount => {
    const { health } = get();
    const newHealth = Math.max(0, health - amount);
    set({ health: newHealth });
    if (newHealth <= 0) {
      get().gameOver();
    }
  },

  heal: amount => {
    const { health, maxHealth } = get();
    set({ health: Math.min(maxHealth, health + amount) });
  },

  // --- Shooting ---
  shoot: () => {
    const { ammo, isReloading } = get();
    if (isReloading || ammo <= 0) return false;

    set(state => ({ ammo: ammo - 1, shotsFired: state.shotsFired + 1 }));

    // Auto-reload when empty
    if (ammo - 1 <= 0) {
      get().startReload();
    }
    return true;
  },

  startReload: () => {
    set({ isReloading: true });
  },

  finishReload: () => {
    const { maxAmmo } = get();
    set({ ammo: maxAmmo, isReloading: false });
  },

  // --- Bullet Management ---
  addBullet: (position, direction) => {
    const id = ++bulletIdCounter;
    set(state => ({
      bullets: [...state.bullets, { id, position, direction }]
    }));
    return id;
  },

  removeBullet: id => {
    set(state => ({
      bullets: state.bullets.filter(b => b.id !== id)
    }));
  },

  clearBullets: () => {
    set({ bullets: [] });
  }
}));
