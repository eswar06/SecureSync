import { EventEmitter } from 'events';
import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { redisClient } from '../cache/redis';
import {
  UserContext,
  BehaviorPattern,
  SessionData,
  TeamData,
  ProjectMetrics,
  MeetingData,
  TeamMetrics,
  ProjectPrediction,
  PredictionType,
  IndustryType,
  UserRole,
  BehaviorType
} from '../../../shared/src/types/index';

/**
 * AIAdaptationEngine - Context-aware interface adaptation and predictive analytics
 */
export class AIAdaptationEngine extends EventEmitter {
  private openai: OpenAI;
  private userContexts: Map<string, UserContext> = new Map();
  private behaviorAnalytics: Map<string, BehaviorPattern[]> = new Map();

  constructor() {
    super();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.initializeAIEngine();
  }

  private initializeAIEngine(): void {
    logger.info('Initializing AI Adaptation Engine');
    this.startBehaviorAnalysis();
    this.startPredictiveAnalytics();
  }

  /**
   * Analyzes user context and adapts interface accordingly
   */
  public async analyzeUserContext(userId: string, sessionData: SessionData): Promise<UserContext> {
    try {
      // Get existing context or create new one
      let context = this.userContexts.get(userId);
      
      if (!context) {
        context = await this.buildInitialUserContext(userId);
        this.userContexts.set(userId, context);
      }

      // Update context with session data
      context = await this.updateContextWithSession(context, sessionData);
      
      // Store updated context
      this.userContexts.set(userId, context);
      await this.persistUserContext(userId, context);

      return context;

    } catch (error) {
      logger.error('Failed to analyze user context:', error);
      throw error;
    }
  }

  /**
   * Adapts interface based on user context
   */
  public async adaptInterface(context: UserContext): Promise<any> {
    try {
      const adaptations = {
        layout: await this.adaptLayout(context),
        features: await this.adaptFeatures(context),
        shortcuts: await this.adaptShortcuts(context),
        notifications: await this.adaptNotifications(context),
        priorities: await this.adaptPriorities(context)
      };

      logger.info(`Interface adapted for user ${context.userId}`, {
        role: context.role,
        industry: context.industry,
        behaviorPatterns: context.behaviorPatterns.length
      });

      return adaptations;

    } catch (error) {
      logger.error('Failed to adapt interface:', error);
      return this.getDefaultInterface();
    }
  }

  /**
   * Predicts project risks using AI analysis
   */
  public async predictProjectRisks(projectData: ProjectMetrics): Promise<ProjectPrediction[]> {
    try {
      const predictions: ProjectPrediction[] = [];

      // Analyze timeline risks
      const timelineRisk = await this.analyzeTimelineRisk(projectData);
      if (timelineRisk.confidence > 0.7) {
        predictions.push(timelineRisk);
      }

      // Analyze budget risks
      const budgetRisk = await this.analyzeBudgetRisk(projectData);
      if (budgetRisk.confidence > 0.7) {
        predictions.push(budgetRisk);
      }

      // Analyze quality risks
      const qualityRisk = await this.analyzeQualityRisk(projectData);
      if (qualityRisk.confidence > 0.7) {
        predictions.push(qualityRisk);
      }

      // Analyze team risks
      const teamRisk = await this.analyzeTeamRisk(projectData);
      if (teamRisk.confidence > 0.7) {
        predictions.push(teamRisk);
      }

      return predictions;

    } catch (error) {
      logger.error('Failed to predict project risks:', error);
      return [];
    }
  }

  /**
   * Recommends meeting participants based on context
   */
  public async recommendParticipants(meetingData: MeetingData): Promise<string[]> {
    try {
      const recommendations: string[] = [];

      // Analyze required skills
      const skillBasedRecommendations = await this.recommendBySkills(meetingData.requiredSkills);
      recommendations.push(...skillBasedRecommendations);

      // Analyze project context
      if (meetingData.projectContext) {
        const projectRecommendations = await this.recommendByProject(meetingData.projectContext);
        recommendations.push(...projectRecommendations);
      }

      // Analyze previous meeting patterns
      const patternRecommendations = await this.recommendByPatterns(meetingData.previousMeetings);
      recommendations.push(...patternRecommendations);

      // Remove duplicates and current participants
      const uniqueRecommendations = [...new Set(recommendations)]
        .filter(userId => !meetingData.currentParticipants.includes(userId));

      return uniqueRecommendations.slice(0, 5); // Top 5 recommendations

    } catch (error) {
      logger.error('Failed to recommend participants:', error);
      return [];
    }
  }

  /**
   * Optimizes team workflows based on analytics
   */
  public async optimizeWorkflows(teamData: TeamData): Promise<any> {
    try {
      const optimizations = {
        bottlenecks: await this.identifyBottlenecks(teamData),
        improvements: await this.suggestImprovements(teamData),
        automationOpportunities: await this.findAutomationOpportunities(teamData),
        efficiencyGains: await this.calculateEfficiencyGains(teamData)
      };

      return optimizations;

    } catch (error) {
      logger.error('Failed to optimize workflows:', error);
      return { bottlenecks: [], improvements: [], automationOpportunities: [], efficiencyGains: [] };
    }
  }

  // Private helper methods

  private async buildInitialUserContext(userId: string): Promise<UserContext> {
    // This would typically fetch from database
    const defaultContext: UserContext = {
      userId,
      role: UserRole.USER,
      industry: IndustryType.ENTERPRISE,
      behaviorPatterns: [],
      workingHours: {
        timezone: 'UTC',
        startTime: '09:00',
        endTime: '17:00',
        workdays: [1, 2, 3, 4, 5],
        breaks: []
      },
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: {
          email: true,
          push: true,
          inApp: true,
          reminders: true,
          mentions: true
        },
        uiAdaptation: {
          adaptByRole: true,
          adaptByIndustry: true,
          adaptByBehavior: true,
          customizations: {}
        }
      },
      teamContext: {
        teamId: 'default',
        teamSize: 1,
        teamRole: 'individual',
        collaborationFrequency: 0,
        teamEfficiency: {
          communicationSpeed: 0.5,
          meetingEfficiency: 0.5,
          taskCompletionRate: 0.5,
          collaborationScore: 0.5,
          bottlenecks: []
        }
      },
      projectContext: []
    };

    return defaultContext;
  }

  private async updateContextWithSession(context: UserContext, sessionData: SessionData): Promise<UserContext> {
    // Analyze session behavior patterns
    const newPatterns = await this.extractBehaviorPatterns(sessionData);
    
    // Update existing patterns or add new ones
    for (const newPattern of newPatterns) {
      const existingIndex = context.behaviorPatterns.findIndex(p => p.type === newPattern.type);
      if (existingIndex >= 0) {
        context.behaviorPatterns[existingIndex] = newPattern;
      } else {
        context.behaviorPatterns.push(newPattern);
      }
    }

    // Update last activity
    context.behaviorPatterns.forEach(pattern => {
      pattern.lastObserved = new Date();
    });

    return context;
  }

  private async extractBehaviorPatterns(sessionData: SessionData): Promise<BehaviorPattern[]> {
    const patterns: BehaviorPattern[] = [];

    // Analyze feature usage
    const featureUsage = sessionData.features.reduce((acc, feature) => {
      acc[feature.feature] = (acc[feature.feature] || 0) + feature.usageCount;
      return acc;
    }, {} as Record<string, number>);

    patterns.push({
      type: BehaviorType.FEATURE_USAGE,
      frequency: Object.values(featureUsage).reduce((sum, count) => sum + count, 0),
      confidence: 0.8,
      lastObserved: new Date(),
      metadata: { featureUsage }
    });

    // Analyze work schedule
    const sessionHour = new Date(sessionData.startTime).getHours();
    patterns.push({
      type: BehaviorType.WORK_SCHEDULE,
      frequency: 1,
      confidence: 0.6,
      lastObserved: new Date(),
      metadata: { sessionHour, sessionDuration: sessionData.duration }
    });

    return patterns;
  }

  private async adaptLayout(context: UserContext): Promise<any> {
    switch (context.role) {
      case UserRole.ADMIN:
        return {
          sidebar: 'expanded',
          dashboard: 'admin',
          quickActions: ['user-management', 'security-overview', 'analytics']
        };
      case UserRole.MODERATOR:
        return {
          sidebar: 'compact',
          dashboard: 'moderation',
          quickActions: ['meeting-control', 'participant-management', 'recording-settings']
        };
      default:
        return {
          sidebar: 'minimal',
          dashboard: 'user',
          quickActions: ['join-meeting', 'create-thread', 'view-reminders']
        };
    }
  }

  private async adaptFeatures(context: UserContext): Promise<any> {
    const features = {
      recording: context.role !== UserRole.GUEST,
      transcription: true,
      privateChannels: context.role !== UserRole.GUEST,
      documentSharing: true,
      analytics: [UserRole.ADMIN, UserRole.MODERATOR].includes(context.role)
    };

    // Industry-specific adaptations
    switch (context.industry) {
      case IndustryType.DEVELOPMENT_AGENCY:
        (features as any)['codeReview'] = true;
        (features as any)['gitIntegration'] = true;
        break;
      case IndustryType.MEDIA_PRODUCTION:
        (features as any)['assetManagement'] = true;
        (features as any)['timelineView'] = true;
        break;
    }

    return features;
  }

  private async adaptShortcuts(context: UserContext): Promise<any> {
    const shortcuts = {
      'ctrl+m': 'toggle-microphone',
      'ctrl+shift+v': 'toggle-video',
      'ctrl+shift+s': 'share-screen'
    };

    // Add role-specific shortcuts
    if (context.role === UserRole.MODERATOR) {
      (shortcuts as any)['ctrl+shift+r'] = 'start-recording';
      (shortcuts as any)['ctrl+shift+t'] = 'toggle-transcription';
    }

    return shortcuts;
  }

  private async adaptNotifications(context: UserContext): Promise<any> {
    const notifications = {
      importance: 'medium',
      channels: ['in-app']
    };

    // Adapt based on behavior patterns
    const meetingPattern = context.behaviorPatterns.find(p => p.type === BehaviorType.MEETING_FREQUENCY);
    if (meetingPattern && meetingPattern.frequency > 10) {
      notifications.importance = 'low'; // Reduce noise for heavy meeting users
    }

    return notifications;
  }

  private async adaptPriorities(context: UserContext): Promise<any> {
    const priorities = [];

    // Industry-specific priorities
    switch (context.industry) {
      case IndustryType.DEVELOPMENT_AGENCY:
        priorities.push('code-reviews', 'sprint-planning', 'client-updates');
        break;
      case IndustryType.RESEARCH_INSTITUTION:
        priorities.push('research-meetings', 'grant-applications', 'publications');
        break;
      case IndustryType.MEDIA_PRODUCTION:
        priorities.push('creative-reviews', 'production-schedule', 'asset-approval');
        break;
      default:
        priorities.push('meetings', 'tasks', 'messages');
    }

    return priorities;
  }

  private async analyzeTimelineRisk(projectData: ProjectMetrics): Promise<ProjectPrediction> {
    const { timeline, team, budget } = projectData;
    
    // Calculate risk factors
    const progressRisk = timeline.progress < 0.5 && Date.now() > timeline.startDate.getTime() + (timeline.endDate.getTime() - timeline.startDate.getTime()) * 0.6;
    const teamEfficiencyRisk = team.efficiency < 0.7;
    const budgetConstraintRisk = budget.spent / budget.allocated > 0.8;

    const riskScore = [progressRisk, teamEfficiencyRisk, budgetConstraintRisk].filter(Boolean).length / 3;

    return {
      type: PredictionType.DELAY_RISK,
      confidence: riskScore,
      prediction: riskScore > 0.6 ? 'High risk of project delay' : 'Project timeline is on track',
      recommendedActions: riskScore > 0.6 ? [
        'Increase team size',
        'Reduce scope',
        'Extend deadline',
        'Improve team efficiency'
      ] : [],
      timeline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
    };
  }

  private async analyzeBudgetRisk(projectData: ProjectMetrics): Promise<ProjectPrediction> {
    const { budget, timeline } = projectData;
    
    const spentRatio = budget.spent / budget.allocated;
    const timeRatio = (Date.now() - timeline.startDate.getTime()) / (timeline.endDate.getTime() - timeline.startDate.getTime());
    
    const burnRate = spentRatio / timeRatio;
    const projectedOverrun = burnRate > 1.2;

    return {
      type: PredictionType.BUDGET_OVERRUN,
      confidence: projectedOverrun ? 0.8 : 0.3,
      prediction: projectedOverrun ? 'Budget overrun likely' : 'Budget on track',
      recommendedActions: projectedOverrun ? [
        'Review expenses',
        'Negotiate additional budget',
        'Reduce scope',
        'Optimize resource allocation'
      ] : [],
      timeline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 weeks from now
    };
  }

  private async analyzeQualityRisk(projectData: ProjectMetrics): Promise<ProjectPrediction> {
    const { quality, team } = projectData;
    
    const qualityRisk = quality.defectRate > 0.1 || quality.testCoverage < 0.8;
    const teamSatisfactionRisk = team.satisfaction < 0.7;

    return {
      type: PredictionType.QUALITY_ISSUE,
      confidence: qualityRisk ? 0.7 : 0.2,
      prediction: qualityRisk ? 'Quality issues detected' : 'Quality metrics healthy',
      recommendedActions: qualityRisk ? [
        'Increase testing',
        'Code review requirements',
        'Team training',
        'Quality gates'
      ] : [],
      timeline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
    };
  }

  private async analyzeTeamRisk(projectData: ProjectMetrics): Promise<ProjectPrediction> {
    const { team } = projectData;
    
    const highTurnoverRisk = team.turnover > 0.2;
    const skillGapRisk = team.skillGaps.length > 2;
    const lowSatisfactionRisk = team.satisfaction < 0.6;

    const teamRisk = [highTurnoverRisk, skillGapRisk, lowSatisfactionRisk].filter(Boolean).length / 3;

    return {
      type: PredictionType.RESOURCE_SHORTAGE,
      confidence: teamRisk,
      prediction: teamRisk > 0.5 ? 'Team stability at risk' : 'Team metrics healthy',
      recommendedActions: teamRisk > 0.5 ? [
        'Address team concerns',
        'Skill development programs',
        'Improve team communication',
        'Recognize achievements'
      ] : [],
      timeline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
    };
  }

  private async recommendBySkills(requiredSkills: string[]): Promise<string[]> {
    // This would query a user skills database
    // For demo, return mock recommendations
    return ['user1', 'user2', 'user3'];
  }

  private async recommendByProject(projectContext: string): Promise<string[]> {
    // This would analyze project team members and stakeholders
    return ['user4', 'user5'];
  }

  private async recommendByPatterns(previousMeetings: string[]): Promise<string[]> {
    // This would analyze previous meeting attendance patterns
    return ['user6', 'user7'];
  }

  private async identifyBottlenecks(teamData: TeamData): Promise<any[]> {
    return teamData.performance.collaboration < 0.7 ? [
      { type: 'communication', severity: 'medium', description: 'Team communication could be improved' }
    ] : [];
  }

  private async suggestImprovements(teamData: TeamData): Promise<any[]> {
    const improvements = [];
    
    if (teamData.performance.velocity < 0.7) {
      improvements.push({
        area: 'velocity',
        suggestion: 'Consider breaking down tasks into smaller chunks',
        impact: 'high'
      });
    }

    return improvements;
  }

  private async findAutomationOpportunities(teamData: TeamData): Promise<any[]> {
    const opportunities: any[] | PromiseLike<any[]> = [];

    teamData.workflows.forEach(workflow => {
      if (workflow.automationPotential > 0.7) {
        opportunities.push({
          workflow: workflow.name,
          potential: workflow.automationPotential,
          estimatedSavings: '2-4 hours per week'
        });
      }
    });

    return opportunities;
  }

  private async calculateEfficiencyGains(teamData: TeamData): Promise<any[]> {
    return [
      {
        metric: 'meeting efficiency',
        current: teamData.performance.overall,
        potential: Math.min(teamData.performance.overall + 0.2, 1.0),
        actions: ['Use structured agendas', 'Time-box discussions']
      }
    ];
  }

  private getDefaultInterface(): any {
    return {
      layout: { sidebar: 'minimal', dashboard: 'user', quickActions: [] },
      features: { recording: false, transcription: true, privateChannels: false },
      shortcuts: {},
      notifications: { importance: 'medium', channels: ['in-app'] },
      priorities: ['meetings', 'messages']
    };
  }

  private async persistUserContext(userId: string, context: UserContext): Promise<void> {
    try {
      await redisClient.setex(
        `user-context:${userId}`,
        3600 * 24, // 24 hours
        JSON.stringify(context)
      );
    } catch (error) {
      logger.error('Failed to persist user context:', error);
    }
  }

  private startBehaviorAnalysis(): void {
    // Start periodic behavior analysis
    setInterval(() => {
      this.analyzeBehaviorTrends();
    }, 3600000); // Every hour
  }

  private startPredictiveAnalytics(): void {
    // Start periodic predictive analytics
    setInterval(() => {
      this.runPredictiveAnalytics();
    }, 86400000); // Every 24 hours
  }

  private async analyzeBehaviorTrends(): Promise<void> {
    // Analyze behavior trends across all users
    logger.debug('Running behavior trend analysis');
  }

  private async runPredictiveAnalytics(): Promise<void> {
    // Run predictive analytics for all active projects
    logger.debug('Running predictive analytics');
  }
}
