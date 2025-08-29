import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper,
  Tabs,
  Tab,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Menu,
  MenuItem
} from '@mui/material';
import {
  CloseOutlined,
  MicOutlined,
  MicOffOutlined,
  SearchOutlined,
  GetAppOutlined,
  ExpandMoreOutlined,
  AssignmentOutlined,
  InsightsOutlined,
  PersonOutlined
} from '@mui/icons-material';
import { useTranscription } from '../../hooks/useTranscription';

interface TranscriptionPanelProps {
  open: boolean;
  onClose: () => void;
  meetingId: string;
}

export const TranscriptionPanel: React.FC<TranscriptionPanelProps> = ({
  open,
  onClose,
  meetingId
}) => {
  const {
    transcription,
    isTranscribing,
    config,
    startTranscription,
    stopTranscription,
    updateConfig,
    getTranscriptionStats,
    searchTranscription,
    exportTranscription
  } = useTranscription(meetingId);

  const [currentTab, setCurrentTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);

  const stats = getTranscriptionStats();

  // Handle search
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchTranscription(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchTranscription]);

  const handleExport = (format: 'txt' | 'json' | 'srt') => {
    const content = exportTranscription(format);
    if (content) {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meeting-${meetingId}-transcription.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setExportAnchor(null);
  };

  const renderTranscriptionTab = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Controls */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            {isTranscribing ? <MicOutlined color="success" /> : <MicOffOutlined color="disabled" />}
            <Typography variant="body2">
              {isTranscribing ? 'Live transcription active' : 'Transcription stopped'}
            </Typography>
          </Box>
          <Button
            variant={isTranscribing ? 'outlined' : 'contained'}
            onClick={isTranscribing ? stopTranscription : startTranscription}
            size="small"
          >
            {isTranscribing ? 'Stop' : 'Start'}
          </Button>
        </Box>

        {/* Settings */}
        <Box mt={2}>
          <FormControlLabel
            control={
              <Switch
                checked={config.speakerIdentification}
                onChange={(e) => updateConfig({ speakerIdentification: e.target.checked })}
              />
            }
            label="Speaker ID"
            sx={{ mr: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={config.actionItemExtraction}
                onChange={(e) => updateConfig({ actionItemExtraction: e.target.checked })}
              />
            }
            label="Action Items"
            sx={{ mr: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={config.sensitiveInfoRedaction}
                onChange={(e) => updateConfig({ sensitiveInfoRedaction: e.target.checked })}
              />
            }
            label="Redact Sensitive"
          />
        </Box>
      </Paper>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search transcription..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: <SearchOutlined sx={{ mr: 1, color: 'text.secondary' }} />
        }}
        sx={{ mb: 2 }}
        size="small"
      />

      {/* Transcription List */}
      <List sx={{ flexGrow: 1, overflow: 'auto' }}>
        {(searchResults.length > 0 ? searchResults : transcription?.segments || []).map((segment) => (
          <ListItem key={segment.id} sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1} width="100%">
              <Chip
                label={segment.speakerId}
                size="small"
                color="primary"
                icon={<PersonOutlined />}
              />
              <Typography variant="caption" color="text.secondary">
                {new Date(segment.startTime).toLocaleTimeString()}
              </Typography>
              <Chip
                label={`${Math.round(segment.confidence * 100)}%`}
                size="small"
                variant="outlined"
                sx={{ ml: 'auto' }}
              />
            </Box>
            <ListItemText
              primary={segment.text}
              sx={{ 
                wordBreak: 'break-word',
                '& .MuiListItemText-primary': {
                  fontSize: '0.875rem',
                  lineHeight: 1.5
                }
              }}
            />
            {segment.redacted && (
              <Chip
                label="Sensitive content redacted"
                size="small"
                color="warning"
                sx={{ mt: 1 }}
              />
            )}
          </ListItem>
        ))}
        
        {!transcription?.segments?.length && !isTranscribing && (
          <Box textAlign="center" py={4}>
            <Typography variant="body2" color="text.secondary">
              Start transcription to see live speech-to-text
            </Typography>
          </Box>
        )}
        
        {!transcription?.segments?.length && isTranscribing && (
          <Box textAlign="center" py={4}>
            <Typography variant="body2" color="text.secondary">
              Listening... Transcription will appear when speaking starts
            </Typography>
          </Box>
        )}
      </List>
    </Box>
  );

  const renderInsightsTab = () => (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {/* Statistics */}
      {stats && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Meeting Statistics</Typography>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
            <Box>
              <Typography variant="body2" color="text.secondary">Total Words</Typography>
              <Typography variant="h6">{stats.totalWords}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Speakers</Typography>
              <Typography variant="h6">{stats.speakers}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Confidence</Typography>
              <Typography variant="h6">{Math.round(stats.averageConfidence * 100)}%</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Segments</Typography>
              <Typography variant="h6">{stats.totalSegments}</Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Action Items */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
          <Box display="flex" alignItems="center" gap={1}>
            <AssignmentOutlined />
            <Typography>Action Items</Typography>
            <Badge badgeContent={transcription?.actionItems.length || 0} color="primary" />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            {transcription?.actionItems.map((item) => (
              <ListItem key={item.id}>
                <ListItemText
                  primary={item.text}
                  secondary={
                    <Box>
                      <Chip label={item.priority} size="small" sx={{ mr: 1 }} />
                      {item.assigneeId && (
                        <Chip label={`@${item.assigneeId}`} size="small" color="primary" />
                      )}
                    </Box>
                  }
                />
              </ListItem>
            )) || (
              <Typography variant="body2" color="text.secondary">
                No action items detected yet
              </Typography>
            )}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* Key Points */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
          <Box display="flex" alignItems="center" gap={1}>
            <InsightsOutlined />
            <Typography>Key Points</Typography>
            <Badge badgeContent={transcription?.summary.keyPoints.length || 0} color="secondary" />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            {transcription?.summary.keyPoints.map((point, index) => (
              <ListItem key={index}>
                <ListItemText primary={point} />
              </ListItem>
            )) || (
              <Typography variant="body2" color="text.secondary">
                Key points will be generated during the meeting
              </Typography>
            )}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* Speaker Statistics */}
      {stats?.speakerStats && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
            <Box display="flex" alignItems="center" gap={1}>
              <PersonOutlined />
              <Typography>Speaker Analysis</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {Object.entries(stats.speakerStats).map(([speakerId, speakerStats]) => (
                <ListItem key={speakerId}>
                  <ListItemText
                    primary={speakerId}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {speakerStats.words} words • {speakerStats.segments} segments
                        </Typography>
                        <Typography variant="caption" display="block">
                          {Math.round(speakerStats.speakTime / 1000)}s speaking time
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ '& .MuiDrawer-paper': { width: 450, display: 'flex', flexDirection: 'column' } }}
    >
      {/* Header */}
      <Box p={2} borderBottom={1} borderColor="divider">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">AI Transcription</Typography>
          <Box>
            <IconButton
              onClick={(e) => setExportAnchor(e.currentTarget)}
              disabled={!transcription?.segments.length}
            >
              <GetAppOutlined />
            </IconButton>
            <IconButton onClick={onClose}>
              <CloseOutlined />
            </IconButton>
          </Box>
        </Box>

        <Tabs value={currentTab} onChange={(_, value) => setCurrentTab(value)} sx={{ mt: 1 }}>
          <Tab label="Transcription" />
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                Insights
                {(transcription?.actionItems.length || 0) > 0 && (
                  <Badge badgeContent={transcription?.actionItems.length} color="primary" />
                )}
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* Content */}
      <Box flexGrow={1} p={2}>
        {currentTab === 0 ? renderTranscriptionTab() : renderInsightsTab()}
      </Box>

      {/* Export Menu */}
      <Menu
        anchorEl={exportAnchor}
        open={Boolean(exportAnchor)}
        onClose={() => setExportAnchor(null)}
      >
        <MenuItem onClick={() => handleExport('txt')}>Export as Text</MenuItem>
        <MenuItem onClick={() => handleExport('json')}>Export as JSON</MenuItem>
        <MenuItem onClick={() => handleExport('srt')}>Export as SRT</MenuItem>
      </Menu>
    </Drawer>
  );
};
