import React, { useEffect, useRef, useState } from 'react';
import { FaTimes, FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaExpand, FaCompress, FaStepForward, FaStepBackward } from 'react-icons/fa';
import { FileItem } from '../../types';
import './VideoPlayer.css';

interface VideoPlayerProps {
  videos: FileItem[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videos,
  currentIndex,
  onClose,
  onNext,
  onPrevious,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

  const currentVideo = videos[currentIndex];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (currentIndex < videos.length - 1) {
        onNext();
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentIndex, videos.length, onNext]);

  useEffect(() => {
    // Reset video when changing videos
    setIsPlaying(false);
    setCurrentTime(0);
  }, [currentIndex]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        togglePlayPause();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(0, currentTime - 5);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.currentTime = Math.min(duration, currentTime + 5);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        handleVolumeChange({ target: { value: Math.min(1, volume + 0.1).toString() } } as any);
        break;
      case 'ArrowDown':
        e.preventDefault();
        handleVolumeChange({ target: { value: Math.max(0, volume - 0.1).toString() } } as any);
        break;
      case 'm':
        e.preventDefault();
        toggleMute();
        break;
      case 'f':
        e.preventDefault();
        toggleFullscreen();
        break;
      case 'Escape':
        if (!document.fullscreenElement) {
          onClose();
        }
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    };
  }, [isPlaying, volume, currentTime, duration]);

  return (
    <div className="video-player-overlay" onClick={onClose}>
      <div
        ref={containerRef}
        className={`video-player-container ${isFullscreen ? 'fullscreen' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onMouseMove={handleMouseMove}
      >
        <button className="close-button" onClick={onClose} title="Cerrar (Esc)">
          <FaTimes />
        </button>

        <video
          ref={videoRef}
          src={currentVideo.cloudinary_url}
          className="video-element"
          onClick={togglePlayPause}
        />

        <div className={`video-controls ${showControls ? 'visible' : ''}`}>
          <div className="progress-bar-container">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="progress-bar"
            />
            <div className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="control-buttons">
            <div className="left-controls">
              <button onClick={togglePlayPause} title={isPlaying ? 'Pausar (Espacio)' : 'Reproducir (Espacio)'}>
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>

              {currentIndex > 0 && (
                <button onClick={onPrevious} title="Video anterior">
                  <FaStepBackward />
                </button>
              )}

              {currentIndex < videos.length - 1 && (
                <button onClick={onNext} title="Video siguiente">
                  <FaStepForward />
                </button>
              )}

              <button onClick={toggleMute} title={isMuted ? 'Activar sonido (M)' : 'Silenciar (M)'}>
                {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="volume-slider"
                title="Volumen"
              />
            </div>

            <div className="center-info">
              <span className="video-title">{currentVideo.original_name}</span>
              <span className="video-counter">
                {currentIndex + 1} / {videos.length}
              </span>
            </div>

            <div className="right-controls">
              <button onClick={toggleFullscreen} title={isFullscreen ? 'Salir de pantalla completa (F)' : 'Pantalla completa (F)'}>
                {isFullscreen ? <FaCompress /> : <FaExpand />}
              </button>
            </div>
          </div>
        </div>

        {currentVideo.description && (
          <div className="video-description">
            {currentVideo.description}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
