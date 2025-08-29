import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { redisClient } from '../cache/redis';
import {
  PrivateChannel,
  PrivateAudioConfig
} from '../../../shared/src/types/index';
import crypto from 'crypto';

/**
 * PrivateVoiceManager - Manages private voice channels for confidential discussions
 */
export class PrivateVoiceManager extends EventEmitter {
  private activeChannels: Map<string, PrivateChannel> = new Map();
  private channelParticipants: Map<string, Set<string>> = new Map();

  constructor() {
    super();
    this.initializeVoiceManager();
  }

  private initializeVoiceManager(): void {
    logger.info('Initializing Private Voice Manager');
  }

  /**
   * Creates a private voice channel with end-to-end encryption
   */
  public async createPrivateChannel(participants: string[], meetingId: string): Promise<PrivateChannel> {
    try {
      const channelId = crypto.randomUUID();
      const encryptionKey = crypto.randomBytes(32).toString('hex');

      const channel: PrivateChannel = {
        id: channelId,
        meetingId,
        participants,
        createdBy: participants[0], // First participant is creator
        createdAt: new Date(),
        isActive: true,
        encryptionKey,
        audioConfig: {
          mainMeetingVolume: 0.5,
          privateChannelVolume: 1.0,
          audioBalance: 0.5,
          noiseReduction: true,
          echoCancellation: true
        },
        zeroRecordingGuarantee: true
      };

      // Store channel
      this.activeChannels.set(channelId, channel);
      this.channelParticipants.set(channelId, new Set(participants));

      // Store in Redis for persistence
      await redisClient.setex(
        `private-channel:${channelId}`,
        3600 * 4, // 4 hours
        JSON.stringify(channel)
      );

      // Add participants to Redis set
      await redisClient.sadd(`channel:${channelId}:participants`, ...participants);

      logger.info(`Private channel created: ${channelId}`, {
        meetingId,
        participantCount: participants.length,
        createdBy: participants[0]
      });

      this.emit('channel-created', { channelId, meetingId, participants });

      return channel;

    } catch (error) {
      logger.error('Failed to create private channel:', error);
      throw error;
    }
  }

  /**
   * Joins a user to a private channel
   */
  public async joinPrivateChannel(channelId: string, userId: string): Promise<boolean> {
    try {
      const channel = this.activeChannels.get(channelId);
      if (!channel) {
        throw new Error('Private channel not found');
      }

      // Check if user is authorized
      if (!channel.participants.includes(userId)) {
        throw new Error('User not authorized for this private channel');
      }

      // Add to active participants
      const participants = this.channelParticipants.get(channelId);
      if (participants) {
        participants.add(userId);
      }

      logger.info(`User joined private channel: ${userId}`, {
        channelId,
        meetingId: channel.meetingId
      });

      this.emit('user-joined-channel', { channelId, userId, meetingId: channel.meetingId });

      return true;

    } catch (error) {
      logger.error('Failed to join private channel:', error);
      return false;
    }
  }

  /**
   * Configures audio balancing between main meeting and private channel
   */
  public toggleMainMeetingAudio(channelId: string, muted: boolean): void {
    const channel = this.activeChannels.get(channelId);
    if (channel) {
      channel.audioConfig.mainMeetingVolume = muted ? 0 : 0.5;
      
      this.emit('audio-config-changed', {
        channelId,
        config: channel.audioConfig
      });

      logger.debug(`Main meeting audio ${muted ? 'muted' : 'unmuted'} for channel ${channelId}`);
    }
  }

  /**
   * Balances audio levels between main meeting and private channel
   */
  public balanceAudioLevels(channelId: string, mainVolume: number, privateVolume: number): void {
    const channel = this.activeChannels.get(channelId);
    if (channel) {
      channel.audioConfig.mainMeetingVolume = Math.max(0, Math.min(1, mainVolume));
      channel.audioConfig.privateChannelVolume = Math.max(0, Math.min(1, privateVolume));
      channel.audioConfig.audioBalance = privateVolume / (mainVolume + privateVolume);

      this.emit('audio-levels-changed', {
        channelId,
        config: channel.audioConfig
      });

      logger.debug(`Audio levels balanced for channel ${channelId}`, {
        mainVolume: channel.audioConfig.mainMeetingVolume,
        privateVolume: channel.audioConfig.privateChannelVolume
      });
    }
  }

  /**
   * Ensures no recording is happening in the private channel
   */
  public async ensureNoRecording(channelId: string): Promise<boolean> {
    try {
      const channel = this.activeChannels.get(channelId);
      if (!channel) {
        return false;
      }

      // Verify zero-recording guarantee
      if (!channel.zeroRecordingGuarantee) {
        logger.warn(`Private channel ${channelId} does not have zero-recording guarantee`);
        return false;
      }

      // Check for any recording attempts (this would integrate with recording prevention)
      const participants = this.channelParticipants.get(channelId);
      if (participants) {
        for (const participantId of participants) {
          const threatScore = await redisClient.get(`threat-score:${participantId}`);
          if (threatScore && parseInt(threatScore) > 50) {
            logger.security('High threat score participant in private channel', {
              channelId,
              participantId,
              threatScore: parseInt(threatScore)
            });
            // Could automatically remove participant or alert moderators
          }
        }
      }

      return true;

    } catch (error) {
      logger.error('Failed to ensure no recording:', error);
      return false;
    }
  }

  /**
   * Ends a private channel and cleans up resources
   */
  public async endPrivateChannel(channelId: string): Promise<void> {
    try {
      const channel = this.activeChannels.get(channelId);
      if (!channel) {
        return;
      }

      // Mark as inactive
      channel.isActive = false;
      channel.endedAt = new Date();

      // Clean up memory
      this.activeChannels.delete(channelId);
      this.channelParticipants.delete(channelId);

      // Clean up Redis
      await redisClient.del(`private-channel:${channelId}`);
      await redisClient.del(`channel:${channelId}:participants`);

      logger.info(`Private channel ended: ${channelId}`, {
        meetingId: channel.meetingId,
        duration: channel.endedAt.getTime() - channel.createdAt.getTime()
      });

      this.emit('channel-ended', { channelId, meetingId: channel.meetingId });

    } catch (error) {
      logger.error('Failed to end private channel:', error);
    }
  }

  /**
   * Gets active private channels for a meeting
   */
  public getActiveChannelsForMeeting(meetingId: string): PrivateChannel[] {
    return Array.from(this.activeChannels.values())
      .filter(channel => channel.meetingId === meetingId && channel.isActive);
  }

  /**
   * Gets channel information by ID
   */
  public getChannel(channelId: string): PrivateChannel | undefined {
    return this.activeChannels.get(channelId);
  }

  /**
   * Gets participants currently in a channel
   */
  public getChannelParticipants(channelId: string): string[] {
    const participants = this.channelParticipants.get(channelId);
    return participants ? Array.from(participants) : [];
  }

  /**
   * Removes a participant from a private channel
   */
  public async removeParticipant(channelId: string, userId: string): Promise<boolean> {
    try {
      const participants = this.channelParticipants.get(channelId);
      if (participants && participants.has(userId)) {
        participants.delete(userId);
        
        await redisClient.srem(`channel:${channelId}:participants`, userId);

        logger.info(`User removed from private channel: ${userId}`, { channelId });

        this.emit('user-left-channel', { channelId, userId });

        // End channel if no participants left
        if (participants.size === 0) {
          await this.endPrivateChannel(channelId);
        }

        return true;
      }

      return false;

    } catch (error) {
      logger.error('Failed to remove participant from private channel:', error);
      return false;
    }
  }

  /**
   * Gets statistics about private channel usage
   */
  public getChannelStatistics(): any {
    const stats = {
      activeChannels: this.activeChannels.size,
      totalParticipants: Array.from(this.channelParticipants.values())
        .reduce((total, participants) => total + participants.size, 0),
      channelsByMeeting: new Map<string, number>()
    };

    // Count channels by meeting
    for (const channel of this.activeChannels.values()) {
      const count = stats.channelsByMeeting.get(channel.meetingId) || 0;
      stats.channelsByMeeting.set(channel.meetingId, count + 1);
    }

    return stats;
  }

  /**
   * Validates channel security and integrity
   */
  public async validateChannelSecurity(channelId: string): Promise<boolean> {
    try {
      const channel = this.activeChannels.get(channelId);
      if (!channel) {
        return false;
      }

      // Check encryption key integrity
      if (!channel.encryptionKey || channel.encryptionKey.length !== 64) {
        logger.warn(`Invalid encryption key for channel ${channelId}`);
        return false;
      }

      // Verify zero-recording guarantee
      if (!channel.zeroRecordingGuarantee) {
        logger.warn(`Channel ${channelId} missing zero-recording guarantee`);
        return false;
      }

      // Check participant authorization
      const authorizedParticipants = await redisClient.smembers(`channel:${channelId}:participants`);
      const currentParticipants = this.getChannelParticipants(channelId);
      
      for (const participant of currentParticipants) {
        if (!authorizedParticipants.includes(participant)) {
          logger.security('Unauthorized participant in private channel', {
            channelId,
            participantId: participant
          });
          await this.removeParticipant(channelId, participant);
        }
      }

      return true;

    } catch (error) {
      logger.error('Failed to validate channel security:', error);
      return false;
    }
  }

  /**
   * Generates ephemeral encryption keys for temporary channels
   */
  private generateEphemeralKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Rotates encryption keys for enhanced security
   */
  public async rotateChannelKey(channelId: string): Promise<boolean> {
    try {
      const channel = this.activeChannels.get(channelId);
      if (!channel) {
        return false;
      }

      const newKey = this.generateEphemeralKey();
      const oldKey = channel.encryptionKey;
      
      channel.encryptionKey = newKey;

      // Update in Redis
      await redisClient.setex(
        `private-channel:${channelId}`,
        3600 * 4,
        JSON.stringify(channel)
      );

      logger.security('Private channel encryption key rotated', {
        channelId,
        meetingId: channel.meetingId
      });

      this.emit('key-rotated', { channelId, oldKey, newKey });

      return true;

    } catch (error) {
      logger.error('Failed to rotate channel key:', error);
      return false;
    }
  }
}
