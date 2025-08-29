import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { redisClient } from '../cache/redis';
import {
  Space,
  SpaceType,
  SpaceParticipant,
  SpaceRole,
  SpacePermissions,
  Thread,
  ThreadStatus,
  ThreadPriority,
  Message,
  MessageType,
  AISuggestion,
  SuggestionType,
  UserPermissions
} from '../../../shared/src/types/index';
import crypto from 'crypto';
import OpenAI from 'openai';

/**
 * SpacesThreadingManager - Advanced spaces and threading system with cross-company collaboration
 */
export class SpacesThreadingManager extends EventEmitter {
  private openai: OpenAI;
  private activeSpaces: Map<string, Space> = new Map();
  private activeThreads: Map<string, Thread> = new Map();

  constructor() {
    super();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.initializeSpacesThreading();
  }

  private initializeSpacesThreading(): void {
    logger.info('Initializing Spaces Threading Manager');
    this.loadActiveSpaces();
    this.loadActiveThreads();
    this.startAISuggestionEngine();
  }

  /**
   * Creates a cross-company communication space with granular permissions
   */
  public async createCrossCompanySpace(config: any): Promise<Space> {
    try {
      const spaceId = crypto.randomUUID();
      
      const space: Space = {
        id: spaceId,
        name: config.name,
        description: config.description,
        type: config.type || SpaceType.CROSS_COMPANY,
        organizationIds: config.organizationIds || [],
        ownerId: config.ownerId,
        participants: config.participants || [],
        threads: [],
        permissions: {
          canCreateThreads: config.permissions?.canCreateThreads ?? true,
          canInviteUsers: config.permissions?.canInviteUsers ?? false,
          canManagePermissions: config.permissions?.canManagePermissions ?? false,
          canDeleteSpace: config.permissions?.canDeleteSpace ?? false,
          crossCompanyAccess: config.permissions?.crossCompanyAccess ?? true
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        isArchived: false
      };

      // Store space
      this.activeSpaces.set(spaceId, space);
      await this.persistSpace(space);

      // Create default welcome thread
      const welcomeThread = await this.createThread({
        spaceId,
        title: 'Welcome to the space',
        description: 'Introduction and guidelines for this cross-company collaboration space',
        createdBy: config.ownerId,
        participants: config.participants.map((p: SpaceParticipant) => p.userId),
        priority: ThreadPriority.NORMAL,
        tags: ['welcome', 'guidelines']
      });

      space.threads.push(welcomeThread);

      logger.info(`Cross-company space created: ${spaceId}`, {
        name: config.name,
        type: config.type,
        organizationCount: config.organizationIds.length,
        participantCount: config.participants.length
      });

      this.emit('space-created', { space, config });

      return space;

    } catch (error) {
      logger.error('Failed to create cross-company space:', error);
      throw error;
    }
  }

  /**
   * Creates a thread with AI organization suggestions
   */
  public async createThread(threadData: any): Promise<Thread> {
    try {
      const threadId = crypto.randomUUID();
      
      const thread: Thread = {
        id: threadId,
        spaceId: threadData.spaceId,
        title: threadData.title,
        description: threadData.description,
        createdBy: threadData.createdBy,
        participants: threadData.participants || [],
        messages: [],
        subThreads: [],
        parentThreadId: threadData.parentThreadId,
        status: ThreadStatus.ACTIVE,
        priority: threadData.priority || ThreadPriority.NORMAL,
        tags: threadData.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivityAt: new Date(),
        isArchived: false,
        aiSuggestions: []
      };

      // Store thread
      this.activeThreads.set(threadId, thread);
      await this.persistThread(thread);

      // Update space with new thread
      const space = this.activeSpaces.get(threadData.spaceId);
      if (space) {
        space.threads.push(thread);
        space.updatedAt = new Date();
        await this.persistSpace(space);
      }

      // Generate AI suggestions for thread organization
      const suggestions = await this.generateThreadSuggestions(thread);
      thread.aiSuggestions = suggestions;

      logger.info(`Thread created: ${threadId}`, {
        spaceId: threadData.spaceId,
        title: threadData.title,
        createdBy: threadData.createdBy,
        participantCount: threadData.participants.length
      });

      this.emit('thread-created', { thread, spaceId: threadData.spaceId });

      return thread;

    } catch (error) {
      logger.error('Failed to create thread:', error);
      throw error;
    }
  }

  /**
   * Suggests thread creation based on conversation context using AI
   */
  public async suggestThreadCreation(conversationContext: string, spaceId: string): Promise<AISuggestion[]> {
    try {
      const prompt = `
        Analyze this conversation and suggest if it should be moved to a new thread:
        
        ${conversationContext}
        
        Consider:
        1. Is this a new topic/subject?
        2. Does it warrant separate discussion?
        3. Would it benefit from focused participation?
        4. Is it getting off-topic from the current thread?
        
        If yes, suggest:
        - Thread title
        - Thread description
        - Suggested participants
        - Priority level
        - Relevant tags
        
        Respond with JSON array of thread suggestions or empty array if no suggestion needed.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 800
      });

      const aiSuggestions = JSON.parse(response.choices[0].message.content || '[]');
      const suggestions: AISuggestion[] = [];

      for (const suggestion of aiSuggestions) {
        suggestions.push({
          id: crypto.randomUUID(),
          type: SuggestionType.THREAD_CREATION,
          content: JSON.stringify({
            title: suggestion.title,
            description: suggestion.description,
            participants: suggestion.participants,
            priority: suggestion.priority,
            tags: suggestion.tags
          }),
          confidence: 0.8,
          context: conversationContext.substring(0, 200),
          createdAt: new Date(),
          accepted: false
        });
      }

      logger.info(`Generated ${suggestions.length} thread creation suggestions for space ${spaceId}`);

      return suggestions;

    } catch (error) {
      logger.error('Failed to suggest thread creation:', error);
      return [];
    }
  }

  /**
   * Links cross-thread references for context preservation
   */
  public async linkCrossThreadReferences(threadIds: string[]): Promise<void> {
    try {
      const threads = threadIds.map(id => this.activeThreads.get(id)).filter(Boolean) as Thread[];
      
      if (threads.length < 2) {
        throw new Error('At least 2 threads required for cross-referencing');
      }

      // Create bidirectional references
      for (let i = 0; i < threads.length; i++) {
        for (let j = i + 1; j < threads.length; j++) {
          const thread1 = threads[i];
          const thread2 = threads[j];

          // Add reference metadata
          if (!thread1.metadata) thread1.metadata = {};
          if (!thread2.metadata) thread2.metadata = {};

          if (!thread1.metadata.crossReferences) thread1.metadata.crossReferences = [];
          if (!thread2.metadata.crossReferences) thread2.metadata.crossReferences = [];

          thread1.metadata.crossReferences.push({
            threadId: thread2.id,
            title: thread2.title,
            relationship: 'related',
            createdAt: new Date()
          });

          thread2.metadata.crossReferences.push({
            threadId: thread1.id,
            title: thread1.title,
            relationship: 'related',
            createdAt: new Date()
          });

          // Update threads
          thread1.updatedAt = new Date();
          thread2.updatedAt = new Date();
          
          await this.persistThread(thread1);
          await this.persistThread(thread2);
        }
      }

      logger.info(`Linked cross-thread references for ${threadIds.length} threads`);

      this.emit('threads-linked', { threadIds });

    } catch (error) {
      logger.error('Failed to link cross-thread references:', error);
      throw error;
    }
  }

  /**
   * Manages thread lifecycle with automatic archiving
   */
  public async manageThreadLifecycle(threadId: string): Promise<void> {
    try {
      const thread = this.activeThreads.get(threadId);
      if (!thread) {
        throw new Error('Thread not found');
      }

      const now = new Date();
      const daysSinceLastActivity = (now.getTime() - thread.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24);

      // Auto-archive based on inactivity and status
      if (daysSinceLastActivity > 30 && thread.status === ThreadStatus.ACTIVE) {
        thread.status = ThreadStatus.ARCHIVED;
        thread.isArchived = true;
        thread.updatedAt = now;

        await this.persistThread(thread);

        logger.info(`Thread auto-archived due to inactivity: ${threadId}`, {
          daysSinceLastActivity,
          title: thread.title
        });

        this.emit('thread-archived', { threadId, reason: 'inactivity', daysSinceLastActivity });
      }

      // Handle resolved threads
      if (thread.status === ThreadStatus.RESOLVED && daysSinceLastActivity > 7) {
        thread.isArchived = true;
        thread.updatedAt = now;

        await this.persistThread(thread);

        logger.info(`Resolved thread archived: ${threadId}`, { title: thread.title });

        this.emit('thread-archived', { threadId, reason: 'resolved', daysSinceLastActivity });
      }

    } catch (error) {
      logger.error('Failed to manage thread lifecycle:', error);
    }
  }

  /**
   * Searches across spaces with permission filtering
   */
  public async searchAcrossSpaces(query: string, userPermissions: UserPermissions, userId: string): Promise<any[]> {
    try {
      const results: any[] = [];
      const lowercaseQuery = query.toLowerCase();

      // Search in accessible spaces
      for (const space of this.activeSpaces.values()) {
        // Check space access permissions
        if (!this.canAccessSpace(space, userId, userPermissions)) {
          continue;
        }

        // Search space metadata
        if (space.name.toLowerCase().includes(lowercaseQuery) || 
            space.description?.toLowerCase().includes(lowercaseQuery)) {
          results.push({
            type: 'space',
            id: space.id,
            title: space.name,
            description: space.description,
            relevance: this.calculateRelevance(query, space.name + ' ' + (space.description || '')),
            path: `/spaces/${space.id}`
          });
        }

        // Search threads in space
        for (const thread of space.threads) {
          if (thread.title.toLowerCase().includes(lowercaseQuery) ||
              thread.description?.toLowerCase().includes(lowercaseQuery)) {
            results.push({
              type: 'thread',
              id: thread.id,
              title: thread.title,
              description: thread.description,
              spaceName: space.name,
              relevance: this.calculateRelevance(query, thread.title + ' ' + (thread.description || '')),
              path: `/spaces/${space.id}/threads/${thread.id}`
            });
          }

          // Search messages in thread
          const threadDetail = this.activeThreads.get(thread.id);
          if (threadDetail) {
            for (const message of threadDetail.messages) {
              if (message.content.toLowerCase().includes(lowercaseQuery)) {
                results.push({
                  type: 'message',
                  id: message.id,
                  title: `Message in ${thread.title}`,
                  description: message.content.substring(0, 200) + '...',
                  spaceName: space.name,
                  threadName: thread.title,
                  relevance: this.calculateRelevance(query, message.content),
                  path: `/spaces/${space.id}/threads/${thread.id}/messages/${message.id}`
                });
              }
            }
          }
        }
      }

      // Sort by relevance
      results.sort((a, b) => b.relevance - a.relevance);

      logger.info(`Search completed: "${query}"`, {
        userId,
        resultCount: results.length,
        spacesSearched: this.activeSpaces.size
      });

      return results.slice(0, 50); // Limit to top 50 results

    } catch (error) {
      logger.error('Failed to search across spaces:', error);
      return [];
    }
  }

  /**
   * Creates a message in a thread
   */
  public async createMessage(threadId: string, authorId: string, content: string, type: string): Promise<Message> {
    try {
      const thread = this.activeThreads.get(threadId);
      if (!thread) {
        throw new Error('Thread not found');
      }

      const messageId = crypto.randomUUID();
      const message: Message = {
        id: messageId,
        threadId,
        authorId,
        content,
        type: type as MessageType,
        attachments: [],
        mentions: this.extractMentions(content),
        reactions: [],
        replies: [],
        createdAt: new Date(),
        isEdited: false,
        isDeleted: false,
        metadata: {
          readBy: [],
          editHistory: [],
          aiAnalysis: await this.analyzeMessage(content)
        }
      };

      // Add message to thread
      thread.messages.push(message);
      thread.lastActivityAt = new Date();
      thread.updatedAt = new Date();

      // Update participant list if author is not already included
      if (!thread.participants.includes(authorId)) {
        thread.participants.push(authorId);
      }

      // Persist updates
      await this.persistThread(thread);

      // Generate AI suggestions based on new message
      const suggestions = await this.generateMessageSuggestions(message, thread);
      if (suggestions.length > 0) {
        thread.aiSuggestions.push(...suggestions);
        await this.persistThread(thread);
      }

      logger.info(`Message created in thread ${threadId}`, {
        messageId,
        authorId,
        contentLength: content.length,
        mentions: message.mentions && message.mentions.length
      });

      this.emit('message-created', { message, threadId });

      return message;

    } catch (error) {
      logger.error('Failed to create message:', error);
      throw error;
    }
  }

  /**
   * Gets participants of a thread
   */
  public async getThreadParticipants(threadId: string): Promise<string[]> {
    const thread = this.activeThreads.get(threadId);
    return thread ? thread.participants : [];
  }

  // Private helper methods

  private async generateThreadSuggestions(thread: Thread): Promise<AISuggestion[]> {
    try {
      const suggestions: AISuggestion[] = [];

      // Suggest participants based on thread content
      if (thread.description && thread.description.length > 50) {
        const participantSuggestion = await this.suggestParticipants(thread);
        if (participantSuggestion) {
          suggestions.push(participantSuggestion);
        }
      }

      // Suggest tags based on content
      const tagSuggestion = await this.suggestTags(thread);
      if (tagSuggestion) {
        suggestions.push(tagSuggestion);
      }

      return suggestions;

    } catch (error) {
      logger.error('Failed to generate thread suggestions:', error);
      return [];
    }
  }

  private async suggestParticipants(thread: Thread): Promise<AISuggestion | null> {
    try {
      const prompt = `
        Based on this thread, suggest relevant participants:
        
        Title: ${thread.title}
        Description: ${thread.description}
        Current participants: ${thread.participants.length}
        
        Suggest user roles or expertise areas that would be valuable for this discussion.
        
        Respond with JSON: {"suggestions": ["role1", "role2"], "reasoning": "explanation"}
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 300
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      if (result.suggestions && result.suggestions.length > 0) {
        return {
          id: crypto.randomUUID(),
          type: SuggestionType.PARTICIPANT_INVITE,
          content: JSON.stringify(result),
          confidence: 0.7,
          context: `Thread: ${thread.title}`,
          createdAt: new Date(),
          accepted: false
        };
      }

      return null;

    } catch (error) {
      logger.error('Failed to suggest participants:', error);
      return null;
    }
  }

  private async suggestTags(thread: Thread): Promise<AISuggestion | null> {
    try {
      const content = `${thread.title} ${thread.description || ''}`;
      
      // Simple tag extraction based on keywords
      const commonTags = [
        'urgent', 'development', 'design', 'marketing', 'sales', 'support',
        'bug', 'feature', 'enhancement', 'documentation', 'planning',
        'review', 'approval', 'deadline', 'meeting', 'decision'
      ];

      const suggestedTags = commonTags.filter(tag => 
        content.toLowerCase().includes(tag)
      );

      if (suggestedTags.length > 0) {
        return {
          id: crypto.randomUUID(),
          type: SuggestionType.WORKFLOW_OPTIMIZATION,
          content: JSON.stringify({ tags: suggestedTags }),
          confidence: 0.6,
          context: `Thread: ${thread.title}`,
          createdAt: new Date(),
          accepted: false
        };
      }

      return null;

    } catch (error) {
      logger.error('Failed to suggest tags:', error);
      return null;
    }
  }

  private async analyzeMessage(content: string): Promise<any> {
    // Simple message analysis - could be enhanced with more sophisticated NLP
    return {
      wordCount: content.split(' ').length,
      hasQuestion: content.includes('?'),
      hasActionItem: /\b(todo|task|action|assign|deadline)\b/i.test(content),
      sentiment: 'neutral', // Would use sentiment analysis
      topics: [], // Would extract topics
      urgency: /\b(urgent|asap|immediately|critical)\b/i.test(content) ? 'high' : 'normal'
    };
  }

  private extractMentions(content: string): string[] {
    const mentionPattern = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionPattern.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;
  }

  private async generateMessageSuggestions(message: Message, thread: Thread): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];

    // Suggest action items if message contains task-related content
    if (message.metadata && message.metadata.aiAnalysis?.hasActionItem) {
      suggestions.push({
        id: crypto.randomUUID(),
        type: SuggestionType.ACTION_ITEM,
        content: 'This message appears to contain action items. Create tasks?',
        confidence: 0.8,
        context: message.content.substring(0, 100),
        createdAt: new Date(),
        accepted: false
      });
    }

    // Suggest reminders if message contains deadline information
    if (/\b(deadline|due|by)\b/i.test(message.content)) {
      suggestions.push({
        id: crypto.randomUUID(),
        type: SuggestionType.REMINDER,
        content: 'This message mentions deadlines. Set up reminders?',
        confidence: 0.7,
        context: message.content.substring(0, 100),
        createdAt: new Date(),
        accepted: false
      });
    }

    return suggestions;
  }

  private canAccessSpace(space: Space, userId: string, userPermissions: UserPermissions): boolean {
    // Check if user is a participant
    const participant = space.participants.find(p => p.userId === userId);
    if (participant) {
      return true;
    }

    // Check cross-company access permissions
    if (space.type === SpaceType.CROSS_COMPANY && userPermissions.crossCompanyAccess) {
      return true;
    }

    // Check if space is public
    if (space.type === SpaceType.PUBLIC) {
      return true;
    }

    return false;
  }

  private calculateRelevance(query: string, content: string): number {
    const queryTerms = query.toLowerCase().split(' ');
    const contentLower = content.toLowerCase();
    
    let score = 0;
    for (const term of queryTerms) {
      const occurrences = (contentLower.match(new RegExp(term, 'g')) || []).length;
      score += occurrences;
    }

    // Boost score for exact phrase matches
    if (contentLower.includes(query.toLowerCase())) {
      score += 10;
    }

    return score;
  }

  private async persistSpace(space: Space): Promise<void> {
    try {
      await redisClient.setex(
        `space:${space.id}`,
        3600 * 24 * 30, // 30 days
        JSON.stringify(space)
      );
    } catch (error) {
      logger.error('Failed to persist space:', error);
    }
  }

  private async persistThread(thread: Thread): Promise<void> {
    try {
      await redisClient.setex(
        `thread:${thread.id}`,
        3600 * 24 * 30, // 30 days
        JSON.stringify(thread)
      );
    } catch (error) {
      logger.error('Failed to persist thread:', error);
    }
  }

  private async loadActiveSpaces(): Promise<void> {
    try {
      const keys = await redisClient.keys('space:*');
      
      for (const key of keys) {
        const spaceData = await redisClient.get(key);
        if (spaceData) {
          const space: Space = JSON.parse(spaceData);
          if (!space.isArchived) {
            this.activeSpaces.set(space.id, space);
          }
        }
      }

      logger.info(`Loaded ${this.activeSpaces.size} active spaces`);

    } catch (error) {
      logger.error('Failed to load active spaces:', error);
    }
  }

  private async loadActiveThreads(): Promise<void> {
    try {
      const keys = await redisClient.keys('thread:*');
      
      for (const key of keys) {
        const threadData = await redisClient.get(key);
        if (threadData) {
          const thread: Thread = JSON.parse(threadData);
          if (!thread.isArchived) {
            this.activeThreads.set(thread.id, thread);
          }
        }
      }

      logger.info(`Loaded ${this.activeThreads.size} active threads`);

    } catch (error) {
      logger.error('Failed to load active threads:', error);
    }
  }

  private startAISuggestionEngine(): void {
    // Periodic AI suggestion generation
    setInterval(() => {
      this.generatePeriodicSuggestions();
    }, 3600000); // Every hour
  }

  private async generatePeriodicSuggestions(): Promise<void> {
    logger.debug('Generating periodic AI suggestions');
    // Implementation for periodic suggestion generation
  }

  public getActiveSpaces(): Space[] {
    return Array.from(this.activeSpaces.values());
  }

  public getActiveThreads(): Thread[] {
    return Array.from(this.activeThreads.values());
  }

  public getSpace(spaceId: string): Space | undefined {
    return this.activeSpaces.get(spaceId);
  }

  public getThread(threadId: string): Thread | undefined {
    return this.activeThreads.get(threadId);
  }
}
