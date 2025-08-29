import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../providers/SocketProvider';
import { useAppDispatch, useAppSelector } from './redux';
import { addNotification } from '../store/slices/notificationsSlice';
import {
  ReminderConfig,
  Duration,
  OverlapAlert,
  Reminder,
  ContextAwareReminder
} from '../../../shared/src/types/index';

interface SmartRemindersHook {
  reminders: Reminder[];
  activeReminders: Reminder[];
  overlapAlerts: OverlapAlert[];
  
  // Reminder management
  createReminder: (config: ReminderConfig) => Promise<string | null>;
  updateReminder: (id: string, updates: Partial<ReminderConfig>) => Promise<boolean>;
  deleteReminder: (id: string) => Promise<boolean>;
  snoozeReminder: (id: string, duration: Duration) => Promise<boolean>;
  
  // Context-aware features
  createContextReminder: (
    content: string,
    context: { chatId?: string; meetingId?: string; threadId?: string }
  ) => Promise<string | null>;
  
  // Smart scheduling
  findOptimalTime: (duration: Duration, preferences?: any) => Promise<Date[]>;
  detectConflicts: (reminderConfig: ReminderConfig) => Promise<OverlapAlert[]>;
  
  // Automation
  enableAutoScheduling: (enabled: boolean) => void;
  setConflictDetection: (enabled: boolean) => void;
  
  // AI-powered suggestions
  getSuggestedReminders: () => Promise<ContextAwareReminder[]>;
  optimizeReminderTiming: (reminderId: string) => Promise<Date | null>;
}

export const useSmartReminders = (): SmartRemindersHook => {
  const dispatch = useAppDispatch();
  const { socket, emit, on, off } = useSocket();
  const { user } = useAppSelector((state) => state.auth);

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activeReminders, setActiveReminders] = useState<Reminder[]>([]);
  const [overlapAlerts, setOverlapAlerts] = useState<OverlapAlert[]>([]);
  const [autoSchedulingEnabled, setAutoSchedulingEnabled] = useState(true);
  const [conflictDetectionEnabled, setConflictDetectionEnabled] = useState(true);

  const reminderCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize reminders system
  useEffect(() => {
    if (user?.id && socket) {
      loadUserReminders();
      startReminderMonitoring();
    }

    return () => {
      if (reminderCheckInterval.current) {
        clearInterval(reminderCheckInterval.current);
      }
    };
  }, [user?.id, socket]);

  const loadUserReminders = useCallback(async () => {
    try {
      emit('get-user-reminders', { userId: user?.id });
    } catch (error) {
      console.error('Failed to load reminders:', error);
    }
  }, [user?.id, emit]);

  const startReminderMonitoring = useCallback(() => {
    // Check for due reminders every minute
    reminderCheckInterval.current = setInterval(() => {
      checkDueReminders();
    }, 60000);
  }, []);

  const checkDueReminders = useCallback(() => {
    const now = new Date();
    const dueReminders = reminders.filter(reminder => {
      if (!reminder.triggerTime) return false; // skip invalid
      const reminderTime = new Date(reminder.triggerTime);
      return reminderTime <= now && !reminder.triggered && reminder.isActive;
    });

    dueReminders.forEach(reminder => {
      triggerReminder(reminder);
    });
  }, [reminders]);

  const triggerReminder = useCallback((reminder: Reminder) => {
    // Mark as triggered
    setReminders(prev => prev.map(r => 
      r.id === reminder.id ? { ...r, triggered: true } : r
    ));

    // Show notification
    dispatch(addNotification({
      type: 'info',
      title: 'Reminder',
      message: reminder.content,
      persistent: true,
      action: reminder.autoScheduled ? {
        label: 'Reschedule',
        callback: () => autoRescheduleReminder(reminder.id?reminder.id:'')
      } : undefined
    }));

    // Send to server for tracking
    emit('reminder-triggered', {
      reminderId: reminder.id,
      userId: user?.id,
      timestamp: new Date()
    });

    // Handle context-specific actions
    if (reminder.context?.meetingId) {
      dispatch(addNotification({
        type: 'info',
        title: 'Meeting Reminder',
        message: `Meeting "${reminder.context.meetingId}" starts soon`,
        action: {
          label: 'Join Meeting',
          callback: () => { window.location.href = `/meeting/${reminder.context!.meetingId}`; }
        }
      }));
    }
  }, [user?.id, emit, dispatch]);

  const createReminder = useCallback(async (config: ReminderConfig): Promise<string | null> => {
    try {
      if (!user?.id) throw new Error('User not authenticated');

      // Check for conflicts if enabled
      let conflicts: OverlapAlert[] = [];
      if (conflictDetectionEnabled) {
        conflicts = await detectConflicts(config);
        if (conflicts.length > 0) {
          setOverlapAlerts(prev => [...prev, ...conflicts]);
        }
      }

      const reminderId = `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const reminderData = {
        id: reminderId,
        ...config,
        userId: user.id,
        createdAt: new Date(),
        triggered: false,
        isActive: true,
        conflicts
      };

      emit('create-reminder', reminderData);

      // Optimistically add to state
      setReminders(prev => [...prev, reminderData as Reminder]);

      dispatch(addNotification({
        type: 'success',
        title: 'Reminder Created',
        message: `Reminder set for ${new Date(config.triggerTime).toLocaleString()}`
      }));

      return reminderId;
    } catch (error) {
      console.error('Failed to create reminder:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Create Failed',
        message: 'Failed to create reminder'
      }));
      return null;
    }
  }, [user?.id, conflictDetectionEnabled, emit, dispatch]);

  const updateReminder = useCallback(async (
    id: string, 
    updates: Partial<ReminderConfig>
  ): Promise<boolean> => {
    try {
      emit('update-reminder', {
        reminderId: id,
        updates,
        updatedBy: user?.id
      });

      // Update local state
      setReminders(prev =>
        prev.map(r =>
          r.id === id ? { ...r, ...updates } as Reminder : r
        )
      );

      return true;
    } catch (error) {
      console.error('Failed to update reminder:', error);
      return false;
    }
  }, [user?.id, emit]);

  const deleteReminder = useCallback(async (id: string): Promise<boolean> => {
    try {
      emit('delete-reminder', {
        reminderId: id,
        deletedBy: user?.id
      });

      // Remove from local state
      setReminders(prev => prev.filter(r => r.id !== id));

      dispatch(addNotification({
        type: 'info',
        title: 'Reminder Deleted',
        message: 'Reminder has been removed'
      }));

      return true;
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      return false;
    }
  }, [user?.id, emit, dispatch]);

  const snoozeReminder = useCallback(async (id: string, duration: Duration): Promise<boolean> => {
    try {
      const reminder = reminders.find(r => r.id === id);
      if (!reminder) return false;

      const newTriggerTime = new Date(Date.now() + duration.value * getDurationMultiplier(duration.unit));
      
      await updateReminder(id, {
        triggerTime: newTriggerTime,
        triggered: false
      });

      dispatch(addNotification({
        type: 'info',
        title: 'Reminder Snoozed',
        message: `Reminder snoozed for ${duration.value} ${duration.unit}`
      }));

      return true;
    } catch (error) {
      console.error('Failed to snooze reminder:', error);
      return false;
    }
  }, [reminders, updateReminder, dispatch]);

  const createContextReminder = useCallback(async (
    content: string,
    context: { chatId?: string; meetingId?: string; threadId?: string }
  ): Promise<string | null> => {
    try {
      // AI-powered context analysis to suggest optimal reminder time
      const suggestedTime = await analyzeContextForTiming(content, context);
      
      const config: ReminderConfig = {
        content,
        triggerTime: suggestedTime,
        context,
        autoScheduled: true,
        smartReschedule: true,
        priority: 'medium'
      };

      return await createReminder(config);
    } catch (error) {
      console.error('Failed to create context reminder:', error);
      return null;
    }
  }, [createReminder]);

  const findOptimalTime = useCallback(async (
    duration: Duration, 
    preferences?: any
  ): Promise<Date[]> => {
    try {
      const response = await new Promise<Date[]>((resolve) => {
        emit('find-optimal-time', {
          userId: user?.id,
          duration,
          preferences,
          existingReminders: reminders
        });

        const handler = (data: { userId: string; optimalTimes: string[] }) => {
          if (data.userId === user?.id) {
            off('optimal-times-found', handler);
            resolve(data.optimalTimes.map(time => new Date(time)));
          }
        };
        on('optimal-times-found', handler);
      });

      return response;
    } catch (error) {
      console.error('Failed to find optimal time:', error);
      return [];
    }
  }, [user?.id, reminders, emit, on, off]);

  const detectConflicts = useCallback(async (reminderConfig: ReminderConfig): Promise<OverlapAlert[]> => {
    try {
      const conflicts: OverlapAlert[] = [];
      const reminderTime = new Date(reminderConfig.triggerTime);

      // Check against existing reminders
      reminders.forEach(existing => {
        if (!existing.triggerTime) return; // skip
        const existingTime = new Date(existing.triggerTime);
        const timeDiff = Math.abs(existingTime.getTime() - reminderTime.getTime());
        
        // If within 15 minutes
        if (timeDiff < 15 * 60 * 1000) {
          conflicts.push({
            type: 'reminder_overlap',
            reminderIds: [existing.id],
            conflictTime: reminderTime,
            severity: 'medium',
            suggestion: 'Consider spacing reminders at least 15 minutes apart'
          });
        }
      });

      // Check against calendar events (if integrated)
      // TODO: Implement calendar integration

      return conflicts;
    } catch (error) {
      console.error('Failed to detect conflicts:', error);
      return [];
    }
  }, [reminders]);

  const enableAutoScheduling = useCallback((enabled: boolean) => {
    setAutoSchedulingEnabled(enabled);
    emit('update-reminder-settings', {
      userId: user?.id,
      autoScheduling: enabled
    });
  }, [user?.id, emit]);

  const setConflictDetection = useCallback((enabled: boolean) => {
    setConflictDetectionEnabled(enabled);
    emit('update-reminder-settings', {
      userId: user?.id,
      conflictDetection: enabled
    });
  }, [user?.id, emit]);

  const getSuggestedReminders = useCallback(async (): Promise<ContextAwareReminder[]> => {
    try {
      const response = await new Promise<ContextAwareReminder[]>((resolve) => {
        emit('get-suggested-reminders', { userId: user?.id });
        
        const handler = (data: { userId: string; suggestions: ContextAwareReminder[] }) => {
          if (data.userId === user?.id) {
            off('reminder-suggestions', handler);
            resolve(data.suggestions);
          }
        };
        on('reminder-suggestions', handler);
      });

      return response;
    } catch (error) {
      console.error('Failed to get suggested reminders:', error);
      return [];
    }
  }, [user?.id, emit, on, off]);

  const optimizeReminderTiming = useCallback(async (reminderId: string): Promise<Date | null> => {
    try {
      const response = await new Promise<Date | null>((resolve) => {
        emit('optimize-reminder-timing', { reminderId, userId: user?.id });
        
        const handler = (data: { reminderId: string; optimizedTime: string | null }) => {
          if (data.reminderId === reminderId) {
            off('reminder-timing-optimized', handler);
            resolve(data.optimizedTime ? new Date(data.optimizedTime) : null);
          }
        };
        on('reminder-timing-optimized', handler);
      });

      if (response) {
        await updateReminder(reminderId, { triggerTime: response });
      }

      return response;
    } catch (error) {
      console.error('Failed to optimize reminder timing:', error);
      return null;
    }
  }, [user?.id, emit, on, off, updateReminder]);

  const autoRescheduleReminder = useCallback(async (reminderId: string) => {
    const optimizedTime = await optimizeReminderTiming(reminderId);
    if (optimizedTime) {
      dispatch(addNotification({
        type: 'success',
        title: 'Reminder Rescheduled',
        message: `Reminder moved to optimal time: ${optimizedTime.toLocaleString()}`
      }));
    }
  }, [optimizeReminderTiming, dispatch]);

  // Helper functions
  const analyzeContextForTiming = async (
    content: string, 
    context: any
  ): Promise<Date> => {
    // AI analysis would go here
    // For now, return a simple heuristic
    const now = new Date();
    
    // If it's about a meeting, suggest 15 minutes before
    if (context.meetingId) {
      return new Date(now.getTime() + 15 * 60 * 1000);
    }
    
    // Default to 1 hour from now
    return new Date(now.getTime() + 60 * 60 * 1000);
  };

  const getDurationMultiplier = (unit: string): number => {
    switch (unit) {
      case 'minutes': return 60 * 1000;
      case 'hours': return 60 * 60 * 1000;
      case 'days': return 24 * 60 * 60 * 1000;
      case 'weeks': return 7 * 24 * 60 * 60 * 1000;
      default: return 60 * 1000;
    }
  };

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleRemindersLoaded = (data: { reminders: Reminder[] }) => {
      setReminders(data.reminders);
    };

    const handleReminderCreated = (data: { reminder: Reminder }) => {
      setReminders(prev => [...prev, data.reminder]);
    };

    const handleOverlapDetected = (data: { alert: OverlapAlert }) => {
      setOverlapAlerts(prev => [...prev, data.alert]);
      
      dispatch(addNotification({
        type: 'warning',
        title: 'Schedule Conflict',
        message: data.alert.suggestion || 'Potential scheduling conflict detected'
      }));
    };

    on('reminders-loaded', handleRemindersLoaded);
    on('reminder-created', handleReminderCreated);
    on('overlap-detected', handleOverlapDetected);

    return () => {
      off('reminders-loaded', handleRemindersLoaded);
      off('reminder-created', handleReminderCreated);
      off('overlap-detected', handleOverlapDetected);
    };
  }, [socket, on, off, dispatch]);

  return {
    reminders,
    activeReminders: reminders.filter(r => r.isActive && !r.triggered),
    overlapAlerts,
    
    // Reminder management
    createReminder,
    updateReminder,
    deleteReminder,
    snoozeReminder,
    
    // Context-aware features
    createContextReminder,
    
    // Smart scheduling
    findOptimalTime,
    detectConflicts,
    
    // Automation
    enableAutoScheduling,
    setConflictDetection,
    
    // AI-powered suggestions
    getSuggestedReminders,
    optimizeReminderTiming
  };
};
