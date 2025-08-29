import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { redisClient } from '../cache/redis';
import {
  Reminder,
  ReminderType,
  ReminderContext,
  RecurringConfig,
  ReminderStatus,
  AutomatedAction,
  AutomatedActionType,
  AutomatedActionStatus,
  OverlapDetection,
  OverlapResolution,
  OverlapAlert,
  DirectMessage,
  Duration,
  DurationUnit
} from '../../../shared/src/types/index';
import crypto from 'crypto';
import OpenAI from 'openai';

/**
 * SmartReminderSystem - Context-aware reminders with automation and conflict detection
 */
export class SmartReminderSystem extends EventEmitter {
  private openai: OpenAI;
  private activeReminders: Map<string, Reminder> = new Map();
  private reminderTimers: Map<string, NodeJS.Timeout> = new Map();
  private overlapDetectionEnabled: boolean = true;

  constructor() {
    super();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.initializeReminderSystem();
  }

  private initializeReminderSystem(): void {
    logger.info('Initializing Smart Reminder System');
    this.loadActiveReminders();
    this.startOverlapDetection();
    this.startRecurringReminderProcessor();
  }

  /**
   * Sets a context-aware reminder tied to specific chats and meetings
   */
  public async setContextualReminder(chatId: string, reminderConfig: any): Promise<Reminder> {
    try {
      const reminderId = crypto.randomUUID();
      
      const reminder: Reminder = {
        id: reminderId,
        userId: reminderConfig.userId,
        title: reminderConfig.title,
        description: reminderConfig.description,
        type: reminderConfig.type || ReminderType.CONTEXTUAL,
        context: {
          chatId,
          meetingId: reminderConfig.meetingId,
          threadId: reminderConfig.threadId,
          projectId: reminderConfig.projectId,
          relatedUsers: reminderConfig.relatedUsers || [],
          metadata: reminderConfig.metadata || {}
        },
        triggerTime: new Date(reminderConfig.triggerTime),
        recurring: reminderConfig.recurring || { enabled: false, frequency: 'daily' as any, interval: 1 },
        status: ReminderStatus.SCHEDULED,
        automatedActions: reminderConfig.automatedActions || [],
        overlapDetection: {
          enabled: this.overlapDetectionEnabled,
          conflictingReminders: [],
          resolution: OverlapResolution.NOTIFY
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store reminder
      this.activeReminders.set(reminderId, reminder);
      await this.persistReminder(reminder);

      // Check for overlaps
      if (this.overlapDetectionEnabled) {
        await this.detectReminderOverlaps(reminder.userId || '', reminder);
      }

      // Schedule reminder
      await this.scheduleReminder(reminder);

      logger.info(`Contextual reminder created: ${reminderId}`, {
        userId: reminder.userId,
        type: reminder.type,
        triggerTime: reminder.triggerTime,
        chatId
      });

      this.emit('reminder-created', { reminder, chatId });

      return reminder;

    } catch (error) {
      logger.error('Failed to set contextual reminder:', error);
      throw error;
    }
  }

  /**
   * Schedules automated messages with duration-based triggers
   */
  public async scheduleAutoMessage(
    message: string, 
    delay: Duration, 
    recipients: string[], 
    context?: any
  ): Promise<AutomatedAction> {
    try {
      const actionId = crypto.randomUUID();
      const triggerTime = new Date(Date.now() + this.durationToMilliseconds(delay));

      const automatedAction: AutomatedAction = {
        id: actionId,
        type: AutomatedActionType.SEND_MESSAGE,
        config: {
          recipients,
          message,
          duration: delay,
          metadata: context || {}
        },
        status: AutomatedActionStatus.PENDING
      };

      // Create a reminder to trigger the automated action
      const reminder: Reminder = {
        id: crypto.randomUUID(),
        userId: context?.userId || 'system',
        title: 'Automated Message',
        description: `Send message: "${message.substring(0, 50)}..."`,
        type: ReminderType.CONTEXTUAL,
        context: {
          relatedUsers: recipients,
          metadata: { automatedMessage: true, ...context }
        },
        triggerTime,
        recurring: { enabled: false, frequency: 'daily' as any, interval: 1 },
        status: ReminderStatus.SCHEDULED,
        automatedActions: [automatedAction],
        overlapDetection: {
          enabled: false,
          conflictingReminders: [],
          resolution: OverlapResolution.NOTIFY
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store and schedule
      this.activeReminders.set(reminder.id || '', reminder);
      await this.persistReminder(reminder);
      await this.scheduleReminder(reminder);

      logger.info(`Auto message scheduled: ${actionId}`, {
        delay: `${delay.value} ${delay.unit}`,
        recipients: recipients.length,
        triggerTime
      });

      return automatedAction;

    } catch (error) {
      logger.error('Failed to schedule auto message:', error);
      throw error;
    }
  }

  /**
   * Detects overlapping reminders and resolves conflicts
   */
  public async detectReminderOverlaps(userId: string, newReminder?: Reminder): Promise<OverlapAlert[]> {
    try {
      const userReminders = Array.from(this.activeReminders.values())
        .filter(r => r.userId === userId && r.status === ReminderStatus.SCHEDULED);

      const overlaps: OverlapAlert[] = [];

      if (newReminder) {
        // Check new reminder against existing ones
        const timeWindow = 30 * 60 * 1000; // 30 minutes
        const conflicting = userReminders.filter(existing => {
          let timeDiff;
          if(existing.triggerTime && newReminder.triggerTime) 
          {
             timeDiff = Math.abs(existing.triggerTime.getTime() - newReminder.triggerTime.getTime()) ;
          }else{
            timeDiff=0
          }
          return timeDiff < timeWindow && existing.id !== newReminder.id;
        });

        if (conflicting.length > 0) {
          const overlap: OverlapAlert = {
            reminderId: newReminder.id,
            conflictingReminderIds: conflicting.map(r => r.id).filter((id): id is string => id !== undefined),
            description: `${conflicting.length} reminders scheduled within 30 minutes`,
            suggestedResolution: this.suggestOverlapResolution(newReminder, conflicting)
          };

          overlaps.push(overlap);

          // Update reminder with overlap information
          if(newReminder.overlapDetection){
            newReminder.overlapDetection.conflictingReminders = conflicting.map(r => r.id).filter((id): id is string => id !== undefined);
          }
          // Handle overlap based on resolution strategy
          await this.handleOverlapResolution(overlap, newReminder);
        }
      }

      return overlaps;

    } catch (error) {
      logger.error('Failed to detect reminder overlaps:', error);
      return [];
    }
  }

  /**
   * Suggests reminders based on conversation content using AI
   */
  public async suggestReminders(conversationContext: string, userId: string): Promise<Reminder[]> {
    try {
      const prompt = `
        Analyze this conversation and suggest relevant reminders:
        
        ${conversationContext}
        
        Look for:
        1. Action items with deadlines
        2. Follow-up meetings
        3. Tasks mentioned
        4. Important dates
        5. Commitments made
        
        For each suggestion, provide:
        - Title (brief)
        - Description (detailed)
        - Suggested time (relative to now)
        - Priority (low/medium/high)
        - Type (meeting/task/deadline/follow_up)
        
        Respond with JSON array of reminder suggestions.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000
      });

      const suggestions = JSON.parse(response.choices[0].message.content || '[]');
      const reminders: Reminder[] = [];

      for (const suggestion of suggestions) {
        const triggerTime = this.parseRelativeTime(suggestion.suggestedTime);
        
        if (triggerTime) {
          const reminder: Reminder = {
            id: crypto.randomUUID(),
            userId,
            title: suggestion.title,
            description: suggestion.description,
            type: this.mapSuggestionType(suggestion.type),
            context: {
              relatedUsers: [],
              metadata: { 
                aiSuggested: true, 
                priority: suggestion.priority,
                originalContext: conversationContext.substring(0, 200)
              }
            },
            triggerTime,
            recurring: { enabled: false, frequency: 'daily' as any, interval: 1 },
            status: ReminderStatus.SCHEDULED,
            automatedActions: [],
            overlapDetection: {
              enabled: true,
              conflictingReminders: [],
              resolution: OverlapResolution.NOTIFY
            },
            createdAt: new Date(),
            updatedAt: new Date()
          };

          reminders.push(reminder);
        }
      }

      logger.info(`AI suggested ${reminders.length} reminders for user ${userId}`, {
        conversationLength: conversationContext.length
      });

      return reminders;

    } catch (error) {
      logger.error('Failed to suggest reminders:', error);
      return [];
    }
  }

  /**
   * Sends direct message to resolve reminder conflicts
   */
  public async sendDirectMessage(overlapAlert: OverlapAlert, message: string, userId: string): Promise<void> {
    try {
      const directMessage: DirectMessage = {
        recipientId: userId,
        message,
        sentAt: new Date(),
        acknowledged: false
      };

      // Store direct message
      await redisClient.setex(
        `direct-message:${crypto.randomUUID()}`,
        3600 * 24, // 24 hours
        JSON.stringify(directMessage)
      );

      // Emit event for real-time delivery
      this.emit('direct-message', {
        userId,
        message: directMessage,
        overlapAlert
      });

      logger.info(`Direct message sent to resolve overlap: ${overlapAlert.reminderId}`, {
        userId,
        conflictCount: overlapAlert.conflictingReminderIds && overlapAlert.conflictingReminderIds.length
      });

    } catch (error) {
      logger.error('Failed to send direct message:', error);
    }
  }

  /**
   * Creates a reminder from user input
   */
  public async createReminder(userId: string, reminderData: any): Promise<Reminder> {
    const reminder: Reminder = {
      id: crypto.randomUUID(),
      userId,
      title: reminderData.title,
      description: reminderData.description,
      type: reminderData.type || ReminderType.TASK,
      context: {
        relatedUsers: reminderData.relatedUsers || [],
        metadata: reminderData.metadata || {}
      },
      triggerTime: new Date(reminderData.triggerTime),
      recurring: reminderData.recurring || { enabled: false, frequency: 'daily' as any, interval: 1 },
      status: ReminderStatus.SCHEDULED,
      automatedActions: reminderData.automatedActions || [],
      overlapDetection: {
        enabled: true,
        conflictingReminders: [],
        resolution: OverlapResolution.NOTIFY
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.activeReminders.set(reminder.id || '', reminder);
    await this.persistReminder(reminder);
    await this.scheduleReminder(reminder);
    
    // Check for overlaps
    await this.detectReminderOverlaps(userId, reminder);

    return reminder;
  }

  // Private helper methods

  private async scheduleReminder(reminder: Reminder): Promise<void> {
    const delay = reminder.triggerTime && reminder.triggerTime.getTime() - Date.now();
    
    if (delay && delay <= 0) {
      // Trigger immediately if time has passed
      await this.triggerReminder(reminder);
      return;
    }

    const timer = setTimeout(async () => {
      await this.triggerReminder(reminder);
    }, delay);

    this.reminderTimers.set(reminder.id || '', timer);
  }

  private async triggerReminder(reminder: Reminder): Promise<void> {
    try {
      reminder.status = ReminderStatus.TRIGGERED;
      reminder.updatedAt = new Date();

      // Execute automated actions
      for (const action of (reminder.automatedActions || [])) {
        await this.executeAutomatedAction(action, reminder);
      }

      // Emit reminder event
      this.emit('reminder-triggered', {
        reminder,
        userId: reminder.userId,
        timestamp: new Date()
      });

      // Handle recurring reminders
      if (reminder.recurring && reminder.recurring.enabled) {
        await this.scheduleRecurringReminder(reminder);
      } else {
        reminder.status = ReminderStatus.COMPLETED;
        this.activeReminders.delete(reminder.id || '');
      }

      // Clean up timer
      this.reminderTimers.delete(reminder.id || '');

      logger.info(`Reminder triggered: ${reminder.id}`, {
        userId: reminder.userId,
        type: reminder.type,
        title: reminder.title
      });

    } catch (error) {
      logger.error('Failed to trigger reminder:', error);
      reminder.status = ReminderStatus.CANCELLED;
    }

    await this.persistReminder(reminder);
  }

  private async executeAutomatedAction(action: AutomatedAction, reminder: Reminder): Promise<void> {
    try {
      action.status = AutomatedActionStatus.EXECUTING;
      action.executedAt = new Date();

      switch (action.type) {
        case AutomatedActionType.SEND_MESSAGE:
          await this.executeSendMessage(action, reminder);
          break;
        case AutomatedActionType.CREATE_MEETING:
          await this.executeCreateMeeting(action, reminder);
          break;
        case AutomatedActionType.ASSIGN_TASK:
          await this.executeAssignTask(action, reminder);
          break;
        case AutomatedActionType.SEND_EMAIL:
          await this.executeSendEmail(action, reminder);
          break;
        case AutomatedActionType.UPDATE_STATUS:
          await this.executeUpdateStatus(action, reminder);
          break;
      }

      action.status = AutomatedActionStatus.COMPLETED;
      action.result = 'Success';

    } catch (error) {
      action.status = AutomatedActionStatus.FAILED;
      action.result = (error as Error).message;
      logger.error('Failed to execute automated action:', error);
    }
  }

  private async executeSendMessage(action: AutomatedAction, reminder: Reminder): Promise<void> {
    const { recipients, message } = action.config;
    
    for (const recipientId of recipients || []) {
      this.emit('automated-message', {
        recipientId,
        message,
        reminderId: reminder.id,
        context: reminder.context
      });
    }
  }

  private async executeCreateMeeting(action: AutomatedAction, reminder: Reminder): Promise<void> {
    // Implementation would create a meeting
    this.emit('automated-meeting-creation', {
      config: action.config,
      reminderId: reminder.id,
      context: reminder.context
    });
  }

  private async executeAssignTask(action: AutomatedAction, reminder: Reminder): Promise<void> {
    // Implementation would assign a task
    this.emit('automated-task-assignment', {
      config: action.config,
      reminderId: reminder.id,
      context: reminder.context
    });
  }

  private async executeSendEmail(action: AutomatedAction, reminder: Reminder): Promise<void> {
    // Implementation would send email
    this.emit('automated-email', {
      config: action.config,
      reminderId: reminder.id,
      context: reminder.context
    });
  }

  private async executeUpdateStatus(action: AutomatedAction, reminder: Reminder): Promise<void> {
    // Implementation would update status
    this.emit('automated-status-update', {
      config: action.config,
      reminderId: reminder.id,
      context: reminder.context
    });
  }

  private async scheduleRecurringReminder(reminder: Reminder): Promise<void> {
    const nextTriggerTime = this.calculateNextRecurrence(reminder);
    
    if (nextTriggerTime) {
      const newReminder: Reminder = {
        ...reminder,
        id: crypto.randomUUID(),
        triggerTime: nextTriggerTime,
        status: ReminderStatus.SCHEDULED,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.activeReminders.set(newReminder.id || '', newReminder);
      await this.persistReminder(newReminder);
      await this.scheduleReminder(newReminder);
    }
  }

  private calculateNextRecurrence(reminder: Reminder): Date | null {
    const { recurring } = reminder;
    if (recurring && !recurring.enabled) return null;

    if (!reminder.triggerTime) return null;
    const current = reminder.triggerTime;
    const next = new Date(current);

    switch (recurring && recurring.frequency) {
      case 'daily':
        recurring && next.setDate(next.getDate() + recurring.interval);
        break;
      case 'weekly':
        recurring && next.setDate(next.getDate() + (7 * recurring.interval));
        break;
      case 'monthly':
        recurring && next.setMonth(next.getMonth() + recurring.interval);
        break;
      case 'yearly':
        recurring && next.setFullYear(next.getFullYear() + recurring.interval);
        break;
    }

    // Check if end date has been reached
    if (recurring && recurring.endDate && next > recurring.endDate) {
      return null;
    }

    return next;
  }

  private durationToMilliseconds(duration: Duration): number {
    const multipliers = {
      [DurationUnit.MINUTES]: 60 * 1000,
      [DurationUnit.HOURS]: 60 * 60 * 1000,
      [DurationUnit.DAYS]: 24 * 60 * 60 * 1000,
      [DurationUnit.WEEKS]: 7 * 24 * 60 * 60 * 1000
    };

    return duration.value * multipliers[duration.unit];
  }

  private parseRelativeTime(timeString: string): Date | null {
    const now = new Date();
    
    // Simple parsing - could be enhanced with a library like chrono-node
    const patterns = [
      { pattern: /in (\d+) minutes?/i, unit: 'minutes' },
      { pattern: /in (\d+) hours?/i, unit: 'hours' },
      { pattern: /in (\d+) days?/i, unit: 'days' },
      { pattern: /tomorrow/i, value: 1, unit: 'days' },
      { pattern: /next week/i, value: 7, unit: 'days' }
    ];

    for (const { pattern, unit, value } of patterns) {
      const match = timeString.match(pattern);
      if (match) {
        const amount = value || parseInt(match[1]);
        const result = new Date(now);
        
        switch (unit) {
          case 'minutes':
            result.setMinutes(result.getMinutes() + amount);
            break;
          case 'hours':
            result.setHours(result.getHours() + amount);
            break;
          case 'days':
            result.setDate(result.getDate() + amount);
            break;
        }
        
        return result;
      }
    }

    return null;
  }

  private mapSuggestionType(typeString: string): ReminderType {
    switch (typeString?.toLowerCase()) {
      case 'meeting': return ReminderType.MEETING;
      case 'task': return ReminderType.TASK;
      case 'deadline': return ReminderType.DEADLINE;
      case 'follow_up': return ReminderType.FOLLOW_UP;
      default: return ReminderType.CONTEXTUAL;
    }
  }

  private suggestOverlapResolution(newReminder: Reminder, conflicting: Reminder[]): OverlapResolution {
    // Simple logic - could be enhanced with ML
    if (conflicting.length > 2) {
      return OverlapResolution.MERGE;
    } else if (newReminder.type === ReminderType.DEADLINE) {
      return OverlapResolution.PRIORITIZE;
    } else {
      return OverlapResolution.NOTIFY;
    }
  }

  private async handleOverlapResolution(overlap: OverlapAlert, reminder: Reminder): Promise<void> {
    switch (overlap.suggestedResolution) {
      case OverlapResolution.NOTIFY:
        await this.sendDirectMessage(
          overlap,
          `You have ${(overlap.conflictingReminderIds || []).length} reminders scheduled within 30 minutes. Consider rescheduling some.`,
          reminder.userId || ''
        );
        break;
      case OverlapResolution.MERGE:
        // Implementation for merging reminders
        break;
      case OverlapResolution.PRIORITIZE:
        // Implementation for prioritizing reminders
        break;
      case OverlapResolution.CANCEL:
        reminder.status = ReminderStatus.CANCELLED;
        break;
    }
  }

  private async persistReminder(reminder: Reminder): Promise<void> {
    try {
      await redisClient.setex(
        `reminder:${reminder.id}`,
        3600 * 24 * 30, // 30 days
        JSON.stringify(reminder)
      );
    } catch (error) {
      logger.error('Failed to persist reminder:', error);
    }
  }

  private async loadActiveReminders(): Promise<void> {
    try {
      const keys = await redisClient.keys('reminder:*');
      
      for (const key of keys) {
        const reminderData = await redisClient.get(key);
        if (reminderData) {
          const reminder: Reminder = JSON.parse(reminderData);
          if (reminder.status === ReminderStatus.SCHEDULED) {
            this.activeReminders.set(reminder.id || '', reminder);
            await this.scheduleReminder(reminder);
          }
        }
      }

      logger.info(`Loaded ${this.activeReminders.size} active reminders`);

    } catch (error) {
      logger.error('Failed to load active reminders:', error);
    }
  }

  private startOverlapDetection(): void {
    // Periodic overlap detection for all users
    setInterval(() => {
      this.performOverlapDetectionScan();
    }, 300000); // Every 5 minutes
  }

  private startRecurringReminderProcessor(): void {
    // Process recurring reminders
    setInterval(() => {
      this.processRecurringReminders();
    }, 60000); // Every minute
  }

  private async performOverlapDetectionScan(): Promise<void> {
    // Implementation for periodic overlap detection
    logger.debug('Performing overlap detection scan');
  }

  private async processRecurringReminders(): Promise<void> {
    // Implementation for processing recurring reminders
    logger.debug('Processing recurring reminders');
  }

  public getActiveReminders(): Reminder[] {
    return Array.from(this.activeReminders.values());
  }

  public getUserReminders(userId: string): Reminder[] {
    return Array.from(this.activeReminders.values())
      .filter(reminder => reminder.userId === userId);
  }
}
