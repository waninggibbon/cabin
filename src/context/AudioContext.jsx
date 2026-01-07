import { createContext, useContext, useEffect, useRef, useState } from 'react';

const AudioContext = createContext(null);

const PLAYLIST = ['/music/in-the-outer-wilds.mp3', '/music/song-of-storms.mp3'];

export const AudioProvider = ({ children }) => {
  const audioRef = useRef(new Audio(PLAYLIST[0]));
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    audio.loop = true;
    audio.volume = 0.5;
    audio.src = PLAYLIST[currentTrackIndex];

    return () => {
      audio.pause();
    };
  }, []); // Run once on mount

  useEffect(() => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.play().catch(e => {
        console.error('Playback failed:', e);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Handle Mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Handle Track Change
  useEffect(() => {
    const audio = audioRef.current;
    const wasPlaying = !audio.paused;

    audio.src = PLAYLIST[currentTrackIndex];
    if (wasPlaying || isPlaying) {
      audio.play().catch(e => console.error('Track change play failed:', e));
    }
  }, [currentTrackIndex]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    setCurrentTrackIndex(prev => (prev + 1) % PLAYLIST.length);
    setIsPlaying(true); // Auto-play when skipping
  };

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        isMuted,
        toggleMute,
        togglePlay,
        nextTrack,
        currentTrackIndex
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
