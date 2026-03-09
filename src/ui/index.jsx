import { Nav } from './Nav';
import { AudioPlayer } from './AudioPlayer';
import { FpsHud } from './fps/FpsHud';
import { TouchControls } from './fps/TouchControls';
import { useGameStore } from '../game/fps/useGameStore';

export const UI = () => {
  const gameState = useGameStore(s => s.gameState);
  const isInGame = gameState !== 'menu';

  return (
    <>
      {/* FPS HUD (always mounted, hides itself when in menu) */}
      <FpsHud />

      {/* Touch controls only during gameplay */}
      {(gameState === 'playing' || gameState === 'waveIntro') && (
        <div className="fixed inset-0 z-30 pointer-events-none">
          <TouchControls />
        </div>
      )}

      {/* Standard site UI (hidden during gameplay) */}
      {!isInGame && (
        <div className="fixed inset-0 z-10 pointer-events-none p-8">
          <div className="mx-auto w-full h-full max-w-[1400px] relative">
            <h1 className="pointer-events-auto absolute top-0 left-0 text-sorc-400 text-4xl">
              nathy.dev
            </h1>

            <div className="md:pointer-events-auto md:absolute md:top-0 md:right-0 md:flex md:gap-4">
              <div className="pointer-events-auto absolute bottom-0 left-1/2 -translate-x-1/2 md:static md:translate-x-0">
                <Nav />
              </div>
              <div className="pointer-events-auto absolute top-0 right-0 md:static">
                <AudioPlayer />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
