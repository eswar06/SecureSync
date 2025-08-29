import React from 'react';
import { Box } from '@mui/material';
import { useParams, Navigate } from 'react-router-dom';
import { VideoCall } from '../../components/meeting/VideoCall';

export const MeetingPage: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();

  if (!meetingId) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>
      <VideoCall meetingId={meetingId} />
    </Box>
  );
};
