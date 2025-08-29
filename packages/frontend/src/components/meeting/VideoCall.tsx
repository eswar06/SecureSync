import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  IconButton,
  Typography,
  Chip,
  Avatar,
  Tooltip,
  Fab,
  Menu,
  MenuItem,
  Badge
} from '@mui/material';
import {
  MicOutlined,
  MicOffOutlined,
  VideocamOutlined,
  VideocamOffOutlined,
  ScreenShareOutlined,
  StopScreenShareOutlined,
  CallEndOutlined,
  MoreVertOutlined,
  SecurityOutlined,
  RecordVoiceOverOutlined,
  VolumeUpOutlined
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebRTC } from '../../hooks/useWebRTC';
import { usePrivateVoice } from '../../hooks/usePrivateVoice';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { toggleAudio, toggleVideo, toggleScreenShare } from '../../store/slices/meetingSlice';
import { PrivateVoicePanel } from './PrivateVoicePanel';
import { SecurityStatus } from './SecurityStatus';
import { TranscriptionPanel } from './TranscriptionPanel';

interface VideoCallProps {
  meetingId: string;
}

export const VideoCall: React.FC<VideoCallProps> = ({ meetingId }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const {
    peers,
    localStream,
    joinMeeting,
    leaveMeeting,
    toggleAudio: toggleWebRTCAudio,
    toggleVideo: toggleWebRTCVideo,
    startScreenShare,
    stopScreenShare,
    getPeerStream
  } = useWebRTC(meetingId);

  const {
    activeChannels,
    currentChannel,
    isInPrivateChannel,
    createPrivateChannel,
    joinPrivateChannel,
    leavePrivateChannel,
    toggleMainMeetingAudio
  } = usePrivateVoice(meetingId);

  const {
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    participants,
    securityStatus,
    connectionStatus
  } = useAppSelector((state) => state.meeting);

  const { user } = useAppSelector((state) => state.auth);

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [showPrivateVoice, setShowPrivateVoice] = useState(false);
  const [showTranscription, setShowTranscription] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Initialize meeting on component mount
  useEffect(() => {
    joinMeeting();
    
    return () => {
      leaveMeeting();
    };
  }, [joinMeeting, leaveMeeting]);

  // Set up local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handleToggleAudio = () => {
    dispatch(toggleAudio());
    toggleWebRTCAudio();
  };

  const handleToggleVideo = () => {
    dispatch(toggleVideo());
    toggleWebRTCVideo();
  };

  const handleToggleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
    dispatch(toggleScreenShare());
  };

  const handleLeaveMeeting = () => {
    leaveMeeting();
    navigate('/dashboard');
  };

  const handleCreatePrivateChannel = () => {
    const selectedParticipants = participants
      .filter(p => p.userId !== user?.id)
      .map(p => p.userId);
    
    if (selectedParticipants.length > 0) {
      createPrivateChannel(selectedParticipants.slice(0, 3)); // Limit to 3 additional participants
    }
  };

  const renderParticipantVideo = (userId: string, index: number) => {
    const participant = participants.find(p => p.userId === userId);
    const stream = getPeerStream(userId);
    
    return (
      <Grid item xs={12} sm={6} md={4} key={userId}>
        <Card
          sx={{
            position: 'relative',
            aspectRatio: '16/9',
            backgroundColor: '#000',
            overflow: 'hidden'
          }}
        >
          {stream ? (
            <video
              autoPlay
              playsInline
              muted={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              ref={(video) => {
                if (video) video.srcObject = stream;
              }}
            />
          ) : (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              height="100%"
              bgcolor="grey.900"
            >
              <Avatar sx={{ width: 64, height: 64 }}>
                {userId.charAt(0).toUpperCase()}
              </Avatar>
            </Box>
          )}

          {/* Participant overlay */}
          <Box
            position="absolute"
            bottom={8}
            left={8}
            right={8}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Chip
              label={userId}
              size="small"
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                backdropFilter: 'blur(4px)'
              }}
            />
            
            <Box display="flex" gap={0.5}>
              {!participant?.audioEnabled && (
                <MicOffOutlined
                  fontSize="small"
                  sx={{ color: 'error.main' }}
                />
              )}
              {!participant?.videoEnabled && (
                <VideocamOffOutlined
                  fontSize="small"
                  sx={{ color: 'error.main' }}
                />
              )}
              {participant?.isPresenting && (
                <ScreenShareOutlined
                  fontSize="small"
                  sx={{ color: 'primary.main' }}
                />
              )}
            </Box>
          </Box>

          {/* Security watermark */}
          <Box
            position="absolute"
            top={8}
            right={8}
            sx={{
              opacity: 0.3,
              fontSize: '10px',
              color: 'white',
              fontFamily: 'monospace',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              padding: '2px 4px',
              borderRadius: 1
            }}
          >
            SECURE • {new Date().toLocaleTimeString()}
          </Box>
        </Card>
      </Grid>
    );
  };

  const renderLocalVideo = () => (
    <Grid item xs={12} sm={6} md={4}>
      <Card
        sx={{
          position: 'relative',
          aspectRatio: '16/9',
          backgroundColor: '#000',
          overflow: 'hidden',
          border: '2px solid',
          borderColor: 'primary.main'
        }}
      >
        {localStream && isVideoEnabled ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)' // Mirror local video
            }}
          />
        ) : (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            height="100%"
            bgcolor="grey.900"
          >
            <Avatar sx={{ width: 64, height: 64 }}>
              {user?.name?.charAt(0).toUpperCase() || 'Y'}
            </Avatar>
          </Box>
        )}

        {/* Local video overlay */}
        <Box
          position="absolute"
          bottom={8}
          left={8}
          right={8}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Chip
            label="You"
            size="small"
            sx={{
              backgroundColor: 'rgba(25, 118, 210, 0.8)',
              color: 'white',
              backdropFilter: 'blur(4px)'
            }}
          />
          
          <Box display="flex" gap={0.5}>
            {!isAudioEnabled && (
              <MicOffOutlined
                fontSize="small"
                sx={{ color: 'error.main' }}
              />
            )}
            {!isVideoEnabled && (
              <VideocamOffOutlined
                fontSize="small"
                sx={{ color: 'error.main' }}
              />
            )}
            {isScreenSharing && (
              <ScreenShareOutlined
                fontSize="small"
                sx={{ color: 'primary.main' }}
              />
            )}
          </Box>
        </Box>

        {/* Security status indicator */}
        <Box
          position="absolute"
          top={8}
          left={8}
        >
          <Tooltip title="Security Active">
            <SecurityOutlined
              fontSize="small"
              sx={{
                color: securityStatus.active ? 'success.main' : 'warning.main',
                filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.8))'
              }}
            />
          </Tooltip>
        </Box>

        {/* Private channel indicator */}
        {isInPrivateChannel && (
          <Box
            position="absolute"
            top={8}
            right={8}
          >
            <Tooltip title="In Private Channel">
              <RecordVoiceOverOutlined
                fontSize="small"
                sx={{
                  color: 'secondary.main',
                  filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.8))'
                }}
              />
            </Tooltip>
          </Box>
        )}
      </Card>
    </Grid>
  );

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Meeting Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box>
          <Typography variant="h6">Meeting: {meetingId}</Typography>
          <Typography variant="body2" color="text.secondary">
            {participants.length + 1} participant{participants.length !== 0 ? 's' : ''}
            {connectionStatus !== 'connected' && ` • ${connectionStatus}`}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          <SecurityStatus />
          
          {activeChannels.length > 0 && (
            <Badge badgeContent={activeChannels.length} color="secondary">
              <IconButton
                onClick={() => setShowPrivateVoice(!showPrivateVoice)}
                color={showPrivateVoice ? 'primary' : 'default'}
              >
                <RecordVoiceOverOutlined />
              </IconButton>
            </Badge>
          )}

          <IconButton
            onClick={() => setShowTranscription(!showTranscription)}
            color={showTranscription ? 'primary' : 'default'}
          >
            <VolumeUpOutlined />
          </IconButton>

          <IconButton
            onClick={(e) => setMenuAnchor(e.currentTarget)}
          >
            <MoreVertOutlined />
          </IconButton>
        </Box>
      </Box>

      {/* Video Grid */}
      <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
        <Grid container spacing={2}>
          {renderLocalVideo()}
          {Array.from(peers.keys()).map((userId, index) => 
            renderParticipantVideo(userId, index)
          )}
        </Grid>
      </Box>

      {/* Controls */}
      <Box
        sx={{
          p: 2,
          backgroundColor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'center',
          gap: 2
        }}
      >
        <Tooltip title={isAudioEnabled ? 'Mute' : 'Unmute'}>
          <IconButton
            onClick={handleToggleAudio}
            color={isAudioEnabled ? 'primary' : 'error'}
            size="large"
          >
            {isAudioEnabled ? <MicOutlined /> : <MicOffOutlined />}
          </IconButton>
        </Tooltip>

        <Tooltip title={isVideoEnabled ? 'Stop Video' : 'Start Video'}>
          <IconButton
            onClick={handleToggleVideo}
            color={isVideoEnabled ? 'primary' : 'error'}
            size="large"
          >
            {isVideoEnabled ? <VideocamOutlined /> : <VideocamOffOutlined />}
          </IconButton>
        </Tooltip>

        <Tooltip title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}>
          <IconButton
            onClick={handleToggleScreenShare}
            color={isScreenSharing ? 'secondary' : 'default'}
            size="large"
          >
            {isScreenSharing ? <StopScreenShareOutlined /> : <ScreenShareOutlined />}
          </IconButton>
        </Tooltip>

        {isInPrivateChannel && (
          <Tooltip title="Toggle Main Meeting Audio">
            <IconButton
              onClick={toggleMainMeetingAudio}
              color="secondary"
              size="large"
            >
              <VolumeUpOutlined />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title="Leave Meeting">
          <Fab
            color="error"
            onClick={handleLeaveMeeting}
            sx={{ ml: 2 }}
          >
            <CallEndOutlined />
          </Fab>
        </Tooltip>
      </Box>

      {/* Side Panels */}
      {showPrivateVoice && (
        <PrivateVoicePanel
          open={showPrivateVoice}
          onClose={() => setShowPrivateVoice(false)}
          activeChannels={activeChannels}
          currentChannel={currentChannel}
          onCreateChannel={handleCreatePrivateChannel}
          onJoinChannel={joinPrivateChannel}
          onLeaveChannel={leavePrivateChannel}
        />
      )}

      {showTranscription && (
        <TranscriptionPanel
          open={showTranscription}
          onClose={() => setShowTranscription(false)}
          meetingId={meetingId}
        />
      )}

      {/* More Options Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={handleCreatePrivateChannel}>
          Create Private Channel
        </MenuItem>
        <MenuItem onClick={() => setShowTranscription(true)}>
          View Transcription
        </MenuItem>
        <MenuItem onClick={() => setShowPrivateVoice(true)}>
          Private Voice Controls
        </MenuItem>
      </Menu>
    </Box>
  );
};
