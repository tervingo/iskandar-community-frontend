import React, { useState, useRef, useEffect } from 'react';

interface CameraTestProps {
  onClose: () => void;
}

const CameraTest: React.FC<CameraTestProps> = ({ onClose }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const testCamera = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Testing camera access...');

      // Request camera and microphone permissions
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });

      console.log('Camera access granted:', mediaStream);
      setStream(mediaStream);

      // Display video in the video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        console.log('Video playing in element');
      }

    } catch (err) {
      console.error('Camera test failed:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Permisos de cámara denegados. Por favor, permite el acceso a la cámara en tu navegador.');
        } else if (err.name === 'NotFoundError') {
          setError('No se encontró ninguna cámara. Verifica que tu cámara esté conectada.');
        } else if (err.name === 'NotReadableError') {
          setError('La cámara está siendo usada por otra aplicación.');
        } else {
          setError(`Error de cámara: ${err.message}`);
        }
      } else {
        setError('Error desconocido al acceder a la cámara.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
      });
      setStream(null);
    }
  };

  useEffect(() => {
    // Auto-start camera test when component mounts
    testCamera();

    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>Test de Cámara</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>Solicitando permisos de cámara...</p>
            </div>
          )}

          {error && (
            <div style={{
              background: '#ff4444',
              color: 'white',
              padding: '10px',
              borderRadius: '5px',
              marginBottom: '20px'
            }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {stream && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'green', marginBottom: '10px' }}>
                ✅ Cámara funcionando correctamente
              </p>
              <video
                ref={videoRef}
                autoPlay
                muted
                style={{
                  width: '100%',
                  maxWidth: '500px',
                  height: 'auto',
                  border: '2px solid #007bff',
                  borderRadius: '8px'
                }}
              />
              <div style={{ marginTop: '10px' }}>
                <p><strong>Tracks activos:</strong></p>
                <ul style={{ textAlign: 'left', display: 'inline-block' }}>
                  {stream.getTracks().map((track, index) => (
                    <li key={index}>
                      {track.kind}: {track.enabled ? 'Activo' : 'Inactivo'}
                      ({track.readyState})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            {!stream && !isLoading && (
              <button
                onClick={testCamera}
                className="btn btn-primary"
                style={{ marginRight: '10px' }}
              >
                Probar Cámara
              </button>
            )}
            {stream && (
              <button
                onClick={stopCamera}
                className="btn btn-secondary"
                style={{ marginRight: '10px' }}
              >
                Detener Cámara
              </button>
            )}
            <button onClick={onClose} className="btn btn-secondary">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraTest;