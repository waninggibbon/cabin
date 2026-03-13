import { useEffect, useCallback } from 'react';
import { Game } from '../game';
import { FpsHud } from '../ui/fps/FpsHud';
import { TouchControls } from '../ui/fps/TouchControls';
import { Nav } from '../ui/Nav';
import { useGameStore } from '../game/fps/useGameStore';

export const GamePage = () => {
  const gameState = useGameStore(s => s.gameState);

  useEffect(() => {
    useGameStore.getState().startGame();
  }, []);

  const handleNavToggle = useCallback(open => {
    const { gameState, pauseGame, resumeGame } = useGameStore.getState();
    if (open && (gameState === 'playing' || gameState === 'waveIntro')) {
      pauseGame();
    } else if (!open && gameState === 'paused') {
      resumeGame();
    }
  }, []);

  return (
    <>
      <FpsHud />

      {(gameState === 'playing' || gameState === 'waveIntro') && (
        <div className="fixed inset-0 z-30 pointer-events-none">
          <TouchControls />
        </div>
      )}

      <div className="fixed top-8 right-8 z-40">
        <Nav onToggle={handleNavToggle} />
      </div>

      <Game />
    </>
  );
};
