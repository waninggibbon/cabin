import { useEffect, useRef, useCallback } from 'react';
import { useThree } from '@react-three/fiber';

// Shared refs that mobile touch controls can write to
export const touchMoveRef = { current: { x: 0, y: 0 } };
export const touchLookRef = { current: { x: 0, y: 0 } };

export const usePlayerControls = () => {
  const keys = useRef({});
  const isPointerLocked = useRef(false);
  const mouseDelta = useRef({ x: 0, y: 0 });
  const { gl } = useThree();

  // Keyboard listeners
  useEffect(() => {
    const onKeyDown = e => {
      keys.current[e.code] = true;
    };
    const onKeyUp = e => {
      keys.current[e.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Pointer lock & mouse move
  useEffect(() => {
    const canvas = gl.domElement;

    const onMouseMove = e => {
      if (isPointerLocked.current) {
        mouseDelta.current.x += e.movementX;
        mouseDelta.current.y += e.movementY;
      }
    };

    const onPointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === canvas;
    };

    const onClick = () => {
      if (!isPointerLocked.current) {
        canvas.requestPointerLock();
      }
    };

    canvas.addEventListener('click', onClick);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onPointerLockChange);

    return () => {
      canvas.removeEventListener('click', onClick);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
    };
  }, [gl]);

  const getMovement = useCallback(() => {
    const k = keys.current;
    let x = 0;
    let z = 0;

    if (k['KeyW'] || k['ArrowUp']) z -= 1;
    if (k['KeyS'] || k['ArrowDown']) z += 1;
    if (k['KeyA'] || k['ArrowLeft']) x -= 1;
    if (k['KeyD'] || k['ArrowRight']) x += 1;

    // Blend in touch input
    x += touchMoveRef.current.x;
    z += touchMoveRef.current.y;

    // Normalize
    const len = Math.sqrt(x * x + z * z);
    if (len > 1) {
      x /= len;
      z /= len;
    }

    return { x, z };
  }, []);

  const getLookDelta = useCallback(() => {
    // Consume mouse delta
    const dx = mouseDelta.current.x;
    const dy = mouseDelta.current.y;
    mouseDelta.current.x = 0;
    mouseDelta.current.y = 0;

    // Blend in touch look input (scaled for feel)
    const touchScale = 3;
    return {
      yaw: dx + touchLookRef.current.x * touchScale,
      pitch: dy + touchLookRef.current.y * touchScale
    };
  }, []);

  return { getMovement, getLookDelta, isPointerLocked };
};
