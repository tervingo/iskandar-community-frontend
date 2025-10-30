import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFileStore } from '../stores/fileStore';
import VideoPlayer from '../components/Files/VideoPlayer';

const VideoViewerPage: React.FC = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const { files, fetchFiles } = useFileStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        setLoading(true);
        await fetchFiles();
        setLoading(false);
      } catch (err) {
        console.error('Error loading files:', err);
        setError('Error al cargar los archivos');
        setLoading(false);
      }
    };

    loadFiles();
  }, [fetchFiles]);

  const videoFiles = files.filter(file => file.file_type.startsWith('video/'));
  const currentIndex = videoFiles.findIndex(file => file.id === fileId);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#000',
        color: '#fff',
        fontSize: '1.2rem'
      }}>
        Cargando video...
      </div>
    );
  }

  if (error || currentIndex === -1) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#000',
        color: '#fff',
        gap: '20px'
      }}>
        <h2>Video no encontrado</h2>
        <button
          onClick={() => navigate('/files')}
          style={{
            padding: '10px 20px',
            background: '#667eea',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Volver a Archivos
        </button>
      </div>
    );
  }

  const handleClose = () => {
    window.close();
    // If window.close() doesn't work (not opened by script), navigate back
    setTimeout(() => {
      navigate('/files');
    }, 100);
  };

  const handleNext = () => {
    if (currentIndex < videoFiles.length - 1) {
      navigate(`/video-viewer/${videoFiles[currentIndex + 1].id}`);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      navigate(`/video-viewer/${videoFiles[currentIndex - 1].id}`);
    }
  };

  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      <VideoPlayer
        videos={videoFiles}
        currentIndex={currentIndex}
        onClose={handleClose}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />
    </div>
  );
};

export default VideoViewerPage;
