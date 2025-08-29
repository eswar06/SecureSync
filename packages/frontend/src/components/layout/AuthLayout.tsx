import React from 'react';
import { Box, Container } from '@mui/material';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <Box
      display="flex"
      minHeight="100vh"
      alignItems="center"
      justifyContent="center"
      bgcolor="background.default"
    >
      <Container maxWidth="sm">
        {children}
      </Container>
    </Box>
  );
};
