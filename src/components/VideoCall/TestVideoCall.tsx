import React, { useEffect, useRef, useState } from 'react';

const TestVideoCall: React.FC = () => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [virtualStream, setVirtualStream] = useState<MediaStream | null>(null);
  const [debug, setDebug] = useState<string[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [screenShareStream, setScreenShareStream] = useState<MediaStream | null>(null);
  const [isScreenShareVideoReady, setIsScreenShareVideoReady] = useState(false);
  const [speechRecognitionEnabled, setSpeechRecognitionEnabled] = useState(false);
  const [virtualUserSpeaking, setVirtualUserSpeaking] = useState(false);
  const [conversationLog, setConversationLog] = useState<Array<{speaker: string, text: string, timestamp: Date}>>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const virtualVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const virtualCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // ICE servers for WebRTC
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  const addDebugMessage = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebug(prev => [...prev, `${timestamp}: ${message}`]);
  };

  // Speech Recognition Setup
  const setupSpeechRecognition = () => {
    // Check if speech recognition is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      addDebugMessage('❌ Speech Recognition not supported in this browser');
      return false;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES'; // Spanish, can be changed to 'en-US' for English

    recognition.onstart = () => {
      addDebugMessage('🎤 Speech recognition started');
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        addDebugMessage(`🗣️ You said: "${finalTranscript.trim()}"`);

        // Add to conversation log
        setConversationLog(prev => [...prev, {
          speaker: 'You',
          text: finalTranscript.trim(),
          timestamp: new Date()
        }]);

        // Have virtual user respond
        virtualUserRespond(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      addDebugMessage(`❌ Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      // Restart recognition if it's still enabled
      if (speechRecognitionEnabled && isCallActive) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (error) {
            addDebugMessage('🔄 Restarting speech recognition...');
          }
        }, 100);
      }
    };

    speechRecognitionRef.current = recognition;
    return true;
  };

  // Virtual User Response System
  const virtualUserRespond = (userText: string) => {
    if (virtualUserSpeaking) return; // Don't interrupt if already speaking

    // Generate response based on what user said
    let response = generateVirtualResponse(userText);

    addDebugMessage(`🤖 Virtual user responding: "${response}"`);

    // Add to conversation log
    setConversationLog(prev => [...prev, {
      speaker: 'Virtual User',
      text: response,
      timestamp: new Date()
    }]);

    // Speak the response
    speakAsVirtualUser(response);
  };

  // Generate contextual responses
  const generateVirtualResponse = (userText: string): string => {
    const lowerText = userText.toLowerCase();

    // Simple response patterns
    if (lowerText.includes('hola') || lowerText.includes('hello')) {
      return '¡Hola! Te escucho perfectamente. El audio funciona bien.';
    } else if (lowerText.includes('test') || lowerText.includes('prueba')) {
      return 'Sí, esta es una prueba de audio. Todo funciona correctamente.';
    } else if (lowerText.includes('adiós') || lowerText.includes('bye')) {
      return 'Adiós, la prueba de audio ha sido exitosa.';
    } else if (lowerText.includes('cómo estás') || lowerText.includes('how are you')) {
      return 'Estoy bien, soy un usuario virtual para probar tu audio.';
    } else if (lowerText.includes('compartir pantalla') || lowerText.includes('screen share')) {
      return 'Veo que estás probando compartir pantalla. Se ve perfectamente.';
    } else {
      // Echo back what they said with confirmation
      return `Recibí tu mensaje: "${userText}". El audio se escucha claramente.`;
    }
  };

  // Text-to-Speech for Virtual User
  const speakAsVirtualUser = (text: string) => {
    if (!('speechSynthesis' in window)) {
      addDebugMessage('❌ Text-to-Speech not supported in this browser');
      return;
    }

    // Cancel any ongoing speech
    if (speechSynthesisRef.current) {
      speechSynthesis.cancel();
    }

    setVirtualUserSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);

    // Configure voice (try to get a different voice from user)
    const voices = speechSynthesis.getVoices();
    const spanishVoices = voices.filter(voice => voice.lang.startsWith('es'));
    const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));

    if (spanishVoices.length > 0) {
      utterance.voice = spanishVoices[0];
    } else if (englishVoices.length > 0) {
      utterance.voice = englishVoices[0];
    }

    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.2; // Higher pitch to differentiate from user
    utterance.volume = 0.8;

    utterance.onstart = () => {
      addDebugMessage('🔊 Virtual user started speaking');
    };

    utterance.onend = () => {
      setVirtualUserSpeaking(false);
      addDebugMessage('🔇 Virtual user finished speaking');
    };

    utterance.onerror = (event) => {
      setVirtualUserSpeaking(false);
      addDebugMessage(`❌ Text-to-speech error: ${event.error}`);
    };

    speechSynthesisRef.current = utterance;
    speechSynthesis.speak(utterance);
  };

  // Toggle Speech Recognition
  const toggleSpeechRecognition = () => {
    if (!speechRecognitionEnabled) {
      if (setupSpeechRecognition()) {
        setSpeechRecognitionEnabled(true);
        speechRecognitionRef.current?.start();
        addDebugMessage('✅ Speech recognition enabled');
      }
    } else {
      setSpeechRecognitionEnabled(false);
      speechRecognitionRef.current?.stop();
      addDebugMessage('⏹️ Speech recognition disabled');
    }
  };

  // Audio level analysis
  const setupAudioAnalysis = (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 1024;

      microphone.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start monitoring audio levels
      const monitorAudio = () => {
        if (!analyserRef.current) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalizedLevel = average / 255;

        setAudioLevel(normalizedLevel);
        setIsSpeaking(normalizedLevel > 0.01); // Threshold for speaking detection

        requestAnimationFrame(monitorAudio);
      };

      monitorAudio();
      addDebugMessage('Audio analysis setup complete');
    } catch (error) {
      addDebugMessage(`Audio analysis error: ${error}`);
    }
  };

  // Create a virtual video stream (test pattern)
  const createVirtualStream = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d')!;
    virtualCanvasRef.current = canvas;

    // Create animated test pattern with PIP and audio visualization
    let frame = 0;
    const drawFrame = () => {
      // Clear canvas
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw animated background
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 50 + Math.sin(frame * 0.1) * 20;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = `hsl(${frame % 360}, 70%, 50%)`;
      ctx.fill();

      // Draw Picture-in-Picture of user's video (screen share when active, camera otherwise)
      const screenShareVideo = screenShareVideoRef.current;
      const localVideo = localVideoRef.current;

      // SIMPLIFIED screen share detection - ignore state variables, check video directly
      const screenShareHasVideo = screenShareVideo && screenShareVideo.videoWidth > 0 && screenShareVideo.videoHeight > 0;
      const screenShareIsPlaying = screenShareVideo && !screenShareVideo.paused && screenShareVideo.readyState >= 2;

      // FORCE use screen share if video element is ready, regardless of state variables
      const screenShareReady = screenShareHasVideo && screenShareIsPlaying;

      // SUPER AGGRESSIVE DEBUG: Every 10 frames (3 times per second)
      if (frame % 10 === 0) {
        console.log('🎯 CANVAS DEBUG:', {
          isScreenSharing,
          screenShareHasVideo,
          screenShareIsPlaying,
          screenShareReady,
          videoWidth: screenShareVideo?.videoWidth || 0,
          videoHeight: screenShareVideo?.videoHeight || 0,
          paused: screenShareVideo?.paused,
          readyState: screenShareVideo?.readyState,
          currentTime: screenShareVideo?.currentTime || 0,
          srcObject: !!screenShareVideo?.srcObject,
          WILL_USE: screenShareReady ? 'SCREEN_SHARE' : 'CAMERA'
        });
      }

      const videoSource = screenShareReady ? screenShareVideo : localVideo;

      if (videoSource && videoSource.videoWidth > 0) {
        const pipWidth = 120;
        const pipHeight = 90;
        const pipX = canvas.width - pipWidth - 10;
        const pipY = 10;

        // Draw PIP border (different color for screen share)
        const usingScreenShare = screenShareReady;
        ctx.strokeStyle = usingScreenShare ? '#FF5722' : '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(pipX - 2, pipY - 2, pipWidth + 4, pipHeight + 4);

        // Draw the user's video/screen in PIP
        ctx.drawImage(videoSource, pipX, pipY, pipWidth, pipHeight);

        // Add PIP label
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(pipX, pipY + pipHeight - 20, pipWidth, 20);
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        const label = usingScreenShare ? 'Your Screen' : 'You';
        ctx.fillText(label, pipX + pipWidth / 2, pipY + pipHeight - 6);

        // Debug info - show every 60 frames (once per 2 seconds at 30fps)
        if (frame % 60 === 0) {
          console.log('PIP Debug:', {
            isScreenSharing,
            isScreenShareVideoReady,
            screenShareVideoWidth: screenShareVideo?.videoWidth || 0,
            screenShareVideoHeight: screenShareVideo?.videoHeight || 0,
            localVideoWidth: localVideo?.videoWidth || 0,
            usingScreenShare,
            videoSourceWidth: videoSource.videoWidth,
            videoSourceHeight: videoSource.videoHeight,
            screenShareStreamActive: screenShareStream ? 'yes' : 'no',
            screenShareVideoReadyState: screenShareVideo?.readyState || 'unknown',
            screenShareVideoPaused: screenShareVideo?.paused || 'unknown',
            screenShareVideoSrcObject: !!screenShareVideo?.srcObject,
            videoSourceTagName: videoSource.tagName,
            videoSourceCurrentTime: videoSource.currentTime
          });

          // Force screen share video to play if it's paused and we're screen sharing
          if (isScreenSharing && screenShareVideo && screenShareVideo.paused) {
            console.log('🔧 Screen share video is paused, forcing play...');
            addDebugMessage('🔧 Forcing screen share video to play');
            screenShareVideo.play().catch(err => {
              console.log('Failed to force play:', err);
            });
          }
        }
      } else {
        // If no video source is available, show debug info
        if (frame % 120 === 0) { // Every 4 seconds
          console.log('No PIP video available:', {
            isScreenSharing,
            isScreenShareVideoReady,
            screenShareVideoElement: !!screenShareVideo,
            localVideoElement: !!localVideo,
            screenShareVideoWidth: screenShareVideo?.videoWidth || 0,
            localVideoWidth: localVideo?.videoWidth || 0
          });
        }

        // Draw placeholder when no video is available
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(canvas.width - 130, 10, 120, 90);
        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No Video', canvas.width - 70, 60);
      }

      // Draw audio visualization (sound waves)
      if (isSpeaking && audioLevel > 0) {
        const waveCount = 5;
        const baseRadius = 30;

        for (let i = 0; i < waveCount; i++) {
          const waveRadius = baseRadius + (i * 15) + (audioLevel * 100);
          const alpha = Math.max(0.1, (1 - i * 0.2) * audioLevel * 2);

          ctx.beginPath();
          ctx.arc(50, canvas.height - 50, waveRadius, 0, 2 * Math.PI);
          ctx.strokeStyle = `rgba(76, 175, 80, ${alpha})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Sound wave icon
        ctx.fillStyle = '#4CAF50';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔊', 50, canvas.height - 40);
      } else {
        // Muted icon when not speaking
        ctx.fillStyle = '#9E9E9E';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔇', 50, canvas.height - 40);
      }

      // Draw main text
      ctx.fillStyle = 'white';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Virtual Test User', centerX, centerY - 100);

      // Show audio status
      let audioStatus = '';
      let statusColor = '#9E9E9E';

      if (virtualUserSpeaking) {
        audioStatus = '🗣️ Speaking to you...';
        statusColor = '#FF5722'; // Orange when virtual user is speaking
      } else if (isSpeaking) {
        audioStatus = `Hearing you (${Math.round(audioLevel * 100)}%)`;
        statusColor = '#4CAF50'; // Green when hearing user
      } else {
        audioStatus = speechRecognitionEnabled ? 'Listening for speech...' : 'Listening...';
        statusColor = speechRecognitionEnabled ? '#2196F3' : '#9E9E9E'; // Blue when speech recognition active
      }

      ctx.fillStyle = statusColor;
      ctx.font = '16px Arial';
      ctx.fillText(audioStatus, centerX, centerY + 80);

      // Show speech recognition status
      if (speechRecognitionEnabled) {
        ctx.fillStyle = '#2196F3';
        ctx.font = '12px Arial';
        ctx.fillText('🎤 Voice Detection: ON', centerX, centerY + 100);
      }

      // Frame counter
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.fillText(`Frame: ${frame}`, centerX, centerY + 120);

      // Screen sharing debug info (visible on canvas) - Force show if screen share stream exists
      if (isScreenSharing || screenShareStream || screenShareVideo) {
        ctx.fillStyle = screenShareReady ? '#4CAF50' : '#FF5722';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`🔍 SCREEN SHARE DEBUG:`, 10, canvas.height - 100);
        ctx.font = '14px Arial';
        ctx.fillText(`• Has Video: ${screenShareHasVideo}`, 10, canvas.height - 80);
        ctx.fillText(`• Is Playing: ${screenShareIsPlaying}`, 10, canvas.height - 65);
        ctx.fillText(`• Screen Ready: ${screenShareReady}`, 10, canvas.height - 50);
        ctx.fillText(`• Video Size: ${screenShareVideo?.videoWidth || 0}x${screenShareVideo?.videoHeight || 0}`, 10, canvas.height - 35);
        ctx.fillStyle = screenShareReady ? '#00FF00' : '#FF0000';
        ctx.font = '18px Arial';
        ctx.fillText(`• USING: ${screenShareReady ? 'SCREEN' : 'CAMERA'}`, 10, canvas.height - 15);

        // TEST: Try to draw screen share video in a larger area to verify it works
        // ALWAYS try if we have a video element with dimensions
        if (screenShareVideo && screenShareVideo.videoWidth > 0) {
          try {
            // Draw a larger version of the screen share in the bottom right for testing
            const testWidth = 250;
            const testHeight = 180;
            const testX = canvas.width - testWidth - 10;
            const testY = canvas.height - testHeight - 120;

            // Draw bright border
            ctx.strokeStyle = screenShareReady ? '#00FF00' : '#FF5722';
            ctx.lineWidth = 3;
            ctx.strokeRect(testX - 3, testY - 3, testWidth + 6, testHeight + 6);

            // Draw the screen share video
            ctx.drawImage(screenShareVideo, testX, testY, testWidth, testHeight);

            // Large label
            ctx.fillStyle = screenShareReady ? 'rgba(0, 255, 0, 0.9)' : 'rgba(255, 87, 34, 0.9)';
            ctx.fillRect(testX, testY + testHeight - 30, testWidth, 30);
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🖥️ SCREEN SHARE TEST', testX + testWidth / 2, testY + testHeight - 10);

            console.log('✅ Successfully drew screen share in test window!');

          } catch (drawError) {
            // If drawing fails, show error
            ctx.fillStyle = '#FF5722';
            ctx.font = '14px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`• Draw Error: ${drawError}`, 10, canvas.height - 5);
            console.error('❌ Failed to draw screen share:', drawError);
          }
        } else {
          // Show why test window is not appearing
          ctx.fillStyle = '#FF5722';
          ctx.font = '14px Arial';
          ctx.textAlign = 'left';
          ctx.fillText(`• No test window: ${!screenShareVideo ? 'No video element' : 'No dimensions'}`, 10, canvas.height - 5);
        }

        // Reset text align for rest of canvas
        ctx.textAlign = 'center';
      }

      frame++;
      requestAnimationFrame(drawFrame);
    };

    drawFrame();
    return canvas.captureStream(30); // 30 FPS
  };

  // Start local media
  const startLocalMedia = async () => {
    try {
      addDebugMessage('Starting local media...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Setup audio analysis for voice detection
      setupAudioAnalysis(stream);

      addDebugMessage('Local media started successfully');
      return stream;
    } catch (error) {
      addDebugMessage(`Error starting local media: ${error}`);
      throw error;
    }
  };

  // Start virtual user stream
  const startVirtualUser = () => {
    try {
      addDebugMessage('Creating virtual user stream...');
      const stream = createVirtualStream();

      // Add audio track (silence)
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0; // Silent
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const mediaStreamDestination = audioContext.createMediaStreamDestination();
      gainNode.connect(mediaStreamDestination);
      oscillator.start();

      // Add audio track to stream
      const audioTrack = mediaStreamDestination.stream.getAudioTracks()[0];
      if (audioTrack) {
        stream.addTrack(audioTrack);
      }

      setVirtualStream(stream);
      if (virtualVideoRef.current) {
        virtualVideoRef.current.srcObject = stream;
      }

      addDebugMessage('Virtual user stream created');
      return stream;
    } catch (error) {
      addDebugMessage(`Error creating virtual user: ${error}`);
      throw error;
    }
  };

  // Simulate WebRTC connection
  const startTestCall = async () => {
    try {
      setIsCallActive(true);
      setConnectionState('connecting');
      addDebugMessage('Starting test call...');

      // Start local media
      const localStream = await startLocalMedia();

      // Start virtual user
      startVirtualUser();

      // Create peer connection
      const pc = new RTCPeerConnection(iceServers);
      peerConnectionRef.current = pc;

      // Add local stream tracks
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        addDebugMessage(`Connection state: ${pc.connectionState}`);
        setConnectionState(pc.connectionState);
      };

      pc.oniceconnectionstatechange = () => {
        addDebugMessage(`ICE connection state: ${pc.iceConnectionState}`);
      };

      // Simulate successful connection after 2 seconds
      setTimeout(() => {
        setConnectionState('connected');
        addDebugMessage('Test call connected successfully! Virtual user is responding.');
      }, 2000);

    } catch (error) {
      addDebugMessage(`Error starting test call: ${error}`);
      setConnectionState('failed');
    }
  };

  // End test call
  const endTestCall = () => {
    addDebugMessage('Ending test call...');

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    // Stop virtual stream
    if (virtualStream) {
      virtualStream.getTracks().forEach(track => track.stop());
      setVirtualStream(null);
    }

    // Stop screen share stream
    if (screenShareStream) {
      screenShareStream.getTracks().forEach(track => track.stop());
      setScreenShareStream(null);
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop speech recognition
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }

    // Stop text-to-speech
    if (speechSynthesisRef.current) {
      speechSynthesis.cancel();
    }

    // Reset audio and screen share state
    setAudioLevel(0);
    setIsSpeaking(false);
    setIsScreenSharing(false);
    setIsScreenShareVideoReady(false);
    setSpeechRecognitionEnabled(false);
    setVirtualUserSpeaking(false);

    setIsCallActive(false);
    setConnectionState('disconnected');
    addDebugMessage('Test call ended');
  };

  // Screen sharing
  const toggleScreenShare = async () => {
    if (!localStream || !peerConnectionRef.current) return;

    try {
      if (!isScreenSharing) {
        addDebugMessage('Starting screen share...');

        // Check if getDisplayMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          throw new Error('Screen sharing not supported in this browser');
        }

        // Add better screen share options
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920, max: 1920 },
            height: { ideal: 1080, max: 1080 },
            frameRate: { ideal: 30, max: 60 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        // Validate that we got a video track
        const videoTracks = screenStream.getVideoTracks();
        if (videoTracks.length === 0) {
          throw new Error('No video track found in screen share stream');
        }

        const videoTrack = videoTracks[0];
        if (!videoTrack || videoTrack.readyState !== 'live') {
          throw new Error('Screen share video track is not ready');
        }

        const sender = peerConnectionRef.current.getSenders().find(s =>
          s.track && s.track.kind === 'video'
        );

        if (!sender) {
          throw new Error('No video sender found in peer connection');
        }

        // Replace the track
        await sender.replaceTrack(videoTrack);

        // Set up screen share video element
        setScreenShareStream(screenStream);
        if (screenShareVideoRef.current) {
          const video = screenShareVideoRef.current;
          video.srcObject = screenStream;

          // Add event handlers to track when video is ready
          const checkVideoReady = () => {
            const isReady = video.videoWidth > 0 && video.videoHeight > 0 && !video.paused && video.readyState >= 2;
            addDebugMessage(`🔍 Video ready check: ${isReady} (${video.videoWidth}x${video.videoHeight}, paused: ${video.paused}, readyState: ${video.readyState})`);

            if (isReady) {
              setIsScreenShareVideoReady(true);
              addDebugMessage('✅ Screen share video is FULLY ready for drawing');
            }

            return isReady;
          };

          const onLoadedMetadata = () => {
            addDebugMessage(`📺 Screen share metadata: ${video.videoWidth}x${video.videoHeight}`);
            checkVideoReady();
          };

          const onCanPlay = () => {
            addDebugMessage(`▶️ Screen share can play: ${video.videoWidth}x${video.videoHeight}`);
            checkVideoReady();
          };

          const onPlaying = () => {
            addDebugMessage(`🎬 Screen share playing: ${video.videoWidth}x${video.videoHeight}, paused: ${video.paused}`);
            checkVideoReady();
          };

          const onTimeUpdate = () => {
            // Only check once when time starts updating
            if (video.currentTime > 0 && !isScreenShareVideoReady) {
              addDebugMessage(`⏰ Screen share time update: ${video.currentTime}`);
              checkVideoReady();
            }
          };

          const onLoadStart = () => {
            addDebugMessage('🔄 Screen share loading started');
            setIsScreenShareVideoReady(false);
          };

          const onError = (e: any) => {
            addDebugMessage(`❌ Screen share error: ${e.type} - ${e.message || 'Unknown error'}`);
            setIsScreenShareVideoReady(false);
          };

          // Add comprehensive event listeners
          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('canplay', onCanPlay);
          video.addEventListener('playing', onPlaying);
          video.addEventListener('timeupdate', onTimeUpdate);
          video.addEventListener('loadstart', onLoadStart);
          video.addEventListener('error', onError);

          // Force video attributes
          video.muted = true;
          video.playsInline = true;
          video.autoplay = true;

          // Force play the video with multiple aggressive attempts
          const forcePlay = async () => {
            try {
              addDebugMessage('🎯 Attempting to play screen share video...');
              await video.play();
              addDebugMessage('✅ Screen share video play succeeded');

              // Give it a moment, then check if it's really ready
              setTimeout(() => {
                if (!checkVideoReady()) {
                  addDebugMessage('⚠️ Video playing but not ready, forcing refresh...');
                  // Try to refresh the srcObject
                  const currentSrc = video.srcObject;
                  video.srcObject = null;
                  setTimeout(() => {
                    video.srcObject = currentSrc;
                    video.play().catch(console.error);
                  }, 100);
                }
              }, 200);

            } catch (err) {
              addDebugMessage(`❌ Screen share video play failed: ${err}`);
              // Try multiple times with increasing delays
              for (let attempt = 1; attempt <= 3; attempt++) {
                setTimeout(async () => {
                  try {
                    await video.play();
                    addDebugMessage(`✅ Screen share video play succeeded on attempt ${attempt + 1}`);
                    checkVideoReady();
                  } catch (retryErr) {
                    addDebugMessage(`❌ Screen share video play failed on attempt ${attempt + 1}: ${retryErr}`);
                  }
                }, attempt * 300);
              }
            }
          };

          forcePlay();
        }

        setIsScreenSharing(true);
        addDebugMessage(`✅ Screen sharing started - resolution: ${videoTrack.getSettings().width}x${videoTrack.getSettings().height}`);

        // Handle screen share end (user clicks stop sharing in browser)
        videoTrack.onended = () => {
          addDebugMessage('📱 Screen sharing ended by user');
          stopScreenShare();
        };
      } else {
        stopScreenShare();
      }
    } catch (error: any) {
      // Provide specific error messages based on error type
      if (error.name === 'NotReadableError') {
        addDebugMessage('❌ Screen share cancelled or source unavailable. Try again or check if another app is using screen capture.');
      } else if (error.name === 'NotAllowedError') {
        addDebugMessage('❌ Screen share permission denied. Please allow screen sharing and try again.');
      } else if (error.name === 'NotFoundError') {
        addDebugMessage('❌ No screen capture source available. Make sure you have a screen to share.');
      } else if (error.name === 'AbortError') {
        addDebugMessage('❌ Screen share request was aborted. Please try again.');
      } else if (error.name === 'NotSupportedError') {
        addDebugMessage('❌ Screen sharing not supported in this browser.');
      } else if (error.name === 'InvalidStateError') {
        addDebugMessage('❌ Invalid state for screen sharing. Please refresh the page and try again.');
      } else {
        addDebugMessage(`❌ Screen share error: ${error.name || 'Unknown'} - ${error.message || error}`);
      }

      // Reset screen sharing state on error
      setIsScreenSharing(false);
      setIsScreenShareVideoReady(false);
      if (screenShareStream) {
        screenShareStream.getTracks().forEach(track => track.stop());
        setScreenShareStream(null);
      }
    }
  };

  const stopScreenShare = async () => {
    if (!localStream || !peerConnectionRef.current) return;

    try {
      addDebugMessage('Stopping screen share...');

      // Stop screen share stream
      if (screenShareStream) {
        screenShareStream.getTracks().forEach(track => track.stop());
        setScreenShareStream(null);
      }

      // Clear screen share video element
      if (screenShareVideoRef.current) {
        const video = screenShareVideoRef.current;
        video.srcObject = null;
        // Remove any event listeners (they should clean up automatically but be safe)
        video.removeEventListener('loadedmetadata', () => {});
        video.removeEventListener('canplay', () => {});
        video.removeEventListener('error', () => {});
      }

      // Reset screen share video ready state
      setIsScreenShareVideoReady(false);

      const videoTrack = localStream.getVideoTracks()[0];
      const sender = peerConnectionRef.current.getSenders().find(s =>
        s.track && s.track.kind === 'video'
      );

      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack);
        setIsScreenSharing(false);
        addDebugMessage('Screen sharing stopped - back to camera view in PIP');
      }
    } catch (error) {
      addDebugMessage(`Error stopping screen share: ${error}`);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isCallActive) {
        endTestCall();
      }
    };
  }, []);

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case 'connected': return '#28a745';
      case 'connecting': return '#ffc107';
      case 'failed': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div className="test-video-call">
      <div className="test-header">
        <h2>🧪 Test Videocall (Admin Only)</h2>
        <p>Test your camera, microphone, and WebRTC connectivity with a virtual user</p>
      </div>

      <div className="connection-status" style={{ color: getConnectionStatusColor() }}>
        <strong>Status: {connectionState}</strong>
      </div>

      {!isCallActive ? (
        <div className="test-controls">
          <button
            className="btn btn-primary btn-lg"
            onClick={startTestCall}
          >
            🎬 Start Test Call
          </button>
          <div className="test-info">
            <h4>What this test includes:</h4>
            <ul>
              <li>✅ Camera and microphone access</li>
              <li>✅ WebRTC connection simulation</li>
              <li>✅ Virtual user with animated video</li>
              <li>✅ Screen sharing functionality</li>
              <li>✅ Connection state monitoring</li>
              <li>🎤 <strong>NEW: Voice conversation testing</strong></li>
              <li>🗣️ Speech recognition and virtual responses</li>
              <li>🔊 Bidirectional audio testing</li>
            </ul>
            <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
              <strong>🎯 Voice Test Instructions:</strong>
              <ol style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '14px' }}>
                <li>Start the test call</li>
                <li>Click "🎤 Start Voice Test"</li>
                <li>Say something like "Hola" or "Test"</li>
                <li>The virtual user will respond with a different voice</li>
                <li>This tests both microphone → speaker audio flow</li>
              </ol>
            </div>
          </div>
        </div>
      ) : (
        <div className="test-call-interface">
          <div className={`video-container ${isScreenSharing ? 'screen-share-active' : ''}`} style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            position: 'relative',
            ...(isScreenSharing && {
              flexDirection: 'column',
              gap: '10px'
            })
          }}>
            <div className={`video-section ${isScreenSharing ? 'screen-sharing' : ''}`} style={{
              ...(isScreenSharing && {
                width: '100%',
                maxWidth: 'none',
                order: 1
              })
            }}>
              <h4>Your Video {isScreenSharing && '🖥️ (Screen Share)'}</h4>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                className="local-video"
                style={{
                  width: '100%',
                  maxWidth: isScreenSharing ? 'none' : '400px',
                  height: isScreenSharing ? 'calc(70vh - 100px)' : 'auto',
                  border: `2px solid ${isScreenSharing ? '#FF5722' : '#007bff'}`,
                  objectFit: isScreenSharing ? 'contain' : 'cover'
                }}
              />
              <div className="video-controls">
                <button
                  className={`btn ${isScreenSharing ? 'btn-warning' : 'btn-secondary'}`}
                  onClick={toggleScreenShare}
                >
                  {isScreenSharing ? '🖥️ Stop Screen Share' : '🖥️ Share Screen'}
                </button>
                <button
                  className={`btn ${speechRecognitionEnabled ? 'btn-success' : 'btn-primary'}`}
                  onClick={toggleSpeechRecognition}
                  style={{ marginTop: '8px' }}
                >
                  {speechRecognitionEnabled ? '🎤 Stop Voice Test' : '🎤 Start Voice Test'}
                </button>
                <div className="screen-share-help" style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  <details>
                    <summary style={{ cursor: 'pointer' }}>ℹ️ Screen share troubleshooting</summary>
                    <div style={{ marginTop: '4px', lineHeight: '1.4' }}>
                      <strong>If screen share fails:</strong>
                      <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                        <li>Make sure you click "Allow" in the permission dialog</li>
                        <li>Close other apps using screen capture (OBS, Teams, etc.)</li>
                        <li>Try refreshing the page if you get persistent errors</li>
                        <li>Check if your browser supports screen sharing</li>
                      </ul>
                    </div>
                  </details>
                </div>
              </div>
            </div>

            <div className={`video-section ${isScreenSharing ? 'pip' : ''}`} style={{
              ...(isScreenSharing && {
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '250px',
                zIndex: 10,
                border: '2px solid #fff',
                borderRadius: '8px',
                backgroundColor: '#000',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
                order: 2
              })
            }}>
              <h4 style={{
                fontSize: isScreenSharing ? '14px' : '1.25rem',
                margin: isScreenSharing ? '5px' : '0 0 1rem 0'
              }}>Virtual Test User</h4>
              <video
                ref={virtualVideoRef}
                autoPlay
                className="remote-video"
                style={{
                  width: '100%',
                  maxWidth: isScreenSharing ? 'none' : '400px',
                  height: isScreenSharing ? '150px' : 'auto',
                  border: `2px solid ${isScreenSharing ? '#fff' : '#28a745'}`,
                  objectFit: 'cover'
                }}
              />
              <div className="virtual-user-info" style={{
                ...(isScreenSharing && {
                  fontSize: '12px',
                  padding: '5px'
                })
              }}>
                <p style={{
                  fontSize: isScreenSharing ? '11px' : '14px',
                  margin: isScreenSharing ? '2px 0' : '8px 0'
                }}>🤖 {isScreenSharing ? 'Virtual User' : 'This is a simulated user for testing purposes'}</p>
                {!isScreenSharing && (
                  <div className="communication-status">
                    <div className="audio-status">
                      <span style={{ color: isSpeaking ? '#4CAF50' : '#9E9E9E' }}>
                        {isSpeaking ? '🔊' : '🔇'} Audio: {isSpeaking ? 'Hearing you' : 'Listening'}
                      </span>
                      {isSpeaking && (
                        <div className="audio-meter" style={{
                          width: '100px',
                          height: '6px',
                          backgroundColor: '#ddd',
                          borderRadius: '3px',
                          marginTop: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${audioLevel * 100}%`,
                            height: '100%',
                            backgroundColor: '#4CAF50',
                            transition: 'width 0.1s'
                          }}></div>
                        </div>
                      )}
                    </div>
                    <div className="video-status" style={{ marginTop: '8px' }}>
                      <span style={{ color: localVideoRef.current?.videoWidth ? '#4CAF50' : '#9E9E9E' }}>
                        👁️ Video: {localVideoRef.current?.videoWidth ? 'Seeing you' : 'Waiting for video'}
                      </span>
                    </div>
                  </div>
                )}
                {isScreenSharing && (
                  <div style={{ fontSize: '10px', color: '#4CAF50', textAlign: 'center' }}>
                    Audio: {isSpeaking ? '🔊 Hearing' : '🔇 Listening'}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="call-controls">
            <button
              className="btn btn-danger btn-lg"
              onClick={endTestCall}
            >
              📞 End Test Call
            </button>
          </div>

          {/* Voice Conversation Log */}
          {conversationLog.length > 0 && (
            <div className="conversation-log" style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              <h4>🗣️ Voice Conversation</h4>
              <div className="conversation-messages">
                {conversationLog.slice(-10).map((message, index) => (
                  <div
                    key={index}
                    className={`message ${message.speaker === 'You' ? 'user-message' : 'virtual-message'}`}
                    style={{
                      margin: '8px 0',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      backgroundColor: message.speaker === 'You' ? '#e3f2fd' : '#f1f8e9',
                      borderLeft: `4px solid ${message.speaker === 'You' ? '#2196F3' : '#4CAF50'}`
                    }}
                  >
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      <strong>{message.speaker}</strong> - {message.timestamp.toLocaleTimeString()}
                    </div>
                    <div>{message.text}</div>
                  </div>
                ))}
              </div>
              {conversationLog.length > 10 && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  Showing last 10 messages ({conversationLog.length} total)
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Debug Console */}
      <div className="debug-console" style={{ marginTop: '2rem' }}>
        <h4>Debug Console</h4>
        <div
          className="debug-output"
          style={{
            backgroundColor: '#1e1e1e',
            color: '#00ff00',
            padding: '1rem',
            borderRadius: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '12px'
          }}
        >
          {debug.map((message, index) => (
            <div key={index}>{message}</div>
          ))}
          {debug.length === 0 && <div>Ready for testing...</div>}
        </div>
      </div>

      {/* Hidden video element for screen share (used for PIP drawing) */}
      <video
        ref={screenShareVideoRef}
        autoPlay
        muted
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default TestVideoCall;