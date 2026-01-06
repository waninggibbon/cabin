import { Button } from './Button';
import { useState } from 'react';

export const Mute = () => {
  const [isMuted, setIsMuted] = useState(false);

  return (
    <Button onClick={() => setIsMuted(!isMuted)}>
      {isMuted ? 'unmute' : 'mute'}
    </Button>
  );
};
