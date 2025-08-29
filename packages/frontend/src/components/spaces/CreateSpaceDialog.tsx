import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Chip,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { SpaceConfig } from '@securesync/shared';

interface CreateSpaceDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateSpace: (config: SpaceConfig) => Promise<boolean>;
}

export const CreateSpaceDialog: React.FC<CreateSpaceDialogProps> = ({
  open,
  onClose,
  onCreateSpace
}) => {
  const [formData, setFormData] = useState<SpaceConfig>({
    name: '',
    description: '',
    organization: '',
    isPublic: true,
    tags: [],
    industry: '',
    maxParticipants: 100,
    allowCrossCompany: true,
    requireApproval: false,
    defaultPermissions: {
      canCreateThreads: true,
      canInviteMembers: false,
      canModerateContent: false,
      canAccessAnalytics: false,
      canManageSettings: false
    }
  });

  const [tagInput, setTagInput] = useState('');

  const handleSubmit = async () => {
    const success = await onCreateSpace(formData);
    if (success) {
      onClose();
      // Reset form
      setFormData({
        name: '',
        description: '',
        organization: '',
        isPublic: true,
        tags: [],
        industry: '',
        maxParticipants: 100,
        allowCrossCompany: true,
        requireApproval: false,
        defaultPermissions: {
          canCreateThreads: true,
          canInviteMembers: false,
          canModerateContent: false,
          canAccessAnalytics: false,
          canManageSettings: false
        }
      });
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Space</DialogTitle>
      
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={3} pt={1}>
          {/* Basic Information */}
          <Typography variant="h6">Basic Information</Typography>
          
          <TextField
            fullWidth
            label="Space Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />
          
          <TextField
            fullWidth
            label="Organization"
            value={formData.organization}
            onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
          />

          <FormControl fullWidth>
            <InputLabel>Industry</InputLabel>
            <Select
              value={formData.industry}
              label="Industry"
              onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
            >
              <MenuItem value="technology">Technology</MenuItem>
              <MenuItem value="healthcare">Healthcare</MenuItem>
              <MenuItem value="finance">Finance</MenuItem>
              <MenuItem value="education">Education</MenuItem>
              <MenuItem value="manufacturing">Manufacturing</MenuItem>
              <MenuItem value="retail">Retail</MenuItem>
              <MenuItem value="consulting">Consulting</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          {/* Tags */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>Tags</Typography>
            <Box display="flex" gap={1} alignItems="center" mb={1}>
              <TextField
                size="small"
                placeholder="Add tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <Button onClick={handleAddTag} variant="outlined" size="small">
                Add
              </Button>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {formData.tags.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  size="small"
                />
              ))}
            </Box>
          </Box>

          {/* Settings */}
          <Typography variant="h6">Space Settings</Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={formData.isPublic}
                onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
              />
            }
            label="Public Space"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={formData.allowCrossCompany}
                onChange={(e) => setFormData(prev => ({ ...prev, allowCrossCompany: e.target.checked }))}
              />
            }
            label="Allow Cross-Company Collaboration"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={formData.requireApproval}
                onChange={(e) => setFormData(prev => ({ ...prev, requireApproval: e.target.checked }))}
              />
            }
            label="Require Approval to Join"
          />

          <TextField
            type="number"
            label="Maximum Participants"
            value={formData.maxParticipants}
            onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) }))}
            inputProps={{ min: 1, max: 1000 }}
          />

          {/* Default Permissions */}
          <Typography variant="h6">Default Member Permissions</Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={formData.defaultPermissions.canCreateThreads}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  defaultPermissions: { ...prev.defaultPermissions, canCreateThreads: e.target.checked }
                }))}
              />
            }
            label="Can Create Threads"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={formData.defaultPermissions.canInviteMembers}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  defaultPermissions: { ...prev.defaultPermissions, canInviteMembers: e.target.checked }
                }))}
              />
            }
            label="Can Invite Members"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={formData.defaultPermissions.canAccessAnalytics}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  defaultPermissions: { ...prev.defaultPermissions, canAccessAnalytics: e.target.checked }
                }))}
              />
            }
            label="Can Access Analytics"
          />
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!formData.name.trim()}
        >
          Create Space
        </Button>
      </DialogActions>
    </Dialog>
  );
};
