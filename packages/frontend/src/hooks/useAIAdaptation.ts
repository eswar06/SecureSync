import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../providers/SocketProvider';
import { useAppDispatch, useAppSelector } from './redux';
import { addNotification } from '../store/slices/notificationsSlice';
import {
  SessionData,
  UserContext,
  ProjectMetrics,
  MeetingData,
  TeamData,
  // AdaptiveIntelligence
} from '../../../shared/src/types/index';

interface AIAdaptationHook {
  // Contextual Intelligence
  currentContext: UserContext | null;
  adaptedInterface: any;
  recommendations: string[];
  
  // Analytics & Insights
  projectMetrics: ProjectMetrics | null;
  predictiveInsights: any[];
  behaviorPatterns: any[];
  
  // Adaptation Functions
  adaptInterfaceForRole: (role: string) => Promise<boolean>;
  adaptInterfaceForIndustry: (industry: string) => Promise<boolean>;
  updateUserContext: (context: Partial<UserContext>) => void;
  
  // Predictive Analytics
  getPredictiveAnalytics: (projectId: string) => Promise<any>;
  getParticipantRecommendations: (meetingId: string) => Promise<string[]>;
  analyzeTeamDynamics: (teamId: string) => Promise<TeamData>;
  
  // Workflow Optimization
  optimizeWorkflow: (workflowData: any) => Promise<any>;
  suggestMeetingImprovements: (meetingData: MeetingData) => Promise<string[]>;
  generateAutomationSuggestions: () => Promise<any[]>;
  
  // Learning & Adaptation
  recordUserInteraction: (interaction: any) => void;
  trainPersonalModel: () => Promise<boolean>;
  exportLearningData: () => Promise<any>;
}

export const useAIAdaptation = (): AIAdaptationHook => {
  const dispatch = useAppDispatch();
  const { socket, emit, on, off } = useSocket();
  const { user } = useAppSelector((state) => state.auth);

  const [currentContext, setCurrentContext] = useState<UserContext | null>(null);
  const [adaptedInterface, setAdaptedInterface] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [projectMetrics, setProjectMetrics] = useState<ProjectMetrics | null>(null);
  const [predictiveInsights, setPredictiveInsights] = useState<any[]>([]);
  const [behaviorPatterns, setBehaviorPatterns] = useState<any[]>([]);

  const interactionHistory = useRef<any[]>([]);
  const learningModel = useRef<any>(null);

  // Initialize AI adaptation system
  useEffect(() => {
    if (user?.id && socket) {
      initializeAIAdaptation();
      loadUserContext();
      startBehaviorTracking();
    }

    return () => {
      saveLearningState();
    };
  }, [user?.id, socket]);

  const initializeAIAdaptation = useCallback(async () => {
    try {
      emit('initialize-ai-adaptation', {
        userId: user?.id,
        deviceInfo: {
          screen: { width: window.screen.width, height: window.screen.height },
          userAgent: navigator.userAgent,
          language: navigator.language
        }
      });

      // Load existing learning model
      const savedModel = localStorage.getItem(`ai-model-${user?.id}`);
      if (savedModel) {
        learningModel.current = JSON.parse(savedModel);
      }
    } catch (error) {
      console.error('Failed to initialize AI adaptation:', error);
    }
  }, [user?.id, emit]);

  const loadUserContext = useCallback(async () => {
    try {
      emit('get-user-context', { userId: user?.id });
    } catch (error) {
      console.error('Failed to load user context:', error);
    }
  }, [user?.id, emit]);

  const startBehaviorTracking = useCallback(() => {
    // Track user interactions for learning
    const trackInteraction = (event: any) => {
      const interaction = {
        type: event.type,
        target: event.target?.tagName,
        timestamp: new Date(),
        context: currentContext
      };
      recordUserInteraction(interaction);
    };

    // Add event listeners for behavior tracking
    document.addEventListener('click', trackInteraction);
    document.addEventListener('keydown', trackInteraction);
    
    return () => {
      document.removeEventListener('click', trackInteraction);
      document.removeEventListener('keydown', trackInteraction);
    };
  }, [currentContext]);

  const adaptInterfaceForRole = useCallback(async (role: string): Promise<boolean> => {
    try {
      emit('adapt-interface-for-role', {
        userId: user?.id,
        role,
        currentContext
      });

      dispatch(addNotification({
        type: 'info',
        title: 'Interface Adaptation',
        message: `Adapting interface for ${role} role...`
      }));

      return true;
    } catch (error) {
      console.error('Failed to adapt interface for role:', error);
      return false;
    }
  }, [user?.id, currentContext, emit, dispatch]);

  const adaptInterfaceForIndustry = useCallback(async (industry: string): Promise<boolean> => {
    try {
      emit('adapt-interface-for-industry', {
        userId: user?.id,
        industry,
        currentContext
      });

      dispatch(addNotification({
        type: 'info',
        title: 'Industry Adaptation',
        message: `Customizing interface for ${industry} industry...`
      }));

      return true;
    } catch (error) {
      console.error('Failed to adapt interface for industry:', error);
      return false;
    }
  }, [user?.id, currentContext, emit, dispatch]);

  const updateUserContext = useCallback((context: Partial<UserContext>) => {
    const updatedContext = { ...currentContext, ...context } as UserContext;
    setCurrentContext(updatedContext);

    emit('update-user-context', {
      userId: user?.id,
      context: updatedContext
    });

    // Trigger real-time adaptation
    if (context.currentProject || context.activeRole) {
      triggerRealTimeAdaptation(updatedContext);
    }
  }, [currentContext, user?.id, emit]);

  const triggerRealTimeAdaptation = useCallback(async (context: UserContext) => {
    try {
      // Analyze current context and adapt interface
      const adaptationRules = await analyzeContextForAdaptation(context);
      
      if (adaptationRules.length > 0) {
        setAdaptedInterface(adaptationRules);
        
        dispatch(addNotification({
          type: 'success',
          title: 'Smart Adaptation',
          message: 'Interface adapted based on your current context'
        }));
      }
    } catch (error) {
      console.error('Failed to trigger real-time adaptation:', error);
    }
  }, [dispatch]);

  const analyzeContextForAdaptation = async (context: UserContext): Promise<any[]> => {
    // AI-powered context analysis
    const rules = [];

    // Role-based adaptations
    if (context.activeRole === 'manager') {
      rules.push({
        type: 'layout',
        change: 'emphasize-analytics',
        priority: 'high'
      });
    } else if (context.activeRole === 'developer') {
      rules.push({
        type: 'layout',
        change: 'emphasize-technical-tools',
        priority: 'high'
      });
    }

    // Project-based adaptations
    if (context.currentProject?.type === 'software-development') {
      rules.push({
        type: 'features',
        change: 'enable-code-collaboration',
        priority: 'medium'
      });
    }

    // Time-based adaptations
    const hour = new Date().getHours();
    if (hour < 10 || hour > 18) {
      rules.push({
        type: 'theme',
        change: 'dark-mode',
        priority: 'low'
      });
    }

    return rules;
  };

  const getPredictiveAnalytics = useCallback(async (projectId: string): Promise<any> => {
    try {
      const response = await new Promise<any>((resolve) => {
        emit('get-predictive-analytics', {
          projectId,
          userId: user?.id,
          context: currentContext
        });

        const handler = (data: { projectId: string; analytics: any }) => {
          if (data.projectId === projectId) {
            off('predictive-analytics-ready', handler);
            resolve(data.analytics);
          }
        };
        on('predictive-analytics-ready', handler);
      });

      setPredictiveInsights(response.insights || []);
      setProjectMetrics(response.metrics || null);

      return response;
    } catch (error) {
      console.error('Failed to get predictive analytics:', error);
      return null;
    }
  }, [user?.id, currentContext, emit, on, off]);

  const getParticipantRecommendations = useCallback(async (meetingId: string): Promise<string[]> => {
    try {
      const response = await new Promise<string[]>((resolve) => {
        emit('get-participant-recommendations', {
          meetingId,
          userId: user?.id,
          context: currentContext
        });

        const handler = (data: { meetingId: string; recommendations: string[] }) => {
          if (data.meetingId === meetingId) {
            off('participant-recommendations-ready', handler);
            resolve(data.recommendations);
          }
        };
        on('participant-recommendations-ready', handler);
      });

      return response;
    } catch (error) {
      console.error('Failed to get participant recommendations:', error);
      return [];
    }
  }, [user?.id, currentContext, emit, on, off]);

  const analyzeTeamDynamics = useCallback(async (teamId: string): Promise<TeamData> => {
    try {
      const response = await new Promise<TeamData>((resolve) => {
        emit('analyze-team-dynamics', {
          teamId,
          userId: user?.id,
          analysisDepth: 'comprehensive'
        });

        const handler = (data: { teamId: string; teamData: TeamData }) => {
          if (data.teamId === teamId) {
            off('team-dynamics-analyzed', handler);
            resolve(data.teamData);
          }
        };
        on('team-dynamics-analyzed', handler);
      });

      return response;
    } catch (error) {
      console.error('Failed to analyze team dynamics:', error);
      throw error;
    }
  }, [user?.id, emit, on, off]);

  const optimizeWorkflow = useCallback(async (workflowData: any): Promise<any> => {
    try {
      const response = await new Promise<any>((resolve) => {
        emit('optimize-workflow', {
          workflowData,
          userId: user?.id,
          context: currentContext
        });

        const handler = (data: { optimizedWorkflow: any; improvements: string[] }) => {
          off('workflow-optimized', handler);
          resolve(data);
        };
        on('workflow-optimized', handler);
      });

      if (response.improvements?.length > 0) {
        setRecommendations(prev => [...prev, ...response.improvements]);
      }

      return response.optimizedWorkflow;
    } catch (error) {
      console.error('Failed to optimize workflow:', error);
      return null;
    }
  }, [user?.id, currentContext, emit, on, off]);

  const suggestMeetingImprovements = useCallback(async (meetingData: MeetingData): Promise<string[]> => {
    try {
      const suggestions = [];

      // Analyze meeting data with AI
      if (meetingData.duration > 60) {
        suggestions.push('Consider breaking long meetings into shorter focused sessions');
      }

      if (meetingData.participantCount > 8) {
        suggestions.push('Large meetings may benefit from structured facilitation');
      }

      if (meetingData.engagementScore < 0.7) {
        suggestions.push('Try interactive elements to increase engagement');
      }

      // Get AI-powered suggestions from server
      const aiSuggestions = await new Promise<string[]>((resolve) => {
        emit('get-meeting-improvement-suggestions', {
          meetingData,
          userId: user?.id
        });

        const handler = (data: { suggestions: string[] }) => {
          off('meeting-suggestions-ready', handler);
          resolve(data.suggestions);
        };
        on('meeting-suggestions-ready', handler);
      });

      return [...suggestions, ...aiSuggestions];
    } catch (error) {
      console.error('Failed to get meeting improvement suggestions:', error);
      return [];
    }
  }, [user?.id, emit, on, off]);

  const generateAutomationSuggestions = useCallback(async (): Promise<any[]> => {
    try {
      const response = await new Promise<any[]>((resolve) => {
        emit('generate-automation-suggestions', {
          userId: user?.id,
          context: currentContext,
          interactionHistory: interactionHistory.current.slice(-100) // Last 100 interactions
        });

        const handler = (data: { suggestions: any[] }) => {
          off('automation-suggestions-ready', handler);
          resolve(data.suggestions);
        };
        on('automation-suggestions-ready', handler);
      });

      return response;
    } catch (error) {
      console.error('Failed to generate automation suggestions:', error);
      return [];
    }
  }, [user?.id, currentContext, emit, on, off]);

  const recordUserInteraction = useCallback((interaction: any) => {
    // Store interaction for learning
    interactionHistory.current.push({
      ...interaction,
      sessionId: currentContext?.sessionId,
      userId: user?.id
    });

    // Keep only last 1000 interactions
    if (interactionHistory.current.length > 1000) {
      interactionHistory.current = interactionHistory.current.slice(-1000);
    }

    // Update learning model
    updateLearningModel(interaction);
  }, [currentContext, user?.id]);

  const updateLearningModel = useCallback((interaction: any) => {
    if (!learningModel.current) {
      learningModel.current = {
        preferences: {},
        patterns: {},
        adaptations: {}
      };
    }

    // Simple pattern recognition
    const pattern = `${interaction.type}-${interaction.target}`;
    learningModel.current.patterns[pattern] = 
      (learningModel.current.patterns[pattern] || 0) + 1;

    // Context-based preferences
    if (currentContext) {
      const contextKey = `${currentContext.activeRole}-${currentContext.currentProject?.type}`;
      if (!learningModel.current.preferences[contextKey]) {
        learningModel.current.preferences[contextKey] = {};
      }
      learningModel.current.preferences[contextKey][pattern] = 
        (learningModel.current.preferences[contextKey][pattern] || 0) + 1;
    }
  }, [currentContext]);

  const trainPersonalModel = useCallback(async (): Promise<boolean> => {
    try {
      // Send interaction data to server for advanced training
      emit('train-personal-model', {
        userId: user?.id,
        interactionHistory: interactionHistory.current,
        learningModel: learningModel.current
      });

      dispatch(addNotification({
        type: 'info',
        title: 'AI Training',
        message: 'Training your personalized AI model...'
      }));

      return true;
    } catch (error) {
      console.error('Failed to train personal model:', error);
      return false;
    }
  }, [user?.id, emit, dispatch]);

  const exportLearningData = useCallback(async (): Promise<any> => {
    try {
      return {
        userId: user?.id,
        interactionHistory: interactionHistory.current,
        learningModel: learningModel.current,
        context: currentContext,
        exportDate: new Date()
      };
    } catch (error) {
      console.error('Failed to export learning data:', error);
      return null;
    }
  }, [user?.id, currentContext]);

  const saveLearningState = useCallback(() => {
    if (learningModel.current && user?.id) {
      localStorage.setItem(
        `ai-model-${user.id}`, 
        JSON.stringify(learningModel.current)
      );
    }
  }, [user?.id]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleContextLoaded = (data: { context: UserContext }) => {
      setCurrentContext(data.context);
    };

    const handleInterfaceAdapted = (data: { adaptations: any[] }) => {
      setAdaptedInterface(data.adaptations);
      
      dispatch(addNotification({
        type: 'success',
        title: 'Interface Adapted',
        message: 'Your interface has been customized based on AI insights'
      }));
    };

    const handleRecommendationsUpdated = (data: { recommendations: string[] }) => {
      setRecommendations(data.recommendations);
    };

    const handleBehaviorPatternDetected = (data: { pattern: any }) => {
      setBehaviorPatterns(prev => [...prev, data.pattern]);
      
      if (data.pattern.confidence > 0.8) {
        dispatch(addNotification({
          type: 'info',
          title: 'Pattern Detected',
          message: data.pattern.description
        }));
      }
    };

    on('user-context-loaded', handleContextLoaded);
    on('interface-adapted', handleInterfaceAdapted);
    on('recommendations-updated', handleRecommendationsUpdated);
    on('behavior-pattern-detected', handleBehaviorPatternDetected);

    return () => {
      off('user-context-loaded', handleContextLoaded);
      off('interface-adapted', handleInterfaceAdapted);
      off('recommendations-updated', handleRecommendationsUpdated);
      off('behavior-pattern-detected', handleBehaviorPatternDetected);
    };
  }, [socket, on, off, dispatch]);

  return {
    // Contextual Intelligence
    currentContext,
    adaptedInterface,
    recommendations,
    
    // Analytics & Insights
    projectMetrics,
    predictiveInsights,
    behaviorPatterns,
    
    // Adaptation Functions
    adaptInterfaceForRole,
    adaptInterfaceForIndustry,
    updateUserContext,
    
    // Predictive Analytics
    getPredictiveAnalytics,
    getParticipantRecommendations,
    analyzeTeamDynamics,
    
    // Workflow Optimization
    optimizeWorkflow,
    suggestMeetingImprovements,
    generateAutomationSuggestions,
    
    // Learning & Adaptation
    recordUserInteraction,
    trainPersonalModel,
    exportLearningData
  };
};
