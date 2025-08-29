import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Alert, Paper } from '@mui/material';
import { RefreshOutlined, BugReportOutlined } from '@mui/icons-material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // In a real app, you would send this to an error reporting service
    // like Sentry, LogRocket, etc.
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          bgcolor="background.default"
          p={3}
        >
          <Paper
            elevation={2}
            sx={{
              p: 4,
              maxWidth: 600,
              width: '100%',
              textAlign: 'center',
            }}
          >
            <BugReportOutlined
              sx={{
                fontSize: 64,
                color: 'error.main',
                mb: 2,
              }}
            />
            
            <Typography variant="h4" color="error" gutterBottom>
              Oops! Something went wrong
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              We apologize for the inconvenience. An unexpected error has occurred in SecureSync Pro.
            </Typography>

            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2" component="div">
                <strong>Error:</strong> {this.state.error?.message}
              </Typography>
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{
                    mt: 1,
                    fontSize: '0.75rem',
                    overflow: 'auto',
                    maxHeight: 200,
                  }}
                >
                  {this.state.errorInfo.componentStack}
                </Typography>
              )}
            </Alert>

            <Box display="flex" gap={2} justifyContent="center">
              <Button
                variant="contained"
                startIcon={<RefreshOutlined />}
                onClick={this.handleReload}
                color="primary"
              >
                Reload Application
              </Button>
              
              <Button
                variant="outlined"
                onClick={this.handleReset}
                color="secondary"
              >
                Try Again
              </Button>
            </Box>

            <Typography
              variant="caption"
              color="text.disabled"
              display="block"
              sx={{ mt: 3 }}
            >
              If this problem persists, please contact support at support@securesync.pro
            </Typography>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}
