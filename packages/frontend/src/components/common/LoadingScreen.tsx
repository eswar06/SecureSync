import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading SecureSync Pro...' 
}) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="background.default"
      gap={3}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Box position="relative">
          <CircularProgress size={60} thickness={4} />
          <Box
            position="absolute"
            top="50%"
            left="50%"
            sx={{
              transform: 'translate(-50%, -50%)',
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Box
                width={24}
                height={24}
                bgcolor="primary.main"
                borderRadius="50%"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Box
                  width={8}
                  height={8}
                  bgcolor="white"
                  borderRadius="50%"
                />
              </Box>
            </motion.div>
          </Box>
        </Box>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Typography
          variant="h6"
          color="text.secondary"
          textAlign="center"
          fontWeight={500}
        >
          {message}
        </Typography>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Typography
          variant="body2"
          color="text.disabled"
          textAlign="center"
        >
          Initializing security protocols...
        </Typography>
      </motion.div>
    </Box>
  );
};
