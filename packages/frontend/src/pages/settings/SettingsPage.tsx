import React from 'react';
import { Box, Typography } from '@mui/material';

export const SettingsPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Typography variant="body1">
        User preferences, security settings, and AI adaptation controls will be available here.
      </Typography>
    </Box>
  );
};
