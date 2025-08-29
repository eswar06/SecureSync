import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SecurityThreat } from '@securesync/shared';

interface SecurityState {
  threats: SecurityThreat[];
  isMonitoring: boolean;
  recordingPrevention: {
    active: boolean;
    threatsDetected: number;
    lastCheck: Date | null;
  };
  watermark: {
    enabled: boolean;
    dynamic: boolean;
    opacity: number;
  };
  networkMonitoring: {
    active: boolean;
    suspiciousActivity: number;
  };
  [key: string]: any; // For future extensibility
}

const initialState: SecurityState = {
  threats: [],
  isMonitoring: false,
  recordingPrevention: {
    active: false,
    threatsDetected: 0,
    lastCheck: null,
  },
  watermark: {
    enabled: false,
    dynamic: true,
    opacity: 0.15,
  },
  networkMonitoring: {
    active: false,
    suspiciousActivity: 0,
  },
};

const securitySlice = createSlice({
  name: 'security',
  initialState,
  reducers: {
    addThreat: (state, action: PayloadAction<SecurityThreat>) => {
      state.threats.unshift(action.payload);
      // Keep only last 100 threats
      if (state.threats.length > 100) {
        state.threats = state.threats.slice(0, 100);
      }
    },
    setMonitoring: (state, action: PayloadAction<boolean>) => {
      state.isMonitoring = action.payload;
    },
    updateRecordingPrevention: (state, action: PayloadAction<Partial<SecurityState['recordingPrevention']>>) => {
      state.recordingPrevention = { ...state.recordingPrevention, ...action.payload };
    },
    updateWatermark: (state, action: PayloadAction<Partial<SecurityState['watermark']>>) => {
      state.watermark = { ...state.watermark, ...action.payload };
    },
    updateNetworkMonitoring: (state, action: PayloadAction<Partial<SecurityState['networkMonitoring']>>) => {
      state.networkMonitoring = { ...state.networkMonitoring, ...action.payload };
    },
    clearThreats: (state) => {
      state.threats = [];
    },
  },
});

export const {
  addThreat,
  setMonitoring,
  updateRecordingPrevention,
  updateWatermark,
  updateNetworkMonitoring,
  clearThreats,
} = securitySlice.actions;

export default securitySlice.reducer;
