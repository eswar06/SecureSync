import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Typography,
  Chip,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Paper
} from '@mui/material';
import {
  AddOutlined,
  PushPinOutlined,
  MoreVertOutlined,
  ChatBubbleOutlined,
  PersonOutlined,
  SmartToyOutlined,
  ArchiveOutlined
} from '@mui/icons-material';
import { useSpaces } from '../../hooks/useSpaces';
import { ThreadCreationData } from '@securesync/shared';

interface ThreadListProps {
  spaceId: string;
}

export const ThreadList: React.FC<ThreadListProps> = ({ spaceId }) => {
  const {
    currentThreads,
    createThread,
    archiveThread,
    pinThread,
    generateThreadSummary,
    extractActionItems
  } = useSpaces();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [newThread, setNewThread] = useState<ThreadCreationData>({
    title: '',
    description: '',
    tags: [],
    priority: 'medium',
    category: 'general'
  });

  const handleCreateThread = async () => {
    const threadId = await createThread(newThread);
    if (threadId) {
      setShowCreateDialog(false);
      setNewThread({
        title: '',
        description: '',
        tags: [],
        priority: 'medium',
        category: 'general'
      });
    }
  };

  const handleGenerateSummary = async (threadId: string) => {
    const summary = await generateThreadSummary(threadId);
    if (summary) {
      // Show summary in a dialog or notification
      console.log('Thread Summary:', summary);
    }
    setMenuAnchor(null);
  };

  const handleExtractActionItems = async (threadId: string) => {
    const actionItems = await extractActionItems(threadId);
    console.log('Action Items:', actionItems);
    setMenuAnchor(null);
  };

  const renderThread = (thread: any) => {
    const messageCount = 0; // TODO: Calculate from messages
    const unreadCount = 0; // TODO: Calculate unread messages
    const lastActivity = new Date(thread.updatedAt || thread.createdAt);

    return (
      <ListItem
        key={thread.id}
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          mb: 1,
          '&:hover': { bgcolor: 'action.hover' }
        }}
      >
        <ListItemText
          primary={
            <Box display="flex" alignItems="center" gap={1}>
              {thread.isPinned && <PushPinOutlined fontSize="small" color="primary" />}
              <Typography variant="subtitle1" component="div">
                {thread.title}
              </Typography>
              {thread.priority === 'high' && (
                <Chip label="High" size="small" color="error" />
              )}
              {thread.priority === 'urgent' && (
                <Chip label="Urgent" size="small" color="warning" />
              )}
            </Box>
          }
          secondary={
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {thread.description}
              </Typography>
              
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <ChatBubbleOutlined fontSize="small" />
                  <Typography variant="caption">{messageCount}</Typography>
                </Box>
                
                <Box display="flex" alignItems="center" gap={0.5}>
                  <PersonOutlined fontSize="small" />
                  <Typography variant="caption">{thread.participants?.length || 0}</Typography>
                </Box>
                
                <Typography variant="caption" color="text.secondary">
                  {lastActivity.toLocaleDateString()}
                </Typography>
                
                {unreadCount > 0 && (
                  <Badge badgeContent={unreadCount} color="primary" />
                )}
              </Box>
              
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {thread.tags.map((tag: string) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
          }
        />
        
        <ListItemSecondaryAction>
          <IconButton
            onClick={(e) => {
              setSelectedThread(thread);
              setMenuAnchor(e.currentTarget);
            }}
          >
            <MoreVertOutlined />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Threads ({currentThreads.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={() => setShowCreateDialog(true)}
        >
          New Thread
        </Button>
      </Box>

      {/* Thread List */}
      <List>
        {currentThreads.map(renderThread)}
      </List>

      {currentThreads.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No threads yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Create the first thread to start organizing conversations
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={() => setShowCreateDialog(true)}
          >
            Create First Thread
          </Button>
        </Paper>
      )}

      {/* Thread Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => {
          setMenuAnchor(null);
          setSelectedThread(null);
        }}
      >
        <MenuItem onClick={() => handleGenerateSummary(selectedThread?.id)}>
          <SmartToyOutlined sx={{ mr: 1 }} />
          Generate AI Summary
        </MenuItem>
        <MenuItem onClick={() => handleExtractActionItems(selectedThread?.id)}>
          <SmartToyOutlined sx={{ mr: 1 }} />
          Extract Action Items
        </MenuItem>
        <MenuItem onClick={() => pinThread(selectedThread?.id)}>
          <PushPinOutlined sx={{ mr: 1 }} />
          {selectedThread?.isPinned ? 'Unpin' : 'Pin'} Thread
        </MenuItem>
        <MenuItem onClick={() => archiveThread(selectedThread?.id)}>
          <ArchiveOutlined sx={{ mr: 1 }} />
          Archive Thread
        </MenuItem>
      </Menu>

      {/* Create Thread Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Thread</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              fullWidth
              label="Thread Title"
              value={newThread.title}
              onChange={(e) => setNewThread(prev => ({ ...prev, title: e.target.value }))}
              required
            />
            
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={newThread.description}
              onChange={(e) => setNewThread(prev => ({ ...prev, description: e.target.value }))}
            />
            
            <TextField
              fullWidth
              label="Category"
              value={newThread.category}
              onChange={(e) => setNewThread(prev => ({ ...prev, category: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateThread}
            variant="contained"
            disabled={!newThread.title.trim()}
          >
            Create Thread
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
