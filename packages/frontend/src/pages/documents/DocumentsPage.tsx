import React from 'react';
import { Box, Typography } from '@mui/material';

export const DocumentsPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Secure Documents
      </Typography>
      <Typography variant="body1">
        Document control with DRM and blockchain logging will be implemented here.
      </Typography>
    </Box>
  );
};
