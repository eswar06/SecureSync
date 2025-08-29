import { useState, useEffect, useRef, useCallback } from 'react';
import SimplePeer from 'simple-peer';
import { useSocket } from '../providers/SocketProvider';
import { useAppDispatch, useAppSelector } from './redux';
import {
  setLocalStream,
  addParticipant,
  removeParticipant,
  updateParticipant,
  setConnectionStatus,
  updateSecurityStatus
} from '../store/slices/meetingSlice';
import { addNotification } from '../store/slices/notificationsSlice';
import { SignalingMessage, SignalingType, Participant, ParticipantRole } from '../../../shared/src/types/index';

interface WebRTCConfig {
  iceServers: RTCIceServer[];
  mediaConstraints: MediaStreamConstraints;
}

interface PeerConnection {
  peer: SimplePeer.Instance;
  userId: string;
  stream?: MediaStream;
}

export const useWebRTC = (meetingId: string) => {
  const dispatch = useAppDispatch();
  const { socket, emit, on, off } = useSocket();
  const { user } = useAppSelector((state) => state.auth);
  const { isAudioEnabled, isVideoEnabled, participants } = useAppSelector((state) => state.meeting);

  const [peers, setPeers] = useState<Map<string, PeerConnection>>(new Map());
  const [isInitiator, setIsInitiator] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, PeerConnection>>(new Map());

  // WebRTC Configuration
  const webrtcConfig: WebRTCConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: 'turn:your-turn-server.com:3478',
        username: 'username',
        credential: 'password'
      }
    ],
    mediaConstraints: {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000
      },
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      }
    }
  };

  // Initialize local media stream
  const initializeLocalStream = useCallback(async () => {
    try {
      dispatch(setConnectionStatus('connecting'));

      const constraints: MediaStreamConstraints = {
        audio: isAudioEnabled,
        video: isVideoEnabled
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      dispatch(setLocalStream(stream));

      // Apply security watermark to video track
      if (stream.getVideoTracks().length > 0) {
        await applySecurityWatermark(stream);
      }

      dispatch(setConnectionStatus('connected'));
      dispatch(updateSecurityStatus({ active: true, watermarkEnabled: true }));

      return stream;
    } catch (error) {
      console.error('Failed to initialize local stream:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Media Access Error',
        message: 'Failed to access camera/microphone. Please check permissions.'
      }));
      dispatch(setConnectionStatus('failed'));
      throw error;
    }
  }, [isAudioEnabled, isVideoEnabled, dispatch]);

  // Apply security watermark to video stream
  const applySecurityWatermark = async (stream: MediaStream) => {
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      // Create canvas for watermark overlay
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const video = document.createElement('video');

      video.srcObject = new MediaStream([videoTrack]);
      video.play();

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const drawFrame = () => {
          if (!ctx) return;

          // Draw video frame
          ctx.drawImage(video, 0, 0);

          // Draw watermark
          ctx.font = '14px monospace';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.textAlign = 'right';
          
          const watermarkText = `${user?.id?.substring(0, 6) || 'SECURE'} • ${new Date().toLocaleTimeString()}`;
          ctx.fillText(watermarkText, canvas.width - 10, canvas.height - 10);

          requestAnimationFrame(drawFrame);
        };

        drawFrame();

        // Replace video track with watermarked version
        const watermarkedStream = canvas.captureStream(30);
        const watermarkedTrack = watermarkedStream.getVideoTracks()[0];
        
        stream.removeTrack(videoTrack);
        stream.addTrack(watermarkedTrack);
      };
    } catch (error) {
      console.error('Failed to apply security watermark:', error);
    }
  };

  // Create peer connection
  const createPeerConnection = useCallback((userId: string, initiator: boolean) => {
    const peer = new SimplePeer({
      initiator,
      trickle: false,
      config: {
        iceServers: webrtcConfig.iceServers
      },
      stream: localStreamRef.current || undefined
    });

    const peerConnection: PeerConnection = {
      peer,
      userId
    };

    // Handle peer events
    peer.on('signal', (signal) => {
      const signalingMessage: SignalingMessage = {
        type: signal.type === 'offer' ? SignalingType.OFFER : SignalingType.ANSWER,
        data: signal,
        from: user?.id || '',
        to: userId,
        meetingId,
        timestamp: new Date()
      };

      emit('webrtc-signal', signalingMessage);
    });

    peer.on('stream', (remoteStream) => {
      peerConnection.stream = remoteStream;
      
      dispatch(updateParticipant({
        userId,
        updates: {
          audioEnabled: remoteStream.getAudioTracks().length > 0,
          videoEnabled: remoteStream.getVideoTracks().length > 0
        }
      }));

      dispatch(addNotification({
        type: 'info',
        title: 'Participant Connected',
        message: `${userId} joined the meeting`
      }));
    });

    peer.on('connect', () => {
      console.log(`Connected to peer: ${userId}`);
      dispatch(updateParticipant({
        userId,
        updates: { joinedAt: new Date() }
      }));
    });

    peer.on('close', () => {
      console.log(`Disconnected from peer: ${userId}`);
      removePeer(userId);
    });

    peer.on('error', (error) => {
      console.error(`Peer connection error with ${userId}:`, error);
      dispatch(addNotification({
        type: 'error',
        title: 'Connection Error',
        message: `Failed to connect to ${userId}`
      }));
      removePeer(userId);
    });

    // Store peer connection
    setPeers(prev => new Map(prev.set(userId, peerConnection)));
    peersRef.current.set(userId, peerConnection);

    return peerConnection;
  }, [meetingId, user?.id, emit, dispatch]);

  // Remove peer connection
  const removePeer = useCallback((userId: string) => {
    const peerConnection = peersRef.current.get(userId);
    if (peerConnection) {
      peerConnection.peer.destroy();
      peersRef.current.delete(userId);
      setPeers(prev => {
        const newPeers = new Map(prev);
        newPeers.delete(userId);
        return newPeers;
      });
      dispatch(removeParticipant(userId));
    }
  }, [dispatch]);

  // Handle incoming WebRTC signals
  const handleWebRTCSignal = useCallback((signal: SignalingMessage) => {
    if (signal.meetingId !== meetingId || !signal.from) return;

    let peerConnection = peersRef.current.get(signal.from);

    if (!peerConnection) {
      // Create new peer connection for incoming signal
      peerConnection = createPeerConnection(signal.from, false);
    }

    // Handle signal based on type
    switch (signal.type) {
      case SignalingType.OFFER:
      case SignalingType.ANSWER:
        peerConnection.peer.signal(signal.data);
        break;
      case SignalingType.ICE_CANDIDATE:
        peerConnection.peer.signal(signal.data);
        break;
    }
  }, [meetingId, createPeerConnection]);

  // Join meeting
  const joinMeeting = useCallback(async () => {
    try {
      await initializeLocalStream();
      
      emit('join-meeting', { meetingId });
      setIsInitiator(true);

      dispatch(addNotification({
        type: 'success',
        title: 'Joined Meeting',
        message: 'Successfully joined the meeting'
      }));
    } catch (error) {
      console.error('Failed to join meeting:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Join Failed',
        message: 'Failed to join meeting. Please try again.'
      }));
    }
  }, [initializeLocalStream, emit, meetingId, dispatch]);

  // Leave meeting
  const leaveMeeting = useCallback(() => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      dispatch(setLocalStream(null));
    }

    // Close all peer connections
    peersRef.current.forEach((peerConnection) => {
      peerConnection.peer.destroy();
    });
    peersRef.current.clear();
    setPeers(new Map());

    // Leave meeting on server
    emit('leave-meeting', { meetingId });

    dispatch(setConnectionStatus('disconnected'));
    dispatch(addNotification({
      type: 'info',
      title: 'Left Meeting',
      message: 'You have left the meeting'
    }));
  }, [meetingId, emit, dispatch]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        
        // Notify other participants
        emit('webrtc-signal', {
          type: SignalingType.MUTE_AUDIO,
          data: { muted: !audioTrack.enabled },
          from: user?.id || '',
          meetingId,
          timestamp: new Date()
        });
      }
    }
  }, [emit, meetingId, user?.id]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        
        // Notify other participants
        emit('webrtc-signal', {
          type: SignalingType.MUTE_VIDEO,
          data: { muted: !videoTrack.enabled },
          from: user?.id || '',
          meetingId,
          timestamp: new Date()
        });
      }
    }
  }, [emit, meetingId, user?.id]);

  // Screen sharing
  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      // Replace video track in all peer connections
      const videoTrack = screenStream.getVideoTracks()[0];
      
      peersRef.current.forEach((peerConnection) => {
        const pc = (peerConnection.peer as any)._pc as RTCPeerConnection | undefined;
        const sender = pc?.getSenders().find(
          (s) => s.track && s.track.kind === "video"
        );
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      // Handle screen share end
      videoTrack.onended = () => {
        stopScreenShare();
      };

      emit('webrtc-signal', {
        type: SignalingType.SCREEN_SHARE,
        data: { sharing: true },
        from: user?.id || '',
        meetingId,
        timestamp: new Date()
      });

      dispatch(addNotification({
        type: 'info',
        title: 'Screen Sharing',
        message: 'You are now sharing your screen'
      }));

    } catch (error) {
      console.error('Failed to start screen sharing:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Screen Share Failed',
        message: 'Failed to start screen sharing'
      }));
    }
  }, [emit, meetingId, user?.id, dispatch]);

  // Stop screen sharing
  const stopScreenShare = useCallback(async () => {
    try {
      // Get camera stream back
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: false // Keep existing audio
      });

      const videoTrack = cameraStream.getVideoTracks()[0];
      
      // Replace screen share track with camera track
      peersRef.current.forEach((peerConnection) => {
        const pc = (peerConnection.peer as any)._pc as RTCPeerConnection | undefined;
        const sender = pc?.getSenders().find(
          (s) => s.track && s.track.kind === "video"
        );
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      });

      emit('webrtc-signal', {
        type: SignalingType.SCREEN_SHARE,
        data: { sharing: false },
        from: user?.id || '',
        meetingId,
        timestamp: new Date()
      });

      dispatch(addNotification({
        type: 'info',
        title: 'Screen Sharing Stopped',
        message: 'You stopped sharing your screen'
      }));

    } catch (error) {
      console.error('Failed to stop screen sharing:', error);
    }
  }, [emit, meetingId, user?.id, dispatch, isVideoEnabled]);

  // Handle participant events
  const handleParticipantJoined = useCallback((data: { userId: string; participants: string[] }) => {
    if (data.userId !== user?.id) {
      dispatch(addParticipant({
        userId: data.userId,
        role: ParticipantRole.PARTICIPANT,
        permissions: {
          canSpeak: true,
          canShare: true,
          canRecord: false,
          canManageParticipants: false,
          canAccessPrivateChannels: false
        },
        audioEnabled: true,
        videoEnabled: false,
        isPresenting: false
      }));

      // If we're the initiator, create peer connection
      if (isInitiator) {
        createPeerConnection(data.userId, true);
      }
    }
  }, [user?.id, dispatch, isInitiator, createPeerConnection]);

  const handleParticipantLeft = useCallback((data: { userId: string }) => {
    removePeer(data.userId);
    dispatch(addNotification({
      type: 'info',
      title: 'Participant Left',
      message: `${data.userId} left the meeting`
    }));
  }, [removePeer, dispatch]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    on('webrtc-signal', handleWebRTCSignal);
    on('participant-joined', handleParticipantJoined);
    on('participant-left', handleParticipantLeft);

    return () => {
      off('webrtc-signal', handleWebRTCSignal);
      off('participant-joined', handleParticipantJoined);
      off('participant-left', handleParticipantLeft);
    };
  }, [socket, on, off, handleWebRTCSignal, handleParticipantJoined, handleParticipantLeft]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveMeeting();
    };
  }, []);

  return {
    // State
    peers,
    localStream: localStreamRef.current,
    isInitiator,
    
    // Actions
    joinMeeting,
    leaveMeeting,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    
    // Utils
    getPeerStream: (userId: string) => peersRef.current.get(userId)?.stream,
    getConnectionState: () => peersRef.current.size > 0 ? 'connected' : 'disconnected'
  };
};
