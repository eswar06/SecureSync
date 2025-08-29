import Redis from 'ioredis';
import { logger } from '../utils/logger';

/**
 * Redis connection manager for caching and real-time coordination
 */
export class RedisConnection {
  private static instance: RedisConnection;
  private client: Redis;
  private subscriber: Redis;
  private publisher: Redis;
  private isConnected: boolean = false;

  private constructor() {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      username: process.env.REDIS_USERNAME || "default",
      password: process.env.REDIS_PASSWORD || "securesync2024",
      db: parseInt(process.env.REDIS_DB || '0'),
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxRetriesPerRequest: null,
      lazyConnect: true,
    };

    this.client = new Redis(redisConfig);
    this.subscriber = new Redis(redisConfig);
    this.publisher = new Redis(redisConfig);

    this.setupEventListeners();
  }

  public static getInstance(): RedisConnection {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new RedisConnection();
    }
    return RedisConnection.instance;
  }

  private setupEventListeners(): void {
    // Main client events
    this.client.on('connect', () => {
      logger.info('Redis client connected');
      this.isConnected = true;
    });

    this.client.on('error', (error) => {
      logger.error('Redis client error:', error);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      logger.warn('Redis client disconnected');
      this.isConnected = false;
    });

    this.client.on('reconnecting', (time: number) => {
      logger.info(`Redis client reconnecting in ${time}ms`);
    });

    // Subscriber events
    this.subscriber.on('connect', () => {
      logger.info('Redis subscriber connected');
    });

    this.subscriber.on('error', (error) => {
      logger.error('Redis subscriber error:', error);
    });

    // Publisher events
    this.publisher.on('connect', () => {
      logger.info('Redis publisher connected');
    });

    this.publisher.on('error', (error) => {
      logger.error('Redis publisher error:', error);
    });
  }

public async connect(): Promise<void> {
  try {
    // Trigger connections (non-async in ioredis)
    this.client.connect();
    this.subscriber.connect();
    this.publisher.connect();

    // Wait until main client is ready
    await new Promise<void>((resolve, reject) => {
      const onReady = () => {
        logger.info("Redis client ready");
        this.client.off("error", onError);
        resolve();
      };
      const onError = (err: Error) => {
        logger.error("Redis connection error:", err);
        reject(err);
      };

      this.client.once("ready", onReady);
      this.client.once("error", onError);
    });

    logger.info("Redis connections established successfully");
  } catch (error) {
    logger.error("Failed to connect to Redis:", error);
    throw error;
  }
}


  public async disconnect(): Promise<void> {
    try {
      await Promise.all([
        this.client.disconnect(),
        this.subscriber.disconnect(),
        this.publisher.disconnect()
      ]);

      this.isConnected = false;
      logger.info('Redis connections closed');

    } catch (error) {
      logger.error('Failed to disconnect from Redis:', error);
      throw error;
    }
  }

  public getClient(): Redis {
    return this.client;
  }

  public getSubscriber(): Redis {
    return this.subscriber;
  }

  public getPublisher(): Redis {
    return this.publisher;
  }

  public isConnectionActive(): boolean {
    return this.isConnected && this.client.status === 'ready';
  }

  // Convenience methods for common operations
  public async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Redis GET error:', error);
      return null;
    }
  }

  public async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error('Redis SET error:', error);
      throw error;
    }
  }

  public async setex(key: string, ttl: number, value: string): Promise<void> {
    try {
      await this.client.setex(key, ttl, value);
    } catch (error) {
      logger.error('Redis SETEX error:', error);
      throw error;
    }
  }

  public async del(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (error) {
      logger.error('Redis DEL error:', error);
      return 0;
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      return false;
    }
  }

  public async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error('Redis KEYS error:', error);
      return [];
    }
  }

  public async lpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.client.lpush(key, ...values);
    } catch (error) {
      logger.error('Redis LPUSH error:', error);
      return 0;
    }
  }

  public async ltrim(key: string, start: number, stop: number): Promise<void> {
    try {
      await this.client.ltrim(key, start, stop);
    } catch (error) {
      logger.error('Redis LTRIM error:', error);
    }
  }

  public async llen(key: string): Promise<number> {
    try {
      return await this.client.llen(key);
    } catch (error) {
      logger.error('Redis LLEN error:', error);
      return 0;
    }
  }

  public async hset(key: string, field: string, value: string): Promise<number> {
    try {
      return await this.client.hset(key, field, value);
    } catch (error) {
      logger.error('Redis HSET error:', error);
      return 0;
    }
  }

  public async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hget(key, field);
    } catch (error) {
      logger.error('Redis HGET error:', error);
      return null;
    }
  }

  public async hgetall(key: string): Promise<Record<string, string>> {
    try {
      return await this.client.hgetall(key);
    } catch (error) {
      logger.error('Redis HGETALL error:', error);
      return {};
    }
  }

  public async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.client.sadd(key, ...members);
    } catch (error) {
      logger.error('Redis SADD error:', error);
      return 0;
    }
  }

  public async srem(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.client.srem(key, ...members);
    } catch (error) {
      logger.error('Redis SREM error:', error);
      return 0;
    }
  }

  public async smembers(key: string): Promise<string[]> {
    try {
      return await this.client.smembers(key);
    } catch (error) {
      logger.error('Redis SMEMBERS error:', error);
      return [];
    }
  }

  public async sismember(key: string, member: string): Promise<boolean> {
    try {
      const result = await this.client.sismember(key, member);
      return result === 1;
    } catch (error) {
      logger.error('Redis SISMEMBER error:', error);
      return false;
    }
  }

  // Pub/Sub methods
  public async publish(channel: string, message: string): Promise<number> {
    try {
      return await this.publisher.publish(channel, message);
    } catch (error) {
      logger.error('Redis PUBLISH error:', error);
      return 0;
    }
  }

  public async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    try {
      await this.subscriber.subscribe(channel);
      this.subscriber.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          callback(message);
        }
      });
    } catch (error) {
      logger.error('Redis SUBSCRIBE error:', error);
      throw error;
    }
  }

  public async unsubscribe(channel: string): Promise<void> {
    try {
      await this.subscriber.unsubscribe(channel);
    } catch (error) {
      logger.error('Redis UNSUBSCRIBE error:', error);
      throw error;
    }
  }

  // Session management
  public async setSession(sessionId: string, sessionData: any, ttl: number = 3600): Promise<void> {
    try {
      await this.setex(`session:${sessionId}`, ttl, JSON.stringify(sessionData));
    } catch (error) {
      logger.error('Failed to set session:', error);
      throw error;
    }
  }

  public async getSession(sessionId: string): Promise<any | null> {
    try {
      const sessionData = await this.get(`session:${sessionId}`);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      logger.error('Failed to get session:', error);
      return null;
    }
  }

  public async deleteSession(sessionId: string): Promise<void> {
    try {
      await this.del(`session:${sessionId}`);
    } catch (error) {
      logger.error('Failed to delete session:', error);
    }
  }

  // User presence management
  public async setUserPresence(userId: string, status: string, ttl: number = 300): Promise<void> {
    try {
      await this.setex(`presence:${userId}`, ttl, status);
      await this.sadd('online-users', userId);
    } catch (error) {
      logger.error('Failed to set user presence:', error);
    }
  }

  public async removeUserPresence(userId: string): Promise<void> {
    try {
      await this.del(`presence:${userId}`);
      await this.srem('online-users', userId);
    } catch (error) {
      logger.error('Failed to remove user presence:', error);
    }
  }

  public async getUserPresence(userId: string): Promise<string | null> {
    try {
      return await this.get(`presence:${userId}`);
    } catch (error) {
      logger.error('Failed to get user presence:', error);
      return null;
    }
  }

  public async getOnlineUsers(): Promise<string[]> {
    try {
      return await this.smembers('online-users');
    } catch (error) {
      logger.error('Failed to get online users:', error);
      return [];
    }
  }

  // Meeting room management
  public async addUserToMeeting(meetingId: string, userId: string): Promise<void> {
    try {
      await this.sadd(`meeting:${meetingId}:participants`, userId);
      await this.hset(`user:${userId}:meetings`, meetingId, new Date().toISOString());
    } catch (error) {
      logger.error('Failed to add user to meeting:', error);
    }
  }

  public async removeUserFromMeeting(meetingId: string, userId: string): Promise<void> {
    try {
      await this.srem(`meeting:${meetingId}:participants`, userId);
      // Note: We keep the meeting history in user:meetings for analytics
    } catch (error) {
      logger.error('Failed to remove user from meeting:', error);
    }
  }

  public async getMeetingParticipants(meetingId: string): Promise<string[]> {
    try {
      return await this.smembers(`meeting:${meetingId}:participants`);
    } catch (error) {
      logger.error('Failed to get meeting participants:', error);
      return [];
    }
  }

  // Rate limiting
  public async checkRateLimit(
    identifier: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      const key = `rate_limit:${identifier}`;
      const now = Date.now();
      const windowStart = now - (windowSeconds * 1000);

      // Remove old entries
      await this.client.zremrangebyscore(key, 0, windowStart);

      // Get current count
      const currentCount = await this.client.zcard(key);

      if (currentCount >= limit) {
        // Get oldest entry to calculate reset time
        const oldestEntries = await this.client.zrange(key, 0, 0, 'WITHSCORES');
        let resetTime = now + (windowSeconds * 1000);

        if (oldestEntries.length === 2) {
          resetTime = parseInt(oldestEntries[1]) + (windowSeconds * 1000);
        }

        return {
          allowed: false,
          remaining: 0,
          resetTime
        };
      }

      // Add current request
      await this.client.zadd(key, now, `${now}-${Math.random()}`);
      await this.client.expire(key, windowSeconds);

      return {
        allowed: true,
        remaining: limit - currentCount - 1,
        resetTime: now + (windowSeconds * 1000)
      };

    } catch (error) {
      logger.error('Failed to check rate limit:', error);
      // In case of error, allow the request
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: Date.now() + (windowSeconds * 1000)
      };
    }
  }
}

// Export singleton instance and convenience methods
const redisConnection = RedisConnection.getInstance();

export const connectRedis = async (): Promise<void> => {
  console.log("Redis config:", {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB
  });

  if (!redisClient.isConnectionActive()) {
    await redisClient.connect();
    console.log("✅ Redis connected");
  } else {
    console.log("ℹ️ Redis already connected, skipping reconnect");
  }
};

export const disconnectRedis = async (): Promise<void> => {
  await redisConnection.disconnect();
};

export const redisClient = redisConnection;
