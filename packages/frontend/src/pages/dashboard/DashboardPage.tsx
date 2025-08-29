import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Badge
} from '@mui/material';
import { 
  SecurityOutlined, 
  VideoCallOutlined, 
  MessageOutlined, 
  FolderOutlined,
  Add,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { useAppSelector } from '../../hooks/redux';
import { useSocket } from '../../providers/SocketProvider';
import { useAuth } from '../../contexts/Authcontext';
import { Meeting } from '../../../../shared/src/types/index';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user } = useAuth();
  
  // Redux state selectors
  const spaces = useAppSelector(state => state.spaces.spaces);
  const securityAlerts = useAppSelector(state => state.security.alerts);
  const meetings = useAppSelector(state => state.meeting.meetings as Meeting[]);
  const documents = useAppSelector(state => state.documents.documents);
  
  // Local state for quick meeting creation
  const [showQuickMeetingDialog, setShowQuickMeetingDialog] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  
  // Quick stats for dashboard cards
  const activeSpaces = spaces?.filter(space => space.status === 'active').length || 0;
  const criticalAlerts = securityAlerts?.filter((alert: { severity: string }) => alert.severity === 'critical').length || 0;

  const upcomingMeetings = meetings?.filter(meeting => 
    new Date(meeting.startTime) > new Date()
  ).length || 0;
  const sharedDocuments = documents?.filter(doc => 
    doc.permissions.allowedToView?.includes(user?.id || '')
  ).length || 0;

  // Card click handlers with navigation
  const handleCardClick = (path: string, feature: string) => {
    // Track analytics
    if (socket) {
      socket.emit('dashboard-feature-accessed', {
        feature,
        userId: user?.id,
        timestamp: new Date()
      });
    }
    navigate(path);
  };

  // Quick actions
  const handleQuickMeeting = () => {
    if (meetingTitle.trim()) {
      // Create instant meeting
      const meetingData = {
        title: meetingTitle,
        startTime: new Date(),
        enableTranscription: true,
        enableRecordingPrevention: true,
        createdBy: user?.id
      };
      
      if (socket) {
        socket.emit('create-instant-meeting', meetingData);
      }
      
      setShowQuickMeetingDialog(false);
      setMeetingTitle('');
      navigate('/meetings/new');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.name || 'User'}!
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Your secure collaboration dashboard
        </Typography>
      </Box>

      {/* Quick Actions Bar */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button 
          variant="contained" 
          startIcon={<VideoCallOutlined />}
          onClick={() => setShowQuickMeetingDialog(true)}
          sx={{ borderRadius: 2 }}
        >
          Quick Meeting
        </Button>
        <Button 
          variant="outlined" 
          startIcon={<MessageOutlined />}
          onClick={() => navigate('/spaces/new')}
          sx={{ borderRadius: 2 }}
        >
          New Space
        </Button>
        <Button 
          variant="outlined" 
          startIcon={<FolderOutlined />}
          onClick={() => navigate('/documents/upload')}
          sx={{ borderRadius: 2 }}
        >
          Upload Document
        </Button>
      </Box>

      {/* Feature Cards Grid */}
      <Grid container spacing={3}>
        {/* Meetings Card */}
        <Grid item xs={12} md={6} lg={3}>
          <Card 
            onClick={() => handleCardClick('/meetings', 'meetings')} 
            sx={{ 
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3
              }
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <VideoCallOutlined color="primary" fontSize="large" />
                  <Typography variant="h6">Meetings</Typography>
                </Box>
                {upcomingMeetings > 0 && (
                  <Badge badgeContent={upcomingMeetings} color="primary" />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Start or join secure meetings
              </Typography>
              <Box mt={2}>
                <Chip 
                  label={`${upcomingMeetings} upcoming`} 
                  size="small" 
                  color={upcomingMeetings > 0 ? 'primary' : 'default'}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Spaces Card */}
        <Grid item xs={12} md={6} lg={3}>
          <Card 
            onClick={() => handleCardClick('/spaces', 'spaces')} 
            sx={{ 
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3
              }
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <MessageOutlined color="primary" fontSize="large" />
                  <Typography variant="h6">Spaces</Typography>
                </Box>
                {activeSpaces > 0 && (
                  <Badge badgeContent={activeSpaces} color="secondary" />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Collaborate in organized spaces
              </Typography>
              <Box mt={2}>
                <Chip 
                  label={`${activeSpaces} active`} 
                  size="small" 
                  color={activeSpaces > 0 ? 'secondary' : 'default'}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Documents Card */}
        <Grid item xs={12} md={6} lg={3}>
          <Card 
            onClick={() => handleCardClick('/documents', 'documents')} 
            sx={{ 
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3
              }
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <FolderOutlined color="primary" fontSize="large" />
                  <Typography variant="h6">Documents</Typography>
                </Box>
                {sharedDocuments > 0 && (
                  <Badge badgeContent={sharedDocuments} color="success" />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Secure document sharing
              </Typography>
              <Box mt={2}>
                <Chip 
                  label={`${sharedDocuments} shared`} 
                  size="small" 
                  color={sharedDocuments > 0 ? 'success' : 'default'}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Card */}
        <Grid item xs={12} md={6} lg={3}>
          <Card 
            onClick={() => handleCardClick('/security', 'security')} 
            sx={{ 
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3
              }
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <SecurityOutlined 
                    color={criticalAlerts > 0 ? 'error' : 'primary'} 
                    fontSize="large" 
                  />
                  <Typography variant="h6">Security</Typography>
                </Box>
                {criticalAlerts > 0 ? (
                  <Warning color="error" />
                ) : (
                  <CheckCircle color="success" />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Monitor security status
              </Typography>
              <Box mt={2}>
                <Chip 
                  label={criticalAlerts > 0 ? `${criticalAlerts} alerts` : 'All secure'} 
                  size="small" 
                  color={criticalAlerts > 0 ? 'error' : 'success'}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Recent Meetings
                </Typography>
                {meetings?.slice(0, 3).map((meeting) => (
                  <Box key={meeting.id} sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      {meeting.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(meeting.startTime).toLocaleDateString()}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Active Spaces
                </Typography>
                {spaces?.filter(space => space.status === 'active').slice(0, 3).map((space) => (
                  <Box key={space.id} sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      {space.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {space.participants.length} participants
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Quick Meeting Dialog */}
      <Dialog 
        open={showQuickMeetingDialog} 
        onClose={() => setShowQuickMeetingDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Start Quick Meeting</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Meeting Title"
            fullWidth
            variant="outlined"
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleQuickMeeting();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowQuickMeetingDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleQuickMeeting} 
            variant="contained"
            disabled={!meetingTitle.trim()}
          >
            Start Meeting
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
