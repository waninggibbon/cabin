import { Button } from './Button';
import { useAudio } from '../context/AudioContext';
import { Play, Pause, SkipForward, Volume2, VolumeX } from 'lucide-react';

export const AudioPlayer = () => {
  const { isPlaying, togglePlay, isMuted, toggleMute } = useAudio();

  return (
    <div className="flex gap-4">
      {/* 
      TODO: Re-enable pause / play skip if needed in the future
      <Button
        onClick={togglePlay}
        variant={isPlaying ? 'attention' : 'default'}
      >
        {isPlaying ? <Pause /> : <Play />}
      </Button>

      <Button onClick={nextTrack}>
        <SkipForward />
      </Button> */}

      <Button
        onClick={togglePlay}
        variant={!isPlaying ? 'attention' : 'default'}
      >
        {!isPlaying ? <VolumeX /> : <Volume2 />}
      </Button>
    </div>
  );
};
