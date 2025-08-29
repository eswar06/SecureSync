import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Meeting, Participant, TranscriptionData } from '@securesync/shared';

interface MeetingState {
  currentMeeting: Meeting | null;
  participants: Participant[];
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  transcription: TranscriptionData | null;
  isRecording: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'failed';
  securityStatus: {
    active: boolean;
    threats: number;
    watermarkEnabled: boolean;
  };
  [key : string]: any; // For future extensibility
}

const initialState: MeetingState = {
  currentMeeting: null,
  participants: [],
  localStream: null,
  remoteStreams: new Map(),
  isAudioEnabled: true,
  isVideoEnabled: false,
  isScreenSharing: false,
  transcription: null,
  isRecording: false,
  connectionStatus: 'disconnected',
  securityStatus: {
    active: false,
    threats: 0,
    watermarkEnabled: false,
  },
};

const meetingSlice = createSlice({
  name: 'meeting',
  initialState,
  reducers: {
    setCurrentMeeting: (state, action: PayloadAction<Meeting>) => {
      state.currentMeeting = action.payload;
    },
    addParticipant: (state, action: PayloadAction<Participant>) => {
      state.participants.push(action.payload);
    },
    removeParticipant: (state, action: PayloadAction<string>) => {
      state.participants = state.participants.filter(p => p.userId !== action.payload);
    },
    updateParticipant: (state, action: PayloadAction<{ userId: string; updates: Partial<Participant> }>) => {
      const index = state.participants.findIndex(p => p.userId === action.payload.userId);
      if (index !== -1) {
        state.participants[index] = { ...state.participants[index], ...action.payload.updates };
      }
    },
    setLocalStream: (state, action: PayloadAction<MediaStream | null>) => {
      state.localStream = action.payload;
    },
    toggleAudio: (state) => {
      state.isAudioEnabled = !state.isAudioEnabled;
    },
    toggleVideo: (state) => {
      state.isVideoEnabled = !state.isVideoEnabled;
    },
    toggleScreenShare: (state) => {
      state.isScreenSharing = !state.isScreenSharing;
    },
    setTranscription: (state, action: PayloadAction<TranscriptionData>) => {
      state.transcription = action.payload;
    },
    setRecording: (state, action: PayloadAction<boolean>) => {
      state.isRecording = action.payload;
    },
    setConnectionStatus: (state, action: PayloadAction<MeetingState['connectionStatus']>) => {
      state.connectionStatus = action.payload;
    },
    updateSecurityStatus: (state, action: PayloadAction<Partial<MeetingState['securityStatus']>>) => {
      state.securityStatus = { ...state.securityStatus, ...action.payload };
    },
    clearMeeting: (state) => {
      state.currentMeeting = null;
      state.participants = [];
      state.localStream = null;
      state.remoteStreams = new Map();
      state.isAudioEnabled = true;
      state.isVideoEnabled = false;
      state.isScreenSharing = false;
      state.transcription = null;
      state.isRecording = false;
      state.connectionStatus = 'disconnected';
      state.securityStatus = {
        active: false,
        threats: 0,
        watermarkEnabled: false,
      };
    },
  },
});

export const {
  setCurrentMeeting,
  addParticipant,
  removeParticipant,
  updateParticipant,
  setLocalStream,
  toggleAudio,
  toggleVideo,
  toggleScreenShare,
  setTranscription,
  setRecording,
  setConnectionStatus,
  updateSecurityStatus,
  clearMeeting,
} = meetingSlice.actions;

export default meetingSlice.reducer;
