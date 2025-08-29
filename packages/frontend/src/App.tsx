import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAppDispatch, useAppSelector } from './hooks/redux';
import { checkAuthStatus } from './store/slices/authSlice';

// Layout Components
import { MainLayout } from './components/layout/MainLayout';
import { AuthLayout } from './components/layout/AuthLayout';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { MeetingPage } from './pages/meeting/MeetingPage';
import { SpacesPage } from './pages/spaces/SpacesPage';
import { DocumentsPage } from './pages/documents/DocumentsPage';
import { SecurityPage } from './pages/security/SecurityPage';
import { SettingsPage } from './pages/settings/SettingsPage';

// Security Components
import { RecordingPrevention } from './components/security/RecordingPrevention';
import { SecurityMonitor } from './components/security/SecurityMonitor';

// Error Boundary
import { ErrorBoundary } from './components/common/ErrorBoundary';

//Auth Provider
import { AuthProvider } from './contexts/Authcontext';

// Private Route Component
interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
};

// Public Route Component (only for non-authenticated users)
const PublicRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AuthLayout>
      {children}
    </AuthLayout>
  );
};

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Check authentication status on app load
    dispatch(checkAuthStatus());
  }, [dispatch]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        {/* Loading component would go here */}
        <div>Loading SecureSync Pro...</div>
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
      <Box minHeight="100vh" bgcolor="background.default">
        {/* Security Components - Always Active */}
        {isAuthenticated && (
          <>
            <RecordingPrevention />
            <SecurityMonitor />
          </>
        )}

        <Routes>
          {/* Public Routes */}
          <Route path="/auth/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />
          <Route path="/auth/register" element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } />

          {/* Private Routes */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          } />
          
          <Route path="/meeting/:meetingId" element={
            <PrivateRoute>
              <MeetingPage />
            </PrivateRoute>
          } />
          
          <Route path="/spaces" element={
            <PrivateRoute>
              <SpacesPage />
            </PrivateRoute>
          } />
          
          <Route path="/spaces/:spaceId" element={
            <PrivateRoute>
              <SpacesPage />
            </PrivateRoute>
          } />
          
          <Route path="/documents" element={
            <PrivateRoute>
              <DocumentsPage />
            </PrivateRoute>
          } />
          
          <Route path="/security" element={
            <PrivateRoute>
              <SecurityPage />
            </PrivateRoute>
          } />
          
          <Route path="/settings" element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          } />

          {/* Redirect root to appropriate page */}
          <Route path="/" element={
            <Navigate to={isAuthenticated ? "/dashboard" : "/auth/login"} replace />
          } />

          {/* Catch-all redirect */}
          <Route path="*" element={
            <Navigate to={isAuthenticated ? "/dashboard" : "/auth/login"} replace />
          } />
        </Routes>
      </Box>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
