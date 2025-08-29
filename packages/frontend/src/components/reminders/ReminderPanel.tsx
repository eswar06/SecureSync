import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Badge,
  Menu
} from '@mui/material';
import {
  CloseOutlined,
  AddOutlined,
  EditOutlined,
  DeleteOutlined,
  SnoozeOutlined,
  SmartToyOutlined,
  WarningOutlined,
  ExpandMoreOutlined,
  ScheduleOutlined,
  AutoModeOutlined
} from '@mui/icons-material';
import { useSmartReminders } from '../../hooks/useSmartReminders';
import { ReminderConfig, Duration, DurationUnit } from '../../../../shared/src/types/index';

interface ReminderPanelProps {
  open: boolean;
  onClose: () => void;
}

export const ReminderPanel: React.FC<ReminderPanelProps> = ({ open, onClose }) => {
  const {
    reminders,
    activeReminders,
    overlapAlerts,
    createReminder,
    updateReminder,
    deleteReminder,
    snoozeReminder,
    getSuggestedReminders,
    findOptimalTime,
    enableAutoScheduling,
    setConflictDetection
  } = useSmartReminders();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSuggestionsDialog, setShowSuggestionsDialog] = useState(false);
  const [editingReminder, setEditingReminder] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedReminder, setSelectedReminder] = useState<any>(null);

  const [newReminder, setNewReminder] = useState<ReminderConfig>({
    content: '',
    triggerTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    priority: 'medium',
    autoScheduled: false,
    smartReschedule: true
  });

  const [autoScheduling, setAutoScheduling] = useState(true);
  const [conflictDetection, setConflictDetectionState] = useState(true);

  const handleCreateReminder = async () => {
    const success = await createReminder(newReminder);
    if (success) {
      setShowCreateDialog(false);
      setNewReminder({
        content: '',
        triggerTime: new Date(Date.now() + 60 * 60 * 1000),
        priority: 'medium',
        autoScheduled: false,
        smartReschedule: true
      });
    }
  };

  const handleUpdateReminder = async () => {
    if (editingReminder) {
      const success = await updateReminder(editingReminder.id, editingReminder);
      if (success) {
        setEditingReminder(null);
      }
    }
  };

  const handleSnoozeReminder = async (id: string, duration: Duration) => {
    await snoozeReminder(id, duration);
    setMenuAnchor(null);
  };

  const loadSuggestions = async () => {
    const suggested = await getSuggestedReminders();
    setSuggestions(suggested);
    setShowSuggestionsDialog(true);
  };

  const findOptimalTimeSlots = async () => {
    const slots = await findOptimalTime({ value: 30, unit: DurationUnit.MINUTES });
    console.log('Optimal time slots:', slots);
  };

  const handleAutoSchedulingChange = (enabled: boolean) => {
    setAutoScheduling(enabled);
    enableAutoScheduling(enabled);
  };

  const handleConflictDetectionChange = (enabled: boolean) => {
    setConflictDetectionState(enabled);
    setConflictDetection(enabled);
  };

  const renderReminder = (reminder: any) => {
    const isOverdue = new Date(reminder.triggerTime) < new Date() && !reminder.triggered;
    const timeUntil = new Date(reminder.triggerTime).getTime() - Date.now();
    const timeLabel = timeUntil > 0 
      ? `in ${Math.floor(timeUntil / (1000 * 60))} minutes`
      : 'overdue';

    return (
      <ListItem
        key={reminder.id}
        sx={{
          border: 1,
          borderColor: isOverdue ? 'error.main' : 'divider',
          borderRadius: 1,
          mb: 1,
          bgcolor: isOverdue ? 'error.light' : 'background.paper'
        }}
      >
        <ListItemText
          primary={reminder.content}
          secondary={
            <Box>
              <Typography variant="caption" display="block">
                {new Date(reminder.triggerTime).toLocaleString()}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                <Chip
                  label={reminder.priority}
                  size="small"
                  color={reminder.priority === 'high' ? 'error' : 'default'}
                />
                {reminder.autoScheduled && (
                  <Chip
                    icon={<AutoModeOutlined />}
                    label="Auto"
                    size="small"
                    variant="outlined"
                  />
                )}
                <Typography variant="caption" color={isOverdue ? 'error' : 'text.secondary'}>
                  {timeLabel}
                </Typography>
              </Box>
              {reminder.context && (
                <Box mt={0.5}>
                  {reminder.context.meetingId && (
                    <Chip label={`Meeting: ${reminder.context.meetingId}`} size="small" />
                  )}
                  {reminder.context.threadId && (
                    <Chip label={`Thread: ${reminder.context.threadId}`} size="small" />
                  )}
                </Box>
              )}
            </Box>
          }
        />
        <ListItemSecondaryAction>
          <IconButton
            onClick={(e) => {
              setSelectedReminder(reminder);
              setMenuAnchor(e.currentTarget);
            }}
          >
            <ScheduleOutlined />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    );
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        sx={{ '& .MuiDrawer-paper': { width: 400, p: 2 } }}
      >
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Smart Reminders</Typography>
          <IconButton onClick={onClose}>
            <CloseOutlined />
          </IconButton>
        </Box>

        {/* Conflict Alerts */}
        {overlapAlerts.length > 0 && (
          <Box mb={2}>
            {overlapAlerts.map((alert, index) => (
              <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                {alert.suggestedResolution}
              </Alert>
            ))}
          </Box>
        )}

        {/* Controls */}
        <Box display="flex" gap={1} mb={2}>
          <Button
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={() => setShowCreateDialog(true)}
            size="small"
            fullWidth
          >
            New Reminder
          </Button>
          <Button
            variant="outlined"
            startIcon={<SmartToyOutlined />}
            onClick={loadSuggestions}
            size="small"
          >
            AI Suggestions
          </Button>
        </Box>

        {/* Settings */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
            <Typography variant="subtitle2">Smart Features</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormControlLabel
              control={
                <Switch
                  checked={autoScheduling}
                  onChange={(e) => handleAutoSchedulingChange(e.target.checked)}
                />
              }
              label="Auto-scheduling"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={conflictDetection}
                  onChange={(e) => handleConflictDetectionChange(e.target.checked)}
                />
              }
              label="Conflict Detection"
            />
            <Button
              variant="outlined"
              onClick={findOptimalTimeSlots}
              startIcon={<ScheduleOutlined />}
              size="small"
              fullWidth
              sx={{ mt: 1 }}
            >
              Find Optimal Times
            </Button>
          </AccordionDetails>
        </Accordion>

        {/* Active Reminders */}
        <Typography variant="subtitle1" gutterBottom>
          Active Reminders ({activeReminders.length})
        </Typography>
        
        <List sx={{ flexGrow: 1, overflow: 'auto' }}>
          {activeReminders.map(renderReminder)}
        </List>

        {activeReminders.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="body2" color="text.secondary">
              No active reminders
            </Typography>
          </Box>
        )}

        {/* All Reminders */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
            <Typography variant="subtitle2">
              All Reminders ({reminders.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {reminders.map(renderReminder)}
            </List>
          </AccordionDetails>
        </Accordion>
      </Drawer>

      {/* Reminder Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => setEditingReminder(selectedReminder)}>
          <EditOutlined sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => handleSnoozeReminder(selectedReminder?.id, { value: 15, unit: DurationUnit.MINUTES })}>
          <SnoozeOutlined sx={{ mr: 1 }} />
          Snooze 15m
        </MenuItem>
        <MenuItem onClick={() => handleSnoozeReminder(selectedReminder?.id, { value: 1, unit: DurationUnit.HOURS })}>
          <SnoozeOutlined sx={{ mr: 1 }} />
          Snooze 1h
        </MenuItem>
        <MenuItem onClick={() => deleteReminder(selectedReminder?.id)}>
          <DeleteOutlined sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Create Reminder Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Smart Reminder</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              fullWidth
              label="Reminder Content"
              value={newReminder.content}
              onChange={(e) => setNewReminder(prev => ({ ...prev, content: e.target.value }))}
              multiline
              rows={2}
              required
            />
            
            <TextField
              fullWidth
              label="Trigger Time"
              type="datetime-local"
              value={new Date(newReminder.triggerTime).toISOString().slice(0, 16)}
              onChange={(e) => setNewReminder(prev => ({ 
                ...prev, 
                triggerTime: new Date(e.target.value) 
              }))}
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={newReminder.priority}
                label="Priority"
                onChange={(e) => setNewReminder(prev => ({ ...prev, priority: e.target.value as any }))}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={newReminder.smartReschedule}
                  onChange={(e) => setNewReminder(prev => ({ 
                    ...prev, 
                    smartReschedule: e.target.checked 
                  }))}
                />
              }
              label="Enable Smart Rescheduling"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={newReminder.autoScheduled}
                  onChange={(e) => setNewReminder(prev => ({ 
                    ...prev, 
                    autoScheduled: e.target.checked 
                  }))}
                />
              }
              label="Auto-scheduled"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateReminder}
            variant="contained"
            disabled={!newReminder.content.trim()}
          >
            Create Reminder
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Reminder Dialog */}
      <Dialog open={Boolean(editingReminder)} onClose={() => setEditingReminder(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Reminder</DialogTitle>
        <DialogContent>
          {editingReminder && (
            <Box display="flex" flexDirection="column" gap={2} pt={1}>
              <TextField
                fullWidth
                label="Reminder Content"
                value={editingReminder.content}
                onChange={(e) => setEditingReminder((prev: any) => ({ ...prev, content: e.target.value }))}
                multiline
                rows={2}
              />
              
              <TextField
                fullWidth
                label="Trigger Time"
                type="datetime-local"
                value={new Date(editingReminder.triggerTime).toISOString().slice(0, 16)}
                onChange={(e) => setEditingReminder((prev: any) => ({ 
                  ...prev, 
                  triggerTime: new Date(e.target.value) 
                }))}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingReminder(null)}>Cancel</Button>
          <Button onClick={handleUpdateReminder} variant="contained">
            Update Reminder
          </Button>
        </DialogActions>
      </Dialog>

      {/* AI Suggestions Dialog */}
      <Dialog open={showSuggestionsDialog} onClose={() => setShowSuggestionsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>AI Reminder Suggestions</DialogTitle>
        <DialogContent>
          <List>
            {suggestions.map((suggestion, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={suggestion.content}
                  secondary={`Confidence: ${Math.round(suggestion.confidence * 100)}%`}
                />
                <Button
                  variant="outlined"
                  onClick={() => {
                    setNewReminder({
                      content: suggestion.content,
                      triggerTime: new Date(suggestion.suggestedTime),
                      priority: suggestion.priority,
                      autoScheduled: true,
                      smartReschedule: true
                    });
                    setShowSuggestionsDialog(false);
                    setShowCreateDialog(true);
                  }}
                >
                  Use
                </Button>
              </ListItem>
            ))}
          </List>
          {suggestions.length === 0 && (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
              No suggestions available at this time
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSuggestionsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
