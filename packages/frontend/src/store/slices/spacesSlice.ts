import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Space, Thread, Message, SpaceParticipant } from '../../../../shared/src/types/index';


// State shape
interface SpacesState {
  spaces: Space[];
  currentSpace: Space | null;
  messages: Message[];
  currentSpaceId: string | null;
  currentThreadId: string | null;
  threads: Thread[];
}

const initialState: SpacesState = {
  spaces: [],
  currentSpace: null,
  messages: [],
  currentSpaceId: null,
  currentThreadId: null,
  threads: []
};

const spacesSlice = createSlice({
  name: 'spaces',
  initialState,
  reducers: {
    setSpaces(state, action: PayloadAction<Space[]>) {
      state.spaces = action.payload;
    },
    setCurrentSpace(state, action: PayloadAction<Space | null>) {
      state.currentSpace = action.payload;

      if (action.payload) {
        state.currentSpaceId = action.payload.id;
        state.threads = action.payload.threads;
      } else {
        state.currentSpaceId = null;
        state.threads = [];
  }
    },
    setCurrentThread(state, action: PayloadAction<string>) {
      state.currentThreadId = action.payload;
    },
    addThread(state, action: PayloadAction<Thread>) {
      const space = state.spaces.find((s) => s.id === action.payload.spaceId);
      if (space) {
        if (!space.threads) space.threads = [];
        space.threads.push(action.payload);
      }
    },
    updateThread(state, action: PayloadAction<Thread>) {
      const space = state.spaces.find((s) => s.id === action.payload.spaceId);
      if (space && space.threads) {
        const idx = space.threads.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) {
          space.threads[idx] = action.payload;
        }
      }
    },
    setMessages(state, action: PayloadAction<Message[]>) {
      state.messages = action.payload;
    },
    addMessage(state, action: PayloadAction<Message>) {
      state.messages.push(action.payload);
      // Also add to the right thread if you maintain messages inside threads
      if (state.currentSpace && state.currentSpace.threads) {
        const thread = state.currentSpace.threads.find(t => t.id === action.payload.threadId);
        if (thread) {
          if (!thread.messages) thread.messages = [];
          thread.messages.push(action.payload);
        }
      }
    },
    updateSpaceParticipants(state, action: PayloadAction<SpaceParticipant[]>) {
      if (state.currentSpace) {
        state.currentSpace.participants = action.payload;
      }
      // Optionally, update participants in the spaces[] array as well
      const currentSpaceId = state.currentSpace?.id;
      if (currentSpaceId) {
        const space = state.spaces.find(s => s.id === currentSpaceId);
        if (space) {
          space.participants = action.payload;
        }
      }
    }
    // ... other reducers as needed
  }
});

export const {
  setSpaces,
  setCurrentSpace,
  addThread,
  updateThread,
  setMessages,
  addMessage,
  updateSpaceParticipants
} = spacesSlice.actions;

export default spacesSlice.reducer;
