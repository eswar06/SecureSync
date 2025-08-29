import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../providers/SocketProvider';
import { useAppDispatch, useAppSelector } from './redux';
import {
  setSpaces,
  setCurrentSpace,
  addThread,
  updateThread,
  setMessages,
  addMessage,
  updateSpaceParticipants
} from '../store/slices/spacesSlice';
import { addNotification } from '../store/slices/notificationsSlice';
import {
  Space,
  Thread,
  Message,
  SpaceConfig,
  ThreadCreationData,
  SpacePermissions
} from '../../../shared/src/types/index';

interface SpacesHookReturn {
  spaces: Space[];
  currentSpace: Space | null;
  currentThreads: Thread[];
  currentMessages: Message[];
  isLoading: boolean;
  
  // Space management
  createSpace: (config: SpaceConfig) => Promise<boolean>;
  joinSpace: (spaceId: string, accessCode?: string) => Promise<boolean>;
  leaveSpace: (spaceId: string) => Promise<boolean>;
  updateSpaceConfig: (spaceId: string, config: Partial<SpaceConfig>) => Promise<boolean>;
  
  // Thread management
  createThread: (data: ThreadCreationData) => Promise<string | null>;
  archiveThread: (threadId: string) => Promise<boolean>;
  pinThread: (threadId: string) => Promise<boolean>;
  
  // Messaging
  sendMessage: (threadId: string, content: string, attachments?: File[]) => Promise<boolean>;
  editMessage: (messageId: string, content: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  reactToMessage: (messageId: string, reaction: string) => Promise<boolean>;
  
  // Search and organization
  searchSpaces: (query: string) => Space[];
  searchThreads: (query: string) => Thread[];
  searchMessages: (query: string) => Message[];
  
  // AI-powered features
  generateThreadSummary: (threadId: string) => Promise<string | null>;
  extractActionItems: (threadId: string) => Promise<any[]>;
  suggestRelatedThreads: (threadId: string) => Promise<Thread[]>;
}

export const useSpaces = (): SpacesHookReturn => {
  const dispatch = useAppDispatch();
  const { socket, emit, on, off } = useSocket();
  const { user } = useAppSelector((state) => state.auth);
  const {
    spaces,
    currentSpace,
    threads,
    messages,
    currentSpaceId,
    currentThreadId
  } = useAppSelector((state) => state.spaces);

  const [isLoading, setIsLoading] = useState(false);
  const searchCache = useRef<Map<string, any[]>>(new Map());

  // Get current threads for the active space
  const currentThreads = threads.filter(thread => 
    thread.spaceId === currentSpaceId
  );

  // Get current messages for the active thread
  const currentMessages = messages.filter(message => 
    message.threadId === currentThreadId
  );

  // Initialize spaces data
  useEffect(() => {
    if (user?.id && socket) {
      loadUserSpaces();
    }
  }, [user?.id, socket]);

  const loadUserSpaces = useCallback(async () => {
    setIsLoading(true);
    try {
      emit('get-user-spaces', { userId: user?.id });
    } catch (error) {
      console.error('Failed to load spaces:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Load Error',
        message: 'Failed to load your spaces'
      }));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, emit, dispatch]);

  // Create new space
  const createSpace = useCallback(async (config: SpaceConfig): Promise<boolean> => {
    try {
      if (!user?.id) throw new Error('User not authenticated');

      emit('create-space', {
        ...config,
        createdBy: user.id,
        createdAt: new Date()
      });

      dispatch(addNotification({
        type: 'info',
        title: 'Creating Space',
        message: `Creating space "${config.name}"...`
      }));

      return true;
    } catch (error) {
      console.error('Failed to create space:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Create Failed',
        message: 'Failed to create space'
      }));
      return false;
    }
  }, [user?.id, emit, dispatch]);

  // Join space
  const joinSpace = useCallback(async (spaceId: string, accessCode?: string): Promise<boolean> => {
    try {
      if (!user?.id) throw new Error('User not authenticated');

      emit('join-space', {
        spaceId,
        userId: user.id,
        accessCode
      });

      dispatch(addNotification({
        type: 'info',
        title: 'Joining Space',
        message: 'Joining space...'
      }));

      return true;
    } catch (error) {
      console.error('Failed to join space:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Join Failed',
        message: 'Failed to join space'
      }));
      return false;
    }
  }, [user?.id, emit, dispatch]);

  // Leave space
  const leaveSpace = useCallback(async (spaceId: string): Promise<boolean> => {
    try {
      if (!user?.id) throw new Error('User not authenticated');

      emit('leave-space', {
        spaceId,
        userId: user.id
      });

      // Clear current space if it's the one being left
      if (currentSpaceId === spaceId) {
        dispatch(setCurrentSpace(null));
      }

      return true;
    } catch (error) {
      console.error('Failed to leave space:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Leave Failed',
        message: 'Failed to leave space'
      }));
      return false;
    }
  }, [user?.id, currentSpaceId, emit, dispatch]);

  // Update space configuration
  const updateSpaceConfig = useCallback(async (
    spaceId: string, 
    config: Partial<SpaceConfig>
  ): Promise<boolean> => {
    try {
      emit('update-space-config', {
        spaceId,
        config,
        updatedBy: user?.id
      });

      return true;
    } catch (error) {
      console.error('Failed to update space config:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update space settings'
      }));
      return false;
    }
  }, [user?.id, emit, dispatch]);

  // Create thread with AI organization
  const createThread = useCallback(async (data: ThreadCreationData): Promise<string | null> => {
    try {
      if (!user?.id || !currentSpaceId) throw new Error('Invalid state');

      const threadData = {
        ...data,
        spaceId: currentSpaceId,
        createdBy: user.id,
        createdAt: new Date(),
        id: `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      emit('create-thread', threadData);

      dispatch(addNotification({
        type: 'info',
        title: 'Creating Thread',
        message: `Creating thread "${data.title}"...`
      }));

      return threadData.id;
    } catch (error) {
      console.error('Failed to create thread:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Create Failed',
        message: 'Failed to create thread'
      }));
      return null;
    }
  }, [user?.id, currentSpaceId, emit, dispatch]);

  // Archive thread
  const archiveThread = useCallback(async (threadId: string): Promise<boolean> => {
    try {
      emit('archive-thread', {
        threadId,
        archivedBy: user?.id,
        archivedAt: new Date()
      });

      return true;
    } catch (error) {
      console.error('Failed to archive thread:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Archive Failed',
        message: 'Failed to archive thread'
      }));
      return false;
    }
  }, [user?.id, emit, dispatch]);

  // Pin thread
  const pinThread = useCallback(async (threadId: string): Promise<boolean> => {
    try {
      emit('pin-thread', {
        threadId,
        pinnedBy: user?.id,
        pinnedAt: new Date()
      });

      return true;
    } catch (error) {
      console.error('Failed to pin thread:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Pin Failed',
        message: 'Failed to pin thread'
      }));
      return false;
    }
  }, [user?.id, emit, dispatch]);

  // Send message with smart context preservation
  const sendMessage = useCallback(async (
    threadId: string, 
    content: string, 
    attachments?: File[]
  ): Promise<boolean> => {
    try {
      if (!user?.id) throw new Error('User not authenticated');

      // Process attachments if any
      const attachmentData = [];
      if (attachments) {
        for (const file of attachments) {
          const base64 = await fileToBase64(file);
          attachmentData.push({
            name: file.name,
            size: file.size,
            type: file.type,
            data: base64
          });
        }
      }

      const messageData = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        threadId,
        content,
        attachments: attachmentData,
        authorId: user.id,
        timestamp: new Date(),
        mentions: extractMentions(content),
        tags: extractTags(content)
      };

      emit('send-message', messageData);

      // Optimistically add message to state
      dispatch(addMessage(messageData as Message));

      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Send Failed',
        message: 'Failed to send message'
      }));
      return false;
    }
  }, [user?.id, emit, dispatch]);

  // Edit message
  const editMessage = useCallback(async (messageId: string, content: string): Promise<boolean> => {
    try {
      emit('edit-message', {
        messageId,
        content,
        editedBy: user?.id,
        editedAt: new Date()
      });

      return true;
    } catch (error) {
      console.error('Failed to edit message:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Edit Failed',
        message: 'Failed to edit message'
      }));
      return false;
    }
  }, [user?.id, emit, dispatch]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      emit('delete-message', {
        messageId,
        deletedBy: user?.id,
        deletedAt: new Date()
      });

      return true;
    } catch (error) {
      console.error('Failed to delete message:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete message'
      }));
      return false;
    }
  }, [user?.id, emit, dispatch]);

  // React to message
  const reactToMessage = useCallback(async (messageId: string, reaction: string): Promise<boolean> => {
    try {
      emit('react-to-message', {
        messageId,
        reaction,
        userId: user?.id,
        timestamp: new Date()
      });

      return true;
    } catch (error) {
      console.error('Failed to react to message:', error);
      return false;
    }
  }, [user?.id, emit]);

  // Search functions with caching
  const searchSpaces = useCallback((query: string): Space[] => {
    if (!query.trim()) return spaces;

    const cacheKey = `spaces_${query}`;
    const cached = searchCache.current.get(cacheKey);
    if (cached) return cached;

    const results = spaces.filter(space =>
      space.name.toLowerCase().includes(query.toLowerCase()) ||
      space.description && space.description.toLowerCase().includes(query.toLowerCase()) ||
      space.tags.some((tag: string)  => tag.toLowerCase().includes(query.toLowerCase()))
    );

    searchCache.current.set(cacheKey, results);
    return results;
  }, [spaces]);

  const searchThreads = useCallback((query: string): Thread[] => {
    if (!query.trim()) return currentThreads;

    const cacheKey = `threads_${query}`;
    const cached = searchCache.current.get(cacheKey);
    if (cached) return cached;

    const results = currentThreads.filter(thread =>
      thread.title.toLowerCase().includes(query.toLowerCase()) ||
      thread.description?.toLowerCase().includes(query.toLowerCase()) ||
      thread.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );

    searchCache.current.set(cacheKey, results);
    return results;
  }, [currentThreads]);

  const searchMessages = useCallback((query: string): Message[] => {
    if (!query.trim()) return currentMessages;

    const cacheKey = `messages_${query}`;
    const cached = searchCache.current.get(cacheKey);
    if (cached) return cached;

    const results = currentMessages.filter(message =>
      message.content.toLowerCase().includes(query.toLowerCase()) ||
      message.mentions && message.mentions.some(mention => mention.toLowerCase().includes(query.toLowerCase()))
    );

    searchCache.current.set(cacheKey, results);
    return results;
  }, [currentMessages]);

  // AI-powered features
  const generateThreadSummary = useCallback(async (threadId: string): Promise<string | null> => {
    try {
      const response = await new Promise<string>((resolve) => {
        emit('generate-thread-summary', { threadId });
        const handler = (data: { threadId: string; summary: string }) => {
          if (data.threadId === threadId) {
            off('thread-summary-generated', handler);
            resolve(data.summary);
          }
        };
        on('thread-summary-generated', handler);
      });

      return response;
    } catch (error) {
      console.error('Failed to generate thread summary:', error);
      return null;
    }
  }, [emit, on, off]);

  const extractActionItems = useCallback(async (threadId: string): Promise<any[]> => {
    try {
      const response = await new Promise<any[]>((resolve) => {
        emit('extract-thread-action-items', { threadId });
        const handler = (data: { threadId: string; actionItems: any[] }) => {
          if (data.threadId === threadId) {
            off('thread-action-items-extracted', handler);
            resolve(data.actionItems);
          }
        };
        on('thread-action-items-extracted', handler);
      });

      return response;
    } catch (error) {
      console.error('Failed to extract action items:', error);
      return [];
    }
  }, [emit, on, off]);

  const suggestRelatedThreads = useCallback(async (threadId: string): Promise<Thread[]> => {
    try {
      const response = await new Promise<Thread[]>((resolve) => {
        emit('suggest-related-threads', { threadId });
        const handler = (data: { threadId: string; relatedThreads: Thread[] }) => {
          if (data.threadId === threadId) {
            off('related-threads-suggested', handler);
            resolve(data.relatedThreads);
          }
        };
        on('related-threads-suggested', handler);
      });

      return response;
    } catch (error) {
      console.error('Failed to suggest related threads:', error);
      return [];
    }
  }, [emit, on, off]);

  // Utility functions
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const extractMentions = (content: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  };

  const extractTags = (content: string): string[] => {
    const tagRegex = /#(\w+)/g;
    const tags = [];
    let match;
    while ((match = tagRegex.exec(content)) !== null) {
      tags.push(match[1]);
    }
    return tags;
  };

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleSpacesLoaded = (data: { spaces: Space[] }) => {
      dispatch(setSpaces(data.spaces));
    };

    const handleSpaceJoined = (data: { space: Space }) => {
      dispatch(addNotification({
        type: 'success',
        title: 'Joined Space',
        message: `Successfully joined "${data.space.name}"`
      }));
    };

    const handleThreadCreated = (data: { thread: Thread }) => {
      dispatch(addThread(data.thread));
    };

    const handleMessageReceived = (data: { message: Message }) => {
      dispatch(addMessage(data.message));
    };

    const handleSpaceUpdated = (data: { space: Space }) => {
      // Update space in state
      dispatch(setSpaces(spaces.map(s => s.id === data.space.id ? data.space : s)));
    };

    on('spaces-loaded', handleSpacesLoaded);
    on('space-joined', handleSpaceJoined);
    on('thread-created', handleThreadCreated);
    on('message-received', handleMessageReceived);
    on('space-updated', handleSpaceUpdated);

    return () => {
      off('spaces-loaded', handleSpacesLoaded);
      off('space-joined', handleSpaceJoined);
      off('thread-created', handleThreadCreated);
      off('message-received', handleMessageReceived);
      off('space-updated', handleSpaceUpdated);
    };
  }, [socket, spaces, on, off, dispatch]);

  return {
    spaces,
    currentSpace,
    currentThreads,
    currentMessages,
    isLoading,
    
    // Space management
    createSpace,
    joinSpace,
    leaveSpace,
    updateSpaceConfig,
    
    // Thread management
    createThread,
    archiveThread,
    pinThread,
    
    // Messaging
    sendMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    
    // Search and organization
    searchSpaces,
    searchThreads,
    searchMessages,
    
    // AI-powered features
    generateThreadSummary,
    extractActionItems,
    suggestRelatedThreads
  };
};
