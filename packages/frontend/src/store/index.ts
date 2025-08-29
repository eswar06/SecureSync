import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';

// Slices
import authSlice from './slices/authSlice';
import uiSlice from './slices/uiSlice';
import meetingSlice from './slices/meetingSlice';
import spacesSlice from './slices/spacesSlice';
import documentsSlice from './slices/documentsSlice';
import securitySlice from './slices/securitySlice';
import notificationsSlice from './slices/notificationsSlice';

// Root reducer
const rootReducer = combineReducers({
  auth: authSlice,
  ui: uiSlice,
  meeting: meetingSlice,
  spaces: spacesSlice,
  documents: documentsSlice,
  security: securitySlice,
  notifications: notificationsSlice,
});

// Persist configuration
const persistConfig = {
  key: 'securesync-pro',
  storage,
  whitelist: ['auth', 'ui'], // Only persist auth and UI preferences
  blacklist: ['meeting', 'security'], // Don't persist sensitive data
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/PURGE',
          'persist/REGISTER',
        ],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
