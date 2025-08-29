import React from 'react';
import { Box } from '@mui/material';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <Box display="flex" minHeight="100vh">
      <Box component="main" flexGrow={1} p={3}>
        {children}
      </Box>
    </Box>
  );
};
