import { useRef, useState, useCallback, useEffect } from 'react';
import { touchMoveRef, touchLookRef } from '../../game/fps/usePlayerControls';

const STICK_SIZE = 120;
const THUMB_SIZE = 50;
const DEAD_ZONE = 5;

const Stick = ({ side, onInput }) => {
  const stickRef = useRef(null);
  const [thumbPos, setThumbPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const touchIdRef = useRef(null);
  const centerRef = useRef({ x: 0, y: 0 });

  const handleStart = useCallback(e => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    const rect = stickRef.current.getBoundingClientRect();
    centerRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    setIsActive(true);
    handleMove(touch);
  }, []);

  const handleMove = useCallback(
    touch => {
      const dx = touch.clientX - centerRef.current.x;
      const dy = touch.clientY - centerRef.current.y;
      const maxRadius = STICK_SIZE / 2 - THUMB_SIZE / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let clampedX = dx;
      let clampedY = dy;
      if (dist > maxRadius) {
        clampedX = (dx / dist) * maxRadius;
        clampedY = (dy / dist) * maxRadius;
      }

      setThumbPos({ x: clampedX, y: clampedY });

      // Normalize to -1 to 1
      let normX = clampedX / maxRadius;
      let normY = clampedY / maxRadius;

      // Apply dead zone
      if (Math.abs(normX) < DEAD_ZONE / maxRadius) normX = 0;
      if (Math.abs(normY) < DEAD_ZONE / maxRadius) normY = 0;

      onInput(normX, normY);
    },
    [onInput]
  );

  const handleEnd = useCallback(() => {
    touchIdRef.current = null;
    setIsActive(false);
    setThumbPos({ x: 0, y: 0 });
    onInput(0, 0);
  }, [onInput]);

  useEffect(() => {
    const onTouchMove = e => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === touchIdRef.current) {
          handleMove(touch);
          break;
        }
      }
    };

    const onTouchEnd = e => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === touchIdRef.current) {
          handleEnd();
          break;
        }
      }
    };

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [handleMove, handleEnd]);

  return (
    <div
      ref={stickRef}
      onTouchStart={handleStart}
      className="pointer-events-auto"
      style={{
        position: 'absolute',
        bottom: '40px',
        [side]: '40px',
        width: `${STICK_SIZE}px`,
        height: `${STICK_SIZE}px`,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        border: `2px solid rgba(139, 92, 246, ${isActive ? 0.6 : 0.25})`,
        boxShadow: isActive ? '0 0 20px rgba(139, 92, 246, 0.3)' : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        touchAction: 'none'
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: `${THUMB_SIZE}px`,
          height: `${THUMB_SIZE}px`,
          borderRadius: '50%',
          background: isActive
            ? 'rgba(139, 92, 246, 0.5)'
            : 'rgba(255,255,255,0.15)',
          border: '2px solid rgba(255,255,255,0.3)',
          transform: `translate(calc(-50% + ${thumbPos.x}px), calc(-50% + ${thumbPos.y}px))`,
          transition: isActive ? 'none' : 'transform 0.15s ease-out'
        }}
      />
    </div>
  );
};

export const TouchControls = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const handleMoveInput = useCallback((x, y) => {
    touchMoveRef.current.x = x;
    touchMoveRef.current.y = y;
  }, []);

  const handleLookInput = useCallback((x, y) => {
    touchLookRef.current.x = x;
    touchLookRef.current.y = y;
  }, []);

  if (!isTouchDevice) return null;

  return (
    <>
      <Stick side="left" onInput={handleMoveInput} />
      <Stick side="right" onInput={handleLookInput} />
    </>
  );
};
