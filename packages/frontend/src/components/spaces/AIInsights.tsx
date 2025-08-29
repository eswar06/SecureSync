import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  IconButton
} from '@mui/material';
import {
  ExpandMoreOutlined,
  TrendingUpOutlined,
  PeopleOutlined,
  AssignmentOutlined,
  InsightsOutlined,
  RefreshOutlined,
  SmartToyOutlined
} from '@mui/icons-material';

interface AIInsightsProps {
  spaceId: string;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ spaceId }) => {
  const [insights, setInsights] = useState<any>({
    engagement: {
      activeUsers: 12,
      totalMessages: 245,
      threadsCreated: 8,
      avgResponseTime: '2.3 hours'
    },
    trends: [
      { topic: 'API Integration', frequency: 15, sentiment: 0.8 },
      { topic: 'Performance Issues', frequency: 12, sentiment: 0.4 },
      { topic: 'Security Updates', frequency: 8, sentiment: 0.6 }
    ],
    actionItems: [
      { text: 'Update API documentation', priority: 'high', assignee: 'John', dueDate: '2024-01-15' },
      { text: 'Review security policies', priority: 'medium', assignee: 'Sarah', dueDate: '2024-01-20' }
    ],
    recommendations: [
      'Consider scheduling a team sync meeting based on recent discussion patterns',
      'High engagement on API topics - might benefit from dedicated channel',
      'Response times are optimal for this type of collaboration space'
    ]
  });

  const [isLoading, setIsLoading] = useState(false);

  const refreshInsights = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const renderEngagementMetrics = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <PeopleOutlined sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" component="div">
              {insights.engagement.activeUsers}
            </Typography>
            <Typography color="text.secondary">
              Active Users
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <AssignmentOutlined sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
            <Typography variant="h4" component="div">
              {insights.engagement.totalMessages}
            </Typography>
            <Typography color="text.secondary">
              Total Messages
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <TrendingUpOutlined sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h4" component="div">
              {insights.engagement.threadsCreated}
            </Typography>
            <Typography color="text.secondary">
              Threads Created
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <InsightsOutlined sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
            <Typography variant="h4" component="div">
              {insights.engagement.avgResponseTime}
            </Typography>
            <Typography color="text.secondary">
              Avg Response Time
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderTopicTrends = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Trending Topics
      </Typography>
      <List>
        {insights.trends.map((trend: any, index: number) => (
          <ListItem key={index} divider>
            <ListItemText
              primary={
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1">{trend.topic}</Typography>
                  <Chip
                    label={`${trend.frequency} mentions`}
                    size="small"
                    color="primary"
                  />
                </Box>
              }
              secondary={
                <Box mt={1}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="caption">Sentiment</Typography>
                    <Typography variant="caption">
                      {Math.round(trend.sentiment * 100)}% positive
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={trend.sentiment * 100}
                    color={trend.sentiment > 0.6 ? 'success' : trend.sentiment > 0.4 ? 'warning' : 'error'}
                  />
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );

  const renderActionItems = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        AI-Extracted Action Items
      </Typography>
      <List>
        {insights.actionItems.map((item: any, index: number) => (
          <ListItem key={index} divider>
            <ListItemText
              primary={item.text}
              secondary={
                <Box display="flex" alignItems="center" gap={1} mt={1}>
                  <Chip
                    label={item.priority}
                    size="small"
                    color={item.priority === 'high' ? 'error' : 'warning'}
                  />
                  <Chip
                    label={`@${item.assignee}`}
                    size="small"
                    variant="outlined"
                  />
                  <Typography variant="caption" color="text.secondary">
                    Due: {item.dueDate}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );

  const renderRecommendations = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        AI Recommendations
      </Typography>
      <List>
        {insights.recommendations.map((recommendation: string, index: number) => (
          <ListItem key={index}>
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
    </Paper>
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          AI Insights & Analytics
        </Typography>
        <Button
          variant="outlined"
          startIcon={isLoading ? <SmartToyOutlined /> : <RefreshOutlined />}
          onClick={refreshInsights}
          disabled={isLoading}
        >
          {isLoading ? 'Analyzing...' : 'Refresh Insights'}
        </Button>
      </Box>

      {isLoading && (
        <Box mb={3}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            AI is analyzing space activity patterns...
          </Typography>
        </Box>
      )}

      <Box display="flex" flexDirection="column" gap={3}>
        {/* Engagement Metrics */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Engagement Overview
          </Typography>
          {renderEngagementMetrics()}
        </Box>

        {/* Topic Trends and Action Items */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            {renderTopicTrends()}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderActionItems()}
          </Grid>
        </Grid>

        {/* AI Recommendations */}
        {renderRecommendations()}

        {/* Advanced Analytics Accordion */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
            <Typography variant="h6">Advanced Analytics</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Collaboration Patterns
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Peak activity hours: 9 AM - 11 AM, 2 PM - 4 PM
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Most active participants: John (25%), Sarah (20%), Mike (18%)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cross-company collaboration: 35% of messages
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Communication Health
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Response rate: 92%
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Thread completion rate: 78%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Knowledge sharing score: 8.5/10
                </Typography>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
};
