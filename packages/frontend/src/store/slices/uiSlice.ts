import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  language: string;
  notifications: {
    enabled: boolean;
    sound: boolean;
  };
  layout: {
    density: 'comfortable' | 'compact';
    sidebar: 'expanded' | 'collapsed' | 'hidden';
  };
}

const initialState: UIState = {
  theme: 'light',
  sidebarOpen: true,
  language: 'en',
  notifications: {
    enabled: true,
    sound: true,
  },
  layout: {
    density: 'comfortable',
    sidebar: 'expanded',
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    updateNotificationSettings: (state, action: PayloadAction<Partial<UIState['notifications']>>) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    updateLayoutSettings: (state, action: PayloadAction<Partial<UIState['layout']>>) => {
      state.layout = { ...state.layout, ...action.payload };
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  setLanguage,
  updateNotificationSettings,
  updateLayoutSettings,
} = uiSlice.actions;

export default uiSlice.reducer;
