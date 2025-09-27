import React, { useEffect, useState, useRef } from 'react';
import { useVideoCallInvitations } from '../../hooks/useSocket';
import { useAuthStore } from '../../stores/authStore';
import { FaVideo, FaPhone, FaPhoneSlash } from 'react-icons/fa';

interface IncomingCallModalProps {
  onCallAccepted: (callId: string) => void;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({ onCallAccepted }) => {
  const { incomingCall, respondToCall } = useVideoCallInvitations();
  const { user } = useAuthStore();
  const [timer, setTimer] = useState(30);
  const beepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (incomingCall) {
      setTimer(30);
      const interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            // Auto-decline after 30 seconds
            handleDecline();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Play incoming call sound (optional)
      playIncomingCallSound();

      return () => {
        clearInterval(interval);
        stopBeeping();
      };
    } else {
      // Stop beeping when no incoming call
      stopBeeping();
    }
  }, [incomingCall]);

  const playIncomingCallSound = () => {
    // Create a simple beeping sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);

      // Repeat beeping
      beepIntervalRef.current = setInterval(() => {
        if (incomingCall) {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();

          osc.connect(gain);
          gain.connect(audioContext.destination);

          osc.frequency.setValueAtTime(800, audioContext.currentTime);
          gain.gain.setValueAtTime(0.1, audioContext.currentTime);

          osc.start();
          osc.stop(audioContext.currentTime + 0.2);
        } else {
          if (beepIntervalRef.current) {
            clearInterval(beepIntervalRef.current);
            beepIntervalRef.current = null;
          }
        }
      }, 1000);

    } catch (error) {
      console.log('Could not play incoming call sound:', error);
    }
  };

  const stopBeeping = () => {
    if (beepIntervalRef.current) {
      clearInterval(beepIntervalRef.current);
      beepIntervalRef.current = null;
    }
  };

  const handleAccept = () => {
    console.log('IncomingCallModal: handleAccept called', { incomingCall, user });
    if (incomingCall && user) {
      console.log('IncomingCallModal: Accepting call', incomingCall.call_id);
      stopBeeping();
      respondToCall(incomingCall.call_id, 'accepted', user.name);
      console.log('IncomingCallModal: Calling onCallAccepted with', incomingCall.call_id);
      onCallAccepted(incomingCall.call_id);
    } else {
      console.log('IncomingCallModal: Cannot accept call - missing incomingCall or user');
    }
  };

  const handleDecline = () => {
    if (incomingCall && user) {
      stopBeeping();
      respondToCall(incomingCall.call_id, 'declined', user.name);
    }
  };

  if (!incomingCall) return null;

  return (
    <div className="incoming-call-modal-overlay">
      <div className="incoming-call-modal">
        <div className="call-header">
          <FaVideo className="call-icon" />
          <h2>Incoming Video Call</h2>
        </div>

        <div className="caller-info">
          <div className="caller-avatar">
            {incomingCall.caller_name.charAt(0).toUpperCase()}
          </div>
          <h3>{incomingCall.caller_name}</h3>
          <p>
            {incomingCall.call_type === 'private' ? '1:1 Video Call' : 'Group Meeting'}
          </p>
        </div>

        <div className="call-timer">
          <span>Auto-decline in {timer}s</span>
        </div>

        <div className="call-actions">
          <button
            className="decline-btn"
            onClick={handleDecline}
            title="Decline call"
          >
            <FaPhoneSlash />
            Decline
          </button>

          <button
            className="accept-btn"
            onClick={handleAccept}
            title="Accept call"
          >
            <FaPhone />
            Accept
          </button>
        </div>

        <div className="call-preview">
          <p>📹 Make sure your camera and microphone are ready</p>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;