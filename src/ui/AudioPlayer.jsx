import { Button } from './Button';
import { useAudio } from '../context/AudioContext';
import { Play, Pause, SkipForward, Volume2, VolumeX } from 'lucide-react';

export const AudioPlayer = () => {
  const { isPlaying, togglePlay, nextTrack, isMuted, toggleMute } = useAudio();

  return (
    <div className="flex gap-4">
      <Button
        onClick={togglePlay}
        variant={isPlaying ? 'attention' : 'default'}
      >
        {isPlaying ? <Pause /> : <Play />}
      </Button>

      <Button onClick={nextTrack}>
        <SkipForward />
      </Button>

      <Button onClick={toggleMute}>
        {isMuted ? <VolumeX /> : <Volume2 />}
      </Button>
    </div>
  );
};
