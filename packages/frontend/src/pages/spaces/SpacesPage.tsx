import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Button,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Divider,
  Paper,
  InputAdornment
} from '@mui/material';
import {
  AddOutlined,
  SearchOutlined,
  FilterListOutlined,
  MoreVertOutlined,
  PushPinOutlined,
  ChatBubbleOutlined,
  GroupOutlined,
  PublicOutlined,
  LockOutlined,
  TrendingUpOutlined,
  SmartToyOutlined,
  AssignmentOutlined
} from '@mui/icons-material';
import { useSpaces } from '../../hooks/useSpaces';
import { useAppSelector } from '../../hooks/redux';
import { SpaceChat } from '../../components/spaces/SpaceChat';
import { CreateSpaceDialog } from '../../components/spaces/CreateSpaceDialog';
import { ThreadList } from '../../components/spaces/ThreadList';
import { AIInsights } from '../../components/spaces/AIInsights';

export const SpacesPage: React.FC = () => {
  const {
    spaces,
    currentSpace,
    currentThreads,
    searchSpaces,
    searchThreads,
    joinSpace,
    createSpace
  } = useSpaces();
  
  const { user } = useAppSelector((state) => state.auth);
  
  const [currentTab, setCurrentTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSpaces, setFilteredSpaces] = useState(spaces);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedSpace, setSelectedSpace] = useState<any>(null);

  // Filter spaces based on search
  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredSpaces(searchSpaces(searchQuery));
    } else {
      setFilteredSpaces(spaces);
    }
  }, [searchQuery, spaces, searchSpaces]);

  const handleSpaceSelect = (spaceId: string) => {
    setSelectedSpaceId(spaceId);
    setCurrentTab(1); // Switch to chat tab
  };

  const handleJoinSpace = async (spaceId: string) => {
    await joinSpace(spaceId);
    setMenuAnchor(null);
  };

  const renderSpaceCard = (space: any) => {
    const isJoined = space.participants?.includes(user?.id);
    const threadCount = currentThreads.filter(t => t.spaceId === space.id).length;
    const unreadCount = 0; // TODO: Calculate unread messages

    return (
      <Grid item xs={12} sm={6} md={4} key={space.id}>
        <Card
          sx={{
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 4
            },
            border: selectedSpaceId === space.id ? 2 : 0,
            borderColor: 'primary.main'
          }}
          onClick={() => isJoined && handleSpaceSelect(space.id)}
        >
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar
                  sx={{
                    bgcolor: space.isPublic ? 'primary.main' : 'secondary.main',
                    width: 40,
                    height: 40
                  }}
                >
                  {space.isPublic ? <PublicOutlined /> : <LockOutlined />}
                </Avatar>
                <Box>
                  <Typography variant="h6" component="div" noWrap>
                    {space.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {space.organization}
                  </Typography>
                </Box>
              </Box>
              
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSpace(space);
                  setMenuAnchor(e.currentTarget);
                }}
              >
                <MoreVertOutlined />
              </IconButton>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
              {space.description}
            </Typography>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" gap={1} alignItems="center">
                <GroupOutlined fontSize="small" />
                <Typography variant="body2">
                  {space.participants?.length || 0}
                </Typography>
                
                <ChatBubbleOutlined fontSize="small" sx={{ ml: 1 }} />
                <Typography variant="body2">
                  {threadCount}
                </Typography>
                
                {unreadCount > 0 && (
                  <Badge badgeContent={unreadCount} color="primary" sx={{ ml: 1 }} />
                )}
              </Box>
              
              {space.trending && (
                <Chip
                  icon={<TrendingUpOutlined />}
                  label="Trending"
                  size="small"
                  color="warning"
                />
              )}
            </Box>

            <Box display="flex" flex-wrap gap={0.5} mb={2}>
              {space.tags?.slice(0, 3).map((tag: string) => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
              {space.tags?.length > 3 && (
                <Chip label={`+${space.tags.length - 3}`} size="small" variant="outlined" />
              )}
            </Box>

            {!isJoined ? (
              <Button
                variant="contained"
                fullWidth
                onClick={(e) => {
                  e.stopPropagation();
                  handleJoinSpace(space.id);
                }}
                startIcon={<AddOutlined />}
              >
                Join Space
              </Button>
            ) : (
              <Button
                variant="outlined"
                fullWidth
                onClick={() => handleSpaceSelect(space.id)}
                startIcon={<ChatBubbleOutlined />}
              >
                Open Chat
              </Button>
            )}
          </CardContent>
        </Card>
      </Grid>
    );
  };

  const renderSpacesList = () => (
    <Box>
      {/* Search and Filter */}
      <Box display="flex" gap={2} mb={3}>
        <TextField
          fullWidth
          placeholder="Search spaces..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined />
              </InputAdornment>
            )
          }}
        />
        <Button
          variant="outlined"
          startIcon={<FilterListOutlined />}
        >
          Filter
        </Button>
        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={() => setShowCreateDialog(true)}
        >
          Create Space
        </Button>
      </Box>

      {/* Spaces Grid */}
      <Grid container spacing={3}>
        {filteredSpaces.map(renderSpaceCard)}
      </Grid>

      {filteredSpaces.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchQuery ? 'No spaces found' : 'No spaces yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {searchQuery 
              ? 'Try adjusting your search terms'
              : 'Create or join a space to start collaborating'
            }
          </Typography>
          {!searchQuery && (
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={() => setShowCreateDialog(true)}
            >
              Create Your First Space
            </Button>
          )}
        </Paper>
      )}
    </Box>
  );

  const renderSpaceChat = () => {
    if (!selectedSpaceId || !currentSpace) {
      return (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Select a space to start chatting
          </Typography>
        </Paper>
      );
    }

    return (
      <Box sx={{ height: 'calc(100vh - 200px)' }}>
        <SpaceChat spaceId={selectedSpaceId} />
      </Box>
    );
  };

  const renderThreads = () => {
    if (!selectedSpaceId) {
      return (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Select a space to view threads
          </Typography>
        </Paper>
      );
    }

    return <ThreadList spaceId={selectedSpaceId} />;
  };

  const renderAIInsights = () => {
    if (!selectedSpaceId) {
      return (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Select a space to view AI insights
          </Typography>
        </Paper>
      );
    }

    return <AIInsights spaceId={selectedSpaceId} />;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Collaboration Spaces
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Cross-company communication with AI-powered threading
          </Typography>
        </Box>
        
        {selectedSpaceId && currentSpace && (
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6">
              {currentSpace.name}
            </Typography>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {currentSpace.isPublic ? <PublicOutlined /> : <LockOutlined />}
            </Avatar>
          </Box>
        )}
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, value) => setCurrentTab(value)}>
          <Tab label="All Spaces" icon={<GroupOutlined />} iconPosition="start" />
          <Tab label="Chat" icon={<ChatBubbleOutlined />} iconPosition="start" />
          <Tab label="Threads" icon={<AssignmentOutlined />} iconPosition="start" />
          <Tab label="AI Insights" icon={<SmartToyOutlined />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Content */}
      <Box>
        {currentTab === 0 && renderSpacesList()}
        {currentTab === 1 && renderSpaceChat()}
        {currentTab === 2 && renderThreads()}
        {currentTab === 3 && renderAIInsights()}
      </Box>

      {/* Space Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor) && Boolean(selectedSpace)}
        onClose={() => {
          setMenuAnchor(null);
          setSelectedSpace(null);
        }}
      >
        <MenuItem onClick={() => handleSpaceSelect(selectedSpace?.id)}>
          Open Chat
        </MenuItem>
        <MenuItem>
          View Details
        </MenuItem>
        <MenuItem>
          Invite Members
        </MenuItem>
        <Divider />
        <MenuItem>
          Leave Space
        </MenuItem>
      </Menu>

      {/* Create Space Dialog */}
      <CreateSpaceDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreateSpace={createSpace}
      />
    </Box>
  );
};
