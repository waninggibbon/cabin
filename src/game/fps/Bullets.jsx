import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { getBullets } from './Gun';
import { InstancedMesh, Matrix4, Vector3, Color } from 'three';

const MAX_BULLETS = 100;
const BULLET_COLOR = new Color('#ffaa22');
const _matrix = new Matrix4();
const _pos = new Vector3();

export const Bullets = () => {
  const meshRef = useRef();

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const bullets = getBullets();
    mesh.count = bullets.length;

    for (let i = 0; i < bullets.length; i++) {
      const b = bullets[i];
      _pos.copy(b.position);
      _matrix.makeTranslation(_pos.x, _pos.y, _pos.z);
      mesh.setMatrixAt(i, _matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, MAX_BULLETS]}
      frustumCulled={false}
    >
      <sphereGeometry args={[0.08, 6, 6]} />
      <meshBasicMaterial color={BULLET_COLOR} />
    </instancedMesh>
  );
};
