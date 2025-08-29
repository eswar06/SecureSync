import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Chip,
  Slider,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  CloseOutlined,
  AddOutlined,
  ExitToAppOutlined,
  VolumeUpOutlined,
  SecurityOutlined
} from '@mui/icons-material';
import { PrivateChannel } from '@securesync/shared';

interface PrivateVoicePanelProps {
  open: boolean;
  onClose: () => void;
  activeChannels: PrivateChannel[];
  currentChannel: string | null;
  onCreateChannel: () => void;
  onJoinChannel: (channelId: string) => void;
  onLeaveChannel: (channelId: string) => void;
}

export const PrivateVoicePanel: React.FC<PrivateVoicePanelProps> = ({
  open,
  onClose,
  activeChannels,
  currentChannel,
  onCreateChannel,
  onJoinChannel,
  onLeaveChannel
}) => {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ '& .MuiDrawer-paper': { width: 320, p: 2 } }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Private Voice Channels</Typography>
        <IconButton onClick={onClose}>
          <CloseOutlined />
        </IconButton>
      </Box>

      <Button
        variant="contained"
        startIcon={<AddOutlined />}
        onClick={onCreateChannel}
        fullWidth
        sx={{ mb: 2 }}
      >
        Create Private Channel
      </Button>

      <List>
        {activeChannels.map((channel) => (
          <ListItem key={channel.id} divider>
            <ListItemText
              primary={`Channel ${channel.id.slice(-6)}`}
              secondary={
                <Box>
                  <Typography variant="caption" display="block">
                    {channel.participants.length} participants
                  </Typography>
                  {channel.zeroRecordingGuarantee && (
                    <Chip
                      icon={<SecurityOutlined />}
                      label="Zero Recording"
                      size="small"
                      color="success"
                      sx={{ mt: 0.5 }}
                    />
                  )}
                </Box>
              }
            />
            <ListItemSecondaryAction>
              {currentChannel === channel.id ? (
                <IconButton
                  edge="end"
                  onClick={() => onLeaveChannel(channel.id)}
                  color="error"
                >
                  <ExitToAppOutlined />
                </IconButton>
              ) : (
                <IconButton
                  edge="end"
                  onClick={() => onJoinChannel(channel.id)}
                  color="primary"
                >
                  <VolumeUpOutlined />
                </IconButton>
              )}
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      {activeChannels.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="body2" color="text.secondary">
            No private channels available
          </Typography>
        </Box>
      )}
    </Drawer>
  );
};
