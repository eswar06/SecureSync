import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../providers/SocketProvider';
import { useAppDispatch, useAppSelector } from './redux';
import { setTranscription } from '../store/slices/meetingSlice';
import { addNotification } from '../store/slices/notificationsSlice';
import {
  TranscriptionData,
  TranscriptionSegment,
  ActionItem,
  MeetingSummary,
  SpeakerIdentification
} from '@securesync/shared';

interface TranscriptionConfig {
  language: string;
  realTime: boolean;
  speakerIdentification: boolean;
  actionItemExtraction: boolean;
  sensitiveInfoRedaction: boolean;
}

export const useTranscription = (meetingId: string) => {
  const dispatch = useAppDispatch();
  const { socket, emit, on, off } = useSocket();
  const { user } = useAppSelector((state) => state.auth);
  const { transcription } = useAppSelector((state) => state.meeting);

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [config, setConfig] = useState<TranscriptionConfig>({
    language: 'en',
    realTime: true,
    speakerIdentification: true,
    actionItemExtraction: true,
    sensitiveInfoRedaction: true
  });

  const audioContext = useRef<AudioContext | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const processingInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio processing for transcription
  const initializeAudioProcessing = useCallback(async () => {
    try {
      // Create audio context for processing
      audioContext.current = new AudioContext({ sampleRate: 48000 });
      
      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        }
      });

      // Create media recorder for audio capture
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      return true;
    } catch (error) {
      console.error('Failed to initialize audio processing:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Transcription Error',
        message: 'Failed to access microphone for transcription'
      }));
      return false;
    }
  }, [dispatch]);

  // Start real-time transcription
  const startTranscription = useCallback(async () => {
    try {
      if (!user?.id) throw new Error('User not authenticated');

      // Initialize audio processing
      const initialized = await initializeAudioProcessing();
      if (!initialized) return false;

      // Start transcription on server
      emit('start-transcription', {
        meetingId,
        config,
        userId: user.id
      });

      // Start recording audio chunks
      if (mediaRecorder.current) {
        mediaRecorder.current.start(1000); // 1 second intervals
      }

      // Process audio chunks for real-time transcription
      processingInterval.current = setInterval(() => {
        if (audioChunks.current.length > 0) {
          processAudioChunks();
        }
      }, 2000); // Process every 2 seconds

      setIsTranscribing(true);

      dispatch(addNotification({
        type: 'success',
        title: 'Transcription Started',
        message: 'Live transcription is now active'
      }));

      return true;
    } catch (error) {
      console.error('Failed to start transcription:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Transcription Failed',
        message: 'Failed to start live transcription'
      }));
      return false;
    }
  }, [user?.id, meetingId, config, emit, initializeAudioProcessing, dispatch]);

  // Stop transcription
  const stopTranscription = useCallback(() => {
    try {
      // Stop recording
      if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
        mediaRecorder.current.stop();
      }

      // Clear processing interval
      if (processingInterval.current) {
        clearInterval(processingInterval.current);
        processingInterval.current = null;
      }

      // Stop transcription on server
      emit('stop-transcription', { meetingId });

      // Close audio context
      if (audioContext.current) {
        audioContext.current.close();
        audioContext.current = null;
      }

      setIsTranscribing(false);
      audioChunks.current = [];

      dispatch(addNotification({
        type: 'info',
        title: 'Transcription Stopped',
        message: 'Live transcription has been stopped'
      }));
    } catch (error) {
      console.error('Failed to stop transcription:', error);
    }
  }, [meetingId, emit, dispatch]);

  // Process audio chunks for transcription
  const processAudioChunks = useCallback(async () => {
    if (audioChunks.current.length === 0 || !user?.id) return;

    try {
      // Combine audio chunks
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
      audioChunks.current = []; // Clear processed chunks

      // Convert to base64 for transmission
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Send audio data for transcription
      emit('process-audio', {
        meetingId,
        audioData: base64Audio,
        speakerId: user.id,
        timestamp: new Date().toISOString(),
        config
      });

    } catch (error) {
      console.error('Failed to process audio chunks:', error);
    }
  }, [user?.id, meetingId, config, emit]);

  // Handle transcription updates from server
  const handleTranscriptionUpdate = useCallback((data: {
    meetingId: string;
    segment: TranscriptionSegment;
    transcriptionId: string;
  }) => {
    if (data.meetingId !== meetingId) return;

    // Update transcription state
    const updatedTranscription = transcription ? {
      ...transcription,
      segments: [...transcription.segments, data.segment]
    } : {
      id: data.transcriptionId,
      meetingId: data.meetingId,
      segments: [data.segment],
      summary: {
        keyPoints: [],
        decisions: [],
        topics: [],
        sentiment: { overall: { positive: 0, negative: 0, neutral: 1, confidence: 0 }, byParticipant: {}, trends: [] },
        duration: 0,
        participantEngagement: []
      },
      actionItems: [],
      speakers: [],
      language: config.language,
      confidence: data.segment.confidence,
      processingTime: 0
    };

    dispatch(setTranscription(updatedTranscription));

    // Extract action items if enabled
    if (config.actionItemExtraction && data.segment.text) {
      extractActionItems(data.segment.text);
    }
  }, [meetingId, transcription, config, dispatch]);

  // Handle transcription completion
  const handleTranscriptionCompleted = useCallback((data: {
    meetingId: string;
    transcriptionData: TranscriptionData;
  }) => {
    if (data.meetingId !== meetingId) return;

    dispatch(setTranscription(data.transcriptionData));

    // Show summary notification
    const summary = data.transcriptionData.summary;
    dispatch(addNotification({
      type: 'info',
      title: 'Meeting Transcription Complete',
      message: `Generated ${summary.keyPoints.length} key points and ${data.transcriptionData.actionItems.length} action items`
    }));
  }, [meetingId, dispatch]);

  // Extract action items from transcript segment
  const extractActionItems = useCallback(async (text: string) => {
    try {
      // Use client-side AI for basic action item detection
      const actionItemPatterns = [
        /\b(?:action item|todo|task|follow[- ]?up|need to|should|must|will|assign|responsible)\b/gi,
        /\b(?:by|before|until|deadline|due)\s+(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2})/gi
      ];

      const hasActionItem = actionItemPatterns.some(pattern => pattern.test(text));
      
      if (hasActionItem) {
        // Request server-side AI processing for detailed extraction
        emit('extract-action-items', {
          meetingId,
          text,
          userId: user?.id
        });
      }
    } catch (error) {
      console.error('Failed to extract action items:', error);
    }
  }, [meetingId, user?.id, emit]);

  // Update transcription configuration
  const updateConfig = useCallback((newConfig: Partial<TranscriptionConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);

    // Send updated config to server if transcribing
    if (isTranscribing) {
      emit('update-transcription-config', {
        meetingId,
        config: updatedConfig
      });
    }
  }, [config, isTranscribing, meetingId, emit]);

  // Get transcription statistics
  const getTranscriptionStats = useCallback(() => {
    if (!transcription) return null;

    const totalSegments = transcription.segments.length;
    const totalWords = transcription.segments.reduce(
      (count, segment) => count + segment.text.split(' ').length,
      0
    );
    const averageConfidence = transcription.segments.reduce(
      (sum, segment) => sum + segment.confidence,
      0
    ) / totalSegments;

    const speakerStats = transcription.segments.reduce((stats, segment) => {
      const speakerId = segment.speakerId;
      if (!stats[speakerId]) {
        stats[speakerId] = {
          segments: 0,
          words: 0,
          speakTime: 0
        };
      }
      stats[speakerId].segments++;
      stats[speakerId].words += segment.text.split(' ').length;
      stats[speakerId].speakTime += segment.endTime - segment.startTime;
      return stats;
    }, {} as Record<string, { segments: number; words: number; speakTime: number }>);

    return {
      totalSegments,
      totalWords,
      averageConfidence,
      speakers: Object.keys(speakerStats).length,
      speakerStats,
      actionItems: transcription.actionItems.length,
      keyPoints: transcription.summary.keyPoints.length
    };
  }, [transcription]);

  // Search transcription
  const searchTranscription = useCallback((query: string) => {
    if (!transcription || !query.trim()) return [];

    const results = transcription.segments.filter(segment =>
      segment.text.toLowerCase().includes(query.toLowerCase())
    );

    return results.map(segment => ({
      ...segment,
      relevance: (segment.text.toLowerCase().match(new RegExp(query.toLowerCase(), 'g')) || []).length
    })).sort((a, b) => b.relevance - a.relevance);
  }, [transcription]);

  // Export transcription
  const exportTranscription = useCallback((format: 'txt' | 'json' | 'srt') => {
    if (!transcription) return null;

    switch (format) {
      case 'txt':
        return transcription.segments
          .map(segment => `${segment.speakerId}: ${segment.text}`)
          .join('\n\n');
      
      case 'json':
        return JSON.stringify(transcription, null, 2);
      
      case 'srt':
        return transcription.segments
          .map((segment, index) => {
            const start = new Date(segment.startTime).toISOString().substr(11, 12);
            const end = new Date(segment.endTime).toISOString().substr(11, 12);
            return `${index + 1}\n${start} --> ${end}\n${segment.text}\n`;
          })
          .join('\n');
      
      default:
        return null;
    }
  }, [transcription]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    on('transcription-update', handleTranscriptionUpdate);
    on('transcription-completed', handleTranscriptionCompleted);
    on('action-items-extracted', (data) => {
      if (data.meetingId === meetingId) {
        dispatch(addNotification({
          type: 'info',
          title: 'Action Items Found',
          message: `${data.actionItems.length} action items extracted from conversation`
        }));
      }
    });

    return () => {
      off('transcription-update', handleTranscriptionUpdate);
      off('transcription-completed', handleTranscriptionCompleted);
      off('action-items-extracted');
    };
  }, [socket, on, off, handleTranscriptionUpdate, handleTranscriptionCompleted, meetingId, dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isTranscribing) {
        stopTranscription();
      }
    };
  }, []);

  return {
    // State
    transcription,
    isTranscribing,
    config,

    // Actions
    startTranscription,
    stopTranscription,
    updateConfig,

    // Utilities
    getTranscriptionStats,
    searchTranscription,
    exportTranscription,
    extractActionItems
  };
};
