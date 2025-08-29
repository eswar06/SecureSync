import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, ApiResponse } from '../../../../shared/src/types';
import { authApi,LoginResponse } from '../../api/auth';
import { RootState } from '..';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk<
  LoginResponse,                                  // ✅ success return type
  { email: string; password: string },            // ✅ argument type
  { rejectValue: string }                         // ✅ reject value type
>(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authApi.login(email, password);
      return response.data as LoginResponse;
    } catch (error: any) {
      const message: string =
        error?.response?.data?.error?.message ?? 'Login failed';

      // Always return here, no fallthrough
      return rejectWithValue(message);
    }
  }
);


export const register = createAsyncThunk<
  LoginResponse,                               // ✅ return type on success
  { email: string; password: string; name: string; organization: string }, // ✅ input type
  { rejectValue: string }                         // ✅ reject value type
>(
  'auth/register',
  async (userData, { rejectWithValue }): Promise<LoginResponse | ReturnType<typeof rejectWithValue>> => {
    try {
      const response = await authApi.register(userData);
      return response.data as LoginResponse;
    } catch (error: any) {
      const message: string =
        error?.response?.data?.error?.message ?? 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      await authApi.logout(state.auth.refreshToken || '');
    } catch (error: any) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    }
  }
);

export const refreshToken = createAsyncThunk<
  LoginResponse,                // ✅ success return type
  void,                                // ✅ no arguments
  { rejectValue: string; state: RootState } // ✅ reject type + state type
>(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }): Promise<LoginResponse | ReturnType<typeof rejectWithValue>> => {
    try {
      const state = getState();
      if (!state.auth.refreshToken) {
        return rejectWithValue('No refresh token available');
      }

      const response = await authApi.refreshToken(state.auth.refreshToken);
      return response.data as LoginResponse;
    } catch (error: any) {
      const message: string =
        error?.response?.data?.error?.message ?? 'Token refresh failed';
      return rejectWithValue(message);
    }
  }
);

export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { getState, dispatch }) => {
    const state = getState() as RootState;
    
    if (state.auth.accessToken && state.auth.refreshToken) {
      // Check if token is still valid
      try {
        // You would make an API call to verify the token here
        // For now, we'll assume it's valid if it exists
        return {
          user: state.auth.user,
          tokens: {
            accessToken: state.auth.accessToken,
            refreshToken: state.auth.refreshToken,
          },
        };
      } catch (error) {
        // Token is invalid, try to refresh
        dispatch(refreshToken() as any);
        throw error;
      }
    }
    
    throw new Error('No authentication data');
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      if (state.user) {
        state.user.isOnline = action.payload;
        state.user.lastActive = new Date();
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.tokens.accessToken;
        state.refreshToken = action.payload.tokens.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.tokens.accessToken;
        state.refreshToken = action.payload.tokens.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })

    // Logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      })

    // Refresh Token
    builder
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.tokens.accessToken;
        state.refreshToken = action.payload.tokens.refreshToken;
        state.error = null;
      })
      .addCase(refreshToken.rejected, (state) => {
        // Token refresh failed, user needs to log in again
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = 'Session expired. Please log in again.';
      })

    // Check Auth Status
    builder
      .addCase(checkAuthStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.tokens.accessToken;
        state.refreshToken = action.payload.tokens.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, updateUser, setOnlineStatus } = authSlice.actions;
export default authSlice.reducer;
