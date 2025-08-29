import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { redisClient } from '../cache/redis';
import {
  SignalingMessage,
  SignalingType,
  SocketEvent,
  SocketEventType,
  SecurityThreat,
  ThreatType,
  ThreatSeverity,
  ThreatEvidence
} from '../../../shared/src/types/index'; //changed here
import { RecordingPreventionEngine } from '../services/recording-prevention';
import { TranscriptionEngine } from '../services/transcription';
import { AIAdaptationEngine } from '../services/ai-adaptation';
import { DocumentSecurityManager } from '../services/document-security';
import { PrivateVoiceManager } from '../services/private-voice';
import { SmartReminderSystem } from '../services/smart-reminders';
import { SpacesThreadingManager } from '../services/spaces-threading';

interface ServiceInstances {
  recordingPrevention: RecordingPreventionEngine;
  transcriptionEngine: TranscriptionEngine;
  aiEngine: AIAdaptationEngine;
  documentSecurity: DocumentSecurityManager;
  privateVoice: PrivateVoiceManager;
  reminderSystem: SmartReminderSystem;
  spacesThreading: SpacesThreadingManager;
}

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    userRole: string;
    organizationId: string;
    meetingId?: string;
    permissions: string[];
  };
}

/**
 * WebSocket handler for real-time communication and signaling
 */
export class SocketHandler {
  private io: SocketIOServer;
  private services: ServiceInstances;
  private authenticatedSockets: Map<string, AuthenticatedSocket> = new Map();
  private meetingRooms: Map<string, Set<string>> = new Map();
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(io: SocketIOServer, services: ServiceInstances) {
    this.io = io;
    this.services = services;
    this.setupMiddleware();
    this.setupConnectionHandler();
    this.setupServiceEventListeners();
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        
        if (!token) {
          logger.security('WebSocket connection attempted without token', {
            socketId: socket.id,
            ipAddress: socket.handshake.address,
            userAgent: socket.handshake.headers['user-agent']
          });
          return next(new Error('Authentication required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token as string, process.env.JWT_SECRET || 'default-secret') as any;
        
        // Check if user is banned
        const isBanned = await redisClient.exists(`ban:${decoded.userId}`);
        if (isBanned) {
          logger.security('Banned user attempted WebSocket connection', {
            userId: decoded.userId,
            socketId: socket.id,
            ipAddress: socket.handshake.address
          });
          return next(new Error('Access denied'));
        }

        // Attach user data to socket
        (socket as AuthenticatedSocket).data = {
          userId: decoded.userId,
          userRole: decoded.role,
          organizationId: decoded.organizationId,
          permissions: decoded.permissions || []
        };

        logger.websocket(socket.id, 'authenticated', {
          userId: decoded.userId,
          role: decoded.role,
          organizationId: decoded.organizationId
        });

        next();

      } catch (error) {
        logger.security('WebSocket authentication failed', {
          error: (error as Error).message,
          socketId: socket.id,
          ipAddress: socket.handshake.address,
          userAgent: socket.handshake.headers['user-agent']
        });
        next(new Error('Authentication failed'));
      }
    });

    // Rate limiting middleware
    this.io.use(async (socket: Socket, next) => {
      const ipAddress = socket.handshake.address;
      const rateLimit = await redisClient.checkRateLimit(`websocket:${ipAddress}`, 10, 60); // 10 connections per minute
      
      if (!rateLimit.allowed) {
        logger.security('WebSocket rate limit exceeded', {
          ipAddress,
          socketId: socket.id,
          resetTime: rateLimit.resetTime
        });
        return next(new Error('Rate limit exceeded'));
      }

      next();
    });
  }

  private setupConnectionHandler(): void {
    this.io.on('connection', async (socket: Socket) => {
      const authSocket = socket as AuthenticatedSocket;
      const { userId, userRole, organizationId } = authSocket.data;

      try {
        // Store authenticated socket
        this.authenticatedSockets.set(socket.id, authSocket);
        this.userSockets.set(userId, socket.id);

        // Set user presence
        await redisClient.setUserPresence(userId, 'online');

        // Join user to their organization room
        await socket.join(`org:${organizationId}`);
        await socket.join(`user:${userId}`);

        logger.websocket(socket.id, 'connected', {
          userId,
          userRole,
          organizationId
        });

        // Emit connection success
        socket.emit('connection-established', {
          socketId: socket.id,
          userId,
          serverTime: new Date().toISOString(),
          features: this.getAvailableFeatures(authSocket.data.permissions)
        });

        // Setup event handlers
        this.setupSocketEventHandlers(authSocket);

        // Notify other users in organization
        socket.to(`org:${organizationId}`).emit('user-online', {
          userId,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        logger.error('Failed to handle socket connection:', error);
        socket.disconnect(true);
      }
    });
  }

  private setupSocketEventHandlers(socket: AuthenticatedSocket): void {
    const { userId, organizationId } = socket.data;

    // Meeting events
    socket.on('join-meeting', async (data: { meetingId: string }) => {
      try {
        await this.handleJoinMeeting(socket, data.meetingId);
      } catch (error:unknown) {
        logger.error('Failed to join meeting:', error);
        socket.emit('error', { type: 'JOIN_MEETING_FAILED', message: (error as Error).message });
      }
    });

    socket.on('leave-meeting', async (data: { meetingId: string }) => {
      try {
        await this.handleLeaveMeeting(socket, data.meetingId);
      } catch (error) {
        logger.error('Failed to leave meeting:', error);
      }
    });

    // WebRTC signaling
    socket.on('webrtc-signal', async (data: SignalingMessage) => {
      try {
        await this.handleWebRTCSignal(socket, data);
      } catch (error) {
        logger.error('Failed to handle WebRTC signal:', error);
      }
    });

    // Audio stream for transcription
    socket.on('audio-stream', async (data: { meetingId: string; audioData: Buffer }) => {
      try {
        if (socket.data.meetingId === data.meetingId) {
          const segment = await this.services.transcriptionEngine.processAudioStream(
            data.meetingId,
            data.audioData,
            userId
          );
          
          if (segment) {
            // Broadcast transcription update to meeting participants
            this.io.to(`meeting:${data.meetingId}`).emit('transcription-segment', {
              meetingId: data.meetingId,
              segment
            });
          }
        }
      } catch (error) {
        logger.error('Failed to process audio stream:', error);
      }
    });

    // Security events
    socket.on('security-alert', async (alert: any) => {
      try {
        await this.services.recordingPrevention.handleSecurityThreat({
          id: `threat_${Date.now()}`,
          type: this.mapAlertToThreatType(alert.type),
          severity: this.mapAlertToSeverity(alert.severity),
          description: alert.description || 'Client-side security alert',
          detectedAt: new Date(),
          userId,
          meetingId: socket.data.meetingId || 'unknown',
          evidence: { clientAlert: alert, metadata: {} } as unknown as ThreatEvidence,
          resolved: false
        }, socket);
      } catch (error) {
        logger.error('Failed to handle security alert:', error);
      }
    });

    // Message events for threading
    socket.on('send-message', async (data: { threadId: string; content: string; type: string }) => {
      try {
        const message = await this.services.spacesThreading.createMessage(
          data.threadId,
          userId,
          data.content,
          data.type
        );

        // Broadcast to thread participants
        const threadParticipants = await this.services.spacesThreading.getThreadParticipants(data.threadId);
        for (const participantId of threadParticipants) {
          const participantSocketId = this.userSockets.get(participantId);
          if (participantSocketId) {
            this.io.to(participantSocketId).emit('new-message', {
              threadId: data.threadId,
              message
            });
          }
        }

        // Log user activity
        logger.userActivity(userId, 'sent_message', {
          threadId: data.threadId,
          messageType: data.type
        });

      } catch (error) {
        logger.error('Failed to send message:', error);
        socket.emit('error', { type: 'SEND_MESSAGE_FAILED', message: (error as Error).message });
      }
    });

    // Typing indicators
    socket.on('typing-start', (data: { threadId: string }) => {
      socket.to(`thread:${data.threadId}`).emit('user-typing', {
        userId,
        threadId: data.threadId,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('typing-stop', (data: { threadId: string }) => {
      socket.to(`thread:${data.threadId}`).emit('user-stopped-typing', {
        userId,
        threadId: data.threadId,
        timestamp: new Date().toISOString()
      });
    });

    // Private voice channel events
    socket.on('create-private-channel', async (data: { meetingId: string; participants: string[] }) => {
      try {
        if (socket.data.meetingId === data.meetingId) {
          const channel = await this.services.privateVoice.createPrivateChannel(
            data.participants,
            data.meetingId
          );

          // Invite participants to private channel
          for (const participantId of data.participants) {
            const participantSocketId = this.userSockets.get(participantId);
            if (participantSocketId) {
              this.io.to(participantSocketId).emit('private-channel-invitation', {
                channelId: channel.id,
                meetingId: data.meetingId,
                invitedBy: userId
              });
            }
          }
        }
      } catch (error) {
        logger.error('Failed to create private channel:', error);
        socket.emit('error', { type: 'PRIVATE_CHANNEL_FAILED', message: (error as Error).message });
      }
    });

    // Document sharing events
    socket.on('share-document', async (data: { documentId: string; recipients: string[] }) => {
      try {
        const document = await this.services.documentSecurity.shareDocument(
          data.documentId,
          userId,
          data.recipients
        );

        // Notify recipients
        for (const recipientId of data.recipients) {
          const recipientSocketId = this.userSockets.get(recipientId);
          if (recipientSocketId) {
            this.io.to(recipientSocketId).emit('document-shared', {
              document,
              sharedBy: userId,
              timestamp: new Date().toISOString()
            });
          }
        }

        // Log audit event
        logger.audit('document_shared', {
          documentId: data.documentId,
          sharedBy: userId,
          recipients: data.recipients
        });

      } catch (error) {
        logger.error('Failed to share document:', error);
        socket.emit('error', { type: 'DOCUMENT_SHARE_FAILED', message: (error as Error).message });
      }
    });

    // Reminder events
    socket.on('create-reminder', async (reminderData: any) => {
      try {
        const reminder = await this.services.reminderSystem.createReminder(userId, reminderData);
        
        socket.emit('reminder-created', {
          reminder,
          timestamp: new Date().toISOString()
        });

        logger.userActivity(userId, 'created_reminder', {
          reminderId: reminder.id,
          type: reminder.type
        });

      } catch (error) {
        logger.error('Failed to create reminder:', error);
        socket.emit('error', { type: 'REMINDER_CREATION_FAILED', message: (error as Error).message });
      }
    });

    // Disconnect handler
    socket.on('disconnect', async (reason) => {
      try {
        await this.handleDisconnect(socket, reason);
      } catch (error) {
        logger.error('Failed to handle disconnect:', error);
      }
    });

    // Heartbeat for connection monitoring
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });
  }

  private async handleJoinMeeting(socket: AuthenticatedSocket, meetingId: string): Promise<void> {
    const { userId, organizationId } = socket.data;

    // Verify meeting access
    // TODO: Implement meeting access verification

    // Leave previous meeting if any
    if (socket.data.meetingId) {
      await this.handleLeaveMeeting(socket, socket.data.meetingId);
    }

    // Join meeting room
    await socket.join(`meeting:${meetingId}`);
    socket.data.meetingId = meetingId;

    // Add to meeting participants
    await redisClient.addUserToMeeting(meetingId, userId);
    
    // Add to in-memory tracking
    if (!this.meetingRooms.has(meetingId)) {
      this.meetingRooms.set(meetingId, new Set());
    }
    this.meetingRooms.get(meetingId)!.add(socket.id);

    // Perform security check
    await this.services.recordingPrevention.performSecurityCheck(socket, meetingId);

    // Start transcription if not already active
    const activeTranscriptions = this.services.transcriptionEngine.getActiveTranscriptions();
    if (!activeTranscriptions.includes(meetingId)) {
      await this.services.transcriptionEngine.startRealTimeTranscription(meetingId);
    }

    // Notify other participants
    socket.to(`meeting:${meetingId}`).emit('participant-joined', {
      userId,
      meetingId,
      timestamp: new Date().toISOString()
    });

    // Send current meeting state to new participant
    const participants = await redisClient.getMeetingParticipants(meetingId);
    socket.emit('meeting-joined', {
      meetingId,
      participants,
      transcriptionActive: true,
      securityActive: true,
      timestamp: new Date().toISOString()
    });

    logger.meetingActivity(meetingId, 'participant_joined', {
      userId,
      socketId: socket.id,
      participantCount: participants.length
    });
  }

  private async handleLeaveMeeting(socket: AuthenticatedSocket, meetingId: string): Promise<void> {
    const { userId } = socket.data;

    // Leave meeting room
    await socket.leave(`meeting:${meetingId}`);
    
    // Remove from meeting participants
    await redisClient.removeUserFromMeeting(meetingId, userId);
    
    // Remove from in-memory tracking
    const meetingSockets = this.meetingRooms.get(meetingId);
    if (meetingSockets) {
      meetingSockets.delete(socket.id);
      if (meetingSockets.size === 0) {
        this.meetingRooms.delete(meetingId);
        
        // End transcription if no participants left
        await this.services.transcriptionEngine.endTranscription(meetingId);
      }
    }

    // Clear meeting ID from socket
    socket.data.meetingId = undefined;

    // Notify other participants
    socket.to(`meeting:${meetingId}`).emit('participant-left', {
      userId,
      meetingId,
      timestamp: new Date().toISOString()
    });

    logger.meetingActivity(meetingId, 'participant_left', {
      userId,
      socketId: socket.id
    });
  }

  private async handleWebRTCSignal(socket: AuthenticatedSocket, signal: SignalingMessage): Promise<void> {
    const { userId } = socket.data;

    // Validate signal
    if (!signal.meetingId || signal.meetingId !== socket.data.meetingId) {
      throw new Error('Invalid meeting ID in signal');
    }

    // Add sender information
    signal.from = userId;
    signal.timestamp = new Date();

    // Route signal to specific participant or broadcast to meeting
    if (signal.to) {
      const targetSocketId = this.userSockets.get(signal.to);
      if (targetSocketId) {
        this.io.to(targetSocketId).emit('webrtc-signal', signal);
      }
    } else {
      // Broadcast to all meeting participants except sender
      socket.to(`meeting:${signal.meetingId}`).emit('webrtc-signal', signal);
    }

    logger.websocket(socket.id, 'webrtc_signal', {
      type: signal.type,
      meetingId: signal.meetingId,
      to: signal.to || 'broadcast'
    });
  }

  private async handleDisconnect(socket: AuthenticatedSocket, reason: string): Promise<void> {
    const { userId, organizationId, meetingId } = socket.data;

    try {
      // Remove from authenticated sockets
      this.authenticatedSockets.delete(socket.id);
      this.userSockets.delete(userId);

      // Remove user presence
      await redisClient.removeUserPresence(userId);

      // Leave meeting if in one
      if (meetingId) {
        await this.handleLeaveMeeting(socket, meetingId);
      }

      // Notify organization members
      socket.to(`org:${organizationId}`).emit('user-offline', {
        userId,
        timestamp: new Date().toISOString(),
        reason
      });

      logger.websocket(socket.id, 'disconnected', {
        userId,
        reason,
        duration: Date.now() - Number(socket.handshake.time)|| 0
      });

    } catch (error) {
      logger.error('Error during disconnect cleanup:', error);
    }
  }

  private setupServiceEventListeners(): void {
    // Transcription events
    this.services.transcriptionEngine.on('transcription-update', (data) => {
      this.io.to(`meeting:${data.meetingId}`).emit('transcription-update', data);
    });

    this.services.transcriptionEngine.on('transcription-completed', (data) => {
      this.io.to(`meeting:${data.meetingId}`).emit('transcription-completed', data);
    });

    // Security events
    this.services.recordingPrevention.on('security-threat', (data:SecurityThreat) => {
      // Notify administrators
      this.io.to('admin-room').emit('security-alert', data);
      
      // Notify affected user if appropriate
      const userSocketId = this.userSockets.get(data.userId);
      if (userSocketId && data.severity !== ThreatSeverity.CRITICAL) {
        this.io.to(userSocketId).emit('security-notice', {
          type: data.type,
          severity: data.severity,
          message: 'Security monitoring detected unusual activity'
        });
      }
    });

    // Reminder events
    this.services.reminderSystem.on('reminder-triggered', (data) => {
      const userSocketId = this.userSockets.get(data.userId);
      if (userSocketId) {
        this.io.to(userSocketId).emit('reminder-notification', data);
      }
    });
  }

  private getAvailableFeatures(permissions: string[]): string[] {
    const features = ['basic-chat', 'presence'];
    
    if (permissions.includes('meetings')) {
      features.push('video-meetings', 'screen-sharing');
    }
    
    if (permissions.includes('recording-prevention')) {
      features.push('recording-prevention', 'watermarks');
    }
    
    if (permissions.includes('transcription')) {
      features.push('live-transcription', 'ai-insights');
    }
    
    if (permissions.includes('private-channels')) {
      features.push('private-voice-channels');
    }
    
    if (permissions.includes('document-security')) {
      features.push('secure-document-sharing', 'drm');
    }

    return features;
  }

  private mapAlertToThreatType(alertType: string): ThreatType {
    switch (alertType) {
      case 'MEDIA_RECORDER': return ThreatType.MEDIA_RECORDER;
      case 'SCREEN_CAPTURE': return ThreatType.SCREEN_RECORDING;
      case 'SUSPICIOUS_SOFTWARE': return ThreatType.THIRD_PARTY_SOFTWARE;
      case 'NETWORK_UPLOAD': return ThreatType.SUSPICIOUS_NETWORK;
      default: return ThreatType.UNAUTHORIZED_ACCESS;
    }
  }

  private mapAlertToSeverity(alertSeverity: string): ThreatSeverity {
    switch (alertSeverity?.toLowerCase()) {
      case 'critical': return ThreatSeverity.CRITICAL;
      case 'high': return ThreatSeverity.HIGH;
      case 'medium': return ThreatSeverity.MEDIUM;
      default: return ThreatSeverity.LOW;
    }
  }

  // Public methods for external use
  public getConnectedUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  public getMeetingParticipants(meetingId: string): string[] {
    const sockets = this.meetingRooms.get(meetingId);
    if (!sockets) return [];
    
    return Array.from(sockets).map(socketId => {
      const socket = this.authenticatedSockets.get(socketId);
      return socket?.data.userId;
    }).filter(Boolean) as string[];
  }

  public sendToUser(userId: string, event: string, data: any): boolean {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  public sendToMeeting(meetingId: string, event: string, data: any): boolean {
    this.io.to(`meeting:${meetingId}`).emit(event, data);
    return true;
  }

  public getConnectionStats(): any {
    return {
      totalConnections: this.authenticatedSockets.size,
      activeMeetings: this.meetingRooms.size,
      onlineUsers: this.userSockets.size,
      averageConnectionDuration: this.calculateAverageConnectionDuration()
    };
  }

  private calculateAverageConnectionDuration(): number {
    const now = Date.now();
    let totalDuration = 0;
    let count = 0;

    for (const socket of this.authenticatedSockets.values()) {
      totalDuration += now - Number(socket.handshake.time)||0;
      count++;
    }

    return count > 0 ? totalDuration / count : 0;
  }
}

// Export initialization function
export const initializeWebSocket = (io: SocketIOServer, services: ServiceInstances): SocketHandler => {
  const socketHandler = new SocketHandler(io, services);
  logger.info('WebSocket handler initialized successfully');
  return socketHandler;
};
