import React from 'react';
import { Box, Typography } from '@mui/material';

export const SecurityPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Security Dashboard
      </Typography>
      <Typography variant="body1">
        Security monitoring, threat detection, and recording prevention status will be displayed here.
      </Typography>
    </Box>
  );
};
