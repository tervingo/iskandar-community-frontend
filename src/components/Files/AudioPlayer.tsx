import React, { useState, useRef, useEffect } from 'react';
import { FileItem } from '../../types';

interface AudioPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  audioFiles: FileItem[];
  currentIndex: number;
  onNavigate: (index: number) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  isOpen,
  onClose,
  audioFiles,
  currentIndex,
  onNavigate
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentAudio = audioFiles[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(prev => Math.min(1, prev + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(prev => Math.max(0, prev - 0.1));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, audioFiles.length, isPlaying]);

  useEffect(() => {
    if (audioRef.current && currentAudio) {
      setLoading(true);
      setError(null);
      setIsPlaying(false);
      setCurrentTime(0);
      audioRef.current.load();
    }
  }, [currentAudio]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const goToNext = () => {
    if (currentIndex < audioFiles.length - 1) {
      onNavigate(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setLoading(false);
    }
  };

  const handleCanPlay = () => {
    setLoading(false);
    setError(null);
  };

  const handleError = () => {
    setLoading(false);
    setError('Failed to load audio file');
    setIsPlaying(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    // Auto-play next track if available
    if (currentIndex < audioFiles.length - 1) {
      goToNext();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = async () => {
    if (!currentAudio) return;

    try {
      const link = document.createElement('a');
      link.href = currentAudio.cloudinary_url;
      link.download = currentAudio.original_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (!isOpen || !currentAudio) return null;

  return (
    <div className="audio-player-overlay" onClick={onClose}>
      <div className="audio-player-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="audio-player-header">
          <div className="audio-info">
            <h3>{currentAudio.original_name}</h3>
            <span className="audio-counter">
              {currentIndex + 1} of {audioFiles.length}
            </span>
          </div>
          <div className="audio-controls-header">
            <button 
              onClick={handleDownload}
              className="btn btn-sm btn-secondary"
              title="Download audio file"
            >
              📥 Download
            </button>
            <button 
              onClick={onClose}
              className="btn btn-sm btn-secondary"
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Audio Element */}
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={handleCanPlay}
          onError={handleError}
          onEnded={handleEnded}
          preload="metadata"
        >
          <source src={currentAudio.cloudinary_url} />
          Your browser does not support the audio element.
        </audio>

        {/* Main Player Area */}
        <div className="audio-player-main">
          {/* Album Art / Waveform Placeholder */}
          <div className="audio-visual">
            <div className="audio-icon">
              🎵
            </div>
            {loading && (
              <div className="audio-loading">
                Loading audio...
              </div>
            )}
            {error && (
              <div className="audio-error">
                <p>{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="btn btn-sm btn-primary"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* Playback Controls */}
          <div className="audio-controls">
            <div className="audio-buttons">
              <button
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                className="btn btn-secondary"
                title="Previous track (←)"
              >
                ⏮
              </button>
              
              <button
                onClick={togglePlay}
                disabled={loading || !!error}
                className="btn btn-primary play-pause-btn"
                title="Play/Pause (Space)"
              >
                {loading ? '⏳' : isPlaying ? '⏸' : '▶'}
              </button>
              
              <button
                onClick={goToNext}
                disabled={currentIndex === audioFiles.length - 1}
                className="btn btn-secondary"
                title="Next track (→)"
              >
                ⏭
              </button>
            </div>

            {/* Progress Bar */}
            <div className="audio-progress">
              <span className="time-display">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="progress-slider"
                disabled={loading || !!error}
              />
              <span className="time-display">{formatTime(duration)}</span>
            </div>

            {/* Volume Control */}
            <div className="volume-control">
              <span className="volume-icon">🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="volume-slider"
                title="Volume (↑/↓)"
              />
              <span className="volume-display">{Math.round(volume * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Audio Metadata */}
        <div className="audio-metadata">
          {currentAudio.description && (
            <p className="audio-description">{currentAudio.description}</p>
          )}
          <div className="audio-details">
            <span>Uploaded by {currentAudio.uploaded_by}</span>
            <span>•</span>
            <span>{new Date(currentAudio.uploaded_at).toLocaleDateString()}</span>
            <span>•</span>
            <span>{(currentAudio.file_size / 1024).toFixed(1)} KB</span>
          </div>
        </div>

        {/* Playlist */}
        {audioFiles.length > 1 && (
          <div className="audio-playlist">
            <h4>Playlist ({audioFiles.length} tracks)</h4>
            <div className="playlist-items">
              {audioFiles.map((audio, index) => (
                <button
                  key={audio.id}
                  className={`playlist-item ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => onNavigate(index)}
                  title={audio.original_name}
                >
                  <div className="playlist-icon">
                    {index === currentIndex && isPlaying ? '🎵' : '🎶'}
                  </div>
                  <div className="playlist-info">
                    <div className="playlist-name">{audio.original_name}</div>
                    <div className="playlist-meta">
                      {audio.uploaded_by} • {(audio.file_size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <div className="playlist-status">
                    {index === currentIndex && (
                      <span className="current-indicator">▶</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioPlayer;