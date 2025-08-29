import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Avatar,
  Grid,
  Paper,
  Divider,
  Alert,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  CloseOutlined,
  SmartToyOutlined,
  TrendingUpOutlined,
  PeopleOutlined,
  InsightsOutlined,
  AutoModeOutlined,
  ExpandMoreOutlined,
  RefreshOutlined,
  SettingsOutlined,
  LightbulbOutlined,
  PsychologyOutlined
} from '@mui/icons-material';
import { useAIAdaptation } from '../../hooks/useAIAdaptation';

interface AIInsightsPanelProps {
  open: boolean;
  onClose: () => void;
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ open, onClose }) => {
  const {
    currentContext,
    adaptedInterface,
    recommendations,
    projectMetrics,
    predictiveInsights,
    behaviorPatterns,
    adaptInterfaceForRole,
    adaptInterfaceForIndustry,
    getPredictiveAnalytics,
    generateAutomationSuggestions,
    trainPersonalModel
  } = useAIAdaptation();

  const [automationSuggestions, setAutomationSuggestions] = useState<any[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [autoAdaptation, setAutoAdaptation] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    if (open) {
      loadAutomationSuggestions();
    }
  }, [open]);

  const loadAutomationSuggestions = async () => {
    const suggestions = await generateAutomationSuggestions();
    setAutomationSuggestions(suggestions);
  };

  const handleTrainModel = async () => {
    setIsTraining(true);
    await trainPersonalModel();
    setIsTraining(false);
  };

  const renderContextualInsights = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Contextual Intelligence
      </Typography>
      
      {currentContext && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Active Role
              </Typography>
              <Typography variant="body1">
                {currentContext.activeRole || 'Not specified'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Current Project
              </Typography>
              <Typography variant="body1">
                {currentContext.currentProject?.name || 'None'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Session Duration
              </Typography>
              <Typography variant="body1">
                {currentContext.sessionDuration ? `${Math.floor(currentContext.sessionDuration / 60)} min` : 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Industry Focus
              </Typography>
              <Typography variant="body1">
                {currentContext.industryFocus || 'General'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {adaptedInterface && adaptedInterface.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Interface adapted based on your current context ({adaptedInterface.length} changes applied)
          </Typography>
        </Alert>
      )}

      <Box display="flex" gap={1} mb={2}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => adaptInterfaceForRole('manager')}
        >
          Manager View
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() => adaptInterfaceForRole('developer')}
        >
          Developer View
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() => adaptInterfaceForIndustry('technology')}
        >
          Tech Industry
        </Button>
      </Box>
    </Box>
  );

  const renderPredictiveAnalytics = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Predictive Analytics
      </Typography>
      
      {projectMetrics && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUpOutlined sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                <Typography variant="h5">
                  {Math.round(projectMetrics.completionProbability * 100)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completion Probability
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <PeopleOutlined sx={{ fontSize: 32, color: 'secondary.main', mb: 1 }} />
                <Typography variant="h5">
                  {projectMetrics.teamEfficiencyScore?.toFixed(1) || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Team Efficiency
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <List>
        {predictiveInsights.map((insight, index) => (
          <ListItem key={index} divider>
            <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>
              <InsightsOutlined />
            </Avatar>
            <ListItemText
              primary={insight.title}
              secondary={
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {insight.description}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      label={`${Math.round(insight.confidence * 100)}% confidence`}
                      size="small"
                      color="primary"
                    />
                    <Chip
                      label={insight.impact}
                      size="small"
                      color={insight.impact === 'high' ? 'error' : 'default'}
                    />
                  </Box>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>

      {predictiveInsights.length === 0 && (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
          No predictive insights available yet. More data is needed.
        </Typography>
      )}
    </Box>
  );

  const renderBehaviorPatterns = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Behavior Patterns
      </Typography>
      
      <List>
        {behaviorPatterns.map((pattern, index) => (
          <ListItem key={index} divider>
            <Avatar sx={{ bgcolor: 'secondary.light', mr: 2 }}>
              <PsychologyOutlined />
            </Avatar>
            <ListItemText
              primary={pattern.type}
              secondary={
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {pattern.description}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="caption">
                      Frequency: {pattern.frequency}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={pattern.strength * 100}
                      sx={{ width: 100, ml: 1 }}
                    />
                  </Box>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>

      {behaviorPatterns.length === 0 && (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
          Analyzing your behavior patterns...
        </Typography>
      )}
    </Box>
  );

  const renderRecommendations = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        AI Recommendations
      </Typography>
      
      <List>
        {recommendations.map((recommendation, index) => (
          <ListItem key={index} divider>
            <Avatar sx={{ bgcolor: 'warning.light', mr: 2 }}>
              <LightbulbOutlined />
            </Avatar>
            <ListItemText
              primary={recommendation}
              sx={{
                '& .MuiListItemText-primary': {
                  fontStyle: 'italic'
                }
              }}
            />
          </ListItem>
        ))}
      </List>

      {recommendations.length === 0 && (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
          No recommendations at this time.
        </Typography>
      )}
    </Box>
  );

  const renderAutomationSuggestions = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Automation Opportunities
      </Typography>
      
      <List>
        {automationSuggestions.map((suggestion, index) => (
          <ListItem key={index} divider>
            <Avatar sx={{ bgcolor: 'success.light', mr: 2 }}>
              <AutoModeOutlined />
            </Avatar>
            <ListItemText
              primary={suggestion.title}
              secondary={
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {suggestion.description}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      label={`${suggestion.timeSavings} time saved`}
                      size="small"
                      color="success"
                    />
                    <Chip
                      label={suggestion.difficulty}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              }
            />
            <Button
              variant="outlined"
              size="small"
              sx={{ ml: 2 }}
            >
              Implement
            </Button>
          </ListItem>
        ))}
      </List>

      {automationSuggestions.length === 0 && (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
          No automation opportunities detected.
        </Typography>
      )}
    </Box>
  );

  const renderSettings = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        AI Settings
      </Typography>
      
      <FormControlLabel
        control={
          <Switch
            checked={autoAdaptation}
            onChange={(e) => setAutoAdaptation(e.target.checked)}
          />
        }
        label="Auto-adaptation"
        sx={{ mb: 2 }}
      />

      <Button
        variant="outlined"
        startIcon={isTraining ? <SmartToyOutlined /> : <PsychologyOutlined />}
        onClick={handleTrainModel}
        disabled={isTraining}
        fullWidth
        sx={{ mb: 2 }}
      >
        {isTraining ? 'Training Model...' : 'Train Personal AI Model'}
      </Button>

      {isTraining && (
        <LinearProgress sx={{ mb: 2 }} />
      )}

      <Button
        variant="outlined"
        startIcon={<RefreshOutlined />}
        onClick={loadAutomationSuggestions}
        fullWidth
      >
        Refresh Insights
      </Button>
    </Box>
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ '& .MuiDrawer-paper': { width: 450, p: 2 } }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <SmartToyOutlined color="primary" />
          <Typography variant="h6">AI Intelligence</Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseOutlined />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
            <Typography variant="subtitle1">Contextual Intelligence</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {renderContextualInsights()}
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
            <Typography variant="subtitle1">Predictive Analytics</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {renderPredictiveAnalytics()}
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
            <Typography variant="subtitle1">Behavior Patterns</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {renderBehaviorPatterns()}
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
            <Typography variant="subtitle1">Recommendations</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {renderRecommendations()}
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
            <Typography variant="subtitle1">Automation</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {renderAutomationSuggestions()}
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
            <Typography variant="subtitle1">Settings</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {renderSettings()}
          </AccordionDetails>
        </Accordion>
      </Box>
    </Drawer>
  );
};
