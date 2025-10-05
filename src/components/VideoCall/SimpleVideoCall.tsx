import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhone } from 'react-icons/fa';

interface SimpleVideoCallProps {
  callId: string;
  onLeave: () => void;
}

const SimpleVideoCall: React.FC<SimpleVideoCallProps> = ({ callId, onLeave }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    initializeCall();

    return () => {
      cleanup();
    };
  }, []);

  const initializeCall = async () => {
    try {
      console.log('SimpleVideoCall: Initializing call...');

      // Request media permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('SimpleVideoCall: Media stream obtained:', stream);
      setLocalStream(stream);

      // Display local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play();
        console.log('SimpleVideoCall: Local video playing');
      }

      setIsInitialized(true);
      console.log('SimpleVideoCall: Initialization complete');

    } catch (err) {
      console.error('SimpleVideoCall: Initialization failed:', err);

      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Permisos de cámara/micrófono denegados. Por favor, permite el acceso en tu navegador.');
        } else if (err.name === 'NotFoundError') {
          setError('No se encontró cámara o micrófono. Verifica que estén conectados.');
        } else if (err.name === 'NotReadableError') {
          setError('Cámara o micrófono en uso por otra aplicación.');
        } else {
          setError(`Error de medios: ${err.message}`);
        }
      } else {
        setError('Error desconocido al inicializar la videollamada.');
      }
    }
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
      });
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
      console.log('Audio toggled:', !isAudioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
      console.log('Video toggled:', !isVideoEnabled);
    }
  };

  const handleLeave = () => {
    cleanup();
    onLeave();
  };

  return (
    <div style={{
      background: '#1a1a1a',
      minHeight: '100vh',
      padding: '20px',
      color: 'white'
    }}>
      {/* Header */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'rgba(0,0,0,0.7)',
        padding: '10px 20px',
        borderRadius: '8px',
        zIndex: 1000
      }}>
        <div>Call ID: {callId}</div>
        <div>Usuario: {user?.name}</div>
        <div>Modo: WebRTC Nativo (sin Agora)</div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          background: '#ff4444',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <h3>Error de Videollamada</h3>
          <p>{error}</p>
          <button
            onClick={initializeCall}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Video Container */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '70vh'
      }}>
        {isInitialized && !error ? (
          <div style={{
            position: 'relative',
            maxWidth: '800px',
            width: '100%'
          }}>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '12px',
                border: '3px solid #007bff',
                backgroundColor: '#000'
              }}
            />

            {/* Video Status Overlay */}
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: 'rgba(0,0,0,0.7)',
              padding: '5px 10px',
              borderRadius: '5px',
              fontSize: '14px'
            }}>
              {isVideoEnabled ? '📹 Cámara Activa' : '📹 Cámara Desactivada'}
            </div>

            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(0,0,0,0.7)',
              padding: '5px 10px',
              borderRadius: '5px',
              fontSize: '14px'
            }}>
              {isAudioEnabled ? '🎤 Micro Activo' : '🎤 Micro Silenciado'}
            </div>
          </div>
        ) : !error && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', marginBottom: '20px' }}>
              Inicializando videollamada...
            </div>
            <div>Solicitando permisos de cámara y micrófono...</div>
          </div>
        )}
      </div>

      {/* Controls */}
      {isInitialized && !error && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '15px',
          background: 'rgba(0,0,0,0.8)',
          padding: '15px',
          borderRadius: '25px'
        }}>
          <button
            onClick={toggleAudio}
            style={{
              background: isAudioEnabled ? '#28a745' : '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}
            title={isAudioEnabled ? 'Silenciar micrófono' : 'Activar micrófono'}
          >
            {isAudioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
          </button>

          <button
            onClick={toggleVideo}
            style={{
              background: isVideoEnabled ? '#28a745' : '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}
            title={isVideoEnabled ? 'Desactivar cámara' : 'Activar cámara'}
          >
            {isVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
          </button>

          <button
            onClick={handleLeave}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}
            title="Salir de la llamada"
          >
            <FaPhone />
          </button>
        </div>
      )}

      {/* Info Box */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        background: 'rgba(0,0,0,0.7)',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '12px',
        maxWidth: '300px'
      }}>
        <div><strong>Nota:</strong> Esta es una implementación básica con WebRTC nativo.</div>
        <div>Para videollamadas completas con múltiples usuarios, se necesita un servidor de señalización.</div>
      </div>
    </div>
  );
};

export default SimpleVideoCall;