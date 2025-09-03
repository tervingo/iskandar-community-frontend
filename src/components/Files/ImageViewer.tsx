import React, { useState, useEffect } from 'react';
import { FileItem } from '../../types';

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  images: FileItem[];
  currentIndex: number;
  onNavigate: (index: number) => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ 
  isOpen, 
  onClose, 
  images, 
  currentIndex, 
  onNavigate 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentImage = images[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      onNavigate(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleImageLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleImageError = () => {
    setLoading(false);
    setError('Failed to load image');
  };

  const handleDownload = async () => {
    if (!currentImage) return;

    try {
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = currentImage.cloudinary_url;
      link.download = currentImage.original_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (!isOpen || !currentImage) return null;

  return (
    <div className="image-viewer-overlay" onClick={onClose}>
      <div className="image-viewer-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="image-viewer-header">
          <div className="image-info">
            <h3>{currentImage.original_name}</h3>
            <span className="image-counter">
              {currentIndex + 1} of {images.length}
            </span>
          </div>
          <div className="image-controls">
            <button 
              onClick={handleDownload}
              className="btn btn-sm btn-secondary"
              title="Download image"
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

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              className="image-nav-btn image-nav-prev"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              title="Previous image (←)"
            >
              ←
            </button>
            <button
              className="image-nav-btn image-nav-next"
              onClick={goToNext}
              disabled={currentIndex === images.length - 1}
              title="Next image (→)"
            >
              →
            </button>
          </>
        )}

        {/* Image container */}
        <div className="image-container">
          {loading && (
            <div className="image-loading">
              Loading image...
            </div>
          )}
          {error && (
            <div className="image-error">
              <p>{error}</p>
              <button 
                onClick={() => setError(null)}
                className="btn btn-sm btn-primary"
              >
                Retry
              </button>
            </div>
          )}
          <img
            src={currentImage.cloudinary_url}
            alt={currentImage.original_name}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ 
              display: error ? 'none' : 'block',
              opacity: loading ? 0 : 1 
            }}
          />
        </div>

        {/* Image metadata */}
        <div className="image-metadata">
          {currentImage.description && (
            <p className="image-description">{currentImage.description}</p>
          )}
          <div className="image-details">
            <span>Uploaded by {currentImage.uploaded_by}</span>
            <span>•</span>
            <span>{new Date(currentImage.uploaded_at).toLocaleDateString()}</span>
            <span>•</span>
            <span>{(currentImage.file_size / 1024).toFixed(1)} KB</span>
          </div>
        </div>

        {/* Thumbnail navigation for multiple images */}
        {images.length > 1 && (
          <div className="image-thumbnails">
            {images.map((image, index) => (
              <button
                key={image.id}
                className={`thumbnail-btn ${index === currentIndex ? 'active' : ''}`}
                onClick={() => onNavigate(index)}
                title={image.original_name}
              >
                <img
                  src={image.cloudinary_url}
                  alt={image.original_name}
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageViewer;