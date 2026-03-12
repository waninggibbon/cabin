import { useGameStore } from '../../game/fps/useGameStore';

export const FpsHud = () => {
  const gameState = useGameStore(s => s.gameState);
  const wave = useGameStore(s => s.wave);
  const health = useGameStore(s => s.health);
  const maxHealth = useGameStore(s => s.maxHealth);
  const ammo = useGameStore(s => s.ammo);
  const maxAmmo = useGameStore(s => s.maxAmmo);
  const isReloading = useGameStore(s => s.isReloading);
  const kills = useGameStore(s => s.kills);
  const score = useGameStore(s => s.score);

  const healthPercent = (health / maxHealth) * 100;
  const healthColor =
    healthPercent > 60 ? '#22c725' : healthPercent > 30 ? '#ffaa22' : '#ff3333';

  if (gameState === 'menu') return null;

  return (
    <div className="fixed inset-0 z-20 pointer-events-none">
      {/* Crosshair */}
      {(gameState === 'playing' || gameState === 'waveIntro') && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            style={{
              width: '2px',
              height: '20px',
              background: 'rgba(255,255,255,0.7)',
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          />
          <div
            style={{
              width: '20px',
              height: '2px',
              background: 'rgba(255,255,255,0.7)',
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          />
        </div>
      )}

      {/* Wave indicator (top center) */}
      {(gameState === 'playing' || gameState === 'waveIntro') && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white text-xl tracking-widest opacity-60">
          WAVE {wave}
        </div>
      )}

      {/* Kill counter (top right) */}
      {(gameState === 'playing' || gameState === 'waveIntro') && (
        <div className="absolute top-6 right-8 text-white text-lg opacity-60">
          KILLS {kills}
        </div>
      )}

      {/* Health bar (bottom left) */}
      {(gameState === 'playing' || gameState === 'waveIntro') && (
        <div className="absolute bottom-8 left-8 flex items-center gap-2">
          <span className="text-white text-sm opacity-60">HP</span>
          <div
            style={{
              width: '150px',
              height: '12px',
              background: 'rgba(0,0,0,0.5)',
              borderRadius: '2px',
              border: '1px solid rgba(255,255,255,0.2)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${healthPercent}%`,
                height: '100%',
                background: healthColor,
                transition: 'width 0.3s, background-color 0.3s'
              }}
            />
          </div>
          <span className="text-white text-sm opacity-60">{health}</span>
        </div>
      )}

      {/* Ammo counter (bottom right) */}
      {(gameState === 'playing' || gameState === 'waveIntro') && (
        <div className="absolute bottom-8 right-8 text-white text-lg">
          {isReloading ? (
            <span className="text-yellow-400 animate-pulse">RELOADING...</span>
          ) : (
            <span style={{ opacity: 0.8 }}>
              {ammo} <span style={{ opacity: 0.4 }}>/ {maxAmmo}</span>
            </span>
          )}
        </div>
      )}

      {/* Wave Imminent */}
      {gameState === 'waveIntro' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="text-white text-4xl tracking-widest animate-pulse"
            style={{ textShadow: '0 0 20px rgba(130,0,236,0.8)' }}
          >
            WAVE {wave} IMMINENT
          </div>
        </div>
      )}

      {/* Game Over */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
          <div
            className="text-center p-8 rounded-lg"
            style={{
              background: 'rgba(0,0,0,0.85)',
              border: '2px solid rgba(255,255,255,0.1)'
            }}
          >
            <div
              className="text-red-500 text-5xl mb-4"
              style={{ textShadow: '0 0 15px rgba(255,0,0,0.5)' }}
            >
              GAME OVER
            </div>
            <div className="text-white text-xl mb-2 opacity-70">
              Waves Survived: {wave}
            </div>
            <div className="text-white text-xl mb-2 opacity-70">
              Kills: {kills}
            </div>
            <div className="text-white text-xl mb-6 opacity-70">
              Score: {score}
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => useGameStore.getState().startGame()}
                className="px-6 py-3 text-white text-lg rounded cursor-pointer transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #8200ec, #6f00e5)',
                  border: '2px solid #8b5cf6'
                }}
              >
                PLAY AGAIN
              </button>
              <button
                onClick={() => useGameStore.getState().returnToMenu()}
                className="px-6 py-3 text-white text-lg rounded cursor-pointer transition-all hover:scale-105"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '2px solid rgba(255,255,255,0.2)'
                }}
              >
                MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click to start hint */}
      {(gameState === 'playing' || gameState === 'waveIntro') && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 text-white text-sm opacity-30 hidden md:block">
          Click to lock cursor • ESC to unlock
        </div>
      )}
    </div>
  );
};
